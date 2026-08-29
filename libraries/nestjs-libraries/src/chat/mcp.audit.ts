import {
  getAuth,
  getRequestId,
} from '@gitroom/nestjs-libraries/chat/async.storage';
import { PrivacyRepository } from '@gitroom/nestjs-libraries/database/prisma/privacy/privacy.repository';
import { AuditEventInput } from '@gitroom/nestjs-libraries/database/prisma/privacy/audit.event';

export type McpOrgContext = {
  id: string;
  apiCredentialId?: string;
};

export function readMcpOrganization(context?: any): McpOrgContext | null {
  try {
    const auth = getAuth() as McpOrgContext | undefined;
    if (auth?.id) {
      return auth;
    }
    const raw = (context?.requestContext as any)?.get?.('organization');
    const parsed = raw ? JSON.parse(raw) : undefined;
    if (parsed?.id) {
      return parsed as McpOrgContext;
    }
  } catch {
    return null;
  }
  return null;
}

export async function recordMcpAudit(
  privacyRepository: PrivacyRepository,
  context: any,
  input: Omit<
    AuditEventInput,
    'organizationId' | 'source' | 'requestId' | 'actorUserId'
  > & { organizationId?: string }
) {
  const org = readMcpOrganization(context);
  const organizationId = input.organizationId || org?.id;
  if (!organizationId) {
    return;
  }

  await privacyRepository.createAuditEvent({
    ...input,
    organizationId,
    actorUserId: null,
    source: 'mcp',
    requestId: getRequestId() || null,
    metadata: {
      ...(input.metadata || {}),
      ...(org?.apiCredentialId ? { apiCredentialId: org.apiCredentialId } : {}),
    },
  });
}
