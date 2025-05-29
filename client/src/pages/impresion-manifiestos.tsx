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
        <title>Manifiesto de Carga ${manifiesto.numero_manifiesto}</title>
        <style>
            @page { margin: 2cm; size: A4; }
            body { 
                font-family: Arial, sans-serif; 
                font-size: 12px; 
                line-height: 1.4;
                color: #333;
            }
            .header { 
                text-align: center; 
                border-bottom: 2px solid #333; 
                padding-bottom: 20px; 
                margin-bottom: 20px;
            }
            .header h1 { 
                margin: 0; 
                font-size: 24px; 
                font-weight: bold;
                color: #2563eb;
            }
            .header h2 { 
                margin: 5px 0; 
                font-size: 18px; 
                color: #666;
            }
            .info-grid { 
                display: grid; 
                grid-template-columns: 1fr 1fr; 
                gap: 20px; 
                margin-bottom: 20px;
            }
            .info-section {
                border: 1px solid #ddd;
                padding: 15px;
                border-radius: 5px;
            }
            .info-section h3 {
                margin: 0 0 10px 0;
                font-size: 14px;
                font-weight: bold;
                color: #2563eb;
                border-bottom: 1px solid #eee;
                padding-bottom: 5px;
            }
            .info-row {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
            }
            .info-label {
                font-weight: bold;
                color: #555;
            }
            .info-value {
                color: #333;
            }
            .qr-section {
                text-align: center;
                margin: 20px 0;
                padding: 15px;
                border: 1px solid #ddd;
                border-radius: 5px;
            }
            .footer {
                position: fixed;
                bottom: 1cm;
                left: 0;
                right: 0;
                text-align: center;
                font-size: 10px;
                color: #666;
                border-top: 1px solid #eee;
                padding-top: 10px;
            }
            .status-badge {
                display: inline-block;
                padding: 4px 8px;
                border-radius: 3px;
                font-size: 10px;
                font-weight: bold;
                background: #10b981;
                color: white;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>MANIFIESTO DE CARGA</h1>
            <h2>Sistema RNDC - Colombia</h2>
            <p><strong>Número:</strong> ${manifiesto.numero_manifiesto}</p>
            <span class="status-badge">${manifiesto.estado.toUpperCase()}</span>
        </div>

        <div class="info-grid">
            <div class="info-section">
                <h3>📋 Información del Manifiesto</h3>
                <div class="info-row">
                    <span class="info-label">Número Manifiesto:</span>
                    <span class="info-value">${manifiesto.numero_manifiesto}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Remesa Asociada:</span>
                    <span class="info-value">${manifiesto.consecutivo_remesa}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Fecha Expedición:</span>
                    <span class="info-value">${format(new Date(manifiesto.fecha_expedicion), "dd/MM/yyyy", { locale: es })}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Valor Flete:</span>
                    <span class="info-value">$${manifiesto.valor_flete.toLocaleString()}</span>
                </div>
            </div>

            <div class="info-section">
                <h3>🚛 Información del Vehículo</h3>
                <div class="info-row">
                    <span class="info-label">Placa:</span>
                    <span class="info-value">${manifiesto.placa}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Conductor:</span>
                    <span class="info-value">${manifiesto.conductor_id}</span>
                </div>
            </div>
        </div>

        <div class="info-grid">
            <div class="info-section">
                <h3>📍 Origen</h3>
                <div class="info-row">
                    <span class="info-label">Municipio:</span>
                    <span class="info-value">${manifiesto.municipio_origen}</span>
                </div>
            </div>

            <div class="info-section">
                <h3>📍 Destino</h3>
                <div class="info-row">
                    <span class="info-label">Municipio:</span>
                    <span class="info-value">${manifiesto.municipio_destino}</span>
                </div>
            </div>
        </div>

        ${manifiesto.ingreso_id ? `
        <div class="info-section">
            <h3>🏛️ Información RNDC</h3>
            <div class="info-row">
                <span class="info-label">ID Ingreso RNDC:</span>
                <span class="info-value">${manifiesto.ingreso_id}</span>
            </div>
            ${manifiesto.codigo_seguridad_qr ? `
            <div class="info-row">
                <span class="info-label">Código QR:</span>
                <span class="info-value">${manifiesto.codigo_seguridad_qr}</span>
            </div>
            ` : ''}
        </div>
        ` : ''}

        <div class="qr-section">
            <h3>📱 Código QR</h3>
            <p>Código de Seguridad: ${manifiesto.codigo_seguridad_qr || 'N/A'}</p>
            <p><em>Escanee este código para verificar la autenticidad del documento</em></p>
        </div>

        <div class="footer">
            <p>Documento generado el ${format(new Date(), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}</p>
            <p>Sistema RNDC - Registro Nacional de Carga</p>
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