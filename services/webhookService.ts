
import { Appointment } from '../types';
import { CONSULTA_INFO } from '../constants';

export const sendWebhook = async (webhookUrl: string, event: 'cita_creada' | 'cita_confirmada' | 'cita_cancelada' | 'cita_completada', appointment: Appointment) => {
  if (!webhookUrl) return;

  try {
    const payload = {
      evento: event,
      timestamp: new Date().toISOString(),
      paciente: {
        nombre: appointment.patient.nombre,
        telefono: appointment.patient.telefono,
        email: appointment.patient.email
      },
      cita: {
        id: appointment.id,
        fecha: appointment.fecha,
        hora: appointment.hora,
        medico: appointment.doctor.nombre,
        sede: appointment.sede === 'centro' ? 'Sede Centro' : 'Sede Norte',
        tipo: CONSULTA_INFO[appointment.tipo].label,
        precio: CONSULTA_INFO[appointment.tipo].price
      },
      odoo: {
        partner_id: appointment.odoo_partner_id,
        sale_order_id: appointment.odoo_sale_order_id
      }
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    return response.ok;
  } catch (error) {
    console.error('Webhook Error:', error);
    return false;
  }
};
