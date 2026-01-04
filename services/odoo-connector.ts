
/**
 * Odoo XML-RPC Connector
 * Proporciona métodos para interactuar con la API de Odoo utilizando XML-RPC sobre HTTP.
 * Incluye un puente CORS para evitar bloqueos del navegador.
 */

export class OdooConnector {
  private url: string;
  // Proxy para evitar errores de CORS (Failed to fetch)
  private proxyUrl: string = 'https://corsproxy.io/?';

  constructor(url: string) {
    this.url = url.endsWith('/') ? url.slice(0, -1) : url;
  }

  private async call(service: string, method: string, args: any[]): Promise<any> {
    const xml = `<?xml version="1.0"?>
      <methodCall>
        <methodName>${method}</methodName>
        <params>
          ${args.map(arg => this.toXmlRpcValue(arg)).join('')}
        </params>
      </methodCall>`;

    // Construimos la URL final usando el proxy para saltar el error "Failed to fetch"
    const targetEndpoint = `${this.url}/xmlrpc/2/${service}`;
    const endpoint = `${this.proxyUrl}${encodeURIComponent(targetEndpoint)}`;
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'text/xml',
          'Accept': 'text/xml'
        },
        body: xml
      });

      if (!response.ok) {
        throw new Error(`Odoo API Error: ${response.status}`);
      }

      const text = await response.text();
      return this.parseXmlRpcResponse(text);
    } catch (error) {
      console.error('Odoo Connector Error:', error);
      throw error;
    }
  }

  private toXmlRpcValue(val: any): string {
    if (val === null || val === undefined) return `<value><nil/></value>`;
    
    if (typeof val === 'number') {
      const type = Number.isInteger(val) ? 'int' : 'double';
      return `<value><${type}>${val}</${type}></value>`;
    } else if (typeof val === 'boolean') {
      return `<value><boolean>${val ? '1' : '0'}</boolean></value>`;
    } else if (Array.isArray(val)) {
      return `<value><array><data>${val.map(v => this.toXmlRpcValue(v)).join('')}</data></array></value>`;
    } else if (typeof val === 'object') {
      const members = Object.entries(val).map(([k, v]) => `<member><name>${k}</name>${this.toXmlRpcValue(v)}</member>`).join('');
      return `<value><struct>${members}</struct></value>`;
    }

    const escaped = String(val)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
    return `<value><string>${escaped}</string></value>`;
  }

  private parseXmlRpcResponse(xml: string): any {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    
    const fault = doc.querySelector('fault');
    if (fault) {
      const faultStruct = this.parseValueNode(fault.querySelector('value'));
      throw new Error(`Odoo Fault: ${faultStruct?.faultString || 'Unknown Error'}`);
    }

    const valueNode = doc.querySelector('param > value');
    return this.parseValueNode(valueNode);
  }

  private parseValueNode(node: Element | null): any {
    if (!node) return null;
    const typeNode = node.firstElementChild;
    if (!typeNode) return node.textContent;

    const type = typeNode.tagName;
    switch (type) {
      case 'string': return typeNode.textContent;
      case 'int': 
      case 'i4': return parseInt(typeNode.textContent || '0', 10);
      case 'double': return parseFloat(typeNode.textContent || '0');
      case 'boolean': return typeNode.textContent === '1' || typeNode.textContent === 'true';
      case 'array':
        const data = typeNode.querySelector('data');
        return Array.from(data?.children || []).map(v => this.parseValueNode(v as Element));
      case 'struct':
        const obj: any = {};
        Array.from(typeNode.querySelectorAll(':scope > member')).forEach(m => {
          const name = m.querySelector('name')?.textContent;
          const val = m.querySelector('value');
          if (name) obj[name] = this.parseValueNode(val);
        });
        return obj;
      case 'nil': return null;
      default: return typeNode.textContent;
    }
  }

  async authenticate(db: string, user: string, key: string): Promise<number> {
    return this.call('common', 'authenticate', [db, user, key, {}]);
  }

  async rpcCall(service: string, method: string, args: any[]): Promise<any> {
    return this.call(service, method, args);
  }
}
