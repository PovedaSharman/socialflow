import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RequestPostApprovalDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
