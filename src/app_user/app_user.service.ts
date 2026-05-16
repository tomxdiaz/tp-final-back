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
import { UpdateMeDto } from './dto/update-me.dto';
import { AppRole } from '../utils/enums/roles';

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

  async updateGlobalRole(userId: string, role: AppRole): Promise<AppUserDto> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('app_user')
      .update({ global_role: role })
      .eq('id', userId)
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

    if (!data) throw new NotFoundException('Usuario a actualizar no encontrado');

    return this.toAppUserDto(data);
  }

  async updateMe(userId: string, dto: UpdateMeDto): Promise<AppUserDto> {
    const supabase = this.supabaseService.getAdminClient();

    const updates: { first_name?: string; last_name?: string; phone?: string } = {};
    if (dto.first_name !== undefined) updates.first_name = dto.first_name;
    if (dto.last_name !== undefined) updates.last_name = dto.last_name;
    if (dto.phone !== undefined) updates.phone = dto.phone;

    const { data, error } = await supabase
      .from('app_user')
      .update(updates)
      .eq('id', userId)
      .select('*')
      .maybeSingle();

    if (error) {
      this.logger.error(`Error updating app_user: ${error.message}`);
      throw new InternalServerErrorException('Error inesperado al actualizar el perfil');
    }

    if (!data) throw new NotFoundException('Usuario no encontrado');

    return this.toAppUserDto(data);
  }

  async setBlockedStatus(userId: string, blocked: boolean): Promise<AppUserDto> {
    const supabase = this.supabaseService.getAdminClient();

    const { error } = await supabase.auth.admin.updateUserById(userId, {
      ban_duration: blocked ? '876000h' : 'none',
    });

    if (error) {
      this.logger.error(`Error blocking user: ${error.message}`);
      throw new InternalServerErrorException(
        'Error inesperado al actualizar el estado del usuario',
      );
    }

    return this.findById(userId);
  }

  toAppUserDto(appUser: AppUser): AppUserDto {
    return {
      id: appUser.id,
      email: appUser.email,
      global_role: appUser.global_role,
      first_name: appUser.first_name ?? null,
      last_name: appUser.last_name ?? null,
      phone: appUser.phone ?? null,
      created_at: appUser.created_at,
      updated_at: appUser.updated_at,
    };
  }

  private isInvalidInputError(error: { code?: string; message?: string }) {
    return (
      error.code === '22P02' ||
      error.message?.toLowerCase().includes('invalid input syntax')
    );
  }
}
