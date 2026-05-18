import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { AppUserService } from './app_user.service';
import { AppUserDto } from './dto/app_user.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { CurrentAppUser } from '../auth/decorators/current-app-user.decorator';
import type { Tables } from '../supabase/database.types';

type AppUser = Tables<'app_user'>;

@ApiTags('app_user')
@ApiBearerAuth()
@UseGuards(SupabaseAuthGuard)
@Controller('app_user')
export class AppUserController {
  constructor(private readonly appUserService: AppUserService) {}

  @Get('me')
  @ApiOperation({ summary: 'Obtener mi perfil' })
  @ApiOkResponse({ type: AppUserDto })
  @ApiUnauthorizedResponse({ description: 'Token inválido o no enviado' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  @ApiInternalServerErrorResponse({ description: 'Error interno' })
  async findMe(@CurrentAppUser appUser: AppUser): Promise<AppUserDto> {
    return this.appUserService.findById(appUser.id);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Editar mi perfil (first_name, last_name, phone)' })
  @ApiOkResponse({ type: AppUserDto })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  @ApiUnauthorizedResponse({ description: 'Token inválido o no enviado' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  @ApiInternalServerErrorResponse({ description: 'Error interno' })
  async updateMe(
    @CurrentAppUser appUser: AppUser,
    @Body() dto: UpdateMeDto,
  ): Promise<AppUserDto> {
    return this.appUserService.updateMe(appUser.id, dto);
  }
}
