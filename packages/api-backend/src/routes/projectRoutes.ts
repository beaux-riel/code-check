import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  language: z.string().optional().default('typescript'),
  path: z.string().optional(), // Make path optional for frontend compatibility
  settings: z.record(z.any()).optional(),
});

const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  language: z.string().optional(),
  path: z.string().min(1).optional(),
  settings: z.record(z.any()).optional(),
});

function projectRoutes(prisma: PrismaClient): Router {
  const router = Router();

  // Get all projects
  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const projects = await prisma.project.findMany({
        include: {
          _count: {
            select: { audits: true },
          },
          audits: {
            select: { startedAt: true, status: true },
            orderBy: { startedAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      const projectsWithMetadata = projects.map((project) => ({
        id: project.id,
        name: project.name,
        description: project.description || '',
        language: 'typescript', // Default language, can be made configurable later
        lastRun:
          project.audits[0]?.startedAt?.toISOString() ||
          new Date().toISOString(),
        status:
          (project.audits[0]?.status?.toLowerCase() as
            | 'running'
            | 'completed'
            | 'failed'
            | 'pending') || 'pending',
        runsCount: project._count.audits,
        issuesCount: 0, // Will be calculated from audit results
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
      }));

      return res
        .status(200)
        .json({ success: true, data: projectsWithMetadata });
    })
  );

  // Get a specific project
  router.get(
    '/:id',
    asyncHandler(async (req, res) => {
      const projectId = req.params.id;

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          _count: {
            select: { audits: true },
          },
          audits: {
            select: {
              id: true,
              status: true,
              startedAt: true,
              completedAt: true,
              _count: {
                select: { issues: true },
              },
            },
            orderBy: { startedAt: 'desc' },
            take: 10,
          },
        },
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found',
        });
      }

      const projectWithMetadata = {
        id: project.id,
        name: project.name,
        description: project.description || '',
        language: 'typescript', // Default language, can be made configurable later
        lastRun:
          project.audits[0]?.startedAt?.toISOString() ||
          new Date().toISOString(),
        status:
          (project.audits[0]?.status?.toLowerCase() as
            | 'running'
            | 'completed'
            | 'failed'
            | 'pending') || 'pending',
        runsCount: project._count.audits,
        issuesCount: 0, // Will be calculated from audit results
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
      };

      return res.status(200).json({ success: true, data: projectWithMetadata });
    })
  );

  // Create a new project
  router.post(
    '/',
    asyncHandler(async (req, res) => {
      const result = createProjectSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: result.error.format(),
        });
      }

      const projectData = {
        name: result.data.name,
        description: result.data.description,
        path:
          result.data.path ||
          `/projects/${result.data.name.toLowerCase().replace(/\s+/g, '-')}`,
        repositoryUrl: null,
      };

      const project = await prisma.project.create({
        data: projectData,
      });

      // Return project in the format expected by frontend
      const formattedProject = {
        id: project.id,
        name: project.name,
        description: project.description || '',
        language: result.data.language || 'typescript',
        lastRun: new Date().toISOString(),
        status: 'pending' as const,
        runsCount: 0,
        issuesCount: 0,
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString(),
      };

      return res.status(201).json({ success: true, data: formattedProject });
    })
  );

  // Update a project
  router.put(
    '/:id',
    asyncHandler(async (req, res) => {
      const projectId = req.params.id;
      const result = updateProjectSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: result.error.format(),
        });
      }

      try {
        const project = await prisma.project.update({
          where: { id: projectId },
          data: {
            ...result.data,
            updatedAt: new Date(),
          },
        });

        // Format project data to match frontend expectations
        const formattedProject = {
          id: project.id,
          name: project.name,
          description: project.description || '',
          language: result.data.language || 'typescript',
          lastRun: new Date().toISOString(),
          status: 'pending' as const,
          runsCount: 0, // Would need to query this
          issuesCount: 0, // Would need to query this
          createdAt: project.createdAt.toISOString(),
          updatedAt: project.updatedAt.toISOString(),
        };

        return res.status(200).json({ success: true, data: formattedProject });
      } catch (error) {
        if (error.code === 'P2025') {
          return res.status(404).json({
            success: false,
            error: 'Project not found',
          });
        }
        throw error;
      }
    })
  );

  // Delete a project
  router.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      const projectId = req.params.id;

      // Check if project has running audits
      const runningAudits = await prisma.audit.count({
        where: {
          projectId,
          status: 'RUNNING',
        },
      });

      if (runningAudits > 0) {
        return res.status(400).json({
          success: false,
          error:
            'Cannot delete project with running audits. Cancel them first.',
        });
      }

      try {
        await prisma.project.delete({ where: { id: projectId } });
        return res
          .status(200)
          .json({ success: true, message: 'Project deleted' });
      } catch (error) {
        if (error.code === 'P2025') {
          return res.status(404).json({
            success: false,
            error: 'Project not found',
          });
        }
        throw error;
      }
    })
  );

  // Get project runs/audits
  router.get(
    '/:id/runs',
    asyncHandler(async (req, res) => {
      const projectId = req.params.id;
      const { limit = '20', offset = '0' } = req.query;

      const audits = await prisma.audit.findMany({
        where: { projectId },
        include: {
          _count: {
            select: { issues: true, files: true },
          },
          issues: {
            select: { id: true, severity: true },
            take: 10, // Just get a few for overview
          },
        },
        orderBy: { startedAt: 'desc' },
        skip: parseInt(String(offset)),
        take: parseInt(String(limit)),
      });

      // Format audits to match RunDetail interface
      const formattedAudits = audits.map((audit) => ({
        id: audit.id,
        projectId: audit.projectId,
        projectName: projectId, // This should ideally come from a join
        status: audit.status.toLowerCase() as
          | 'running'
          | 'completed'
          | 'failed'
          | 'pending',
        startTime: audit.startedAt.toISOString(),
        endTime: audit.completedAt?.toISOString(),
        duration: audit.duration,
        issues: audit.issues || [],
        metrics: {
          totalFiles: audit.totalFiles,
          processedFiles: audit.totalFiles, // Assuming all files were processed
          totalIssues: audit.totalIssues,
          errors: audit.errorCount,
          warnings: audit.warningCount,
          info: audit.infoCount,
          codeQualityScore: 0, // Would be calculated
          performanceScore: 0, // Would be calculated
          securityScore: 0, // Would be calculated
        },
        logs: [], // Would need to fetch from AuditLog if needed
      }));

      return res.status(200).json({ success: true, data: formattedAudits });
    })
  );

  // Get a specific run/audit
  router.get(
    '/:projectId/runs/:runId',
    asyncHandler(async (req, res) => {
      const { projectId, runId } = req.params;

      const audit = await prisma.audit.findFirst({
        where: {
          id: runId,
          projectId,
        },
        include: {
          project: true,
          issues: {
            orderBy: [{ severity: 'desc' }, { line: 'asc' }],
            take: 1000,
          },
          files: {
            orderBy: { filePath: 'asc' },
            include: {
              _count: {
                select: { issues: true },
              },
            },
          },
        },
      });

      if (!audit) {
        return res.status(404).json({
          success: false,
          error: 'Run not found',
        });
      }

      return res.status(200).json({ success: true, data: audit });
    })
  );

  // Start a new run/audit for a project
  router.post(
    '/:id/runs',
    asyncHandler(async (req, res) => {
      const projectId = req.params.id;

      // Check if project exists
      const project = await prisma.project.findUnique({
        where: { id: projectId },
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          error: 'Project not found',
        });
      }

      // Check if there's already a running audit
      const runningAudit = await prisma.audit.findFirst({
        where: {
          projectId,
          status: 'RUNNING',
        },
      });

      if (runningAudit) {
        return res.status(400).json({
          success: false,
          error: 'A run is already in progress for this project',
        });
      }

      // Create new audit
      const audit = await prisma.audit.create({
        data: {
          projectId,
          status: 'PENDING',
          configuration: JSON.stringify({}),
        },
      });

      // Format audit to match RunDetail interface
      const formattedAudit = {
        id: audit.id,
        projectId: audit.projectId,
        projectName: project.name,
        status: audit.status.toLowerCase() as
          | 'running'
          | 'completed'
          | 'failed'
          | 'pending',
        startTime: audit.startedAt.toISOString(),
        endTime: audit.completedAt?.toISOString(),
        duration: audit.duration,
        issues: [],
        metrics: {
          totalFiles: audit.totalFiles,
          processedFiles: 0,
          totalIssues: audit.totalIssues,
          errors: audit.errorCount,
          warnings: audit.warningCount,
          info: audit.infoCount,
          codeQualityScore: 0,
          performanceScore: 0,
          securityScore: 0,
        },
        logs: [],
      };

      return res.status(201).json({ success: true, data: formattedAudit });
    })
  );

  // Stop a running audit
  router.post(
    '/:projectId/runs/:runId/stop',
    asyncHandler(async (req, res) => {
      const { projectId, runId } = req.params;

      const audit = await prisma.audit.findFirst({
        where: {
          id: runId,
          projectId,
        },
      });

      if (!audit) {
        return res.status(404).json({
          success: false,
          error: 'Run not found',
        });
      }

      if (audit.status !== 'RUNNING') {
        return res.status(400).json({
          success: false,
          error: 'Run is not currently running',
        });
      }

      const updatedAudit = await prisma.audit.update({
        where: { id: runId },
        data: {
          status: 'CANCELLED',
          completedAt: new Date(),
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Run stopped',
        data: updatedAudit,
      });
    })
  );

  return router;
}

export default projectRoutes;
