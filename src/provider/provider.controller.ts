import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ProviderService } from './provider.service';
import { ProviderDto } from './dto/provider.dto';
import { CreateProviderDto } from './dto/create-provider.dto';
import { UpdateProviderDto } from './dto/update-provider.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentAppUser } from '../auth/decorators/current-app-user.decorator';
import { AppRole } from '../utils/enums/roles';
import type { Tables } from '../supabase/database.types';

type AppUser = Tables<'app_user'>;

@ApiTags('provider')
@Controller('provider')
export class ProviderController {
  constructor(private readonly providerService: ProviderService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({ summary: 'Crear perfil de provider (USER o SUPER_USER)' })
  @ApiCreatedResponse({ type: ProviderDto })
  @ApiConflictResponse({ description: 'Ya existe un perfil de provider para este usuario' })
  @ApiUnauthorizedResponse({ description: 'Token inválido o no enviado' })
  @ApiInternalServerErrorResponse({ description: 'Error interno' })
  async create(
    @CurrentAppUser appUser: AppUser,
    @Body() dto: CreateProviderDto,
  ): Promise<ProviderDto> {
    return this.providerService.create(appUser.id, dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @Roles(AppRole.PROVIDER)
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Mi perfil de provider (PROVIDER o SUPER_USER)' })
  @ApiOkResponse({ type: ProviderDto })
  @ApiUnauthorizedResponse({ description: 'Token inválido o no enviado' })
  @ApiForbiddenResponse({ description: 'Sin permisos' })
  @ApiNotFoundResponse({ description: 'Perfil de provider no encontrado' })
  @ApiInternalServerErrorResponse({ description: 'Error interno' })
  async findMe(@CurrentAppUser appUser: AppUser): Promise<ProviderDto> {
    return this.providerService.findMyProfile(appUser.id);
  }

  @Patch('me')
  @ApiBearerAuth()
  @Roles(AppRole.PROVIDER)
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Editar mi perfil de provider (PROVIDER o SUPER_USER)' })
  @ApiOkResponse({ type: ProviderDto })
  @ApiUnauthorizedResponse({ description: 'Token inválido o no enviado' })
  @ApiForbiddenResponse({ description: 'Sin permisos' })
  @ApiNotFoundResponse({ description: 'Perfil de provider no encontrado' })
  @ApiInternalServerErrorResponse({ description: 'Error interno' })
  async updateMe(
    @CurrentAppUser appUser: AppUser,
    @Body() dto: UpdateProviderDto,
  ): Promise<ProviderDto> {
    return this.providerService.updateMyProfile(appUser.id, dto);
  }

  @Get(':providerId')
  @ApiOperation({ summary: 'Perfil público de un provider (sin auth)' })
  @ApiOkResponse({ type: ProviderDto })
  @ApiNotFoundResponse({ description: 'Provider no encontrado' })
  @ApiInternalServerErrorResponse({ description: 'Error interno' })
  async findPublicById(@Param('providerId') providerId: string): Promise<ProviderDto> {
    return this.providerService.findPublicById(providerId);
  }
}
