import type { Sede, Vehiculo, Configuracion } from "@shared/schema";

export interface ExcelRemesaRow {
  GRANJA: string;
  PLANTA: string;
  PLACA: string;
  FECHA_CITA: string;
  IDENTIFICACION: string;
  TONELADAS: number;
}

export interface RemesaXMLData {
  consecutivo: string;
  codigoSedeRemitente: string;
  codigoSedeDestinatario: string;
  cantidadCargada: number;
  fechaCitaCargue: string;
  fechaCitaDescargue: string;
  conductorId: string;
  config: Configuracion;
}

export interface ManifiestoXMLData {
  numeroManifiesto: string;
  consecutivoRemesa: string;
  fechaExpedicion: string;
  municipioOrigen: string;
  municipioDestino: string;
  placa: string;
  conductorId: string;
  valorFlete: number;
  fechaPagoSaldo: string;
  propietarioTipo: string;
  propietarioNumero: string;
  config: Configuracion;
}

export interface CumplimientoXMLData {
  consecutivoRemesa: string;
  fechaCumplimiento: string;
  cantidadCargada: number;
  fechaCitaCargue?: string;
  fechaCitaDescargue?: string;
  horaCitaCargue?: string;
  horaCitaDescargue?: string;
  config: Configuracion;
}

export interface CumplimientoManifiestoXMLData {
  numeroManifiesto: string;
  fechaExpedicion: string;
  config: Configuracion;
}

export interface ConsultaManifiestoXMLData {
  numeroManifiesto: string;
  fechaIngreso?: string;
  config: Configuracion;
}

export class XMLGenerator {

  generateRemesaXML(data: RemesaXMLData): string {
    console.log(`🔧 XML Generator: Usando capacidad real del vehículo: ${data.cantidadCargada}`);
    console.log(`🔧 XML Generator: Consecutivo recibido: "${data.consecutivo}"`);
    
    return `<ns0:Envelope xmlns:ns0="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns1="urn:BPMServicesIntf-IBPMServices">
  <ns0:Header/>
  <ns0:Body>
    <ns1:AtenderMensajeRNDC>
      <Request>
        <root>
          <acceso>
            <username>${data.config.usuario}</username>
            <password>${data.config.password}</password>
          </acceso>
          <solicitud>
            <tipo>1</tipo>
            <procesoid>3</procesoid>
          </solicitud>
          <variables>
            <NUMNITEMPRESATRANSPORTE>${data.config.empresa_nit}</NUMNITEMPRESATRANSPORTE>
            <CONSECUTIVOREMESA>${data.consecutivo}</CONSECUTIVOREMESA>
            <CODOPERACIONTRANSPORTE>G</CODOPERACIONTRANSPORTE>
            <CODNATURALEZACARGA>1</CODNATURALEZACARGA>
            <CANTIDADCARGADA>${data.cantidadCargada}</CANTIDADCARGADA>
            <UNIDADMEDIDACAPACIDAD>1</UNIDADMEDIDACAPACIDAD>
            <CODTIPOEMPAQUE>0</CODTIPOEMPAQUE>
            <MERCANCIAREMESA>002309</MERCANCIAREMESA>
            <DESCRIPCIONCORTAPRODUCTO>ALIMENTO PARA AVES DE CORRAL</DESCRIPCIONCORTAPRODUCTO>
            <CODTIPOIDREMITENTE>N</CODTIPOIDREMITENTE>
            <NUMIDREMITENTE>8600588314</NUMIDREMITENTE>
            <CODSEDEREMITENTE>${data.codigoSedeRemitente}</CODSEDEREMITENTE>
            <CODTIPOIDDESTINATARIO>N</CODTIPOIDDESTINATARIO>
            <NUMIDDESTINATARIO>8600588314</NUMIDDESTINATARIO>
            <CODSEDEDESTINATARIO>${data.codigoSedeDestinatario}</CODSEDEDESTINATARIO>
            <DUENOPOLIZA>N</DUENOPOLIZA>
            <HORASPACTOCARGA>2</HORASPACTOCARGA>
            <HORASPACTODESCARGUE>2</HORASPACTODESCARGUE>
            <CODTIPOIDPROPIETARIO>N</CODTIPOIDPROPIETARIO>
            <NUMIDPROPIETARIO>${data.config.empresa_nit}</NUMIDPROPIETARIO>
            <CODSEDEPROPIETARIO>01</CODSEDEPROPIETARIO>
            <FECHACITAPACTADACARGUE>${data.fechaCitaCargue}</FECHACITAPACTADACARGUE>
            <HORACITAPACTADACARGUE>08:00</HORACITAPACTADACARGUE>
            <FECHACITAPACTADADESCARGUE>${data.fechaCitaDescargue}</FECHACITAPACTADADESCARGUE>
            <HORACITAPACTADADESCARGUEREMESA>13:00</HORACITAPACTADADESCARGUEREMESA>
          </variables>
        </root>
      </Request>
    </ns1:AtenderMensajeRNDC>
  </ns0:Body>
</ns0:Envelope>`;
  }

