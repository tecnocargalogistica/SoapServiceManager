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
            @page { margin: 1.5cm; size: A4; }
            body { 
                font-family: Arial, sans-serif; 
                font-size: 9px; 
                line-height: 1.2;
                color: #000;
                margin: 0;
                padding: 0;
            }
            .header-container {
                display: table;
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 10px;
            }
            .header-left {
                display: table-cell;
                width: 20%;
                vertical-align: top;
                padding: 5px;
            }
            .header-center {
                display: table-cell;
                width: 60%;
                text-align: center;
                vertical-align: top;
                padding: 5px;
            }
            .header-right {
                display: table-cell;
                width: 20%;
                text-align: right;
                vertical-align: top;
                padding: 5px;
            }
            .logo-area {
                font-size: 8px;
                border: 1px solid #000;
                padding: 5px;
                height: 80px;
            }
            .title {
                font-size: 16px;
                font-weight: bold;
                margin: 0;
                text-transform: uppercase;
            }
            .company-info {
                font-size: 11px;
                margin: 5px 0;
                font-weight: bold;
            }
            .qr-placeholder {
                border: 2px solid #000;
                width: 80px;
                height: 80px;
                display: inline-block;
                text-align: center;
                line-height: 80px;
                font-size: 8px;
            }
            .manifest-info {
                font-size: 10px;
                margin-top: 5px;
            }
            .dates-section {
                border: 1px solid #000;
                margin: 5px 0;
            }
            .dates-table {
                width: 100%;
                border-collapse: collapse;
            }
            .dates-table td, .dates-table th {
                border: 1px solid #000;
                padding: 3px;
                text-align: center;
                font-size: 8px;
            }
            .section-title {
                background: #f0f0f0;
                font-weight: bold;
                text-align: center;
                padding: 4px;
                border: 1px solid #000;
                margin: 5px 0 0 0;
                font-size: 9px;
                text-transform: uppercase;
            }
            .info-table {
                width: 100%;
                border-collapse: collapse;
                border: 1px solid #000;
                margin-bottom: 5px;
            }
            .info-table td, .info-table th {
                border: 1px solid #000;
                padding: 2px;
                font-size: 8px;
                vertical-align: top;
            }
            .info-table th {
                background: #f8f8f8;
                font-weight: bold;
                text-align: center;
            }
            .label {
                font-weight: bold;
                background: #f8f8f8;
                width: 25%;
            }
            .value {
                width: 25%;
            }
            .values-section {
                border: 1px solid #000;
                margin: 5px 0;
            }
            .values-table {
                width: 100%;
                border-collapse: collapse;
            }
            .values-table td {
                border: 1px solid #000;
                padding: 3px;
                font-size: 8px;
            }
            .observations {
                border: 1px solid #000;
                margin: 5px 0;
                padding: 5px;
            }
            .footer-text {
                font-size: 7px;
                text-align: center;
                margin-top: 10px;
                line-height: 1.3;
            }
        </style>
    </head>
    <body>
        <!-- ENCABEZADO -->
        <div class="header-container">
            <div class="header-left">
                <div class="logo-area">
                    🇨🇴<br>
                    La movilidad<br>
                    es de todos<br>
                    Mintransporte
                </div>
            </div>
            <div class="header-center">
                <h1 class="title">MANIFIESTO ELECTRÓNICO DE CARGA</h1>
                <div class="company-info">AVÍCOLA LOS CAMBULOS S.A.S</div>
                <div style="font-size: 9px;">
                    <strong>Nit:</strong> 900123456<br>
                    <strong>Tel:</strong> 601-234-5678 - 601-987-6543<br>
                    RESIDENCIAS MARÍTIMA
                </div>
            </div>
            <div class="header-right">
                <div class="qr-placeholder">[QR CODE]</div>
                <div class="manifest-info">
                    <strong>Manifiesto:</strong> ${manifiesto.numero_manifiesto}<br>
                    <strong>Autorización:</strong> ${manifiesto.autorizacion_numero || '104518661'}
                </div>
            </div>
        </div>

        <!-- FECHAS Y TIPO -->
        <div class="dates-section">
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
                    <td>${manifiesto.fecha_hora_radicacion ? format(new Date(manifiesto.fecha_hora_radicacion), "yyyy/MM/dd HH:mm 'pm'", { locale: es }) : 'N/A'}</td>
                    <td>${manifiesto.tipo_manifiesto || 'General'}</td>
                    <td>${manifiesto.municipio_origen}</td>
                    <td>${manifiesto.municipio_destino}</td>
                </tr>
            </table>
        </div>

        <!-- INFORMACIÓN DEL VEHÍCULO Y CONDUCTORES -->
        <div class="section-title">INFORMACIÓN DEL VEHÍCULO Y CONDUCTORES</div>
        <table class="info-table">
            <tr>
                <td class="label">TITULAR MANIFIESTO</td>
                <td class="value">${manifiesto.titular_manifiesto_nombre || 'FABRICIANO QUINTERO MUÑOZ'}</td>
                <td class="label">DOCUMENTO IDENTIFICACIÓN</td>
                <td class="value">${manifiesto.titular_manifiesto_documento || '4133687'}</td>
                <td class="label">ORIGEN</td>
                <td class="value">${manifiesto.municipio_origen}</td>
                <td class="label">TELÉFONOS</td>
                <td class="value">0</td>
                <td class="label">CIUDAD</td>
                <td class="value">${manifiesto.municipio_origen}</td>
            </tr>
            <tr>
                <td class="label">PLACA</td>
                <td class="value">${manifiesto.placa}</td>
                <td class="label">MARCA</td>
                <td class="value">${manifiesto.vehiculo_marca || 'CHEVROLET'}</td>
                <td class="label">CONFIGURACIÓN</td>
                <td class="value">${manifiesto.vehiculo_configuracion || '2'}</td>
                <td class="label">PESO VACÍO</td>
                <td class="value">${manifiesto.vehiculo_peso_vacio || '3000'}</td>
                <td class="label">PESO CARGADO</td>
                <td class="value">${manifiesto.vehiculo_peso_cargado || '0'}</td>
                <td class="label">CÓDIGO SEGURIDAD SOAT</td>
                <td class="value">${manifiesto.vehiculo_codigo_seguridad || '860002400 LA PREVISORA S.A COMPAÑÍA'}</td>
                <td class="label">No PÓLIZA</td>
                <td class="value">${manifiesto.vehiculo_poliza || '438006646'}</td>
                <td class="label">F. vencimiento SOAT</td>
                <td class="value">${manifiesto.vehiculo_vencimiento_soat ? format(new Date(manifiesto.vehiculo_vencimiento_soat), "yyyy/MM/dd", { locale: es }) : '2026/02/18'}</td>
            </tr>
            <tr>
                <td class="label">CONDUCTOR</td>
                <td class="value">${manifiesto.conductor_nombre_completo || 'JAROL ANDRÉS DURÁN SALDAÑA'}</td>
                <td class="label">DOCUMENTO IDENTIFICACIÓN</td>
                <td class="value">${manifiesto.conductor_id}</td>
                <td class="label">DIRECCIÓN CONDUCTOR 1</td>
                <td class="value">${manifiesto.conductor_direccion || 'DIAGONAL 18 #3-105 VILLA MARÍA ETAPA 3'}</td>
                <td class="label">TELÉFONOS</td>
                <td class="value">${manifiesto.conductor_telefono || '0.0'}</td>
                <td class="label">No de LICENCIA</td>
                <td class="value">${manifiesto.conductor_licencia_numero || 'C2-1073511288'}</td>
                <td class="label">CIUDAD CONDUCTOR</td>
                <td class="value">${manifiesto.conductor_ciudad || 'MOSQUERA'}</td>
            </tr>
            ${manifiesto.conductor2_nombre ? `
            <tr>
                <td class="label">CONDUCTOR No. 2</td>
                <td class="value">${manifiesto.conductor2_nombre}</td>
                <td class="label">DOCUMENTO IDENTIFICACIÓN</td>
                <td class="value">${manifiesto.conductor2_documento}</td>
                <td class="label">DIRECCIÓN CONDUCTOR 2</td>
                <td class="value">${manifiesto.conductor2_direccion}</td>
                <td class="label">TELÉFONOS</td>
                <td class="value">${manifiesto.conductor2_telefono}</td>
                <td class="label">No de LICENCIA</td>
                <td class="value">${manifiesto.conductor2_licencia}</td>
                <td class="label">CIUDAD CONDUCTOR 2</td>
                <td class="value">${manifiesto.conductor2_ciudad}</td>
            </tr>
            ` : ''}
            <tr>
                <td class="label">POSEEDOR O TENEDOR VEHÍCULO</td>
                <td class="value">${manifiesto.propietario_nombre || 'JAROL ANDRÉS DURÁN SALDAÑA'}</td>
                <td class="label">DOCUMENTO IDENTIFICACIÓN</td>
                <td class="value">${manifiesto.propietario_documento || '1073511288'}</td>
                <td class="label">DIRECCIÓN</td>
                <td class="value">${manifiesto.propietario_direccion || ''}</td>
                <td class="label">TELÉFONOS</td>
                <td class="value">${manifiesto.propietario_telefono || ''}</td>
                <td class="label">CIUDAD</td>
                <td class="value">${manifiesto.propietario_ciudad || ''}</td>
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
                <th>No existe póliza</th>
            </tr>
            <tr>
                <td>${manifiesto.consecutivo_remesa}</td>
                <td>${manifiesto.mercancia_unidad_medida || 'Kilogramos'}</td>
                <td>${manifiesto.mercancia_cantidad || '7,000.00'}</td>
                <td>${manifiesto.mercancia_naturaleza || 'Carga Normal'}</td>
                <td>${manifiesto.mercancia_empaque || 'Paquetes'}</td>
                <td>${manifiesto.mercancia_producto_transportado || 'ALIMENTOPARAAVESECTORRIAL'}</td>
                <td>${manifiesto.mercancia_informacion_remitente || '860058314 AVÍCOLA LOS CAMBULOS S.A'}</td>
                <td>${manifiesto.mercancia_informacion_destinatario || '860058314 AVÍCOLA LOS CAMBULOS S.A'}</td>
                <td>${manifiesto.mercancia_dueno_poliza || ''}</td>
                <td>${manifiesto.mercancia_numero_poliza || ''}</td>
            </tr>
            <tr>
                <td colspan="2">Remesa No:${manifiesto.consecutivo_remesa}</td>
                <td colspan="2">${manifiesto.mercancia_producto_transportado || 'ALIMENTOPARAAVESECTORRIAL'}</td>
                <td colspan="3">${manifiesto.mercancia_lugar_cargue || 'FUNZA CUNDINAMARCA'}</td>
                <td colspan="3">${manifiesto.mercancia_lugar_descargue || 'GUADUAS CUNDINAMARCA'}</td>
            </tr>
        </table>

        <!-- VALORES -->
        <div style="display: table; width: 100%;">
            <div style="display: table-cell; width: 70%; vertical-align: top;">
                <div class="section-title">VALORES</div>
                <table class="values-table">
                    <tr>
                        <td class="label">VALOR TOTAL DEL VIAJE</td>
                        <td class="value">${(manifiesto.valor_total_viaje || manifiesto.valor_flete || 758624).toLocaleString()}.00</td>
                    </tr>
                    <tr>
                        <td class="label">RETENCIÓN EN LA FUENTE</td>
                        <td class="value">${(manifiesto.retencion_fuente || 7567).toLocaleString()}.00</td>
                    </tr>
                    <tr>
                        <td class="label">RETENCIÓN ICA</td>
                        <td class="value">${(manifiesto.retencion_ica || 0).toLocaleString()}.00</td>
                    </tr>
                    <tr>
                        <td class="label">VALOR NETO A PAGAR</td>
                        <td class="value">${(manifiesto.valor_neto_pagar || 758027).toLocaleString()}.00</td>
                    </tr>
                    <tr>
                        <td class="label">VALOR ANTICIPO</td>
                        <td class="value">${(manifiesto.valor_anticipo || 0).toLocaleString()}.00</td>
                    </tr>
                    <tr>
                        <td class="label">SALDO A PAGAR</td>
                        <td class="value">${(manifiesto.saldo_pagar || 758027).toLocaleString()}.00</td>
                    </tr>
                </table>
                <div style="font-size: 7px; margin-top: 5px;">
                    <strong>VALOR TOTAL DEL VIAJE EN LETRAS:</strong> ${manifiesto.valor_total_letras || 'SETECIENTOS CINCUENTA Y OCHO MIL SEISCIENTOS VEINTISIETE PESOS'}
                </div>
            </div>
            <div style="display: table-cell; width: 30%; vertical-align: top; padding-left: 10px;">
                <div class="section-title">OBSERVACIONES</div>
                <table class="values-table">
                    <tr>
                        <td class="label">LUGAR DE PAGO</td>
                        <td class="value">${manifiesto.lugar_pago || 'BOGOTA BOGOTA D.C.'}</td>
                    </tr>
                    <tr>
                        <td class="label">FECHA</td>
                        <td class="value">${manifiesto.fecha_pago ? format(new Date(manifiesto.fecha_pago), "yyyy/MM/dd", { locale: es }) : '2025/08/28'}</td>
                    </tr>
                </table>
                <div style="margin-top: 10px; border: 1px solid #000; padding: 5px;">
                    <div style="text-align: center; font-weight: bold; font-size: 8px;">CARGUE PAGADO POR</div>
                    <div style="text-align: center; padding: 5px;">${manifiesto.cargue_pagado_por || 'DESTINATARIO'}</div>
                </div>
                <div style="margin-top: 5px; border: 1px solid #000; padding: 5px;">
                    <div style="text-align: center; font-weight: bold; font-size: 8px;">DESCARGUE PAGADO POR</div>
                    <div style="text-align: center; padding: 5px;">${manifiesto.descargue_pagado_por || 'DESTINATARIO'}</div>
                </div>
            </div>
        </div>

        <!-- PIE DE PÁGINA -->
        <div class="footer-text">
            Esta validez de este documento podrá ser consultada en el Registro Nacional de Despachos de Carga <strong>Firma y Huella del TITULAR MANIFIESTO o ACEPTACIÓN DIGITAL</strong> | <strong>Firma y Huella del CONDUCTOR o ACEPTACIÓN DIGITAL</strong><br>
            Carga RNDC descargada a la Superintendencia de Puertos y Transporte, en los términos señalados en el Código, artículo 1013, numeral 3 del código de comercio electrónico: sirecordnotfound@mintransporte.gov.co
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