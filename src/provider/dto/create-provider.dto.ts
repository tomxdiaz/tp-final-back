import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateProviderDto {
  @ApiProperty({ example: 'Aventuras del Sur' })
  @IsString()
  @MaxLength(200)
  business_name!: string;

  @ApiPropertyOptional({ example: 'Ofrecemos excursiones en la Patagonia' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'contacto@aventurasur.com' })
  @IsOptional()
  @IsEmail()
  contact_email?: string;

  @ApiPropertyOptional({ example: '+54911234567' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  contact_phone?: string;
}
