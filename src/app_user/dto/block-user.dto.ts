import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class BlockUserDto {
  @ApiProperty({ example: true, description: 'true para bloquear, false para desbloquear' })
  @IsBoolean()
  blocked!: boolean;
}
