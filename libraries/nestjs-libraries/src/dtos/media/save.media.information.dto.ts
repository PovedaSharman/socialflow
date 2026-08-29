import {
  IsNumber,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { MEDIA_ALT_MAX_LENGTH } from '@gitroom/nestjs-libraries/dtos/media/media.accessibility';
import { Transform } from 'class-transformer';

export class SaveMediaInformationDto {
  @IsString()
  id: string;

  @IsString()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MinLength(1)
  @MaxLength(MEDIA_ALT_MAX_LENGTH)
  alt: string;

  @IsUrl()
  @ValidateIf((o) => !!o.thumbnail)
  thumbnail: string;

  @IsNumber()
  @ValidateIf((o) => !!o.thumbnailTimestamp)
  thumbnailTimestamp: number;
}
