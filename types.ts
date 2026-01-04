
export interface Patient {
  id?: number;
  nombre: string;
  email?: string; // Opcional
  telefono: string;
  dni?: string;   // Opcional
  fechaNacimiento?: string;
  direccion?: string;
  odoo_partner_id?: number;
}

export type UserRole = 'superadmin' | 'admin_negocio' | 'recepcion_sede';

export interface AppUser {
  id: string;
  email: string;
  nombre: string;
  role: UserRole;
  company_id: string;
  sede_id?: string;
}

export interface Doctor {
  id: string;
  nombre: string;
  especialidad: string;
  sedes: string[];
  activo: boolean;
  company_id: string;
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
  historialClinico?: string;
  tratamientos?: string;
  odoo_partner_id?: number;
  odoo_sale_order_id?: number;
  company_id: string;
  createdAt: string;
  updatedAt: string;
}

export interface Sede {
  id: string;
  nombre: string;
  direccion: string;
  horarios: Record<string, { inicio: string; fin: string }>;
  company_id: string;
}

export interface OdooConfig {
  url: string;
  db: string;
  username: string;
  apiKey: string;
  webhookUrl: string;
  odooCompanyId?: number;
}

export interface CompanyProfile {
  id: string;
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
  activeCompanyId: string;
}

export interface OdooProduct {
  id: number;
  name: string;
  list_price: number;
  default_code: string;
}
