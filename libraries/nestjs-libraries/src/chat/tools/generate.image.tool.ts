import { AgentToolInterface } from '@gitroom/nestjs-libraries/chat/agent.tool.interface';
import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { Injectable } from '@nestjs/common';
import { MediaService } from '@gitroom/nestjs-libraries/database/prisma/media/media.service';
import { UploadFactory } from '@gitroom/nestjs-libraries/upload/upload.factory';
import { checkAuth } from '@gitroom/nestjs-libraries/chat/auth.context';
import { PrivacyRepository } from '@gitroom/nestjs-libraries/database/prisma/privacy/privacy.repository';
import {
  enforceMcpScopeAudit,
  recordMcpAudit,
} from '@gitroom/nestjs-libraries/chat/mcp.audit';

@Injectable()
export class GenerateImageTool implements AgentToolInterface {
  private storage = UploadFactory.createStorage();

  constructor(
    private _mediaService: MediaService,
    private _privacyRepository: PrivacyRepository
  ) {}
  name = 'generateImageTool';

  run() {
    return createTool({
      id: 'generateImageTool',
      description: `Generate image to use in a post,
                    in case the user specified a platform that requires attachment and attachment was not provided,
                    ask if they want to generate a picture of a video.
      `,
      mcp: {
        annotations: {
          title: 'Generate Image',
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: true,
        },
      },
      inputSchema: z.object({
        prompt: z.string(),
      }),
      outputSchema: z.object({
        id: z.string(),
        path: z.string(),
      }),
      execute: async (inputData, context) => {
        checkAuth(inputData, context);
        const scopeError = await enforceMcpScopeAudit(
          this._privacyRepository,
          context,
          'media:generate',
          'mcp.media.generate',
          'media'
        );
        if (scopeError) {
          throw new Error(scopeError);
        }
        const org = JSON.parse(
          (context?.requestContext as any)?.get('organization') as string
        );
        try {
          const image = await this._mediaService.generateImage(
            inputData.prompt,
            org
          );

          const dataUrl = 'data:image/png;base64,' + image;
          const knownSize = Buffer.from(image, 'base64').length;
          const file = await this.storage.uploadSimple(dataUrl);

          const saved = await this._mediaService.saveFile(
            org.id,
            file.split('/').pop()!,
            file,
            undefined,
            knownSize
          );

          await recordMcpAudit(this._privacyRepository, context, {
            action: 'mcp.media.generate',
            targetType: 'media',
            targetId: saved.id,
            outcome: 'success',
            metadata: { kind: 'image' },
          });

          return saved;
        } catch (err) {
          await recordMcpAudit(this._privacyRepository, context, {
            action: 'mcp.media.generate',
            targetType: 'media',
            outcome: 'failed',
            metadata: { kind: 'image' },
          });
          throw err;
        }
      },
    });
  }
}
