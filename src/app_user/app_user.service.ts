import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { AppUserDto } from './dto/app_user.dto';
import { SupabaseService } from '../supabase/supabase.service';
import { Tables } from '../supabase/database.types';
import { UpdateGlobalRoleDto } from './dto/update-role.dto';

type AppUser = Tables<'app_user'>;

@Injectable()
export class AppUserService {
  private readonly logger = new Logger(AppUserService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async findById(id: string): Promise<AppUserDto> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('app_user')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      this.logger.error(`Error finding app_user by id: ${error.message}`);

      throw new InternalServerErrorException(
        'Error inesperado al obtener el usuario',
      );
    }

    if (!data) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return this.toAppUserDto(data);
  }

  async findAll(): Promise<AppUserDto[]> {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('app_user')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      this.logger.error(`Error finding all app_users: ${error.message}`);

      throw new InternalServerErrorException(
        'Error inesperado al obtener los usuarios',
      );
    }

    return (data ?? []).map((appUser) => this.toAppUserDto(appUser));
  }

  async findByEmail(email: string): Promise<AppUserDto | null> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('app_user')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (error) {
      this.logger.error(`Error finding app_user by email: ${error.message}`);

      throw new InternalServerErrorException(
        'Error inesperado al obtener el usuario',
      );
    }

    if (!data) return null;

    return this.toAppUserDto(data);
  }

  async updateGlobalRole(
    updateGlobalRoleDto: UpdateGlobalRoleDto,
  ): Promise<AppUserDto> {
    const supabase = this.supabaseService.getClient();

    if (!updateGlobalRoleDto.appUserId) {
      throw new BadRequestException('El id del usuario es requerido');
    }

    if (!updateGlobalRoleDto.role) {
      throw new BadRequestException('El rol es requerido');
    }

    const { data, error } = await supabase
      .from('app_user')
      .update({
        global_role: updateGlobalRoleDto.role as AppUser['global_role'],
      })
      .eq('id', updateGlobalRoleDto.appUserId)
      .select('*')
      .maybeSingle();

    if (error) {
      this.logger.error(`Error updating global role: ${error.message}`);

      if (this.isInvalidInputError(error)) {
        throw new BadRequestException('Datos inválidos para actualizar el rol');
      }

      throw new InternalServerErrorException(
        'Error inesperado al actualizar el rol global',
      );
    }

    if (!data) {
      throw new NotFoundException('Usuario a actualizar no encontrado');
    }

    return this.toAppUserDto(data);
  }

  toAppUserDto(appUser: AppUser): AppUserDto {
    return {
      id: appUser.id,
      email: appUser.email,
      global_role: appUser.global_role,
    };
  }

  private isInvalidInputError(error: { code?: string; message?: string }) {
    return (
      error.code === '22P02' ||
      error.message?.toLowerCase().includes('invalid input syntax')
    );
  }
}
