import { Controller, Get } from '@nestjs/common';
import {
  ApiInternalServerErrorResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CategoryService } from './category.service';
import { CategoryDto } from './dto/category.dto';

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
}
