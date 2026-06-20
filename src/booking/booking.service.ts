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
import { BookingPersonDto, CreateBookingDto } from './dto/create-booking.dto';
import { BookingStatus } from '../utils/enums/roles';
import type { Json } from '../supabase/database.types';

type BookingWithJoins = {
  id: number;
  app_user_id: string;
  activity_session_id: number | null;
  number_of_people: number;
  total_price: number;
  status: BookingStatus;
  customer_notes: string | null;
  participants: Json | null;
  created_at: string;
  updated_at: string;
  activity_session: {
    id: number;
    activity_id: number;
    datetime: string;
    booked_spots: number;
    status: 'AVAILABLE' | 'CANCELLED' | 'COMPLETED';
    created_at: string;
    updated_at: string;
    activity: {
      id: number;
      business_id: number;
      title: string;
      description: string | null;
      category_id: number;
      starting_hour: string;
      location: string | null;
      images: string[];
      meeting_point: string | null;
      latitude: number | null;
      longitude: number | null;
      difficulty: string | null;
      duration_minutes: number | null;
      base_price: number;
      currency: string;
      days_of_week: number[];
      min_age: number | null;
      max_participants: number | null;
      is_active: boolean;
      created_at: string;
      updated_at: string;
      business: {
        id: number;
        app_user_id: string;
        business_name: string;
        description: string | null;
        contact_email: string | null;
        contact_phone: string | null;
        verified: boolean;
        created_at: string;
        updated_at: string;
      } | null;
    } | null;
  } | null;
  app_user: {
    id: string;
    email: string;
    first_name: string | null;
    last_name: string | null;
  };
};

