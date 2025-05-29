import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Printer, 
  Eye, 
  Download, 
  Search, 
  FileText,
  Calendar,
  MapPin,
  Truck,
  User
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Manifiesto {
  id: number;
  numero_manifiesto: string;
  consecutivo_remesa: string;
  fecha_expedicion: Date;
  municipio_origen: string;
  municipio_destino: string;
  placa: string;
  conductor_id: string;
  valor_flete: number;
  estado: string;
  ingreso_id?: string;
  codigo_seguridad_qr?: string;
  created_at: Date;
}

export default function ImpresionManifiestos() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedManifiesto, setSelectedManifiesto] = useState<Manifiesto | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  // Obtener todos los manifiestos
  const { data: manifiestos, isLoading } = useQuery({
    queryKey: ["/api/manifiestos"],
  });

  // Filtrar manifiestos según el término de búsqueda
  const filteredManifiestos = manifiestos?.filter((m: Manifiesto) =>
    m.numero_manifiesto.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.conductor_id.includes(searchTerm)
  ) || [];

  const handlePreviewManifiesto = (manifiesto: Manifiesto) => {
    setSelectedManifiesto(manifiesto);
    setShowPreview(true);
  };

  const handlePrintManifiesto = (manifiesto: Manifiesto) => {
    // Crear ventana de impresión
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(generateManifiestoPrintHTML(manifiesto));
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  const handleDownloadPDF = (manifiesto: Manifiesto) => {
    // Generar y descargar PDF
    const htmlContent = generateManifiestoPrintHTML(manifiesto);
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `manifiesto_${manifiesto.numero_manifiesto}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Descarga exitosa",
      description: `Manifiesto ${manifiesto.numero_manifiesto} descargado`,
    });
  };

  const generateManifiestoPrintHTML = (manifiesto: Manifiesto) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Manifiesto Electrónico de Carga ${manifiesto.numero_manifiesto}</title>
        <style>
            @page { margin: 1cm; size: A4; }
            body { 
                font-family: Arial, sans-serif; 
                font-size: 7px; 
                line-height: 1.1;
                color: #000;
                margin: 0;
                padding: 0;
            }
            .main-container {
                border: 2px solid #000;
                padding: 3px;
            }
            .header-container {
                display: table;
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 3px;
            }
            .header-left {
                display: table-cell;
                width: 25%;
                vertical-align: top;
                border-right: 1px solid #000;
                padding: 2px;
            }
            .header-center {
                display: table-cell;
                width: 50%;
                text-align: center;
                vertical-align: middle;
                padding: 2px;
                border-right: 1px solid #000;
            }
            .header-right {
                display: table-cell;
                width: 25%;
                text-align: center;
                vertical-align: top;
                padding: 2px;
            }
            .logo-container {
                background: #4472C4;
                color: white;
                padding: 3px;
                text-align: center;
                font-size: 6px;
                margin-bottom: 2px;
            }
            .logo-colombia {
                background: #FFC000;
                color: #000;
                padding: 2px;
                font-size: 5px;
                margin-bottom: 1px;
            }
            .supertransporte {
                background: #70AD47;
                color: white;
                padding: 2px;
                font-size: 6px;
                font-weight: bold;
            }
            .title {
                font-size: 12px;
                font-weight: bold;
                margin: 2px 0;
                text-transform: uppercase;
            }
            .company-info {
                font-size: 8px;
                margin: 1px 0;
                font-weight: bold;
            }
            .company-details {
                font-size: 6px;
                margin: 1px 0;
            }
            .qr-info {
                font-size: 6px;
                margin-top: 2px;
            }
            .qr-placeholder {
                border: 1px solid #000;
                width: 60px;
                height: 60px;
                display: inline-block;
                text-align: center;
                line-height: 60px;
                font-size: 6px;
                margin-bottom: 2px;
            }
            .disclaimer-text {
                font-size: 5px;
                text-align: justify;
                line-height: 1.2;
                margin: 2px 0;
            }
            .dates-section {
                border: 1px solid #000;
                margin: 2px 0;
            }
            .dates-table {
                width: 100%;
                border-collapse: collapse;
            }
            .dates-table td, .dates-table th {
                border: 1px solid #000;
                padding: 1px;
                text-align: center;
                font-size: 6px;
                font-weight: bold;
            }
            .section-title {
                background: #DDDDDD;
                font-weight: bold;
                text-align: center;
                padding: 2px;
                border: 1px solid #000;
                margin: 2px 0 0 0;
                font-size: 7px;
                text-transform: uppercase;
            }
            .info-table {
                width: 100%;
                border-collapse: collapse;
                border: 1px solid #000;
                margin-bottom: 2px;
            }
            .info-table td, .info-table th {
                border: 1px solid #000;
                padding: 1px;
                font-size: 6px;
                vertical-align: top;
            }
            .info-table th {
                background: #DDDDDD;
                font-weight: bold;
                text-align: center;
                font-size: 5px;
            }
            .field-label {
                background: #DDDDDD;
                font-weight: bold;
                font-size: 5px;
                text-align: center;
                padding: 1px;
            }
            .field-value {
                text-align: center;
                font-size: 6px;
                padding: 1px;
            }
            .bottom-section {
                display: table;
                width: 100%;
                margin-top: 2px;
            }
            .values-column {
                display: table-cell;
                width: 60%;
                vertical-align: top;
                padding-right: 2px;
            }
            .observations-column {
                display: table-cell;
                width: 40%;
                vertical-align: top;
            }
            .values-table {
                width: 100%;
                border-collapse: collapse;
                border: 1px solid #000;
            }
            .values-table td {
                border: 1px solid #000;
                padding: 1px;
                font-size: 6px;
            }
            .values-label {
                background: #DDDDDD;
                font-weight: bold;
                text-align: left;
                padding: 1px 2px;
                width: 70%;
            }
            .values-amount {
                text-align: right;
                padding: 1px 2px;
                width: 30%;
            }
            .footer-text {
                font-size: 5px;
                text-align: center;
                margin-top: 3px;
                line-height: 1.2;
                border-top: 1px solid #000;
                padding-top: 2px;
            }
        </style>
    </head>
    <body>
        <div class="main-container">
            <!-- ENCABEZADO -->
            <div class="header-container">
                <div class="header-left">
                    <div class="logo-container" style="background: #FFC000; color: #000; text-align: center; padding: 8px; font-size: 7px; border: 1px solid #000;">
                        🇨🇴<br>
                        <strong>La movilidad<br>es de todos</strong>
                    </div>
                    <div class="logo-container" style="background: #4472C4; color: white; text-align: center; padding: 4px; font-size: 8px; border: 1px solid #000;">
                        <strong>Mintransporte</strong>
                    </div>
                    <div class="supertransporte" style="background: #70AD47; color: white; text-align: center; padding: 4px; font-size: 7px; border: 1px solid #000;">
                        <strong>SuperTransporte</strong>
                    </div>
                </div>
                <div class="header-center">
                    <h1 class="title">MANIFIESTO ELECTRÓNICO DE CARGA</h1>
                    <div class="company-info">TRANSPETROMIRA S.A.S</div>
                    <div class="company-details">
                        <strong>Nit: 9013690938</strong><br>
                        <strong>CARRERA 3 No 5 72 barrio el Comercio</strong><br>
                        <strong>Tel: 3183118181 - 3184000500 RICAURTE NARIÑO</strong>
                    </div>
                </div>
                <div class="header-right">
                    <div class="disclaimer-text">
                        "La impresión en soporte cartular (papel) de este acto administrativo producido por medios electrónicos en cumplimiento de la ley 527 de 1999 (Artículos 6 al 13) y de la ley 962 de 2005 (Artículo 6), es una reproducción del documento original que se encuentra en formato electrónico en la Base de Datos del RNDC en el Ministerio de Transporte, cuya representación digital goza de autenticidad, integridad y no repudio"
                    </div>
                    <div class="qr-placeholder">[QR CODE]</div>
                    <div class="qr-info">
                        <strong>Manifiesto:</strong> ${manifiesto.numero_manifiesto}<br>
                        <strong>Autorización:</strong> 104518661
                    </div>
                </div>
            </div>

            <!-- FECHAS Y TIPO -->
            <table class="dates-table">
                <tr>
                    <th>FECHA DE EXPEDICIÓN</th>
                    <th>FECHA Y HORA RADICACIÓN</th>
                    <th>TIPO DE MANIFIESTO</th>
                    <th>ORIGEN DEL VIAJE</th>
                    <th>DESTINO DEL VIAJE</th>
                </tr>
                <tr>
                    <td>${format(new Date(manifiesto.fecha_expedicion), "yyyy/MM/dd", { locale: es })}</td>
                    <td>2025/05/28 08:42 pm</td>
                    <td>General</td>
                    <td>${manifiesto.municipio_origen}</td>
                    <td>${manifiesto.municipio_destino}</td>
                </tr>
            </table>

            <!-- INFORMACIÓN DEL VEHÍCULO Y CONDUCTORES -->
            <div class="section-title">INFORMACIÓN DEL VEHÍCULO Y CONDUCTORES</div>
            <table class="info-table">
                <tr>
                    <td class="field-label">TITULAR MANIFIESTO</td>
                    <td class="field-value" colspan="2">FABRICIANO QUINTERO MUÑOZ</td>
                    <td class="field-label">DOCUMENTO<br>IDENTIFICACIÓN</td>
                    <td class="field-value">4133687</td>
                    <td class="field-label">DIRECCIÓN</td>
                    <td class="field-value" colspan="2"></td>
                    <td class="field-label">TELÉFONOS</td>
                    <td class="field-value">0</td>
                    <td class="field-label">CIUDAD</td>
                    <td class="field-value">${manifiesto.municipio_origen}</td>
                </tr>
                <tr>
                    <td class="field-label">PLACA</td>
                    <td class="field-value">${manifiesto.placa}</td>
                    <td class="field-label">MARCA</td>
                    <td class="field-value">CHEVROLET</td>
                    <td class="field-label">PLACA SEMIREMOLQUE</td>
                    <td class="field-value"></td>
                    <td class="field-label">PLACA SEMIREMOL 2</td>
                    <td class="field-value"></td>
                    <td class="field-label">CONFIGURACIÓN</td>
                    <td class="field-value">2</td>
                    <td class="field-label">PesoVacío</td>
                    <td class="field-value">3000</td>
                    <td class="field-label">PesoVacíoRemolque</td>
                    <td class="field-value"></td>
                    <td class="field-label">COMPAÑÍA SEGUROS SOAT</td>
                    <td class="field-value">860002400 LA PREVISORA S.A COMPAÑÍA</td>
                    <td class="field-label">CUNDINAMARCA</td>
                    <td class="field-value"></td>
                    <td class="field-label">No PÓLIZA</td>
                    <td class="field-value">438006646</td>
                    <td class="field-label">F.Vencimiento SOAT</td>
                    <td class="field-value">2026/02/18</td>
                </tr>
                <tr>
                    <td class="field-label">CONDUCTOR</td>
                    <td class="field-value" colspan="3">JAROL ANDRÉS DURÁN SALDAÑA</td>
                    <td class="field-label">DOCUMENTO IDENTIFICACIÓN</td>
                    <td class="field-value">${manifiesto.conductor_id}</td>
                    <td class="field-label">DIRECCIÓN</td>
                    <td class="field-value" colspan="2">DIAGONAL 18 #3-105 VILLA MARÍA ETAPA 3</td>
                    <td class="field-label">TELÉFONOS</td>
                    <td class="field-value">00</td>
                    <td class="field-label">No de LICENCIA</td>
                    <td class="field-value">C2-1073511288</td>
                    <td class="field-label">CIUDAD CONDUCTOR</td>
                    <td class="field-value">MOSQUERA</td>
                </tr>
                <tr>
                    <td class="field-label">CONDUCTOR Nro. 2</td>
                    <td class="field-value" colspan="3"></td>
                    <td class="field-label">DOCUMENTO IDENTIFICACIÓN</td>
                    <td class="field-value"></td>
                    <td class="field-label">DIRECCIÓN CONDUCTOR 2</td>
                    <td class="field-value" colspan="2"></td>
                    <td class="field-label">TELÉFONOS</td>
                    <td class="field-value"></td>
                    <td class="field-label">No de LICENCIA</td>
                    <td class="field-value"></td>
                    <td class="field-label">CUNDINAMARCA<br>CIUDAD CONDUCTOR 2</td>
                    <td class="field-value"></td>
                </tr>
                <tr>
                    <td class="field-label">POSEEDOR O TENEDOR VEHÍCULO</td>
                    <td class="field-value" colspan="3">JAROL ANDRÉS DURÁN SALDAÑA</td>
                    <td class="field-label">DOCUMENTO IDENTIFICACIÓN</td>
                    <td class="field-value">1073511288</td>
                    <td class="field-label">DIRECCIÓN</td>
                    <td class="field-value" colspan="2"></td>
                    <td class="field-label">TELÉFONOS</td>
                    <td class="field-value"></td>
                    <td class="field-label"></td>
                    <td class="field-value"></td>
                    <td class="field-label">CIUDAD</td>
                    <td class="field-value"></td>
                </tr>
            </table>

            <!-- INFORMACIÓN DE LA MERCANCÍA TRANSPORTADA -->
            <div class="section-title">INFORMACIÓN DE LA MERCANCÍA TRANSPORTADA</div>
            <table class="info-table">
                <tr>
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
                    <td class="field-value">${manifiesto.consecutivo_remesa}</td>
                    <td class="field-value">Kilogramos</td>
                    <td class="field-value">7,000.00</td>
                    <td class="field-value">Carga<br>General</td>
                    <td class="field-value">Paquetes.</td>
                    <td class="field-value">002309<br>Permiso INVIAS:<br>ALIMENTOPARAAVESDECORRAL<br>Fraccionada<br>en máximo 2<br>kgs por<br>unidad de<br>empaque</td>
                    <td class="field-value">860058314 AVÍCOLA LOS CAMBULOS S.A</td>
                    <td class="field-value">860058314 AVÍCOLA LOS CAMBULOS S.A</td>
                    <td class="field-value">No existe póliza</td>
                </tr>
            </table>

            <!-- PRECIO DEL VIAJE, VALORES Y OBSERVACIONES -->
            <div class="bottom-section">
                <div class="values-column">
                    <div class="section-title">PRECIO DEL VIAJE VALORES</div>
                    <table class="values-table">
                        <tr>
                            <td class="values-label">VALOR TOTAL DEL VIAJE</td>
                            <td class="values-amount">${(manifiesto.valor_flete || 765684).toLocaleString()}.00</td>
                        </tr>
                        <tr>
                            <td class="values-label">RETENCIÓN EN LA FUENTE</td>
                            <td class="values-amount">0.00</td>
                        </tr>
                        <tr>
                            <td class="values-label">RETENCIÓN ICA</td>
                            <td class="values-amount">0.00</td>
                        </tr>
                        <tr>
                            <td class="values-label">VALOR NETO A PAGAR</td>
                            <td class="values-amount">${(manifiesto.valor_flete || 765684).toLocaleString()}.00</td>
                        </tr>
                        <tr>
                            <td class="values-label">VALOR ANTICIPO</td>
                            <td class="values-amount">0.00</td>
                        </tr>
                        <tr>
                            <td class="values-label">SALDO A PAGAR</td>
                            <td class="values-amount">${(manifiesto.valor_flete || 765684).toLocaleString()}.00</td>
                        </tr>
                    </table>
                    <div style="font-size: 6px; margin-top: 2px; padding: 2px;">
                        <strong>VALOR TOTAL DEL VIAJE EN LETRAS:</strong> SETECIENTOS SESENTA Y CINCO MIL SEISCIENTOS OCHENTA Y CUATRO PESOS
                    </div>
                </div>
                <div class="observations-column">
                    <div class="section-title">PAGO DEL SALDO OBSERVACIONES<br>RECOMENDACIONES</div>
                    <table class="values-table" style="margin-bottom: 5px;">
                        <tr>
                            <td class="values-label">LUGAR<br>DE PAGO</td>
                            <td class="values-amount">BOGOTA BOGOTA<br>D.C.</td>
                            <td class="values-label">FECHA</td>
                            <td class="values-amount">2025/08/28</td>
                        </tr>
                    </table>
                    <div style="border: 1px solid #000; margin: 2px 0; padding: 1px;">
                        <div class="field-label" style="text-align: center; font-size: 5px;">CARGUE PAGADO POR</div>
                        <div class="field-value" style="padding: 8px; text-align: center; font-weight: bold;">DESTINATARIO</div>
                    </div>
                    <div style="border: 1px solid #000; margin: 2px 0; padding: 1px;">
                        <div class="field-label" style="text-align: center; font-size: 5px;">DESCARGUE PAGADO POR</div>
                        <div class="field-value" style="padding: 8px; text-align: center; font-weight: bold;">DESTINATARIO</div>
                    </div>
                </div>
            </div>

            <!-- PIE DE PÁGINA -->
            <div class="footer-text">
                <div style="display: table; width: 100%; margin-top: 10px;">
                    <div style="display: table-cell; width: 65%; vertical-align: top;">
                        <strong>Si es víctima de algún fraude o conoce de alguna irregularidad en el Registro Nacional de Despachos de Carga RNDC denúncielo a la Superintendencia de Puertos y Transporte, en la línea gratuita nacional 018000 915615 y a través del correo electrónico: atencionciudadano@supertransporte.gov.co</strong>
                    </div>
                    <div style="display: table-cell; width: 35%; vertical-align: top; text-align: center;">
                        <strong>Firma y Huella TITULAR MANIFIESTO o ACEPTACIÓN DIGITAL</strong>
                        <div style="height: 30px; border-bottom: 1px solid #000; margin: 5px 0;"></div>
                        <strong>Firma y Huella del CONDUCTOR o ACEPTACIÓN DIGITAL</strong>
                        <div style="height: 30px; border-bottom: 1px solid #000; margin: 5px 0;"></div>
                    </div>
                </div>
            </div>
        </div>
    </body>
    </html>`;
  };

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Impresión de Manifiestos</h1>
          <p className="text-muted-foreground">
            Imprime o descarga manifiestos de carga para documentación física
          </p>
        </div>

        {/* Búsqueda */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Buscar Manifiestos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Buscar por número de manifiesto, placa o conductor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button variant="outline">
                <Search className="h-4 w-4 mr-2" />
                Buscar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Manifiestos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Manifiestos Disponibles
              <Badge variant="secondary">
                {filteredManifiestos.length} encontrados
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Cargando manifiestos...</div>
            ) : filteredManifiestos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No se encontraron manifiestos
              </div>
            ) : (
              <div className="space-y-4">
                {filteredManifiestos.map((manifiesto: Manifiesto) => (
                  <div
                    key={manifiesto.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-lg">
                          Manifiesto {manifiesto.numero_manifiesto}
                        </span>
                        <Badge variant={manifiesto.estado === "exitoso" ? "default" : "secondary"}>
                          {manifiesto.estado}
                        </Badge>
                        {manifiesto.ingreso_id && (
                          <Badge variant="outline" className="text-green-600">
                            RNDC: {manifiesto.ingreso_id}
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Truck className="h-4 w-4" />
                          {manifiesto.placa}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {manifiesto.conductor_id}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(manifiesto.fecha_expedicion), "dd/MM/yyyy", { locale: es })}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {manifiesto.municipio_origen} → {manifiesto.municipio_destino}
                        </div>
                      </div>
                      
                      <div className="text-sm">
                        <span className="font-medium">Valor Flete:</span> ${manifiesto.valor_flete.toLocaleString()}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePreviewManifiesto(manifiesto)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Vista Previa
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePrintManifiesto(manifiesto)}
                      >
                        <Printer className="h-4 w-4 mr-1" />
                        Imprimir
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadPDF(manifiesto)}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Descargar
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de Vista Previa */}
        {showPreview && selectedManifiesto && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Vista Previa - Manifiesto {selectedManifiesto.numero_manifiesto}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handlePrintManifiesto(selectedManifiesto)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Imprimir
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowPreview(false)}
                    >
                      Cerrar
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div 
                  className="bg-white p-6 overflow-auto max-h-[70vh] border"
                  dangerouslySetInnerHTML={{ 
                    __html: generateManifiestoPrintHTML(selectedManifiesto).replace(
                      /<style>.*?<\/style>/s, 
                      '<style>body { font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; color: #333; } .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; } .header h1 { margin: 0; font-size: 24px; font-weight: bold; color: #2563eb; } .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; } .info-section { border: 1px solid #ddd; padding: 15px; border-radius: 5px; } .info-section h3 { margin: 0 0 10px 0; font-size: 14px; font-weight: bold; color: #2563eb; } .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; } .info-label { font-weight: bold; color: #555; } .status-badge { display: inline-block; padding: 4px 8px; border-radius: 3px; font-size: 10px; font-weight: bold; background: #10b981; color: white; }</style>'
                    ).replace('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Manifiesto de Carga ' + selectedManifiesto.numero_manifiesto + '</title>', '').replace('</head><body>', '').replace('</body></html>', '')
                  }}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}