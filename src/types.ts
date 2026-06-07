// ─── Shared enums ────────────────────────────────────────────────────────────

export type GlobalRole = 'SUPER_USER' | 'USER';
export type DifficultyLevel = 'BAJA' | 'MEDIA' | 'ALTA' | 'EXTREMA';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';
export type SessionStatus = 'AVAILABLE' | 'CANCELLED' | 'COMPLETED';

// ─── AppUser ─────────────────────────────────────────────────────────────────

export interface AppUser {
  id: string;
  email: string;
  global_role: GlobalRole;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateAppUserPayload {
  first_name?: string;
  last_name?: string;
  phone?: string;
}

// ─── Category ────────────────────────────────────────────────────────────────

export interface Category {
  id: number;
  name: string;
}

// ─── Review ──────────────────────────────────────────────────────────────────

export interface Review {
  id: number;
  business_id: number;
  app_user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateReviewPayload {
  business_id: number;
  /** 1–5 */
  rating: number;
  comment?: string;
}

// ─── Business ────────────────────────────────────────────────────────────────

export interface Business {
  id: number;
  app_user_id: string;
  business_name: string;
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  verified: boolean;
  created_at: string;
  updated_at: string;
  reviews: Review[];
}

export interface CreateBusinessPayload {
  business_name: string;
  description?: string;
  contact_email?: string;
  contact_phone?: string;
}

export interface UpdateBusinessPayload {
  business_name?: string;
  description?: string;
  contact_email?: string;
  contact_phone?: string;
}

// ─── Activity ────────────────────────────────────────────────────────────────

export interface ActivitySession {
  id: number;
  datetime: string;
  booked_spots: number;
  status: SessionStatus;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: number;
  business_id: number;
  title: string;
  description: string | null;
  category_id: number;
  category?: Category;
  starting_hour: string;
  location: string | null;
  images: string[];
  meeting_point: string | null;
  latitude: number | null;
  longitude: number | null;
  difficulty: DifficultyLevel | null;
  duration_minutes: number | null;
  base_price: number;
  currency: string;
  /** 0 = Sunday … 6 = Saturday */
  days_of_week: number[];
  min_age: number | null;
  max_participants: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  /** Only present on GET /activity/:id */
  sessions?: ActivitySession[];
  /** Only present on GET /activity/:id */
  business?: BookingBusiness;
}

export interface CreateActivityPayload {
  title: string;
  description?: string;
  category_id: number;
  /** Format HH:MM */
  starting_hour: string;
  location?: string;
  images?: string[];
  meeting_point?: string;
  latitude?: number;
  longitude?: number;
  difficulty?: DifficultyLevel;
  duration_minutes?: number;
  base_price: number;
  currency?: string;
  days_of_week: number[];
  min_age?: number;
  max_participants?: number;
}

export interface UpdateActivityPayload {
  title?: string;
  description?: string;
  category_id?: number;
  starting_hour?: string;
  location?: string;
  images?: string[];
  meeting_point?: string;
  latitude?: number;
  longitude?: number;
  difficulty?: DifficultyLevel;
  duration_minutes?: number;
  base_price?: number;
  currency?: string;
  days_of_week?: number[];
  min_age?: number;
  max_participants?: number;
}

// ─── Shared booking sub-types ─────────────────────────────────────────────────

export interface BookingBusiness {
  id: number;
  app_user_id: string;
  business_name: string;
  description: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface BookingAppUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

export interface BookingActivity {
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
  difficulty: DifficultyLevel | null;
  duration_minutes: number | null;
  base_price: number;
  currency: string;
  days_of_week: number[];
  min_age: number | null;
  max_participants: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  business: BookingBusiness;
}

export interface BookingActivitySession {
  id: number;
  activity_id: number;
  datetime: string;
  booked_spots: number;
  status: SessionStatus;
  created_at: string;
  updated_at: string;
  activity: BookingActivity;
}

// ─── Booking (POST /booking, POST /booking/:id/cancel) ────────────────────────

export interface Booking {
  id: number;
  app_user: BookingAppUser;
  /** null when the session was deleted (activity removed) */
  activity_session: BookingActivitySession | null;
  number_of_people: number;
  total_price: number;
  status: BookingStatus;
  customer_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateBookingPayload {
  activity_session_id: number;
  number_of_people: number;
  customer_notes?: string;
}

// ─── Business bookings (GET /business/me/bookings) ───────────────────────────

export interface BusinessBooking {
  id: number;
  app_user: BookingAppUser;
  activity_session: BookingActivitySession;
  number_of_people: number;
  total_price: number;
  status: BookingStatus;
  customer_notes: string | null;
  created_at: string;
  updated_at: string;
}
