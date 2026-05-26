import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { BookingDto } from './dto/booking.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import type { Tables } from '../supabase/database.types';

type Booking = Tables<'booking'>;

type SessionWithActivity = Tables<'activity_session'> & {
  activity: Pick<Tables<'activity'>, 'base_price' | 'max_participants'>;
};

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async create(userId: string, dto: CreateBookingDto): Promise<BookingDto> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: sessionRaw, error: sError } = await supabase
      .from('activity_session')
      .select('*, activity!inner(base_price, max_participants)')
      .eq('id', dto.activity_session_id)
      .maybeSingle();

    const session = sessionRaw as SessionWithActivity | null;

    if (sError) {
      this.logger.error(`Error finding session: ${sError.message}`);
      throw new InternalServerErrorException('Error inesperado al obtener la sesión');
    }
    if (!session) throw new NotFoundException('Sesión de actividad no encontrada');

    if (session.status !== 'AVAILABLE') {
      throw new BadRequestException('La sesión no está disponible');
    }

    if (session.activity.max_participants !== null) {
      const available = session.activity.max_participants - session.booked_spots;
      if (dto.number_of_people > available) {
        throw new BadRequestException(
          `No hay suficientes lugares. Disponibles: ${available}`,
        );
      }
    }

    const total_price = session.activity.base_price * dto.number_of_people;

    const { data, error } = await supabase
      .from('booking')
      .insert({
        app_user_id: userId,
        activity_session_id: dto.activity_session_id,
        number_of_people: dto.number_of_people,
        total_price,
        customer_notes: dto.customer_notes ?? null,
      })
      .select('*')
      .single();

    if (error) {
      this.logger.error(`Error creating booking: ${error.message}`);
      throw new InternalServerErrorException('Error inesperado al crear la reserva');
    }

    const { error: uError } = await supabase
      .from('activity_session')
      .update({ booked_spots: session.booked_spots + dto.number_of_people })
      .eq('id', dto.activity_session_id);

    if (uError) {
      this.logger.error(`Error updating booked_spots: ${uError.message}`);
      await supabase.from('booking').delete().eq('id', data.id);
      throw new InternalServerErrorException('Error inesperado al actualizar los lugares reservados');
    }

    return this.toBookingDto(data);
  }

  async cancel(bookingId: number, userId: string): Promise<BookingDto> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: booking, error } = await supabase
      .from('booking')
      .select('*')
      .eq('id', bookingId)
      .maybeSingle();

    if (error) {
      this.logger.error(`Error finding booking: ${error.message}`);
      throw new InternalServerErrorException('Error inesperado al obtener la reserva');
    }
    if (!booking) throw new NotFoundException('Reserva no encontrada');

    if (booking.app_user_id !== userId) {
      throw new ForbiddenException('No tenés permiso para cancelar esta reserva');
    }

    if (booking.status === 'CANCELLED') {
      throw new BadRequestException('La reserva ya está cancelada');
    }

    const { data, error: uError } = await supabase
      .from('booking')
      .update({ status: 'CANCELLED' })
      .eq('id', bookingId)
      .select('*')
      .maybeSingle();

    if (uError) {
      this.logger.error(`Error cancelling booking: ${uError.message}`);
      throw new InternalServerErrorException('Error inesperado al cancelar la reserva');
    }
    if (!data) throw new NotFoundException('Reserva no encontrada');

    const { data: session, error: sError } = await supabase
      .from('activity_session')
      .select('booked_spots')
      .eq('id', booking.activity_session_id)
      .maybeSingle();

    if (sError) {
      this.logger.error(`Error finding session after cancel: ${sError.message}`);
      throw new InternalServerErrorException('Error inesperado al actualizar los lugares');
    }
    if (!session) throw new NotFoundException('Sesión de actividad no encontrada');

    const newSpots = Math.max(0, session.booked_spots - booking.number_of_people);

    const { error: spError } = await supabase
      .from('activity_session')
      .update({ booked_spots: newSpots })
      .eq('id', booking.activity_session_id);

    if (spError) {
      this.logger.error(`Error updating booked_spots after cancel: ${spError.message}`);
      throw new InternalServerErrorException('Error inesperado al devolver los lugares');
    }

    return this.toBookingDto(data);
  }

  private toBookingDto(booking: Booking): BookingDto {
    return {
      id: booking.id,
      app_user_id: booking.app_user_id,
      activity_session_id: booking.activity_session_id,
      number_of_people: booking.number_of_people,
      total_price: booking.total_price,
      status: booking.status,
      customer_notes: booking.customer_notes ?? null,
      created_at: booking.created_at,
      updated_at: booking.updated_at,
    };
  }
}
