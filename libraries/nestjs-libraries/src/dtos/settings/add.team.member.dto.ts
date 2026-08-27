import {
  IsBoolean,
  IsDefined,
  IsEmail,
  IsIn,
  IsString,
} from 'class-validator';

export class AddTeamMemberDto {
  @IsDefined()
  @IsEmail()
  email: string;

  @IsString()
  @IsIn(['ADMIN', 'APPROVER', 'EDITOR', 'VIEWER'])
  role: string;

  @IsDefined()
  @IsBoolean()
  sendEmail: boolean;
}
