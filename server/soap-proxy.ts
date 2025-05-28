export interface SOAPResponse {
  success: boolean;
  data?: any;
  error?: string;
  mensaje?: string;
}

export class SOAPProxy {
  private primaryEndpoint: string;
  private backupEndpoint: string;
  private timeout: number;

  constructor(primaryEndpoint: string, backupEndpoint: string, timeout = 30000) {
    this.primaryEndpoint = primaryEndpoint;
    this.backupEndpoint = backupEndpoint;
    this.timeout = timeout;
  }

  async sendSOAPRequest(xmlContent: string): Promise<SOAPResponse> {
    const endpoints = [this.primaryEndpoint, this.backupEndpoint];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Intentando envío a endpoint: ${endpoint}`);
        
        console.log(`🎯 Usando endpoint personalizado: ${endpoint}`);
        console.log(`📡 Enviando SOAP a: ${endpoint}`);
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': '"urn:BPMServicesIntf-IBPMServices#AtenderMensajeRNDC"',
            'Accept': 'text/xml, application/xml, text/html',
            'User-Agent': 'RNDC-Client/1.0',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          body: xmlContent,
          signal: AbortSignal.timeout(this.timeout)
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseText = await response.text();
        console.log(`Respuesta recibida de ${endpoint}:`, responseText);

        // Parse response to extract success/error information
        const parsedResponse = this.parseSOAPResponse(responseText);
        
        return {
          success: true,
          data: parsedResponse,
          mensaje: 'Solicitud procesada exitosamente'
        };

      } catch (error) {
        console.error(`Error en endpoint ${endpoint}:`, error);
        
        // If this is the last endpoint, return the error
        if (endpoint === endpoints[endpoints.length - 1]) {
          return {
            success: false,
            error: `Error en todos los endpoints: ${error}`,
            mensaje: 'Error al conectar con el servicio RNDC'
          };
        }
        
        // Otherwise, continue to next endpoint
        continue;
      }
    }

    return {
      success: false,
      error: 'No se pudo conectar a ningún endpoint',
      mensaje: 'Servicio RNDC no disponible'
    };
  }

  private parseSOAPResponse(responseXml: string): any {
    try {
      // Check for specific RNDC success indicators
      const hasIngresoId = responseXml.includes('<ingresoid>') || responseXml.includes('&lt;ingresoid&gt;');
      const hasErrorMsg = responseXml.includes('<ErrorMSG>') || responseXml.includes('Error RNDC') || responseXml.includes('&lt;ErrorMSG&gt;');
      const isSuccess = hasIngresoId && !hasErrorMsg;
      
      // Extract relevant information from the response
      const consecutivoMatch = responseXml.match(/<CONSECUTIVO[^>]*>([^<]+)</i);
      const mensajeMatch = responseXml.match(/<MENSAJE[^>]*>([^<]+)</i);
      const ingresoIdMatch = responseXml.match(/<ingresoid[^>]*>([^<]+)</i);
      const errorMatch = responseXml.match(/<ErrorMSG[^>]*>([^<]+)</i);
      
      return {
        success: isSuccess,
        consecutivo: consecutivoMatch ? consecutivoMatch[1] : null,
        ingresoId: ingresoIdMatch ? ingresoIdMatch[1] : null,
        mensaje: errorMatch ? errorMatch[1] : (mensajeMatch ? mensajeMatch[1] : 'Respuesta procesada'),
        rawResponse: responseXml
      };
    } catch (error) {
      console.error('Error parsing SOAP response:', error);
      return {
        success: false,
        mensaje: 'Error al procesar respuesta del servidor',
        rawResponse: responseXml
      };
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      // Test con un XML básico válido para RNDC
      const testXml = `<?xml version="1.0" encoding="utf-8"?>
        <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:BPMServicesIntf-IBPMServices">
          <soap:Body>
            <urn:AtenderMensajeRNDC>
              <Request>&lt;MENSAJE&gt;&lt;CABECERA&gt;&lt;VERSION&gt;01&lt;/VERSION&gt;&lt;/CABECERA&gt;&lt;/MENSAJE&gt;</Request>
            </urn:AtenderMensajeRNDC>
          </soap:Body>
        </soap:Envelope>`;
      
      const result = await this.sendSOAPRequest(testXml);
      return result.success;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}
