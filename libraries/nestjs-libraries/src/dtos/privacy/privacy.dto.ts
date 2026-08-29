import {
  IsBoolean,
  IsDefined,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RecordConsentDto {
  @IsString()
  @IsDefined()
  @MinLength(1)
  @MaxLength(100)
  purpose: string;

  @IsString()
  @IsDefined()
  @MinLength(1)
  @MaxLength(40)
  version: string;

  @IsBoolean()
  granted: boolean;
}

export class RequestDeletionDto {
  @IsString()
  @IsDefined()
  @MinLength(1)
  password: string;
}
