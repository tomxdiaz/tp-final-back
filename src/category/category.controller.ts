import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { CategoryDto } from './dto/category.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { SupabaseAuthGuard } from '../auth/guards/supabase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AppRole } from '../utils/enums/roles';

@ApiTags('category')
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas las categorías (público)' })
  @ApiOkResponse({ type: CategoryDto, isArray: true })
  @ApiInternalServerErrorResponse({ description: 'Error interno' })
  async findAll(): Promise<CategoryDto[]> {
    return this.categoryService.findAll();
  }

  @Post()
  @Roles(AppRole.SUPER_USER)
  @UseGuards(SupabaseAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Crear una categoría (SUPER_USER)' })
  @ApiCreatedResponse({ type: CategoryDto })
  @ApiUnauthorizedResponse({ description: 'Token inválido o no enviado' })
  @ApiForbiddenResponse({ description: 'Sin permisos' })
  @ApiConflictResponse({ description: 'Categoría con ese nombre ya existe' })
  @ApiInternalServerErrorResponse({ description: 'Error interno' })
  async create(@Body() dto: CreateCategoryDto): Promise<CategoryDto> {
    return this.categoryService.create(dto);
  }
}
