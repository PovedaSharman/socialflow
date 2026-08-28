import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class DecidePostApprovalDto {
  @IsIn(['APPROVED', 'REJECTED'])
  decision: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
