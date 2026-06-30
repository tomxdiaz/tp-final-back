import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNoContentResponse,
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
import { SessionDetailDto } from './dto/session-detail.dto';
import { ReviewEligibilityDto } from './dto/review-eligibility.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { CurrentAppUser } from '../auth/decorators/current-app-user.decorator';
import type { Tables } from '../supabase/database.types';
import type { UploadedImage } from '../supabase/supabase.service';

type AppUser = Tables<'app_user'>;

const MAX_IMAGES = 10;
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const imageInterceptorOptions = {
  limits: { fileSize: MAX_IMAGE_SIZE_BYTES },
  fileFilter: (
    _req: unknown,
    file: { mimetype: string },
    cb: (error: Error | null, accept: boolean) => void,
  ) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos de imagen'), false);
    }
  },
};

@ApiTags('activity')
@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  @UseInterceptors(
    FilesInterceptor('images', MAX_IMAGES, imageInterceptorOptions),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateActivityDto })
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
    @UploadedFiles() images: UploadedImage[],
  ): Promise<ActivityDto> {
    return this.activityService.create(appUser.id, dto, images);
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
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ActivityDto> {
    return this.activityService.findById(id);
  }

  @Get(':id/review-eligibility')
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({
    summary:
      'Indica si el usuario autenticado puede dejar una reseña (reserva confirmada)',
  })
  @ApiOkResponse({ type: ReviewEligibilityDto })
  @ApiUnauthorizedResponse({ description: 'Token inválido o no enviado' })
  @ApiNotFoundResponse({ description: 'Actividad no encontrada' })
  @ApiInternalServerErrorResponse({ description: 'Error interno' })
  async getReviewEligibility(
    @Param('id', ParseIntPipe) id: number,
    @CurrentAppUser appUser: AppUser,
  ): Promise<ReviewEligibilityDto> {
    return this.activityService.getReviewEligibility(id, appUser.id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  @UseInterceptors(
    FilesInterceptor('images', MAX_IMAGES, imageInterceptorOptions),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateActivityDto })
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
    @UploadedFiles() images: UploadedImage[],
  ): Promise<ActivityDto> {
    return this.activityService.update(id, appUser.id, dto, images);
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

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar actividad (solo el dueño)' })
  @ApiNoContentResponse()
  @ApiUnauthorizedResponse({ description: 'Token inválido o no enviado' })
  @ApiForbiddenResponse({ description: 'No es el dueño de la actividad' })
  @ApiNotFoundResponse({ description: 'Actividad no encontrada' })
  @ApiInternalServerErrorResponse({ description: 'Error interno' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentAppUser appUser: AppUser,
  ): Promise<void> {
    return this.activityService.delete(id, appUser.id);
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
    summary: 'Listar actividades de mi negocio, activas e inactivas',
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

  @Get('/me/:id')
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({
    summary: 'Obtener actividad por id (solo el dueño, activa o inactiva)',
  })
  @ApiOkResponse({ type: ActivityDto })
  @ApiUnauthorizedResponse({ description: 'Token inválido o no enviado' })
  @ApiForbiddenResponse({ description: 'No es el dueño de la actividad' })
  @ApiNotFoundResponse({ description: 'Actividad no encontrada' })
  @ApiInternalServerErrorResponse({ description: 'Error interno' })
  async findByIdOwner(
    @Param('id', ParseIntPipe) id: number,
    @CurrentAppUser appUser: AppUser,
  ): Promise<ActivityDto> {
    return await this.activityService.findByIdOwner(id, appUser.id);
  }

  @Get(':id/session/:sessionId')
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({ summary: 'Detalle de una sesión con sus reservas (solo el dueño)' })
  @ApiOkResponse({ type: SessionDetailDto })
  @ApiUnauthorizedResponse({ description: 'Token inválido o no enviado' })
  @ApiForbiddenResponse({ description: 'No es el dueño de la actividad' })
  @ApiNotFoundResponse({ description: 'Actividad o sesión no encontrada' })
  @ApiInternalServerErrorResponse({ description: 'Error interno' })
  async findSessionDetail(
    @Param('id', ParseIntPipe) activityId: number,
    @Param('sessionId', ParseIntPipe) sessionId: number,
    @CurrentAppUser appUser: AppUser,
  ): Promise<SessionDetailDto> {
    return this.activityService.findSessionDetail(activityId, sessionId, appUser.id);
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
