import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AppUserService } from '../app_user/app_user.service';
import { AppUserDto } from '../app_user/dto/app_user.dto';
import { UpdateGlobalRoleDto } from '../app_user/dto/update-role.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AppRole } from '../utils/enums/roles';
import { BusinessDto } from '../business/dto/business.dto';
import { BusinessService } from '../business/business.service';

@ApiTags('admin')
@ApiBearerAuth()
@Roles(AppRole.SUPER_USER)
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly appUserService: AppUserService,
    private readonly businessService: BusinessService,
  ) {}

  @Get('/user')
  @ApiOperation({ summary: 'Listar todos los usuarios (SUPER_USER)' })
  @ApiOkResponse({ type: AppUserDto, isArray: true })
  @ApiUnauthorizedResponse({ description: 'Token inválido o no enviado' })
  @ApiForbiddenResponse({ description: 'Sin permisos' })
  @ApiInternalServerErrorResponse({ description: 'Error interno' })
  async findAllUsers(): Promise<AppUserDto[]> {
    return this.appUserService.findAll();
  }

  @Patch('/user/:id/role')
  @ApiOperation({ summary: 'Cambiar el rol de un usuario (SUPER_USER)' })
  @ApiOkResponse({ type: AppUserDto })
  @ApiUnauthorizedResponse({ description: 'Token inválido o no enviado' })
  @ApiForbiddenResponse({ description: 'Sin permisos' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  @ApiInternalServerErrorResponse({ description: 'Error interno' })
  async updateRole(
    @Param('id') id: string,
    @Body() dto: UpdateGlobalRoleDto,
  ): Promise<AppUserDto> {
    return this.appUserService.updateGlobalRole(id, dto.role);
  }

  @Get('/business')
  @ApiOperation({ summary: 'Listar todos los negocios (SUPER_USER)' })
  @ApiOkResponse({ type: BusinessDto, isArray: true })
  @ApiUnauthorizedResponse({ description: 'Token inválido o no enviado' })
  @ApiForbiddenResponse({ description: 'Sin permisos' })
  @ApiInternalServerErrorResponse({ description: 'Error interno' })
  async findAllBusinesses(): Promise<BusinessDto[]> {
    return this.businessService.findAllAdmin();
  }

  @Patch('/business/:id/verify')
  @ApiOperation({ summary: 'Verificar un negocio (SUPER_USER)' })
  @ApiOkResponse({ type: BusinessDto })
  @ApiUnauthorizedResponse({ description: 'Token inválido o no enviado' })
  @ApiForbiddenResponse({ description: 'Sin permisos' })
  @ApiNotFoundResponse({ description: 'Negocio no encontrado' })
  @ApiInternalServerErrorResponse({ description: 'Error interno' })
  async verifyBusiness(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BusinessDto> {
    return this.businessService.verifyBusiness(id);
  }

  @Patch('/business/:id/deactivate')
  @ApiOperation({
    summary: 'Desactivar un negocio y hacer cascade (SUPER_USER)',
  })
  @ApiOkResponse({ type: BusinessDto })
  @ApiUnauthorizedResponse({ description: 'Token inválido o no enviado' })
  @ApiForbiddenResponse({ description: 'Sin permisos' })
  @ApiNotFoundResponse({ description: 'Negocio no encontrado' })
  @ApiInternalServerErrorResponse({ description: 'Error interno' })
  async deactivateBusiness(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BusinessDto> {
    return this.businessService.deactivateBusiness(id);
  }
}
