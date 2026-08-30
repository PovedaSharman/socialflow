import { PrismaRepository } from '@gitroom/nestjs-libraries/database/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { SaveMediaInformationDto } from '@gitroom/nestjs-libraries/dtos/media/save.media.information.dto';
import { Prisma, PrismaClient } from '@prisma/client';
import { fitsStorageQuota } from '@gitroom/nestjs-libraries/database/prisma/media/storage.quota';
import {
  AuthorizationActions,
  Sections,
  SubscriptionException,
} from '@gitroom/backend/services/auth/permissions/permission.exception.class';

type MediaCreateResult = {
  id: string;
  name: string;
  originalName: string | null;
  path: string;
  thumbnail: string | null;
  alt: string | null;
  fileSize: number;
};

@Injectable()
export class MediaRepository {
  constructor(private _media: PrismaRepository<'media'>) {}

  private mediaSelect = {
    id: true,
    name: true,
    originalName: true,
    path: true,
    thumbnail: true,
    alt: true,
    fileSize: true,
  } as const;

  /**
   * Persist media under a per-organisation advisory lock so concurrent saves
   * cannot both pass an aggregate-then-insert quota check.
   */
  async saveFileAtomic(
    org: string,
    fileName: string,
    filePath: string,
    originalName: string | undefined,
    fileSize: number,
    limitBytes: number | null
  ): Promise<MediaCreateResult> {
    const prisma = this._media.model as unknown as PrismaClient;

    return prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${org}))`;

      if (limitBytes !== null) {
        const aggregate = await tx.media.aggregate({
          where: {
            organizationId: org,
            deletedAt: null,
          },
          _sum: {
            fileSize: true,
          },
        });
        const used = Number(aggregate._sum.fileSize || 0);
        if (
          !fitsStorageQuota({
            usedBytes: used,
            reservedBytes: 0,
            incomingBytes: fileSize,
            limitBytes,
          })
        ) {
          throw new SubscriptionException({
            section: Sections.STORAGE_BYTES,
            action: AuthorizationActions.Create,
          });
        }
      }

      return tx.media.create({
        data: {
          organization: {
            connect: {
              id: org,
            },
          },
          name: fileName,
          path: filePath,
          originalName: originalName || null,
          fileSize,
        },
        select: this.mediaSelect,
      });
    });
  }

  async sumOrganizationFileSize(org: string) {
    const result = await this._media.model.media.aggregate({
      where: {
        organizationId: org,
        deletedAt: null,
      },
      _sum: {
        fileSize: true,
      },
    });
    return Number(result._sum.fileSize || 0);
  }

  getMediaById(org: string, id: string) {
    return this._media.model.media.findFirst({
      where: {
        id,
        organizationId: org,
        deletedAt: null,
      },
    });
  }

  deleteMedia(org: string, id: string) {
    return this._media.model.media.updateMany({
      where: {
        id,
        organizationId: org,
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  saveMediaInformation(org: string, data: SaveMediaInformationDto) {
    return this._media.model.media.update({
      where: {
        id: data.id,
        organizationId: org,
      },
      data: {
        alt: data.alt,
        thumbnail: data.thumbnail,
        thumbnailTimestamp: data.thumbnailTimestamp,
      },
      select: {
        id: true,
        name: true,
        originalName: true,
        alt: true,
        thumbnail: true,
        path: true,
        thumbnailTimestamp: true,
      },
    });
  }

  async getMedia(org: string, page: number, search?: string) {
    const pageNum = (page || 1) - 1;
    const trimmedSearch = search?.trim();
    const searchFilter = trimmedSearch
      ? {
          originalName: {
            contains: trimmedSearch,
            mode: 'insensitive' as const,
          },
        }
      : {};
    const query: { where: Prisma.MediaWhereInput } = {
      where: {
        organization: {
          id: org,
        },
        deletedAt: null,
        ...searchFilter,
      },
    };
    const pages = Math.ceil((await this._media.model.media.count(query)) / 18);
    const results = await this._media.model.media.findMany({
      where: {
        organizationId: org,
        deletedAt: null,
        ...searchFilter,
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        originalName: true,
        path: true,
        thumbnail: true,
        alt: true,
        thumbnailTimestamp: true,
        fileSize: true,
      },
      skip: pageNum * 18,
      take: 18,
    });

    return {
      pages,
      results,
    };
  }
}
