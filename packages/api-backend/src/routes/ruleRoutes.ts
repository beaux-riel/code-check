import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { z } from 'zod';

// Import the rule system from core-engine
// For now, we'll create a basic structure that can be expanded
const updateRuleSchema = z.object({
  enabled: z.boolean().optional(),
  severity: z.enum(['error', 'warning', 'info']).optional(),
  config: z.record(z.any()).optional(),
});

function ruleRoutes(): Router {
  const router = Router();

  // Get all rules organized by category
  router.get(
    '/',
    asyncHandler(async (req, res) => {
      // This would normally come from the core-engine rule system
      // For now, return a mock structure that matches the frontend expectations
      const ruleCategories = [
        {
          id: 'security',
          name: 'Security',
          description: 'Security-related code analysis rules',
          rules: [
            {
              id: 'security/sql-injection',
              name: 'SQL Injection Prevention',
              description: 'Detects potential SQL injection vulnerabilities',
              category: 'security',
              severity: 'error',
              enabled: true,
              fixable: true,
              config: {},
            },
            {
              id: 'security/xss-prevention',
              name: 'XSS Prevention',
              description:
                'Detects potential cross-site scripting vulnerabilities',
              category: 'security',
              severity: 'error',
              enabled: true,
              fixable: false,
              config: {},
            },
            {
              id: 'security/hardcoded-secrets',
              name: 'Hardcoded Secrets',
              description:
                'Detects hardcoded passwords, API keys, and other secrets',
              category: 'security',
              severity: 'error',
              enabled: true,
              fixable: false,
              config: {},
            },
          ],
        },
        {
          id: 'performance',
          name: 'Performance',
          description: 'Performance optimization rules',
          rules: [
            {
              id: 'performance/react-anonymous-functions',
              name: 'React Anonymous Functions',
              description: 'Avoid anonymous functions in JSX props',
              category: 'performance',
              severity: 'warning',
              enabled: true,
              fixable: true,
              config: {},
            },
            {
              id: 'performance/expensive-operations',
              name: 'Expensive Operations',
              description:
                'Detects potentially expensive operations that should be memoized',
              category: 'performance',
              severity: 'warning',
              enabled: true,
              fixable: false,
              config: {},
            },
          ],
        },
        {
          id: 'code-quality',
          name: 'Code Quality',
          description: 'General code quality and maintainability rules',
          rules: [
            {
              id: 'quality/complexity',
              name: 'Cyclomatic Complexity',
              description: 'Detects functions with high cyclomatic complexity',
              category: 'code-quality',
              severity: 'warning',
              enabled: true,
              fixable: false,
              config: {
                maxComplexity: 10,
              },
            },
            {
              id: 'quality/duplicate-code',
              name: 'Duplicate Code',
              description: 'Detects duplicate code blocks',
              category: 'code-quality',
              severity: 'info',
              enabled: true,
              fixable: false,
              config: {
                minLines: 5,
              },
            },
          ],
        },
        {
          id: 'design-patterns',
          name: 'Design Patterns',
          description: 'Design pattern implementation guidelines',
          rules: [
            {
              id: 'patterns/singleton',
              name: 'Singleton Pattern',
              description: 'Validates proper singleton pattern implementation',
              category: 'design-patterns',
              severity: 'info',
              enabled: false,
              fixable: true,
              config: {},
            },
            {
              id: 'patterns/factory',
              name: 'Factory Pattern',
              description: 'Suggests factory pattern usage where appropriate',
              category: 'design-patterns',
              severity: 'info',
              enabled: false,
              fixable: false,
              config: {},
            },
          ],
        },
      ];

      return res.status(200).json({ success: true, data: ruleCategories });
    })
  );

  // Update a specific rule
  router.put(
    '/:ruleId',
    asyncHandler(async (req, res) => {
      const ruleId = req.params.ruleId;
      const result = updateRuleSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: 'Validation error',
          details: result.error.format(),
        });
      }

      // In a real implementation, this would update the rule configuration
      // For now, return the updated rule data
      const updatedRule = {
        id: ruleId,
        ...result.data,
        updatedAt: new Date().toISOString(),
      };

      return res.status(200).json({ success: true, data: updatedRule });
    })
  );

  // Get a specific rule
  router.get(
    '/:ruleId',
    asyncHandler(async (req, res) => {
      const ruleId = req.params.ruleId;

      // Mock rule data - in real implementation, would come from rule system
      const rule = {
        id: ruleId,
        name: 'Example Rule',
        description: 'An example rule for demonstration',
        category: 'general',
        severity: 'warning',
        enabled: true,
        fixable: false,
        config: {},
        documentation: {
          description: 'Detailed description of what this rule checks for',
          examples: [
            {
              title: 'Bad Example',
              code: '// Example of code that would trigger this rule',
              valid: false,
            },
            {
              title: 'Good Example',
              code: '// Example of code that follows this rule',
              valid: true,
            },
          ],
          references: [
            {
              title: 'Documentation Link',
              url: 'https://example.com/docs',
            },
          ],
        },
      };

      return res.status(200).json({ success: true, data: rule });
    })
  );

  // Reset rules to defaults
  router.post(
    '/reset',
    asyncHandler(async (req, res) => {
      // In a real implementation, this would reset all rules to their default configuration
      return res.status(200).json({
        success: true,
        message: 'Rules reset to defaults',
      });
    })
  );

  // Export rule configuration
  router.get(
    '/export',
    asyncHandler(async (req, res) => {
      const { format = 'json' } = req.query;

      // Mock configuration export
      const config = {
        version: '1.0.0',
        rules: {
          'security/sql-injection': { enabled: true, severity: 'error' },
          'performance/react-anonymous-functions': {
            enabled: true,
            severity: 'warning',
          },
          'quality/complexity': {
            enabled: true,
            severity: 'warning',
            config: { maxComplexity: 10 },
          },
        },
        exportedAt: new Date().toISOString(),
      };

      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader(
          'Content-Disposition',
          'attachment; filename="codecheck-rules.json"'
        );
        return res.status(200).json(config);
      }

      return res.status(400).json({
        success: false,
        error: 'Unsupported export format',
      });
    })
  );

  // Import rule configuration
  router.post(
    '/import',
    asyncHandler(async (req, res) => {
      const configSchema = z.object({
        version: z.string(),
        rules: z.record(
          z.object({
            enabled: z.boolean().optional(),
            severity: z.enum(['error', 'warning', 'info']).optional(),
            config: z.record(z.any()).optional(),
          })
        ),
      });

      const result = configSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid configuration format',
          details: result.error.format(),
        });
      }

      // In a real implementation, this would apply the imported configuration
      return res.status(200).json({
        success: true,
        message: 'Configuration imported successfully',
        imported: Object.keys(result.data.rules).length,
      });
    })
  );

  return router;
}

export default ruleRoutes;
