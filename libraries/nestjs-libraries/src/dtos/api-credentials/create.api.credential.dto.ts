import {
  ArrayUnique,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { MCP_SCOPES } from '@gitroom/nestjs-libraries/chat/mcp.scopes';

export class CreateApiCredentialDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  scopes?: string[];

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export const CREATE_API_CREDENTIAL_ALLOWED_SCOPES = [...MCP_SCOPES];