  generateManifiestoXML(data: ManifiestoXMLData): string {
    return `<ns0:Envelope xmlns:ns0="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns1="urn:BPMServicesIntf-IBPMServices">
  <ns0:Header/>
  <ns0:Body>
    <ns1:AtenderMensajeRNDC>
      <Request>
        <root>
          <acceso>
            <username>${data.config.usuario}</username>
            <password>${data.config.password}</password>
          </acceso>
          <solicitud>
            <tipo>1</tipo>
            <procesoid>4</procesoid>
          </solicitud>
          <variables>
            <NUMNITEMPRESATRANSPORTE>${data.config.empresa_nit}</NUMNITEMPRESATRANSPORTE>
            <NUMMANIFIESTOCARGA>${data.numeroManifiesto}</NUMMANIFIESTOCARGA>
            <CODOPERACIONTRANSPORTE>G</CODOPERACIONTRANSPORTE>
            <FECHAEXPEDICIONMANIFIESTO>${data.fechaExpedicion}</FECHAEXPEDICIONMANIFIESTO>
            <CODMUNICIPIOORIGENMANIFIESTO>${data.municipioOrigen}</CODMUNICIPIOORIGENMANIFIESTO>
            <CODMUNICIPIODESTINOMANIFIESTO>${data.municipioDestino}</CODMUNICIPIODESTINOMANIFIESTO>
            <CODIDTITULARMANIFIESTO>${data.propietarioTipo}</CODIDTITULARMANIFIESTO>
            <NUMIDTITULARMANIFIESTO>${data.propietarioNumero}</NUMIDTITULARMANIFIESTO>
            <NUMPLACA>${data.placa}</NUMPLACA>
            <CODIDCONDUCTOR>C</CODIDCONDUCTOR>
            <NUMIDCONDUCTOR>${data.conductorId}</NUMIDCONDUCTOR>
            <VALORFLETEPACTADOVIAJE>${data.valorFlete}</VALORFLETEPACTADOVIAJE>
            <RETENCIONICAMANIFIESTOCARGA>0.0</RETENCIONICAMANIFIESTOCARGA>
            <RETENCIONFUENTEMANIFIESTO>0.0</RETENCIONFUENTEMANIFIESTO>
            <VALORANTICIPOMANIFIESTO>0</VALORANTICIPOMANIFIESTO>
            <FECHAPAGOSALDOMANIFIESTO>${data.fechaPagoSaldo}</FECHAPAGOSALDOMANIFIESTO>
            <CODMUNICIPIOPAGOSALDO>11001000</CODMUNICIPIOPAGOSALDO>
            <CODRESPONSABLEPAGOCARGUE>D</CODRESPONSABLEPAGOCARGUE>
            <CODRESPONSABLEPAGODESCARGUE>D</CODRESPONSABLEPAGODESCARGUE>
            <ACEPTACIONELECTRONICA>SI</ACEPTACIONELECTRONICA>
            <REMESASMAN procesoid="43">
              <REMESA>
                <CONSECUTIVOREMESA>${data.consecutivoRemesa}</CONSECUTIVOREMESA>
              </REMESA>
            </REMESASMAN>
          </variables>
        </root>
      </Request>
    </ns1:AtenderMensajeRNDC>
  </ns0:Body>
</ns0:Envelope>`;
  }

