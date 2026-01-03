
/**
 * Odoo XML-RPC Connector
 * Proporciona métodos para interactuar con la API de Odoo utilizando XML-RPC sobre HTTP.
 */

export class OdooConnector {
  private url: string;

  constructor(url: string) {
    // Asegurar que la URL no termine en slash
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

    const endpoint = `${this.url}/xmlrpc/2/${service}`;
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/xml' },
        body: xml
      });

      if (!response.ok) {
        throw new Error(`Odoo API Error: ${response.statusText}`);
      }

      const text = await response.text();
      return this.parseXmlRpcResponse(text);
    } catch (error) {
      console.error('XML-RPC Call failed:', error);
      throw error;
    }
  }

  private toXmlRpcValue(val: any): string {
    let type = 'string';
    let value = val;

    if (typeof val === 'number') {
      if (Number.isInteger(val)) type = 'int';
      else type = 'double';
    } else if (typeof val === 'boolean') {
      type = 'boolean';
      value = val ? '1' : '0';
    } else if (Array.isArray(val)) {
      return `<value><array><data>${val.map(v => this.toXmlRpcValue(v)).join('')}</data></array></value>`;
    } else if (typeof val === 'object' && val !== null) {
      const members = Object.entries(val).map(([k, v]) => `<member><name>${k}</name>${this.toXmlRpcValue(v)}</member>`).join('');
      return `<value><struct>${members}</struct></value>`;
    }

    return `<value><${type}>${value}</${type}></value>`;
  }

  private parseXmlRpcResponse(xml: string): any {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    const fault = doc.querySelector('fault');
    
    if (fault) {
      const faultString = doc.querySelector('member:last-child string')?.textContent;
      throw new Error(`Odoo Fault: ${faultString}`);
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
      case 'boolean': return typeNode.textContent === '1';
      case 'array':
        const data = typeNode.querySelector('data');
        return Array.from(data?.children || []).map(v => this.parseValueNode(v as Element));
      case 'struct':
        const obj: any = {};
        const members = Array.from(typeNode.querySelectorAll(':scope > member'));
        members.forEach(m => {
          const name = m.querySelector('name')?.textContent;
          const val = m.querySelector('value');
          if (name) obj[name] = this.parseValueNode(val);
        });
        return obj;
      default: return typeNode.textContent;
    }
  }

  // --- Odoo Specific API ---

  async authenticate(db: string, user: string, key: string): Promise<number> {
    return this.call('common', 'authenticate', [db, user, key, {}]);
  }

  async rpcCall(service: string, method: string, args: any[]): Promise<any> {
    return this.call(service, method, args);
  }

  async searchRead(uid: number, key: string, model: string, domain: any[], fields: string[]): Promise<any[]> {
    return this.call('object', 'execute_kw', [
      this.getDbFromConfig(), uid, key, model, 'search_read', [domain], { fields }
    ]);
  }

  // Helper to get DB if not provided, usually stored in config
  private getDbFromConfig(): string {
    // This is just a placeholder, the actual DB should be passed in calls
    return ""; 
  }
}
