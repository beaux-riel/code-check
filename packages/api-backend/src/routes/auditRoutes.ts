import { Router } from 'express';
import { z } from 'zod';
import asyncHandler from 'express-async-handler';
import { PrismaClient } from '@prisma/client';
import { getSharedAuditService } from '../websocket/websocketServer';
import {
  createAuditSchema,
  queryAuditsSchema,
  updateAuditSchema,
  ApiResponse,
} from '../types/api';

function auditRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const auditService = getSharedAuditService(prisma);

  // Create a new audit
  router.post(
    '/',
    asyncHandler(async (req, res) => {
      const result = createAuditSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: result.error.format(),
        });
      }

      const auditId = await auditService.createAudit(result.data);
      return res.status(201).json({ success: true, data: { auditId } });
    })
  );

  // Start an audit
  router.post(
    '/:auditId/start',
    asyncHandler(async (req, res) => {
      const auditId = req.params.auditId;
      await auditService.startAudit(auditId);
      return res.status(200).json({ success: true, message: 'Audit started' });
    })
  );

  // Cancel an audit
  router.post(
    '/:auditId/cancel',
    asyncHandler(async (req, res) => {
      const auditId = req.params.auditId;
      await auditService.cancelAudit(auditId);
      return res
        .status(200)
        .json({ success: true, message: 'Audit cancelled' });
    })
  );

  // Get audit status
  router.get(
    '/:auditId/status',
    asyncHandler(async (req, res) => {
      const auditId = req.params.auditId;
      const auditStatus = await auditService.getAuditStatus(auditId);
      return res.status(200).json({ success: true, data: auditStatus });
    })
  );

  // Get audit details
  router.get(
    '/:auditId',
    asyncHandler(async (req, res) => {
      const auditId = req.params.auditId;
      const audit = await prisma.audit.findUnique({
        where: { id: auditId },
        include: {
          project: true,
          issues: {
            orderBy: { line: 'asc' },
            take: 1000, // Limit to prevent huge responses
          },
          files: {
            orderBy: { filePath: 'asc' },
          },
        },
      });

      if (!audit) {
        return res.status(404).json({
          success: false,
          error: 'Audit not found',
        });
      }

      return res.status(200).json({ success: true, data: audit });
    })
  );

  // Get all audits with pagination and filtering
  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const query = queryAuditsSchema.parse(req.query);

      const where: any = {};
      if (query.projectId) {
        where.projectId = query.projectId;
      }
      if (query.status) {
        where.status = query.status;
      }

      const [audits, total] = await Promise.all([
        prisma.audit.findMany({
          where,
          include: {
            project: { select: { name: true } },
            _count: {
              select: { issues: true, files: true },
            },
          },
          orderBy: { [query.sortBy]: query.sortOrder },
          skip: query.offset,
          take: query.limit,
        }),
        prisma.audit.count({ where }),
      ]);

      const totalPages = Math.ceil(total / query.limit);
      const currentPage = Math.floor(query.offset / query.limit) + 1;

      return res.status(200).json({
        success: true,
        data: audits,
        pagination: {
          limit: query.limit,
          offset: query.offset,
          total,
          totalPages,
          currentPage,
          hasNext: currentPage < totalPages,
          hasPrev: currentPage > 1,
        },
      });
    })
  );

  // Get audit issues
  router.get(
    '/:auditId/issues',
    asyncHandler(async (req, res) => {
      const auditId = req.params.auditId;
      const { severity, limit = '100', offset = '0' } = req.query;

      const where: any = { auditId };
      if (severity) {
        where.severity = String(severity).toUpperCase();
      }

      const issues = await prisma.issue.findMany({
        where,
        orderBy: [{ severity: 'desc' }, { line: 'asc' }],
        skip: parseInt(String(offset)),
        take: parseInt(String(limit)),
      });

      return res.status(200).json({ success: true, data: issues });
    })
  );

  // Get audit files
  router.get(
    '/:auditId/files',
    asyncHandler(async (req, res) => {
      const auditId = req.params.auditId;
      const { limit = '100', offset = '0' } = req.query;

      const files = await prisma.auditFile.findMany({
        where: { auditId },
        include: {
          _count: {
            select: { issues: true },
          },
        },
        orderBy: { filePath: 'asc' },
        skip: parseInt(String(offset)),
        take: parseInt(String(limit)),
      });

      return res.status(200).json({ success: true, data: files });
    })
  );

  // Update audit (mainly for status changes)
  router.patch(
    '/:auditId',
    asyncHandler(async (req, res) => {
      const auditId = req.params.auditId;
      const result = updateAuditSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: result.error.format(),
        });
      }

      const audit = await prisma.audit.update({
        where: { id: auditId },
        data: result.data,
      });

      return res.status(200).json({ success: true, data: audit });
    })
  );

  // Delete audit
  router.delete(
    '/:auditId',
    asyncHandler(async (req, res) => {
      const auditId = req.params.auditId;

      // Check if audit is running
      const audit = await prisma.audit.findUnique({
        where: { id: auditId },
        select: { status: true },
      });

      if (!audit) {
        return res.status(404).json({
          success: false,
          error: 'Audit not found',
        });
      }

      if (audit.status === 'RUNNING') {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete running audit. Cancel it first.',
        });
      }

      await prisma.audit.delete({ where: { id: auditId } });
      return res.status(200).json({ success: true, message: 'Audit deleted' });
    })
  );

  return router;
}

export default auditRoutes;
