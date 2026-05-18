import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { AppRole } from '../../utils/enums/roles';

export class AppUserDto {
  @ApiProperty({ example: '1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a', format: 'uuid' })
  @IsUUID()
  id!: string;

  @ApiProperty({ example: 'owner@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: AppRole, example: 'USER' })
  @IsEnum(AppRole)
  global_role!: AppRole;

  @ApiPropertyOptional({ example: 'Juan' })
  @IsOptional()
  @IsString()
  first_name!: string | null;

  @ApiPropertyOptional({ example: 'Pérez' })
  @IsOptional()
  @IsString()
  last_name!: string | null;

  @ApiPropertyOptional({ example: '+54911234567' })
  @IsOptional()
  @IsString()
  phone!: string | null;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  created_at!: string;

  @ApiProperty({ example: '2024-01-01T00:00:00Z' })
  updated_at!: string;
}