  generateCumplimientoXML(data: CumplimientoXMLData): string {
    // Calcular horarios automáticamente
    const fechaCargue = data.fechaCitaCargue || data.fechaCumplimiento;
    const fechaDescargue = data.fechaCitaDescargue || data.fechaCumplimiento;
    const horaCargue = data.horaCitaCargue || "08:00";
    const horaDescargue = data.horaCitaDescargue || "13:00";
    
    // Calcular hora de salida (hora inicial + 2 horas)
    const horaSalidaCargue = this.addHoursToTime(horaCargue, 2);
    const horaSalidaDescargue = this.addHoursToTime(horaDescargue, 2);

    return `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:BPMServicesIntf-IBPMServices">
  <soapenv:Header/>
  <soapenv:Body>
    <urn:AtenderMensajeRNDC>
      <Request>
        <root>
          <acceso>
            <username>${data.config.usuario}</username>
            <password>${data.config.password}</password>
          </acceso>
          <solicitud>
            <tipo>1</tipo>
            <procesoid>5</procesoid>
          </solicitud>
          <variables>
            <NUMNITEMPRESATRANSPORTE>${data.config.empresa_nit}</NUMNITEMPRESATRANSPORTE>
            <CONSECUTIVOREMESA>${data.consecutivoRemesa}</CONSECUTIVOREMESA>
            <TIPOCUMPLIDOREMESA>C</TIPOCUMPLIDOREMESA>
            <CANTIDADCARGADA>${data.cantidadCargada}</CANTIDADCARGADA>
            <CANTIDADENTREGADA>${data.cantidadCargada}</CANTIDADENTREGADA>
            <UNIDADMEDIDACAPACIDAD>1</UNIDADMEDIDACAPACIDAD>
            <FECHALLEGADACARGUE>${fechaCargue}</FECHALLEGADACARGUE>
            <HORALLEGADACARGUEREMESA>${horaCargue}</HORALLEGADACARGUEREMESA>
            <FECHAENTRADACARGUE>${fechaCargue}</FECHAENTRADACARGUE>
            <HORAENTRADACARGUEREMESA>${horaCargue}</HORAENTRADACARGUEREMESA>
            <FECHASALIDACARGUE>${fechaCargue}</FECHASALIDACARGUE>
            <HORASALIDACARGUEREMESA>${horaSalidaCargue}</HORASALIDACARGUEREMESA>
            <FECHALLEGADADESCARGUE>${fechaDescargue}</FECHALLEGADADESCARGUE>
            <HORALLEGADADESCARGUECUMPLIDO>${horaDescargue}</HORALLEGADADESCARGUECUMPLIDO>
            <FECHAENTRADADESCARGUE>${fechaDescargue}</FECHAENTRADADESCARGUE>
            <HORAENTRADADESCARGUECUMPLIDO>${horaDescargue}</HORAENTRADADESCARGUECUMPLIDO>
            <FECHASALIDADESCARGUE>${fechaDescargue}</FECHASALIDADESCARGUE>
            <HORASALIDADESCARGUECUMPLIDO>${horaSalidaDescargue}</HORASALIDADESCARGUECUMPLIDO>
          </variables>
        </root>
      </Request>
    </urn:AtenderMensajeRNDC>
  </soapenv:Body>
</soapenv:Envelope>`;
  }

  generateCumplimientoManifiestoXML(data: CumplimientoManifiestoXMLData): string {
    // Fecha de expedición + 1 día
    const fechaExpedicion = new Date(data.fechaExpedicion);
    fechaExpedicion.setDate(fechaExpedicion.getDate() + 1);
    const fechaEntregaDocumentos = this.formatDate(fechaExpedicion);

    return `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:BPMServicesIntf-IBPMServices">
  <soapenv:Header/>
  <soapenv:Body>
    <urn:AtenderMensajeRNDC>
      <Request>
        <root>
          <acceso>
            <username>${data.config.usuario}</username>
            <password>${data.config.password}</password>
          </acceso>
          <solicitud>
            <tipo>1</tipo>
            <procesoid>6</procesoid>
          </solicitud>
          <variables>
            <NUMNITEMPRESATRANSPORTE>${data.config.empresa_nit}</NUMNITEMPRESATRANSPORTE>
            <NUMMANIFIESTOCARGA>${data.numeroManifiesto}</NUMMANIFIESTOCARGA>
            <TIPOCUMPLIDOMANIFIESTO>C</TIPOCUMPLIDOMANIFIESTO>
            <FECHAENTREGADOCUMENTOS>${fechaEntregaDocumentos}</FECHAENTREGADOCUMENTOS>
          </variables>
        </root>
      </Request>
    </urn:AtenderMensajeRNDC>
  </soapenv:Body>
</soapenv:Envelope>`;
  }

  formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  addDaysToDate(date: string, days: number): string {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return this.formatDate(d);
  }

  // Método auxiliar para sumar horas a un tiempo en formato HH:MM
  addHoursToTime(timeString: string, hours: number): string {
    const [hourStr, minuteStr] = timeString.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    
    const newHour = (hour + hours) % 24;
    return `${newHour.toString().padStart(2, '0')}:${minuteStr}`;
  }

  generateConsultaManifiestoXML(data: ConsultaManifiestoXMLData): string {
    return `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:BPMServicesIntf-IBPMServices">
    <soapenv:Header/>
    <soapenv:Body>
        <urn:AtenderMensajeRNDC>
            <Request>
                <root>
 <acceso>
  <username>${data.config.usuario}</username>
  <password>${data.config.password}</password>
 </acceso>
 <solicitud>
  <tipo>3</tipo>
  <procesoid>4</procesoid>
 </solicitud>
 <variables>
FECHAING
 </variables>
 <documento>
  <NUMNITEMPRESATRANSPORTE>${data.config.empresa_nit}</NUMNITEMPRESATRANSPORTE>
  <NUMMANIFIESTOCARGA>${data.numeroManifiesto}</NUMMANIFIESTOCARGA>
 </documento>
</root>
            </Request>
        </urn:AtenderMensajeRNDC>
    </soapenv:Body>
</soapenv:Envelope>`;
  }
}

export const xmlGenerator = new XMLGenerator();
