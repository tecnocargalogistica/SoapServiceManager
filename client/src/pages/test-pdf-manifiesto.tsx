import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Download, 
  Search, 
  ArrowLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import type { Manifiesto } from "@/../../shared/schema";

const TestPDFManifiesto = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const { data: manifiestos = [], isLoading } = useQuery<Manifiesto[]>({
    queryKey: ['/api/manifiestos'],
  });

  const filteredManifiestos = manifiestos.filter(m => 
    m.numero_manifiesto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.conductor_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generateTestPDF = (manifiesto: Manifiesto) => {
    const htmlContent = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Manifiesto de Carga - ${manifiesto.numero_manifiesto}</title>
    <meta name="author" content="TRANSPETROMIRA S.A.S"/>
    <meta name="description" content="Manifiesto Electrónico de Carga"/>
    <style type="text/css">
        * {margin:0; padding:0; text-indent:0; }
        body { font-family: Arial, sans-serif; font-size: 8pt; }
        .s1 { color: black; font-family:Arial, sans-serif; font-style: normal; font-weight: bold; text-decoration: none; font-size: 12pt; }
        h3 { color: black; font-family:Arial, sans-serif; font-style: normal; font-weight: bold; text-decoration: none; font-size: 10pt; }
        h4 { color: black; font-family:Arial, sans-serif; font-style: normal; font-weight: bold; text-decoration: none; font-size: 8pt; }
        .s2 { color: black; font-family:Arial, sans-serif; font-style: normal; font-weight: normal; text-decoration: none; font-size: 8pt; }
        p { color: black; font-family:Arial, sans-serif; font-style: normal; font-weight: normal; text-decoration: none; font-size: 6pt; margin:0pt; }
        .h2 { color: black; font-family:Arial, sans-serif; font-style: normal; font-weight: bold; text-decoration: none; font-size: 11pt; }
        .h1 { color: black; font-family:Arial, sans-serif; font-style: normal; font-weight: bold; text-decoration: none; font-size: 12pt; }
        .s3 { color: black; font-family:Arial, sans-serif; font-style: normal; font-weight: bold; text-decoration: none; font-size: 6pt; }
        .s4 { color: black; font-family:Arial, sans-serif; font-style: normal; font-weight: normal; text-decoration: none; font-size: 8pt; }
        .s5 { color: black; font-family:Arial, sans-serif; font-style: normal; font-weight: bold; text-decoration: none; font-size: 10pt; }
        .s6 { color: black; font-family:Arial, sans-serif; font-style: normal; font-weight: normal; text-decoration: none; font-size: 6pt; }
        .s7 { color: black; font-family:Arial, sans-serif; font-style: normal; font-weight: normal; text-decoration: none; font-size: 10pt; }
        .s8 { color: black; font-family:Arial, sans-serif; font-style: normal; font-weight: normal; text-decoration: none; font-size: 7pt; }
        .s9 { color: black; font-family:Arial, sans-serif; font-style: normal; font-weight: normal; text-decoration: none; font-size: 6pt; vertical-align: 1pt; }
        .s10 { color: black; font-family:Arial, sans-serif; font-style: normal; font-weight: normal; text-decoration: none; font-size: 6pt; vertical-align: -2pt; }
        .s11 { color: black; font-family:Arial, sans-serif; font-style: normal; font-weight: normal; text-decoration: none; font-size: 7pt; vertical-align: -2pt; }
        .s12 { color: black; font-family:Arial, sans-serif; font-style: normal; font-weight: normal; text-decoration: none; font-size: 6pt; }
        .s13 { color: black; font-family:Arial, sans-serif; font-style: normal; font-weight: bold; text-decoration: none; font-size: 8pt; }
        
        table { border-collapse: collapse; width: 100%; margin: 10px 0; }
        td, th { border: 1px solid black; padding: 4px; text-align: left; vertical-align: top; }
        .header-section { text-align: center; margin: 20px 0; }
        .logo-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .company-info { text-align: center; }
        .field-highlight { background-color: #ffff99; font-weight: bold; }
        
        @media print {
            body { margin: 0; padding: 10mm; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <!-- Botones de acción - solo en pantalla -->
    <div class="no-print" style="margin-bottom: 20px; text-align: center;">
        <button onclick="window.print()" style="background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; margin-right: 10px; cursor: pointer;">
            🖨️ Imprimir / Descargar PDF
        </button>
        <button onclick="window.close()" style="background: #6c757d; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer;">
            ✕ Cerrar
        </button>
    </div>

    <!-- Encabezado con logos -->
    <div class="header-section">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 20px;">
            <!-- Logo izquierdo -->
            <div style="width: 200px;">
                <div style="background: #FFC000; color: black; text-align: center; padding: 8px; font-size: 8px; border: 1px solid black; margin-bottom: 5px;">
                    🇨🇴<br>
                    <strong>La movilidad<br>es de todos</strong>
                </div>
                <div style="background: #4472C4; color: white; text-align: center; padding: 4px; font-size: 9px; border: 1px solid black; margin-bottom: 5px;">
                    <strong>Mintransporte</strong>
                </div>
                <div style="background: #70AD47; color: white; text-align: center; padding: 4px; font-size: 8px; border: 1px solid black;">
                    <strong>SuperTransporte</strong>
                </div>
            </div>
            
            <!-- Centro -->
            <div style="flex: 1; text-align: center; margin: 0 20px;">
                <p class="s1">MANIFIESTO ELECTRÓNICO DE CARGA</p>
                <h3>TRANSPETROMIRA S.A.S</h3>
                <h4>Nit: 9013690938</h4>
                <p class="s2">CARRERA 3 No 5 72 barrio el Comercio</p>
                <p class="s2">Tel: 3505172184 - 3214913376 RICAURTE NARIÑO</p>
            </div>
            
            <!-- Derecha -->
            <div style="width: 300px; font-size: 6px; text-align: justify;">
                <p>"La impresión en soporte cartular (papel) de este acto administrativo producido por medios electrónicos en cumplimiento de la ley 527 de 1999 (Artículos 6 al 13) y de la ley 962 de 2005 (Artículo 6), es una reproducción del documento original que se encuentra en formato electrónico en la Base de Datos del RNDC en el Ministerio de Transporte, cuya representación digital goza de autenticidad, integridad y no repudio"</p>
                <div style="margin-top: 10px; font-size: 8px; font-weight: bold;">
                    <p>Manifiesto: <span class="field-highlight">${manifiesto.numero_manifiesto}</span></p>
                    <p>Autorización:</p>
                </div>
            </div>
        </div>
    </div>

    <!-- Tabla de fechas y destinos -->
    <table>
        <tr style="background: #f0f0f0;">
            <th>FECHA DE EXPEDICION</th>
            <th>FECHA y HORA RADICACION</th>
            <th>TIPO DE MANIFIESTO</th>
            <th>ORIGEN DEL VIAJE</th>
            <th>DESTINO DEL VIAJE</th>
        </tr>
        <tr>
            <td>${new Date(manifiesto.fecha_expedicion).toLocaleDateString('es-CO')}</td>
            <td></td>
            <td>General</td>
            <td>${manifiesto.municipio_origen}</td>
            <td>${manifiesto.municipio_destino}</td>
        </tr>
    </table>

    <!-- Información del vehículo y conductores -->
    <h4 style="background: #f0f0f0; padding: 5px; margin: 10px 0;">INFORMACIÓN DEL VEHÍCULO Y CONDUCTORES</h4>
    
    <table>
        <tr>
            <td style="background: #f8f8f8; font-weight: bold;">TITULAR MANIFIESTO</td>
            <td colspan="2"></td>
            <td style="background: #f8f8f8; font-weight: bold;">DOCUMENTO IDENTIFICACIÓN</td>
            <td></td>
            <td style="background: #f8f8f8; font-weight: bold;">DIRECCIÓN</td>
            <td colspan="2"></td>
            <td style="background: #f8f8f8; font-weight: bold;">TELÉFONOS</td>
            <td></td>
            <td style="background: #f8f8f8; font-weight: bold;">CIUDAD</td>
            <td></td>
        </tr>
    </table>

    <table>
        <tr>
            <td style="background: #f8f8f8; font-weight: bold;">PLACA</td>
            <td style="font-weight: bold;" class="field-highlight">${manifiesto.placa}</td>
            <td style="background: #f8f8f8; font-weight: bold;">MARCA</td>
            <td></td>
            <td style="background: #f8f8f8; font-weight: bold;">PLACA SEMIREMOLQUE</td>
            <td></td>
            <td style="background: #f8f8f8; font-weight: bold;">PLACA SEMIREMOL 2</td>
            <td></td>
            <td style="background: #f8f8f8; font-weight: bold;">CONFIGURACIÓN</td>
            <td></td>
            <td style="background: #f8f8f8; font-weight: bold;">PesoVacío</td>
            <td></td>
            <td style="background: #f8f8f8; font-weight: bold;">PesoVacíoRemolque</td>
            <td></td>
            <td style="background: #f8f8f8; font-weight: bold;">COMPAÑÍA SEGUROS SOAT</td>
            <td colspan="2"></td>
            <td style="background: #f8f8f8; font-weight: bold;">No PÓLIZA</td>
            <td></td>
            <td style="background: #f8f8f8; font-weight: bold;">F.Vencimiento SOAT</td>
            <td></td>
        </tr>
    </table>

    <table>
        <tr>
            <td style="background: #f8f8f8; font-weight: bold;">CONDUCTOR</td>
            <td colspan="3"></td>
            <td style="background: #f8f8f8; font-weight: bold;">DOCUMENTO IDENTIFICACIÓN</td>
            <td class="field-highlight">${manifiesto.conductor_id}</td>
            <td style="background: #f8f8f8; font-weight: bold;">DIRECCIÓN</td>
            <td colspan="2"></td>
            <td style="background: #f8f8f8; font-weight: bold;">TELÉFONOS</td>
            <td>0.0</td>
            <td style="background: #f8f8f8; font-weight: bold;">No de LICENCIA</td>
            <td></td>
            <td style="background: #f8f8f8; font-weight: bold;">CIUDAD CONDUCTOR</td>
            <td></td>
        </tr>
    </table>

    <!-- Información de la mercancía -->
    <h4 style="background: #f0f0f0; padding: 5px; margin: 10px 0;">INFORMACIÓN DE LA MERCANCÍA TRANSPORTADA</h4>
    
    <table>
        <tr style="background: #f0f0f0;">
            <th>Nro. Remesa</th>
            <th>Unidad Medida</th>
            <th>Cantidad</th>
            <th>Naturaleza</th>
            <th>Empaque</th>
            <th>Producto Transportado</th>
            <th>Información Remitente / Lugar Cargue</th>
            <th>Información Destinatario / Lugar Descargue</th>
            <th>Dueño Póliza</th>
        </tr>
        <tr>
            <td class="field-highlight">${manifiesto.consecutivo_remesa}</td>
            <td>Kilogramos</td>
            <td></td>
            <td>Carga Normal</td>
            <td>Paquetes.</td>
            <td>002309<br>Permiso INVIAS:<br>ALIMENTOPARAAVESDECORRAL</td>
            <td>860058314 AVÍCOLA LOS CAMBULOS S.A</td>
            <td>860058314 AVÍCOLA LOS CAMBULOS S.A</td>
            <td>No existe póliza</td>
        </tr>
    </table>

    <!-- Valores y observaciones -->
    <div style="display: flex; margin-top: 20px;">
        <div style="width: 50%; margin-right: 10px;">
            <h4 style="background: #f0f0f0; padding: 5px; text-align: center;">VALORES</h4>
            <table>
                <tr>
                    <td style="background: #f8f8f8; font-weight: bold;">VALOR TOTAL DEL VIAJE</td>
                    <td></td>
                </tr>
                <tr>
                    <td style="background: #f8f8f8; font-weight: bold;">RETENCIÓN EN LA FUENTE</td>
                    <td></td>
                </tr>
                <tr>
                    <td style="background: #f8f8f8; font-weight: bold;">RETENCIÓN ICA</td>
                    <td>0.00</td>
                </tr>
                <tr>
                    <td style="background: #f8f8f8; font-weight: bold;">VALOR NETO A PAGAR</td>
                    <td></td>
                </tr>
                <tr>
                    <td style="background: #f8f8f8; font-weight: bold;">VALOR ANTICIPO</td>
                    <td>0.00</td>
                </tr>
                <tr>
                    <td style="background: #f8f8f8; font-weight: bold;">SALDO A PAGAR</td>
                    <td></td>
                </tr>
            </table>
            <div style="border: 1px solid black; padding: 5px; margin-top: 5px; font-size: 6px;">
                <strong>VALOR TOTAL DEL VIAJE EN LETRAS:</strong> SETECIENTOS SESENTA Y CINCO MIL SEISCIENTOS OCHENTA Y CUATRO PESOS
            </div>
        </div>
        
        <div style="width: 50%;">
            <h4 style="background: #f0f0f0; padding: 5px; text-align: center;">OBSERVACIONES</h4>
            <table style="margin-bottom: 10px;">
                <tr>
                    <td style="background: #f8f8f8; font-weight: bold;">LUGAR DE PAGO</td>
                    <td>BOGOTÁ BOGOTÁ D.C.</td>
                    <td style="background: #f8f8f8; font-weight: bold;">FECHA</td>
                    <td></td>
                </tr>
            </table>
            <div style="border: 1px solid black; margin-bottom: 10px; padding: 10px; text-align: center;">
                <div style="font-weight: bold; font-size: 6px; margin-bottom: 5px;">CARGUE PAGADO POR</div>
                <div style="font-weight: bold;">DESTINATARIO</div>
            </div>
            <div style="border: 1px solid black; padding: 10px; text-align: center;">
                <div style="font-weight: bold; font-size: 6px; margin-bottom: 5px;">DESCARGUE PAGADO POR</div>
                <div style="font-weight: bold;">DESTINATARIO</div>
            </div>
        </div>
    </div>

    <!-- Pie de página -->
    <div style="margin-top: 30px; display: flex;">
        <div style="width: 60%; font-size: 6px;">
            <strong>Si es víctima de algún fraude o conoce de alguna irregularidad en el Registro Nacional de Despachos de Carga RNDC denúncielo a la Superintendencia de Puertos y Transporte, en la línea gratuita nacional 018000 915615 y a través del correo electrónico: atencionciudadano@supertransporte.gov.co</strong>
        </div>
        <div style="width: 40%; text-align: center;">
            <div style="font-size: 6px; font-weight: bold; margin-bottom: 20px;">
                Firma y Huella TITULAR MANIFIESTO o ACEPTACIÓN DIGITAL
            </div>
            <div style="border-bottom: 1px solid black; height: 30px; margin-bottom: 20px;"></div>
            <div style="font-size: 6px; font-weight: bold; margin-bottom: 20px;">
                Firma y Huella del CONDUCTOR o ACEPTACIÓN DIGITAL
            </div>
            <div style="border-bottom: 1px solid black; height: 30px;"></div>
        </div>
    </div>
</body>
</html>`;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      
      toast({
        title: "✅ PDF Generado",
        description: `Manifiesto ${manifiesto.numero_manifiesto} listo para imprimir`,
      });
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Link href="/impresion-manifiestos">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Impresión
          </Button>
        </Link>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            🧪 Prueba de PDF con Campos Dinámicos
          </CardTitle>
          <p className="text-gray-600">
            Prueba del manifiesto usando tu plantilla HTML con los campos: 
            <Badge variant="secondary" className="mx-1">CONSECUTIVO</Badge>
            <Badge variant="secondary" className="mx-1">ID CONDUCTOR</Badge>
            <Badge variant="secondary" className="mx-1">PLACA</Badge>
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar por número de manifiesto, placa o conductor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Button variant="outline">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="p-6">
            <p>Cargando manifiestos...</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredManifiestos.map((manifiesto) => (
            <Card key={manifiesto.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                  <div>
                    <p className="text-sm text-gray-500">Número de Manifiesto</p>
                    <p className="font-bold text-lg">{manifiesto.numero_manifiesto}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Placa</p>
                    <p className="font-semibold">{manifiesto.placa}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Conductor ID</p>
                    <p className="font-semibold">{manifiesto.conductor_id}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => generateTestPDF(manifiesto)}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      Generar PDF Test
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {filteredManifiestos.length === 0 && !isLoading && (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-gray-500">No se encontraron manifiestos que coincidan con la búsqueda.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default TestPDFManifiesto;