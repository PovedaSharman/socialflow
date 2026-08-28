import { IsBoolean, IsDefined, IsString, MaxLength } from 'class-validator';

export class SignatureDto {
  @IsString()
  @MaxLength(10_000)
  @IsDefined()
  content: string;

  @IsBoolean()
  @IsDefined()
  autoAdd: boolean;
}
