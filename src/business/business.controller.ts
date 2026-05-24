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
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { BusinessService } from './business.service';
import { BusinessDto } from './dto/business.dto';
import { CreateBusinessDto } from './dto/create-business.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { CurrentAppUser } from '../auth/decorators/current-app-user.decorator';
import type { Tables } from '../supabase/database.types';

type AppUser = Tables<'app_user'>;

@ApiTags('business')
@Controller('business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Post()
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({ summary: 'Crear perfil de negocio (USER o SUPER_USER)' })
  @ApiCreatedResponse({ type: BusinessDto })
  @ApiConflictResponse({
    description: 'Ya existe un perfil de negocio para este usuario',
  })
  @ApiUnauthorizedResponse({ description: 'Token inválido o no enviado' })
  @ApiInternalServerErrorResponse({ description: 'Error interno' })
  async create(
    @CurrentAppUser appUser: AppUser,
    @Body() dto: CreateBusinessDto,
  ): Promise<BusinessDto> {
    return this.businessService.create(appUser.id, dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({ summary: 'Mi perfil de negocio' })
  @ApiOkResponse({ type: BusinessDto })
  @ApiUnauthorizedResponse({ description: 'Token inválido o no enviado' })
  @ApiNotFoundResponse({ description: 'Perfil de negocio no encontrado' })
  @ApiInternalServerErrorResponse({ description: 'Error interno' })
  async findMe(@CurrentAppUser appUser: AppUser): Promise<BusinessDto> {
    return this.businessService.findMyProfile(appUser.id);
  }

  @Patch('me')
  @ApiBearerAuth()
  @UseGuards(SupabaseAuthGuard)
  @ApiOperation({ summary: 'Editar mi perfil de negocio' })
  @ApiOkResponse({ type: BusinessDto })
  @ApiUnauthorizedResponse({ description: 'Token inválido o no enviado' })
  @ApiNotFoundResponse({ description: 'Perfil de negocio no encontrado' })
  @ApiInternalServerErrorResponse({ description: 'Error interno' })
  async updateMe(
    @CurrentAppUser appUser: AppUser,
    @Body() dto: UpdateBusinessDto,
  ): Promise<BusinessDto> {
    return this.businessService.updateMyProfile(appUser.id, dto);
  }

  @Get(':businessId')
  @ApiOperation({ summary: 'Perfil público de un negocio (sin auth)' })
  @ApiOkResponse({ type: BusinessDto })
  @ApiNotFoundResponse({ description: 'Negocio no encontrado' })
  @ApiInternalServerErrorResponse({ description: 'Error interno' })
  async findPublicById(
    @Param('businessId', ParseIntPipe) businessId: number,
  ): Promise<BusinessDto> {
    return this.businessService.findPublicById(businessId);
  }
}
