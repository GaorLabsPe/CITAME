
import { ConsultaType } from './types';

export const COLORS = {
  primary: '#017E84', // Teal principal
  secondary: '#714B67', // Púrpura principal
  dark: '#1e3050',
  background: '#f4f7f6',
  cards: '#ffffff',
  text: '#1e293b',
  borders: '#e2e8f0',
  status: {
    pendiente: '#714B67',
    confirmada: '#017E84',
    completada: '#10b981',
    cancelada: '#ef4444'
  }
};

export const CONSULTA_INFO: Record<ConsultaType, { label: string; price: number }> = {
  general: { label: 'Consulta General', price: 50 },
  especializada: { label: 'Consulta Especializada', price: 80 },
  control: { label: 'Consulta de Control', price: 30 },
  urgencia: { label: 'Consulta de Urgencia', price: 100 }
};

export const DEFAULT_SEDES = [
  { id: 'centro', nombre: 'Sede Centro', direccion: 'Av. Principal #31', horarios: { '1': { inicio: '08:00', fin: '18:00' } } },
  { id: 'norte', nombre: 'Sede Norte', direccion: 'Calle Norte #101', horarios: { '1': { inicio: '09:00', fin: '19:00' } } }
];
