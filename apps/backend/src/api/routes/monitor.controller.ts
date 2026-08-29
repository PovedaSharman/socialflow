import { Controller, Get, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { PrismaService } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { ioRedis } from '@gitroom/nestjs-libraries/redis/redis.service';

@ApiTags('Monitor')
@Controller('/monitor')
export class MonitorController {
  constructor(private _prisma: PrismaService) {}

  @Get('/live')
  live() {
    return {
      status: 'ok',
      check: 'liveness',
    };
  }

  @Get('/ready')
  async ready(@Res() res: Response) {
    const checks: Record<string, 'ok' | 'error'> = {
      database: 'error',
      redis: 'error',
    };

    try {
      await this._prisma.$queryRaw`SELECT 1`;
      checks.database = 'ok';
    } catch {
      checks.database = 'error';
    }

    try {
      const pong = await ioRedis.ping();
      checks.redis = pong === 'PONG' ? 'ok' : 'error';
    } catch {
      checks.redis = 'error';
    }

    const healthy = Object.values(checks).every((value) => value === 'ok');
    return res.status(healthy ? 200 : 503).json({
      status: healthy ? 'ok' : 'error',
      check: 'readiness',
      checks,
    });
  }

  @Get('/queue/:name')
  async getMessagesGroup() {
    return {
      status: 'success',
      message:
        'Queue probe remains a lightweight placeholder until Temporal metrics are wired.',
    };
  }
}
