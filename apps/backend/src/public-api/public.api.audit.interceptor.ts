import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { PrivacyRepository } from '@gitroom/nestjs-libraries/database/prisma/privacy/privacy.repository';
import { catchError, concatMap, from, map, Observable, throwError } from 'rxjs';

@Injectable()
export class PublicApiAuditInterceptor implements NestInterceptor {
  constructor(private _privacyRepository: PrivacyRepository) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const record = (outcome: 'success' | 'failed', error?: any) =>
      this._privacyRepository.createAuditEvent({
        organizationId: request.org.id,
        actorUserId: null,
        action: 'api.request',
        targetType: 'public_api',
        targetId: request.publicApiScopeDecision?.required || null,
        outcome,
        source: 'api',
        requestId: request.headers?.['x-request-id'] || null,
        metadata: {
          action: request.publicApiScopeDecision?.action || null,
          required: request.publicApiScopeDecision?.required || null,
          authKind: request.org.authKind || null,
          apiCredentialId: request.org.apiCredentialId || null,
          statusCode: error?.status || error?.statusCode || null,
        },
        ip: request.ip,
      });

    return next.handle().pipe(
      concatMap((value) => from(record('success')).pipe(map(() => value))),
      catchError((error) =>
        from(record('failed', error)).pipe(
          concatMap(() => throwError(() => error))
        )
      )
    );
  }
}
