export interface SOAPConfig {
  endpoint: string;
  username: string;
  password: string;
  timeout?: number;
}

export interface SOAPResponse {
  success: boolean;
  data?: any;
  error?: string;
  rawResponse?: string;
}

export class SOAPClient {
  private config: SOAPConfig;

  constructor(config: SOAPConfig) {
    this.config = {
      timeout: 30000,
      ...config
    };
  }

  async sendRequest(xmlContent: string): Promise<SOAPResponse> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(this.config.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': '',
          'Accept': 'text/xml',
          'Authorization': `Basic ${btoa(`${this.config.username}:${this.config.password}`)}`
        },
        body: xmlContent,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseText = await response.text();
      const parsedData = this.parseSOAPResponse(responseText);

      return {
        success: true,
        data: parsedData,
        rawResponse: responseText
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
        data: null
      };
    }
  }

  private parseSOAPResponse(xml: string): any {
    try {
      // Basic XML parsing for SOAP response
      const isSuccess = !xml.toLowerCase().includes('error') && 
                       !xml.toLowerCase().includes('fault');
      
      // Extract common SOAP elements
      const consecutivoMatch = xml.match(/<CONSECUTIVO[^>]*>([^<]+)</i);
      const mensajeMatch = xml.match(/<MENSAJE[^>]*>([^<]+)</i);
      const estadoMatch = xml.match(/<ESTADO[^>]*>([^<]+)</i);

      return {
        success: isSuccess,
        consecutivo: consecutivoMatch?.[1] || null,
        mensaje: mensajeMatch?.[1] || 'Respuesta procesada',
        estado: estadoMatch?.[1] || null,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        mensaje: 'Error al procesar respuesta SOAP',
        error: error instanceof Error ? error.message : 'Error de parsing'
      };
    }
  }

  async testConnection(): Promise<boolean> {
    const testXml = `<?xml version="1.0" encoding="utf-8"?>
      <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
        <soap:Body>
          <test>connectivity</test>
        </soap:Body>
      </soap:Envelope>`;

    try {
      const result = await this.sendRequest(testXml);
      return result.success;
    } catch {
      return false;
    }
  }

  updateConfig(newConfig: Partial<SOAPConfig>) {
    this.config = { ...this.config, ...newConfig };
  }
}

// Factory function to create SOAP client
export function createSOAPClient(config: SOAPConfig): SOAPClient {
  return new SOAPClient(config);
}

// Utility functions for XML generation
export const XMLUtils = {
  escapeXML: (text: string): string => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  formatDate: (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  },

  formatTime: (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
};
