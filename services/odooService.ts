
import { OdooConnector } from './odoo-connector';
import { Patient, OdooConfig, OdooProduct, Appointment } from '../types';
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
      console.error('Error de autenticación Odoo:', e);
      return false;
    }
  }

  async getOdooCompanies(): Promise<{id: number, name: string}[]> {
    try {
      if (!this.uid) await this.init();
      return await this.connector.rpcCall('object', 'execute_kw', [
        this.config.db, this.uid, this.config.apiKey, 'res.company', 'search_read',
        [[]], { fields: ['id', 'name'] }
      ]);
    } catch (e) {
      console.error('Error obteniendo compañías de Odoo:', e);
      return [];
    }
  }

  private getContext() {
    const context: any = {};
    if (this.config.odooCompanyId) {
      context.allowed_company_ids = [this.config.odooCompanyId];
      context.company_id = this.config.odooCompanyId;
    }
    return context;
  }

  /**
   * Busca un contacto específico por DNI (vat o ref)
   */
  async getPartnerByVat(vat: string): Promise<any | null> {
    try {
      if (!this.uid) await this.init();
      const cleanVat = vat.trim();
      
      const partners = await this.connector.rpcCall('object', 'execute_kw', [
        this.config.db, this.uid, this.config.apiKey, 'res.partner', 'search_read',
        [['|', ['vat', '=', cleanVat], ['ref', '=', cleanVat]]], 
        { 
          fields: ['id', 'name', 'email', 'phone', 'mobile', 'vat', 'street', 'ref'], 
          limit: 1,
          context: this.getContext()
        }
      ]);
      return partners && partners.length > 0 ? partners[0] : null;
    } catch (e) {
      console.error('Error buscando por VAT en Odoo:', e);
      return null;
    }
  }

  async searchPartners(query?: string): Promise<any[]> {
    try {
      if (!this.uid) await this.init();
      const domain = query ? ['|', '|', ['name', 'ilike', query], ['vat', 'ilike', query], ['ref', 'ilike', query]] : [];
      return await this.connector.rpcCall('object', 'execute_kw', [
        this.config.db, this.uid, this.config.apiKey, 'res.partner', 'search_read',
        [domain], 
        { 
          fields: ['id', 'name', 'email', 'phone', 'vat', 'street', 'ref'], 
          limit: 50, 
          context: this.getContext() 
        }
      ]);
    } catch (e) {
      console.error('Error buscando partners en Odoo:', e);
      return [];
    }
  }

  async findOrCreatePartner(patient: Patient): Promise<number> {
    try {
      if (!this.uid) await this.init();
      
      if (patient.dni) {
        const existingByVat = await this.getPartnerByVat(patient.dni);
        if (existingByVat) return existingByVat.id;
      }

      if (patient.email) {
        const existingByEmail = await this.connector.rpcCall('object', 'execute_kw', [
          this.config.db, this.uid, this.config.apiKey, 'res.partner', 'search_read',
          [[['email', '=', patient.email.toLowerCase()]]], 
          { fields: ['id'], limit: 1, context: this.getContext() }
        ]);
        if (existingByEmail.length > 0) return existingByEmail[0].id;
      }

      const partnerVals: any = {
        name: patient.nombre,
        email: patient.email ? patient.email.toLowerCase() : '',
        phone: patient.telefono,
        vat: patient.dni,
        customer_rank: 1,
        company_type: 'person'
      };

      // CRÍTICO: Solo añadir company_id si es un número válido
      if (this.config.odooCompanyId && typeof this.config.odooCompanyId === 'number') {
        partnerVals.company_id = this.config.odooCompanyId;
      }

      const partnerId = await this.connector.rpcCall('object', 'execute_kw', [
        this.config.db, this.uid, this.config.apiKey, 'res.partner', 'create', [partnerVals], { context: this.getContext() }
      ]);

      return partnerId;
    } catch (e) {
      console.error('Error en findOrCreatePartner:', e);
      throw e;
    }
  }

  async getMedicalProducts(): Promise<OdooProduct[]> {
    if (!this.uid) await this.init();
    return await this.connector.rpcCall('object', 'execute_kw', [
      this.config.db, this.uid, this.config.apiKey, 'product.product', 'search_read',
      [[['type', '=', 'service'], ['sale_ok', '=', true]]],
      { fields: ['id', 'name', 'list_price', 'default_code'], context: this.getContext() }
    ]);
  }

  async createSaleOrder(appointment: Appointment, partnerId: number, productId: number): Promise<number> {
    if (!this.uid) await this.init();
    const price = CONSULTA_INFO[appointment.tipo].price;
    
    const orderLineVals: any = {
      product_id: productId,
      product_uom_qty: 1,
      price_unit: price
    };

    const saleOrderVals: any = {
      partner_id: partnerId,
      date_order: `${appointment.fecha} ${appointment.hora}:00`,
      order_line: [[0, 0, orderLineVals]],
      note: `CITA CONFIRMADA\nSede: ${appointment.sede}\nMédico: ${appointment.doctor.nombre}\nServicio: ${CONSULTA_INFO[appointment.tipo].label}`,
      origin: `CITAME-${appointment.id}`
    };

    // CRÍTICO: Asegurar que company_id se incluya solo si existe y es válido
    if (this.config.odooCompanyId && typeof this.config.odooCompanyId === 'number') {
      saleOrderVals.company_id = this.config.odooCompanyId;
      orderLineVals.company_id = this.config.odooCompanyId;
    }

    const saleOrderId = await this.connector.rpcCall('object', 'execute_kw', [
      this.config.db, this.uid, this.config.apiKey, 'sale.order', 'create', [saleOrderVals], { context: this.getContext() }
    ]);

    return saleOrderId;
  }
}
