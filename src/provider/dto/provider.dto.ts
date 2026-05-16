import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString, IsUUID } from 'class-validator';

export class ProviderDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  id!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  app_user_id!: string;

  @ApiProperty({ example: 'Aventuras del Sur' })
  @IsString()
  business_name!: string;

  @ApiPropertyOptional({ example: 'Ofrecemos excursiones en la Patagonia' })
  @IsOptional()
  @IsString()
  description!: string | null;

  @ApiPropertyOptional({ example: 'contacto@aventurasur.com' })
  @IsOptional()
  @IsEmail()
  contact_email!: string | null;

  @ApiPropertyOptional({ example: '+54911234567' })
  @IsOptional()
  @IsString()
  contact_phone!: string | null;

  @ApiProperty({ example: false })
  @IsBoolean()
  verified!: boolean;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  created_at!: string;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  updated_at!: string;
}