@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  async create(userId: string, dto: CreateBookingDto): Promise<BookingDto> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: session, error: sError } = await supabase
      .from('activity_session')
      .select('*, activity!inner(base_price, max_participants)')
      .eq('id', dto.activity_session_id)
      .maybeSingle();

    if (sError) {
      this.logger.error(`Error finding session: ${sError.message}`);
      throw new InternalServerErrorException(
        'Error inesperado al obtener la sesión',
      );
    }
    if (!session)
      throw new NotFoundException('Sesión de actividad no encontrada');

    if (session.status !== 'AVAILABLE') {
      throw new BadRequestException('La sesión no está disponible');
    }

    if (session.activity.max_participants !== null) {
      const available =
        session.activity.max_participants - session.booked_spots;
      if (dto.number_of_people > available) {
        throw new BadRequestException(
          `No hay suficientes lugares. Disponibles: ${available}`,
        );
      }
    }

    if (
      dto.participants !== undefined &&
      dto.participants.length !== dto.number_of_people
    ) {
      throw new BadRequestException(
        `La cantidad de participantes (${dto.participants.length}) debe coincidir con el número de personas (${dto.number_of_people})`,
      );
    }

    const total_price = session.activity.base_price * dto.number_of_people;

    const { data, error } = await supabase
      .from('booking')
      .insert({
        app_user_id: userId,
        activity_session_id: dto.activity_session_id,
        number_of_people: dto.number_of_people,
        total_price,
        status: BookingStatus.PENDING,
        customer_notes: dto.customer_notes ?? null,
        participants: (dto.participants ?? null) as Json,
      })
      .select('id')
      .single();

    if (error) {
      this.logger.error(`Error creating booking: ${error.message}`);
      throw new InternalServerErrorException(
        'Error inesperado al crear la reserva',
      );
    }

    const { error: uError } = await supabase
      .from('activity_session')
      .update({ booked_spots: session.booked_spots + dto.number_of_people })
      .eq('id', dto.activity_session_id);

    if (uError) {
      this.logger.error(`Error updating booked_spots: ${uError.message}`);
      await supabase.from('booking').delete().eq('id', data.id);
      throw new InternalServerErrorException(
        'Error inesperado al actualizar los lugares reservados',
      );
    }

    return this.fetchWithJoins(data.id);
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
      throw new InternalServerErrorException(
        'Error inesperado al obtener la reserva',
      );
    }
    if (!booking) throw new NotFoundException('Reserva no encontrada');

    if (booking.app_user_id !== userId) {
      throw new ForbiddenException(
        'No tenés permiso para cancelar esta reserva',
      );
    }

    if (booking.status === 'CANCELLED') {
      throw new BadRequestException('La reserva ya está cancelada');
    }

    const { error: uError } = await supabase
      .from('booking')
      .update({ status: 'CANCELLED' })
      .eq('id', bookingId);

    if (uError) {
      this.logger.error(`Error cancelling booking: ${uError.message}`);
      throw new InternalServerErrorException(
        'Error inesperado al cancelar la reserva',
      );
    }

    if (booking.activity_session_id !== null) {
      const { data: session, error: sError } = await supabase
        .from('activity_session')
        .select('booked_spots')
        .eq('id', booking.activity_session_id)
        .maybeSingle();

      if (sError) {
        this.logger.error(
          `Error finding session after cancel: ${sError.message}`,
        );
        throw new InternalServerErrorException(
          'Error inesperado al actualizar los lugares',
        );
      }

      if (session) {
        const newSpots = Math.max(
          0,
          session.booked_spots - booking.number_of_people,
        );

        const { error: spError } = await supabase
          .from('activity_session')
          .update({ booked_spots: newSpots })
          .eq('id', booking.activity_session_id);

        if (spError) {
          this.logger.error(
            `Error updating booked_spots after cancel: ${spError.message}`,
          );
          throw new InternalServerErrorException(
            'Error inesperado al devolver los lugares',
          );
        }
      }
    }

    return this.fetchWithJoins(bookingId);
  }

  async confirm(bookingId: number, userId: string): Promise<BookingDto> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: booking, error } = await supabase
      .from('booking')
      .select(
        'id, status, activity_session_id, activity_session(activity(business(app_user_id)))',
      )
      .eq('id', bookingId)
      .maybeSingle();

    if (error) {
      this.logger.error(`Error finding booking: ${error.message}`);
      throw new InternalServerErrorException(
        'Error inesperado al obtener la reserva',
      );
    }
    if (!booking) throw new NotFoundException('Reserva no encontrada');

    const businessOwnerId =
      booking.activity_session?.activity?.business?.app_user_id;

    if (!businessOwnerId || businessOwnerId !== userId) {
      throw new ForbiddenException(
        'No tenés permiso para confirmar esta reserva',
      );
    }

    if (booking.status === BookingStatus.CONFIRMED) {
      throw new BadRequestException('La reserva ya está confirmada');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException(
        'No se puede confirmar una reserva cancelada',
      );
    }

    const { error: uError } = await supabase
      .from('booking')
      .update({ status: BookingStatus.CONFIRMED })
      .eq('id', bookingId);

    if (uError) {
      this.logger.error(`Error confirming booking: ${uError.message}`);
      throw new InternalServerErrorException(
        'Error inesperado al confirmar la reserva',
      );
    }

    return this.fetchWithJoins(bookingId);
  }

  async getMyBookings(userId: string): Promise<BookingDto[]> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('booking')
      .select(
        '*, activity_session(*, activity(*, business(*))), app_user(id, email, first_name, last_name)',
      )
      .eq('app_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      this.logger.error(`Error fetching user bookings: ${error.message}`);
      throw new InternalServerErrorException(
        'Error inesperado al obtener las reservas',
      );
    }

    return (data as unknown as BookingWithJoins[]).map((b) =>
      this.toBookingDto(b),
    );
  }

  async getMyBookingById(
    bookingId: number,
    userId: string,
  ): Promise<BookingDto> {
    const supabase = this.supabaseService.getAdminClient();

    const { data: booking, error } = await supabase
      .from('booking')
      .select(
        '*, activity_session(*, activity(*, business(*))), app_user(id, email, first_name, last_name)',
      )
      .eq('id', bookingId)
      .maybeSingle();

    if (error) {
      this.logger.error(`Error finding booking: ${error.message}`);
      throw new InternalServerErrorException(
        'Error inesperado al obtener la reserva',
      );
    }
    if (!booking) throw new NotFoundException('Reserva no encontrada');

    if (booking.app_user.id !== userId) {
      throw new ForbiddenException('No tenés permiso para ver esta reserva');
    }

    return this.toBookingDto(booking);
  }

  private async fetchWithJoins(bookingId: number): Promise<BookingDto> {
    const supabase = this.supabaseService.getAdminClient();

    const { data, error } = await supabase
      .from('booking')
      .select(
        '*, activity_session(*, activity(*, business(*))), app_user(id, email, first_name, last_name)',
      )
      .eq('id', bookingId)
      .single();

    if (error) {
      this.logger.error(`Error fetching booking with joins: ${error.message}`);
      throw new InternalServerErrorException(
        'Error inesperado al obtener la reserva',
      );
    }

    return this.toBookingDto(data);
  }

  private toBookingDto(b: BookingWithJoins): BookingDto {
    return {
      id: b.id,
      app_user: {
        id: b.app_user.id,
        email: b.app_user.email,
        first_name: b.app_user.first_name,
        last_name: b.app_user.last_name,
      },
      activity_session: b.activity_session
        ? {
            id: b.activity_session.id,
            activity_id: b.activity_session.activity_id,
            datetime: b.activity_session.datetime,
            booked_spots: b.activity_session.booked_spots,
            status: b.activity_session.status,
            created_at: b.activity_session.created_at,
            updated_at: b.activity_session.updated_at,
            activity: b.activity_session.activity
              ? {
                  id: b.activity_session.activity.id,
                  business_id: b.activity_session.activity.business_id,
                  title: b.activity_session.activity.title,
                  description: b.activity_session.activity.description,
                  category_id: b.activity_session.activity.category_id,
                  starting_hour: b.activity_session.activity.starting_hour,
                  location: b.activity_session.activity.location,
                  images: b.activity_session.activity.images,
                  meeting_point: b.activity_session.activity.meeting_point,
                  latitude: b.activity_session.activity.latitude,
                  longitude: b.activity_session.activity.longitude,
                  difficulty: b.activity_session.activity.difficulty,
                  duration_minutes:
                    b.activity_session.activity.duration_minutes,
                  base_price: b.activity_session.activity.base_price,
                  currency: b.activity_session.activity.currency,
                  days_of_week: b.activity_session.activity.days_of_week,
                  min_age: b.activity_session.activity.min_age,
                  max_participants:
                    b.activity_session.activity.max_participants,
                  is_active: b.activity_session.activity.is_active,
                  created_at: b.activity_session.activity.created_at,
                  updated_at: b.activity_session.activity.updated_at,
                  business: b.activity_session.activity.business
                    ? {
                        id: b.activity_session.activity.business.id,
                        app_user_id:
                          b.activity_session.activity.business.app_user_id,
                        business_name:
                          b.activity_session.activity.business.business_name,
                        description:
                          b.activity_session.activity.business.description,
                        contact_email:
                          b.activity_session.activity.business.contact_email,
                        contact_phone:
                          b.activity_session.activity.business.contact_phone,
                        verified: b.activity_session.activity.business.verified,
                        created_at:
                          b.activity_session.activity.business.created_at,
                        updated_at:
                          b.activity_session.activity.business.updated_at,
                      }
                    : null!,
                }
              : null!,
          }
        : null,
      number_of_people: b.number_of_people,
      total_price: b.total_price,
      status: b.status,
      customer_notes: b.customer_notes ?? null,
      participants: (b.participants as BookingPersonDto[] | null) ?? null,
      created_at: b.created_at,
      updated_at: b.updated_at,
    };
  }
}
