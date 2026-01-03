
import { OdooConnector } from './odoo-connector';
import { Patient, OdooConfig, OdooProduct, Appointment } from '../types';
// Fix: Import CONSULTA_INFO from constants as it is not exported from types
import { CONSULTA_INFO } from '../constants';

export class OdooService {
  private connector: OdooConnector;
  private config: OdooConfig;
  private uid: number = 0;

  constructor(config: OdooConfig) {
    this.config = config;
    this.connector = new OdooConnector(config.url);
  }

  async init(): Promise<boolean> {
    try {
      this.uid = await this.connector.authenticate(this.config.db, this.config.username, this.config.apiKey);
      return !!this.uid;
    } catch (e) {
      console.error('Odoo Auth Error', e);
      return false;
    }
  }

  async findOrCreatePartner(patient: Patient): Promise<number> {
    // 1. Buscar por email
    const existing = await this.connector.searchRead(
      this.uid, this.config.apiKey, 'res.partner',
      [['email', '=', patient.email]],
      ['id']
    );

    if (existing && existing.length > 0) {
      return existing[0].id;
    }

    // 2. Crear si no existe
    const partnerId = await this.connector.rpcCall('object', 'execute_kw', [
      this.config.db, this.uid, this.config.apiKey, 'res.partner', 'create', [{
        name: patient.nombre,
        email: patient.email,
        phone: patient.telefono,
        customer_rank: 1,
        company_type: 'person'
      }]
    ]);

    return partnerId;
  }

  async getMedicalProducts(): Promise<OdooProduct[]> {
    return await this.connector.searchRead(
      this.uid, this.config.apiKey, 'product.product',
      [['type', '=', 'service'], ['sale_ok', '=', true]],
      ['id', 'name', 'list_price', 'default_code']
    );
  }

  async createSaleOrder(appointment: Appointment, partnerId: number, productId: number): Promise<number> {
    const price = CONSULTA_INFO[appointment.tipo].price;
    const saleOrderId = await this.connector.rpcCall('object', 'execute_kw', [
      this.config.db, this.uid, this.config.apiKey, 'sale.order', 'create', [{
        partner_id: partnerId,
        date_order: `${appointment.fecha} ${appointment.hora}:00`,
        order_line: [[0, 0, {
          product_id: productId,
          product_uom_qty: 1,
          price_unit: price
        }]],
        note: `Cita médica - ${appointment.doctor.nombre} - Sede ${appointment.sede.toUpperCase()}
               Fecha: ${appointment.fecha} Hora: ${appointment.hora}
               Tipo: ${CONSULTA_INFO[appointment.tipo].label}`,
        x_sede: appointment.sede, // Campos personalizados sugeridos
        x_fecha_cita: appointment.fecha,
        x_hora_cita: appointment.hora,
        x_doctor: appointment.doctor.nombre
      }]
    ]);

    return saleOrderId;
  }
}
