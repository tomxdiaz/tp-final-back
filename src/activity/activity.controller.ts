import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ActivityService } from './activity.service';
import { ActivityDto } from './dto/activity.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { CurrentAppUser } from '../auth/decorators/current-app-user.decorator';
import type { Tables } from '../supabase/database.types';

type AppUser = Tables<'app_user'>;

@ApiTags('activity')
@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({ summary: 'Crear actividad (requiere business verificado)' })
  @ApiCreatedResponse({ type: ActivityDto })
  @ApiBadRequestResponse({
    description: 'Sin business profile o no verificado',
  })
  @ApiUnauthorizedResponse({ description: 'Token inválido o no enviado' })
  @ApiInternalServerErrorResponse({ description: 'Error interno' })
  async create(
    @CurrentAppUser appUser: AppUser,
    @Body() dto: CreateActivityDto,
  ): Promise<ActivityDto> {
    return this.activityService.create(appUser.id, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar actividades activas de negocios verificados (público)',
  })
  @ApiOkResponse({ type: ActivityDto, isArray: true })
  @ApiInternalServerErrorResponse({ description: 'Error interno' })
  async findAll(): Promise<ActivityDto[]> {
    return this.activityService.findAllPublic();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener actividad por id (público)' })
  @ApiOkResponse({ type: ActivityDto })
  @ApiNotFoundResponse({ description: 'Actividad no encontrada' })
  @ApiInternalServerErrorResponse({ description: 'Error interno' })
  async findById(@Param('id', ParseIntPipe) id: number): Promise<ActivityDto> {
    return this.activityService.findById(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({ summary: 'Editar actividad (solo el dueño)' })
  @ApiOkResponse({ type: ActivityDto })
  @ApiUnauthorizedResponse({ description: 'Token inválido o no enviado' })
  @ApiForbiddenResponse({ description: 'No es el dueño de la actividad' })
  @ApiNotFoundResponse({ description: 'Actividad no encontrada' })
  @ApiInternalServerErrorResponse({ description: 'Error interno' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @CurrentAppUser appUser: AppUser,
    @Body() dto: UpdateActivityDto,
  ): Promise<ActivityDto> {
    return this.activityService.update(id, appUser.id, dto);
  }

  @Post(':id/renew')
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({
    summary: 'Renovar sessions de una actividad (solo el dueño)',
  })
  @ApiOkResponse({ type: ActivityDto })
  @ApiUnauthorizedResponse({ description: 'Token inválido o no enviado' })
  @ApiForbiddenResponse({ description: 'No es el dueño de la actividad' })
  @ApiNotFoundResponse({ description: 'Actividad no encontrada' })
  @ApiInternalServerErrorResponse({ description: 'Error interno' })
  async renew(
    @Param('id', ParseIntPipe) id: number,
    @CurrentAppUser appUser: AppUser,
  ): Promise<ActivityDto> {
    return this.activityService.renew(id, appUser.id);
  }

  @Post(':id/deactivate')
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({ summary: 'Desactivar actividad (solo el dueño)' })
  @ApiOkResponse({ type: ActivityDto })
  @ApiUnauthorizedResponse({ description: 'Token inválido o no enviado' })
  @ApiForbiddenResponse({ description: 'No es el dueño de la actividad' })
  @ApiNotFoundResponse({ description: 'Actividad no encontrada' })
  @ApiInternalServerErrorResponse({ description: 'Error interno' })
  async deactivate(
    @Param('id', ParseIntPipe) id: number,
    @CurrentAppUser appUser: AppUser,
  ): Promise<ActivityDto> {
    return this.activityService.deactivate(id, appUser.id);
  }

  @Post(':id/activate')
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({
    summary:
      'Activar actividad (solo el dueño, business debe estar verificado)',
  })
  @ApiOkResponse({ type: ActivityDto })
  @ApiBadRequestResponse({ description: 'Business no verificado' })
  @ApiUnauthorizedResponse({ description: 'Token inválido o no enviado' })
  @ApiForbiddenResponse({ description: 'No es el dueño de la actividad' })
  @ApiNotFoundResponse({ description: 'Actividad no encontrada' })
  @ApiInternalServerErrorResponse({ description: 'Error interno' })
  async activate(
    @Param('id', ParseIntPipe) id: number,
    @CurrentAppUser appUser: AppUser,
  ): Promise<ActivityDto> {
    return this.activityService.activate(id, appUser.id);
  }

  @Get('/business/me')
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({
    summary: 'Listar actividades activas de mi negocio, activas e inactivas',
  })
  @ApiOkResponse({ type: ActivityDto, isArray: true })
  @ApiUnauthorizedResponse({ description: 'Token inválido o no enviado' })
  @ApiForbiddenResponse({ description: 'No es el dueño de la actividad' })
  @ApiNotFoundResponse({ description: 'Negocio no encontrado' })
  @ApiInternalServerErrorResponse({ description: 'Error interno' })
  async findAllOfMyBusiness(
    @CurrentAppUser appUser: AppUser,
  ): Promise<ActivityDto[]> {
    return this.activityService.findAllOfMyBusiness(appUser.id);
  }

  @Get('/business/:businessId')
  @ApiOperation({
    summary: 'Listar actividades activas de un negocio activo',
  })
  @ApiOkResponse({ type: ActivityDto, isArray: true })
  @ApiNotFoundResponse({ description: 'Negocio no encontrado' })
  @ApiInternalServerErrorResponse({ description: 'Error interno' })
  async findAllByBusiness(
    @Param('businessId', ParseIntPipe) businessId: number,
  ): Promise<ActivityDto[]> {
    return this.activityService.findAllByBusinessPublic(businessId);
  }
}
