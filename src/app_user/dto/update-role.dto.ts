import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { AppRole } from '../../utils/enums/roles';

export class UpdateGlobalRoleDto {
  @ApiProperty({ enum: Object.values(AppRole), example: 'PROVIDER' })
  @IsEnum(AppRole, {
    message: `role must be one of: ${Object.values(AppRole).join(', ')}`,
  })
  role!: AppRole;
}
