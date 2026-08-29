import { AgentToolInterface } from '@gitroom/nestjs-libraries/chat/agent.tool.interface';
import { createTool } from '@mastra/core/tools';
import { Injectable } from '@nestjs/common';
import z from 'zod';
import {
  checkAuth,
  missingMcpScope,
} from '@gitroom/nestjs-libraries/chat/auth.context';
import { PrivacyRepository } from '@gitroom/nestjs-libraries/database/prisma/privacy/privacy.repository';
import {
  readMcpOrganization,
  recordMcpAudit,
} from '@gitroom/nestjs-libraries/chat/mcp.audit';

@Injectable()
export class AuditListTool implements AgentToolInterface {
  constructor(private _privacyRepository: PrivacyRepository) {}
  name = 'auditList';

  run() {
    return createTool({
      id: 'auditList',
      description:
        'List recent organisation audit events (actor-safe metadata only). Requires audit:read.',
      inputSchema: z.object({
        take: z
          .number()
          .int()
          .min(1)
          .max(100)
          .optional()
          .describe('Maximum events to return (default 20, max 100)'),
      }),
      mcp: {
        annotations: {
          title: 'List Audit Events',
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      outputSchema: z.object({
        output: z.array(
          z.object({
            id: z.string(),
            action: z.string(),
            targetType: z.string(),
            targetId: z.string().nullable(),
            outcome: z.string(),
            source: z.string(),
            createdAt: z.string(),
          })
        ),
        errors: z.string().optional(),
      }),
      execute: async (inputData, context) => {
        checkAuth(inputData, context);
        const scopeError = missingMcpScope('audit:read', context);
        if (scopeError) {
          await recordMcpAudit(this._privacyRepository, context, {
            action: 'mcp.audit.list',
            targetType: 'audit',
            outcome: 'denied',
            metadata: { reason: 'missing_scope' },
          });
          return { output: [], errors: scopeError };
        }

        const org = readMcpOrganization(context);
        if (!org?.id) {
          return { output: [], errors: 'Organisation context missing' };
        }

        const rows = await this._privacyRepository.listAuditEvents(
          org.id,
          inputData.take || 20
        );

        await recordMcpAudit(this._privacyRepository, context, {
          organizationId: org.id,
          action: 'mcp.audit.list',
          targetType: 'audit',
          outcome: 'success',
          metadata: { count: rows.length },
        });

        return {
          output: rows.map((row) => ({
            id: row.id,
            action: row.action,
            targetType: row.targetType,
            targetId: row.targetId,
            outcome: row.outcome,
            source: row.source,
            createdAt: row.createdAt.toISOString(),
          })),
        };
      },
    });
  }
}
