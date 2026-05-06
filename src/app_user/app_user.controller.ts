import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { AppUserService } from './app_user.service';
import { AppUserDto } from './dto/app_user.dto';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentAppUser } from '../auth/decorators/current-app-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { AppRole } from '../utils/enums/roles';
import type { Tables } from '../supabase/database.types';
import { UpdateGlobalRoleDto } from './dto/update-role.dto';

type AppUser = Tables<'app_user'>;

@ApiTags('app_user')
@Controller('app_user')
export class AppUserController {
  constructor(private readonly appUserService: AppUserService) {}

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener información del usuario logueado' })
  @ApiOkResponse({
    description: 'Usuario logueado obtenido correctamente',
    type: AppUserDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido, expirado o no enviado',
  })
  @ApiNotFoundResponse({
    description: 'Usuario no encontrado',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error interno del servidor al obtener el usuario logueado',
  })
  @UseGuards(SupabaseAuthGuard)
  async findMe(@CurrentAppUser appUser: AppUser): Promise<AppUserDto> {
    return await this.appUserService.findById(appUser.id);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Obtener todos los usuarios (solo para SUPER_USER)',
  })
  @ApiOkResponse({
    description: 'Listado de usuarios obtenido correctamente',
    type: AppUserDto,
    isArray: true,
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido, expirado o no enviado',
  })
  @ApiForbiddenResponse({
    description: 'El usuario no tiene permisos suficientes',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error interno del servidor al obtener los usuarios',
  })
  @Roles(AppRole.SUPER_USER)
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  async findAll(): Promise<AppUserDto[]> {
    return await this.appUserService.findAll();
  }

  @Patch('role')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Actualizar el rol global de un usuario (solo para SUPER_USER)',
  })
  @ApiOkResponse({
    description: 'Rol global actualizado correctamente',
    type: AppUserDto,
  })
  @ApiBadRequestResponse({
    description: 'Datos inválidos para actualizar el rol',
  })
  @ApiUnauthorizedResponse({
    description: 'Token inválido, expirado o no enviado',
  })
  @ApiForbiddenResponse({
    description: 'El usuario no tiene permisos suficientes',
  })
  @ApiNotFoundResponse({
    description: 'Usuario a actualizar no encontrado',
  })
  @ApiInternalServerErrorResponse({
    description: 'Error interno del servidor al actualizar el rol global',
  })
  @Roles(AppRole.SUPER_USER)
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  async updateGlobalRole(
    @Body() updateGlobalRoleDto: UpdateGlobalRoleDto,
  ): Promise<AppUserDto> {
    return await this.appUserService.updateGlobalRole(updateGlobalRoleDto);
  }
}
