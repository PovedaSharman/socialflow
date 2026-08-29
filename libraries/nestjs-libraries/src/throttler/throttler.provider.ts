import { ThrottlerGuard } from '@nestjs/throttler';
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';

const AUTH_MUTATION_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot',
  '/auth/forgot-return',
  '/auth/resend-activation',
  '/auth/activate',
];

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  public override async canActivate(
    context: ExecutionContext
  ): Promise<boolean> {
    const { url, method } = context.switchToHttp().getRequest<Request>();
    const path = String(url || '').split('?')[0];
    const isAuthMutation =
      method === 'POST' &&
      AUTH_MUTATION_PATHS.some((candidate) => path.endsWith(candidate));
    const isPublicPosts =
      method === 'POST' && path.includes('/public/v1/posts');

    if (isAuthMutation || isPublicPosts) {
      return super.canActivate(context);
    }

    return true;
  }

  protected override async getTracker(
    req: Record<string, any>
  ): Promise<string> {
    if (!req.org?.id) {
      const forwarded = String(req.headers?.['x-forwarded-for'] || '')
        .split(',')[0]
        .trim();
      return `ip_${forwarded || req.ip || 'unknown'}`;
    }

    const credential = String(
      req.headers?.authorization || req.headers?.['x-api-key'] || ''
    )
      .slice(0, 24)
      .replace(/[^a-zA-Z0-9_:-]/g, '');

    return (
      req.org.id +
      '_' +
      (credential || 'session') +
      '_' +
      (String(req.url || '').indexOf('/posts') > -1 ? 'posts' : 'other')
    );
  }
}
