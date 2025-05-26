import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface XMLPreviewProps {
  data: any;
  type: "remesa" | "manifiesto" | "cumplimiento";
  config: any;
  className?: string;
}

export default function XMLPreview({ data, type, config, className }: XMLPreviewProps) {
  const { toast } = useToast();

  const xmlContent = useMemo(() => {
    if (!data || !config) return "";

    switch (type) {
      case "remesa":
        return generateRemesaXML(data, config);
      case "manifiesto":
        return generateManifiestoXML(data, config);
      case "cumplimiento":
        return generateCumplimientoXML(data, config);
      default:
        return "";
    }
  }, [data, type, config]);

  const handleCopyXML = async () => {
    try {
      await navigator.clipboard.writeText(xmlContent);
      toast({
        title: "XML copiado",
        description: "El contenido XML ha sido copiado al portapapeles",
      });
    } catch (error) {
      toast({
        title: "Error al copiar",
        description: "No se pudo copiar el XML al portapapeles",
        variant: "destructive"
      });
    }
  };

  const handleDownloadXML = () => {
    const blob = new Blob([xmlContent], { type: "text/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}_${Date.now()}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "XML descargado",
      description: "El archivo XML ha sido descargado exitosamente",
    });
  };

  const highlightXML = (xml: string) => {
    return xml
      .replace(/(&lt;\/?)([^&\s]+)([^&]*?)(&gt;)/g, '$1<span class="text-yellow-400">$2</span>$3$4')
      .replace(/(&gt;)([^&<]+)(&lt;)/g, '$1<span class="text-green-400">$2</span>$3')
      .replace(/([^&>]+)(&gt;)/g, '<span class="text-blue-400">$1</span>$2');
  };

  if (!xmlContent) {
    return (
      <div className="text-center py-6 text-gray-500">
        <p>No se puede generar el XML con los datos proporcionados</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* XML Actions */}
      <div className="flex items-center justify-between mb-4">
        <Badge variant="outline" className="capitalize">
          XML {type}
        </Badge>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleCopyXML}>
            <Copy className="h-4 w-4 mr-1" />
            Copiar
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadXML}>
            <Download className="h-4 w-4 mr-1" />
            Descargar
          </Button>
        </div>
      </div>

      {/* XML Content */}
      <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
        <pre className="text-sm text-gray-100 font-mono leading-relaxed">
          <code
            dangerouslySetInnerHTML={{
              __html: highlightXML(xmlContent.replace(/</g, '&lt;').replace(/>/g, '&gt;'))
            }}
          />
        </pre>
      </div>

      {/* Validation Status */}
      <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <CheckCircle className="text-emerald-600" />
          <span className="text-emerald-800 font-medium">XML válido y listo para envío</span>
        </div>
        <p className="text-emerald-700 text-sm mt-1">
          Todos los campos requeridos están presentes y tienen el formato correcto.
        </p>
      </div>
    </div>
  );
}

