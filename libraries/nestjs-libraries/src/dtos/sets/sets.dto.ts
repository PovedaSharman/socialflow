import { IsDefined, IsOptional, IsString, MaxLength } from 'class-validator';

export class SetsDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  id?: string;

  @IsString()
  @MaxLength(120)
  @IsDefined()
  name: string;

  @IsString()
  @MaxLength(100_000)
  @IsDefined()
  content: string;
}

export class UpdateSetsDto {
  @IsString()
  @MaxLength(128)
  @IsDefined()
  id: string;

  @IsString()
  @MaxLength(120)
  @IsDefined()
  name: string;

  @IsString()
  @MaxLength(100_000)
  @IsDefined()
  content: string;
}
