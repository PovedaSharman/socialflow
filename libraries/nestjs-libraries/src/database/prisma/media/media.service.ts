import { HttpException, Injectable } from '@nestjs/common';
import { MediaRepository } from '@gitroom/nestjs-libraries/database/prisma/media/media.repository';
import { OpenaiService } from '@gitroom/nestjs-libraries/openai/openai.service';
import { generationError } from '@gitroom/nestjs-libraries/openai/generation.error';
import { SubscriptionService } from '@gitroom/nestjs-libraries/database/prisma/subscriptions/subscription.service';
import { Organization } from '@prisma/client';
import { SaveMediaInformationDto } from '@gitroom/nestjs-libraries/dtos/media/save.media.information.dto';
import { VideoManager } from '@gitroom/nestjs-libraries/videos/video.manager';
import { VideoDto } from '@gitroom/nestjs-libraries/dtos/videos/video.dto';
import { UploadFactory } from '@gitroom/nestjs-libraries/upload/upload.factory';
import {
  AuthorizationActions,
  Sections,
  SubscriptionException,
} from '@gitroom/backend/services/auth/permissions/permission.exception.class';
import { pricing } from '@gitroom/nestjs-libraries/database/prisma/subscriptions/pricing';
import { resolveTrustedByteLength } from '@gitroom/nestjs-libraries/database/prisma/media/storage.quota';
import {
  claimStorageReservation,
  releaseStorageReservation,
} from '@gitroom/nestjs-libraries/database/prisma/media/storage.reservation';
import { parseDataUrl } from '@gitroom/nestjs-libraries/upload/data.url';
import { resolveObjectByteLength } from '@gitroom/nestjs-libraries/upload/object.byte.length';

@Injectable()
export class MediaService {
  private storage = UploadFactory.createStorage();

  constructor(
    private _mediaRepository: MediaRepository,
    private _openAi: OpenaiService,
    private _subscriptionService: SubscriptionService,
    private _videoManager: VideoManager
  ) {}

  async deleteMedia(org: string, id: string) {
    return this._mediaRepository.deleteMedia(org, id);
  }

  getMediaById(org: string, id: string) {
    return this._mediaRepository.getMediaById(org, id);
  }

  async generateImage(
    prompt: string,
    org: Organization,
    generatePromptFirst?: boolean
  ) {
    try {
      const generating = await this._subscriptionService.useCredit(
        org,
        'ai_images',
        async () => {
          if (generatePromptFirst) {
            prompt = await this._openAi.generatePromptForPicture(prompt);
            console.log('Prompt:', prompt);
          }
          return this._openAi.generateImage(prompt);
        }
      );

      return generating;
    } catch (err) {
      throw generationError(err);
    }
  }

  private async storageLimitForOrganization(
    org: string
  ): Promise<number | null> {
    if (!process.env.STRIPE_PUBLISHABLE_KEY) {
      return null;
    }
    const subscription =
      await this._subscriptionService.getSubscriptionByOrganizationId(org);
    const tier = subscription?.subscriptionTier || 'FREE';
    return pricing[tier]?.storage_bytes ?? 0;
  }

  /**
   * Persist a media row with a trusted byte length. When Stripe billing is
   * configured, Redis soft-reserves capacity and PostgreSQL re-checks under an
   * organisation advisory lock before insert.
   */
  async saveFile(
    org: string,
    fileName: string,
    filePath: string,
    originalName?: string,
    fileSize?: unknown
  ) {
    let trusted = await resolveObjectByteLength(filePath);
    if (trusted === null) {
      trusted = resolveTrustedByteLength(fileSize);
    }
    if (trusted === null) {
      throw new HttpException(
        'Trusted file size is required before storing media.',
        400
      );
    }

    const limitBytes = await this.storageLimitForOrganization(org);
    let reserved = false;

    try {
      if (limitBytes !== null) {
        const used = await this._mediaRepository.sumOrganizationFileSize(org);
        const claimed = await claimStorageReservation({
          organizationId: org,
          usedBytes: used,
          incomingBytes: trusted,
          limitBytes,
        });
        if (!claimed) {
          throw new SubscriptionException({
            section: Sections.STORAGE_BYTES,
            action: AuthorizationActions.Create,
          });
        }
        reserved = true;
      }

      return await this._mediaRepository.saveFileAtomic(
        org,
        fileName,
        filePath,
        originalName,
        trusted,
        limitBytes
      );
    } catch (err) {
      try {
        await this.storage.removeFile(filePath);
      } catch {
        // Best-effort cleanup; quota denial must still surface.
      }
      throw err;
    } finally {
      if (reserved) {
        await releaseStorageReservation(org, trusted);
      }
    }
  }

  getMedia(org: string, page: number, search?: string) {
    return this._mediaRepository.getMedia(org, page, search);
  }

  saveMediaInformation(org: string, data: SaveMediaInformationDto) {
    return this._mediaRepository.saveMediaInformation(org, data);
  }

  getVideoOptions() {
    return this._videoManager.getAllVideos();
  }

  async generateVideoAllowed(org: Organization, type: string) {
    const video = this._videoManager.getVideoByName(type);
    if (!video) {
      throw new Error(`Video type ${type} not found`);
    }

    if (!video.trial && org.isTrailing) {
      throw new HttpException('This video is not available in trial mode', 406);
    }

    return true;
  }

  async generateVideo(org: Organization, body: VideoDto) {
    try {
      const totalCredits = await this._subscriptionService.checkCredits(
        org,
        'ai_videos'
      );

      if (totalCredits.credits <= 0) {
        throw new SubscriptionException({
          action: AuthorizationActions.Create,
          section: Sections.VIDEOS_PER_MONTH,
        });
      }

      const video = this._videoManager.getVideoByName(body.type);
      if (!video) {
        throw new Error(`Video type ${body.type} not found`);
      }

      if (!video.trial && org.isTrailing) {
        throw new HttpException(
          'This video is not available in trial mode',
          406
        );
      }

      console.log(body.customParams);
      await video.instance.processAndValidate(body.customParams);
      console.log('no err');

      return await this._subscriptionService.useCredit(
        org,
        'ai_videos',
        async () => {
          const loadedData = await video.instance.process(
            body.output,
            body.customParams
          );

          const parsed =
            typeof loadedData === 'string' ? parseDataUrl(loadedData) : null;
          const knownSize = parsed?.buffer.length;
          const file = await this.storage.uploadSimple(loadedData);
          return this.saveFile(
            org.id,
            file.split('/').pop()!,
            file,
            undefined,
            knownSize
          );
        }
      );
    } catch (err) {
      throw generationError(err);
    }
  }

  async videoFunction(identifier: string, functionName: string, body: any) {
    const video = this._videoManager.getVideoByName(identifier);
    if (!video) {
      throw new Error(`Video with identifier ${identifier} not found`);
    }

    // @ts-ignore
    const functionToCall = video.instance[functionName];
    if (
      typeof functionToCall !== 'function' ||
      this._videoManager.checkAvailableVideoFunction(functionToCall)
    ) {
      throw new HttpException(
        `Function ${functionName} not found on video instance`,
        400
      );
    }

    return functionToCall(body);
  }
}
