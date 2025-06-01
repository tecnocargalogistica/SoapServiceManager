import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Printer, 
  Eye, 
  Download, 
  Search, 
  FileText,
  Calendar,
  MapPin,
  Truck,
  User,
  Archive,
  CheckCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import ManifiestoCargaTailwind from "@/components/ManifiestoCargaTailwind";
import ManifiestoPDFHorizontal from "@/components/ManifiestoPDFHorizontal";
import JSZip from "jszip";

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
  const [selectedManifiestos, setSelectedManifiestos] = useState<Set<string>>(new Set());
  const [filterToday, setFilterToday] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const { toast } = useToast();

  // Obtener todos los manifiestos
  const { data: manifiestos, isLoading } = useQuery({
    queryKey: ["/api/manifiestos"],
  });

  // Función para verificar si una fecha es hoy
  const isToday = (dateString: string | Date) => {
    const date = new Date(dateString);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Filtrar manifiestos según el término de búsqueda y filtro de fecha
  const filteredManifiestos = (manifiestos || []).filter((m: Manifiesto) => {
    const matchesSearch = m.numero_manifiesto.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.conductor_id.includes(searchTerm);
    
    const matchesDate = !filterToday || isToday(m.fecha_expedicion);
    
    return matchesSearch && matchesDate;
  });

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

  // Manejar selección de manifiestos
  const handleManifiestoSelection = (numeroManifiesto: string, checked: boolean) => {
    const newSelection = new Set(selectedManifiestos);
    if (checked) {
      newSelection.add(numeroManifiesto);
    } else {
      newSelection.delete(numeroManifiesto);
    }
    setSelectedManifiestos(newSelection);
  };

  // Seleccionar todos los manifiestos filtrados
  const handleSelectAll = () => {
    const allNumbers = new Set(filteredManifiestos.map((m: Manifiesto) => m.numero_manifiesto));
    setSelectedManifiestos(allNumbers);
  };

  // Deseleccionar todos
  const handleDeselectAll = () => {
    setSelectedManifiestos(new Set());
  };

  // Función auxiliar para generar PDF de 2 páginas con la placa del vehículo
  const generateManifiestoPDF = async (numeroManifiesto: string): Promise<{ blob: Blob, placa: string }> => {
    try {
      // Obtener datos completos del manifiesto
      const response = await fetch(`/api/manifiestos/datos-completos/${numeroManifiesto}`);
      const datosCompletos = await response.json();
      
      // Importar la clase ManifiestoPDFHorizontalGenerator
      const ManifiestoPDFHorizontalModule = await import('@/components/ManifiestoPDFHorizontal');
      
      // Crear una instancia del generador con los datos completos
      const generator = new (ManifiestoPDFHorizontalModule as any).ManifiestoPDFHorizontalGenerator(datosCompletos);
      
      // Generar el PDF de 2 páginas
      const blob = await generator.getBlob();
      
      return {
        blob: blob,
        placa: datosCompletos.manifiesto.placa || numeroManifiesto
      };
    } catch (error) {
      console.error(`Error generando PDF para manifiesto ${numeroManifiesto}:`, error);
      throw error;
    }
  };

  // Descargar múltiples manifiestos como ZIP
  const handleDownloadZip = async () => {
    if (selectedManifiestos.size === 0) {
      toast({
        title: "Sin selección",
        description: "Selecciona al menos un manifiesto para descargar",
        variant: "destructive"
      });
      return;
    }

    setIsDownloadingZip(true);

    try {
      const zip = new JSZip();
      const selectedManifiestosArray = filteredManifiestos.filter((m: Manifiesto) => 
        selectedManifiestos.has(m.numero_manifiesto)
      );

      console.log(`🚀 Iniciando generación de ${selectedManifiestosArray.length} PDFs...`);
      
      // PASO 1: Generar todos los PDFs y almacenarlos en memoria
      const pdfCache: { [key: string]: { blob: Blob, placa: string } } = {};
      let generatedCount = 0;
      
      for (const manifiesto of selectedManifiestosArray) {
        try {
          console.log(`📄 Generando PDF ${generatedCount + 1}/${selectedManifiestosArray.length}: ${manifiesto.numero_manifiesto}`);
          
          if (!manifiesto || !manifiesto.numero_manifiesto) {
            console.error('Manifiesto inválido:', manifiesto);
            continue;
          }
          
          // Obtener datos completos del manifiesto
          const response = await fetch(`/api/manifiestos/datos-completos/${manifiesto.numero_manifiesto}`);
          if (!response.ok) {
            console.error(`No se pudieron obtener datos para manifiesto ${manifiesto.numero_manifiesto}`);
            continue;
          }
          const datosCompletos = await response.json();
          
          // Generar PDF horizontal de 2 páginas (igual que el botón individual)
          const generator = new ManifiestoPDFHorizontalGenerator(datosCompletos.manifiesto);
          await generator.generate();
          const blob = await generator.getBlob();
          
          const placa = datosCompletos.manifiesto.placa || manifiesto.numero_manifiesto;
          
          // Almacenar en cache temporal
          pdfCache[manifiesto.numero_manifiesto] = { blob, placa };
          generatedCount++;
          
          console.log(`✅ PDF generado: ${placa}.pdf`);
          
        } catch (error) {
          console.error(`❌ Error generando PDF para manifiesto ${manifiesto?.numero_manifiesto || 'desconocido'}:`, error);
          // Continuar con los demás manifiestos
        }
      }
      
      console.log(`📦 Total PDFs generados: ${generatedCount}/${selectedManifiestosArray.length}`);
      
      if (generatedCount === 0) {
        throw new Error('No se pudo generar ningún PDF');
      }
      
      // PASO 2: Agregar todos los PDFs generados al ZIP
      console.log('🗜️ Creando archivo ZIP...');
      for (const [numeroManifiesto, pdfData] of Object.entries(pdfCache)) {
        zip.file(`${pdfData.placa}.pdf`, pdfData.blob);
        console.log(`📁 Agregado al ZIP: ${pdfData.placa}.pdf`);
      }

      // Generar el archivo ZIP
      const zipBlob = await zip.generateAsync({ type: "blob" });
      
      // Descargar el ZIP
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      const today = format(new Date(), 'yyyy-MM-dd');
      a.download = `manifiestos_${today}_${selectedManifiestos.size}_PDFs.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Descarga exitosa",
        description: `${generatedCount} manifiestos PDF descargados en ZIP`,
      });

      // Limpiar selección
      setSelectedManifiestos(new Set());
    } catch (error) {
      toast({
        title: "Error en descarga",
        description: "Error al generar el archivo ZIP con PDFs",
        variant: "destructive"
      });
    } finally {
      setIsDownloadingZip(false);
    }
  };

  const generateManifiestoPrintHTML = (manifiesto: Manifiesto) => {
    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Manifiesto Electrónico de Carga ${manifiesto.numero_manifiesto}</title>
        <style>
            /* CSS styles for printing */
            body { font-family: Arial, sans-serif; margin: 0; padding: 10px; }
            .header { text-align: center; margin-bottom: 20px; }
            .title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
            .content { margin-bottom: 20px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="title">MANIFIESTO ELECTRÓNICO DE CARGA</div>
            <div>No. ${manifiesto.numero_manifiesto}</div>
        </div>
        
        <div class="content">
            <div class="row">
                <span><strong>Fecha:</strong> ${format(new Date(manifiesto.fecha_expedicion), "dd/MM/yyyy")}</span>
                <span><strong>Estado:</strong> ${manifiesto.estado}</span>
            </div>
            <div class="row">
                <span><strong>Placa:</strong> ${manifiesto.placa}</span>
                <span><strong>Conductor:</strong> ${manifiesto.conductor_id}</span>
            </div>
            <div class="row">
                <span><strong>Origen:</strong> ${manifiesto.municipio_origen}</span>
                <span><strong>Destino:</strong> ${manifiesto.municipio_destino}</span>
            </div>
            <div class="row">
                <span><strong>Valor Flete:</strong> $${Number(manifiesto.valor_flete).toLocaleString()}</span>
                ${manifiesto.ingreso_id ? `<span><strong>ID RNDC:</strong> ${manifiesto.ingreso_id}</span>` : ''}
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

        {/* Búsqueda y Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Buscar Manifiestos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Input
                placeholder="Buscar por número de manifiesto, placa o conductor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Button 
                variant={filterToday ? "default" : "outline"}
                onClick={() => setFilterToday(!filterToday)}
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                HOY
                {filterToday && <CheckCircle className="h-4 w-4" />}
              </Button>
            </div>
            
            {/* Controles de selección múltiple */}
            {filteredManifiestos.length > 0 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground">
                    {selectedManifiestos.size} de {filteredManifiestos.length} seleccionados
                  </span>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={handleSelectAll}
                      disabled={selectedManifiestos.size === filteredManifiestos.length}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Seleccionar Todos
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={handleDeselectAll}
                      disabled={selectedManifiestos.size === 0}
                    >
                      Deseleccionar Todos
                    </Button>
                  </div>
                </div>
                
                {selectedManifiestos.size > 0 && (
                  <Button 
                    onClick={handleDownloadZip}
                    disabled={isDownloadingZip}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Archive className="h-4 w-4 mr-2" />
                    {isDownloadingZip ? 'Generando ZIP...' : `Descargar ${selectedManifiestos.size} en ZIP`}
                  </Button>
                )}
              </div>
            )}
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
              <div className="text-center py-8 text-muted-foreground">
                Cargando manifiestos...
              </div>
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
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedManifiestos.has(manifiesto.numero_manifiesto)}
                        onCheckedChange={(checked) => 
                          handleManifiestoSelection(manifiesto.numero_manifiesto, checked as boolean)
                        }
                        className="mt-1"
                      />
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
                      <ManifiestoPDFHorizontal manifiesto={manifiesto} />
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