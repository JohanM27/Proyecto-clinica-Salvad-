
export type Role = 'client' | 'doctor';

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: Role;
  created_at: string;
}

export type PaymentMethod = 'BAC' | 'Occidente' | 'N/A';
export type AppointmentStatus = 'pending' | 'request' | 'confirmed' | 'finished' | 'cancelled' | 'rescheduled';

export interface Appointment {
  id: string;
  client_id: string;
  title: string;
  description: string;
  payment_method: PaymentMethod;
  attendees: string[];
  status: AppointmentStatus;
  scheduled_at: string;
  client_rating: number;
  created_at: string;
  // Join fields
  client?: Profile;
}

export interface WorkingDay {
  enabled: boolean;
  start: string;
  end: string;
}

export interface WorkingHours {
  [key: string]: WorkingDay;
}

export interface ClinicConfig {
  id: number;
  is_open: boolean;
  working_hours: WorkingHours;
}
