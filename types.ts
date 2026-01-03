
export interface Patient {
  id?: number;
  nombre: string;
  email: string;
  telefono: string;
  dni?: string;
  fechaNacimiento?: string;
  direccion?: string;
}

export interface Doctor {
  id: string;
  nombre: string;
  especialidad: string;
  sedes: string[];
  activo: boolean;
}

export type AppointmentStatus = 'pendiente' | 'confirmada' | 'completada' | 'cancelada';
export type SedeType = string;
export type ConsultaType = 'general' | 'especializada' | 'control' | 'urgencia';

export interface Appointment {
  id: string;
  patient: Patient;
  doctor: Doctor;
  sede: SedeType;
  tipo: ConsultaType;
  fecha: string; 
  hora: string; 
  duracion: number;
  estado: AppointmentStatus;
  motivo: string;
  odoo_partner_id?: number;
  odoo_sale_order_id?: number;
  company_id: string; // ID de la compañía que posee la cita
  createdAt: string;
  updatedAt: string;
}

export interface Sede {
  id: string;
  nombre: string;
  direccion: string;
  horarios: Record<string, { inicio: string; fin: string }>;
}

export interface OdooConfig {
  url: string;
  db: string;
  username: string;
  apiKey: string;
  webhookUrl: string;
}

export interface CompanyProfile {
  id: string; // El slug de la URL, ej: 'feetcare'
  name: string;
  tagline: string;
  primaryColor: string;
  secondaryColor: string;
  odoo: OdooConfig;
  isActive: boolean;
  logo?: string;
}

export interface AppConfig {
  companies: CompanyProfile[];
  activeCompanyId: string; // Para el panel de admin por defecto
}

export interface OdooProduct {
  id: number;
  name: string;
  list_price: number;
  default_code: string;
}
