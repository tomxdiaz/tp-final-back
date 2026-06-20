import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

export class UpdateBusinessDto {
  @ApiPropertyOptional({ example: 'Aventuras del Sur' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  business_name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((o) => o.contact_email !== '' && o.contact_email != null)
  @IsEmail()
  contact_email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(30)
  contact_phone?: string;
}
