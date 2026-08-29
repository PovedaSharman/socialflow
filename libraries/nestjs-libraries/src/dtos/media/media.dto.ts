import {
  IsDefined,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
  Validate,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { MEDIA_ALT_MAX_LENGTH } from '@gitroom/nestjs-libraries/dtos/media/media.accessibility';
import {
  ValidUrlExtension,
  ValidUrlPath,
} from '@gitroom/helpers/utils/valid.url.path';

export class MediaDto {
  @IsString()
  @IsDefined()
  id: string;

  @IsString()
  @IsDefined()
  @Validate(ValidUrlPath)
  @Validate(ValidUrlExtension)
  path: string;

  @ValidateIf((o) => o.alt)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(MEDIA_ALT_MAX_LENGTH)
  alt?: string;

  @ValidateIf((o) => o.thumbnail)
  @IsUrl()
  thumbnail?: string;
}
