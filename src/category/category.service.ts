import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CategoryDto } from './dto/category.dto';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async findAll(): Promise<CategoryDto[]> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('category')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      this.logger.error(`Error finding categories: ${error.message}`);
      throw new InternalServerErrorException(
        'Error inesperado al obtener las categorías',
      );
    }

    return (data ?? []).map((c) => ({ id: c.id, name: c.name }));
  }
}
