import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsUUID } from 'class-validator';
import { AppRole } from '../../utils/enums/roles';

export class AppUserDto {
  @ApiProperty({
    example: '1a1a1a1a-1a1a-1a1a-1a1a-1a1a1a1a1a1a',
    format: 'uuid',
  })
  @IsUUID()
  id!: string;

  @ApiProperty({ example: 'owner@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: AppRole, example: 'USER' })
  @IsEnum(AppRole, {
    message: `global_role must be one of: ${Object.values(AppRole).join(', ')}`,
  })
  global_role!: AppRole;
}