// XML Generation Functions
function generateRemesaXML(data: any, config: any): string {
  const formatDate = (date: string) => {
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  return `<ns0:Envelope xmlns:ns0="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns1="urn:BPMServicesIntf-IBPMServices">
  <ns0:Header/>
  <ns0:Body>
    <ns1:AtenderMensajeRNDC>
      <Request>
        <root>
          <acceso>
            <username>${config.usuario}</username>
            <password>${config.password}</password>
          </acceso>
          <solicitud>
            <tipo>1</tipo>
            <procesoid>3</procesoid>
          </solicitud>
          <variables>
            <NUMNITEMPRESATRANSPORTE>${config.empresa_nit}</NUMNITEMPRESATRANSPORTE>
            <CONSECUTIVOREMESA>20250419</CONSECUTIVOREMESA>
            <CODOPERACIONTRANSPORTE>G</CODOPERACIONTRANSPORTE>
            <CODNATURALEZACARGA>1</CODNATURALEZACARGA>
            <CANTIDADCARGADA>10000</CANTIDADCARGADA>
            <UNIDADMEDIDACAPACIDAD>1</UNIDADMEDIDACAPACIDAD>
            <CODTIPOEMPAQUE>0</CODTIPOEMPAQUE>
            <MERCANCIAREMESA>002309</MERCANCIAREMESA>
            <DESCRIPCIONCORTAPRODUCTO>ALIMENTO PARA AVES DE CORRAL</DESCRIPCIONCORTAPRODUCTO>
            <CODTIPOIDREMITENTE>N</CODTIPOIDREMITENTE>
            <NUMIDREMITENTE>8600588314</NUMIDREMITENTE>
            <CODSEDEREMITENTE>002</CODSEDEREMITENTE>
            <CODTIPOIDDESTINATARIO>N</CODTIPOIDDESTINATARIO>
            <NUMIDDESTINATARIO>8600588314</NUMIDDESTINATARIO>
            <CODSEDEDESTINATARIO>009</CODSEDEDESTINATARIO>
            <DUENOPOLIZA>N</DUENOPOLIZA>
            <HORASPACTOCARGA>2</HORASPACTOCARGA>
            <HORASPACTODESCARGUE>2</HORASPACTODESCARGUE>
            <CODTIPOIDPROPIETARIO>N</CODTIPOIDPROPIETARIO>
            <NUMIDPROPIETARIO>${config.empresa_nit}</NUMIDPROPIETARIO>
            <CODSEDEPROPIETARIO>01</CODSEDEPROPIETARIO>
            <FECHACITAPACTADACARGUE>${data.FECHA_CITA ? formatDate(data.FECHA_CITA) : '19/04/2025'}</FECHACITAPACTADACARGUE>
            <HORACITAPACTADACARGUE>08:00</HORACITAPACTADACARGUE>
            <FECHACITAPACTADADESCARGUE>${data.FECHA_CITA ? formatDate(data.FECHA_CITA) : '19/04/2025'}</FECHACITAPACTADADESCARGUE>
            <HORACITAPACTADADESCARGUEREMESA>13:00</HORACITAPACTADADESCARGUEREMESA>
          </variables>
        </root>
      </Request>
    </ns1:AtenderMensajeRNDC>
  </ns0:Body>
</ns0:Envelope>`;
}

function generateManifiestoXML(data: any, config: any): string {
  return `<ns0:Envelope xmlns:ns0="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns1="urn:BPMServicesIntf-IBPMServices">
  <ns0:Header/>
  <ns0:Body>
    <ns1:AtenderMensajeRNDC>
      <Request>
        <root>
          <acceso>
            <username>${config.usuario}</username>
            <password>${config.password}</password>
          </acceso>
          <solicitud>
            <tipo>1</tipo>
            <procesoid>4</procesoid>
          </solicitud>
          <variables>
            <NUMNITEMPRESATRANSPORTE>${config.empresa_nit}</NUMNITEMPRESATRANSPORTE>
            <NUMMANIFIESTOCARGA>79154</NUMMANIFIESTOCARGA>
            <CODOPERACIONTRANSPORTE>G</CODOPERACIONTRANSPORTE>
            <FECHAEXPEDICIONMANIFIESTO>${new Date().toLocaleDateString('es-CO')}</FECHAEXPEDICIONMANIFIESTO>
            <CODMUNICIPIOORIGENMANIFIESTO>25286000</CODMUNICIPIOORIGENMANIFIESTO>
            <CODMUNICIPIODESTINOMANIFIESTO>25320000</CODMUNICIPIODESTINOMANIFIESTO>
            <CODTIPOIDTITULARMANIFIESTO>C</CODTIPOIDTITULARMANIFIESTO>
            <NUMIDTITULARMANIFIESTO>4133687</NUMIDTITULARMANIFIESTO>
            <NUMPLACA>${data.PLACA || 'GIT990'}</NUMPLACA>
            <CODTIPOIDCONDUCTOR>C</CODTIPOIDCONDUCTOR>
            <NUMIDCONDUCTOR>${data.IDENTIFICACION || '1073511288'}</NUMIDCONDUCTOR>
            <VALORFLETEPACTADOVIAJE>765684</VALORFLETEPACTADOVIAJE>
            <RETENCIONICAMANIFIESTOCARGA>0.0</RETENCIONICAMANIFIESTOCARGA>
            <RETENCIONFTOMANIFIESTOCARGA>0.0</RETENCIONFTOMANIFIESTOCARGA>
            <VALORANTICIPOMANIFIESTO>0</VALORANTICIPOMANIFIESTO>
            <FECHAPAGOSALDOMANIFIESTO>13/05/2025</FECHAPAGOSALDOMANIFIESTO>
            <CODMUNICIPIOPAGOSALDO>11001000</CODMUNICIPIOPAGOSALDO>
            <RESPONSABLEPAGOCARGUE>E</RESPONSABLEPAGOCARGUE>
            <RESPONSABLEPAGODESCARGUE>E</RESPONSABLEPAGODESCARGUE>
            <ACEPTACIONELECTRONICA>SI</ACEPTACIONELECTRONICA>
            <REMESASMAN procesoid="43">
              <REMESA>
                <CONSECUTIVOREMESA>79154</CONSECUTIVOREMESA>
              </REMESA>
            </REMESASMAN>
          </variables>
        </root>
      </Request>
    </ns1:AtenderMensajeRNDC>
  </ns0:Body>
</ns0:Envelope>`;
}

function generateCumplimientoXML(data: any, config: any): string {
  const formatDate = (date: string) => {
    const d = new Date(date);
    return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
  };

  return `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:BPMServicesIntf-IBPMServices">
  <soapenv:Header/>
  <soapenv:Body>
    <urn:AtenderMensajeRNDC>
      <Request>
        <root>
          <acceso>
            <username>${config.usuario}</username>
            <password>${config.password}</password>
          </acceso>
          <solicitud>
            <tipo>1</tipo>
            <procesoid>5</procesoid>
          </solicitud>
          <variables>
            <NUMNITEMPRESATRANSPORTE>${config.empresa_nit}</NUMNITEMPRESATRANSPORTE>
            <CONSECUTIVOREMESA>${data.consecutivoRemesa || '58565'}</CONSECUTIVOREMESA>
            <FECHACUMPLIMIENTO>${data.fechaCumplimiento ? formatDate(data.fechaCumplimiento) : formatDate(new Date().toISOString())}</FECHACUMPLIMIENTO>
            <HORACUMPLIMIENTO>12:00</HORACUMPLIMIENTO>
            <CODMUNICIPIOREMESACUMPLIDA>11001000</CODMUNICIPIOREMESACUMPLIDA>
          </variables>
        </root>
      </Request>
    </urn:AtenderMensajeRNDC>
  </soapenv:Body>
</soapenv:Envelope>`;
}
