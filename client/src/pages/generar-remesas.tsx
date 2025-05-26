import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Upload, Download, Play, Eye, FileText, AlertTriangle, CheckCircle } from "lucide-react";

import FileUpload from "@/components/upload/file-upload";
import XMLPreview from "@/components/xml/xml-preview";
import ProcessingStatus from "@/components/processing/processing-status";
import { useExcelUpload } from "@/hooks/use-excel-upload";
import { apiRequest } from "@/lib/queryClient";

export default function GenerarRemesas() {
  const [activeTab, setActiveTab] = useState("preview");
  const [selectedRecord, setSelectedRecord] = useState(0);
  const [processingMode, setProcessingMode] = useState("preview");
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [processingResult, setProcessingResult] = useState<any>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: config } = useQuery({
    queryKey: ["/api/configuracion"]
  });

  const { data: nextConsecutivo } = useQuery({
    queryKey: ["/api/consecutivos/remesa"]
  });

  const {
    uploadFile,
    isUploading,
    uploadError
  } = useExcelUpload({
    onSuccess: (result) => {
      setUploadResult(result);
      toast({
        title: "Archivo cargado exitosamente",
        description: `${result.totalRows} registros encontrados, ${result.validRows} válidos`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error al cargar archivo",
        description: error,
        variant: "destructive"
      });
    }
  });

  const processRemesasMutation = useMutation({
    mutationFn: async (data: { data: any[], mode: string }) => {
      const response = await apiRequest("POST", "/api/remesas/process", data);
      return response.json();
    },
    onSuccess: (result) => {
      setProcessingResult(result);
      setActiveTab("results");
      queryClient.invalidateQueries({ queryKey: ["/api/remesas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/logs"] });
      
      toast({
        title: "Procesamiento completado",
        description: `${result.successCount} remesas exitosas, ${result.errorCount} errores`,
      });
    },
    onError: () => {
      toast({
        title: "Error en procesamiento",
        description: "Ocurrió un error durante el procesamiento por lotes",
        variant: "destructive"
      });
    }
  });

  const handleStartProcessing = () => {
    if (!uploadResult?.data) {
      toast({
        title: "No hay datos para procesar",
        description: "Primero debe cargar un archivo Excel válido",
        variant: "destructive"
      });
      return;
    }

    // Filter only valid rows
    const validData = uploadResult.data.filter((_: any, index: number) => {
      const result = uploadResult.validation.results[index];
      return result?.success;
    });

    if (validData.length === 0) {
      toast({
        title: "No hay registros válidos",
        description: "Corrija los errores en el archivo antes de procesar",
        variant: "destructive"
      });
      return;
    }

    processRemesasMutation.mutate({
      data: validData,
      mode: processingMode
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
          <span>Operaciones por Lotes</span>
          <span className="text-gray-400">›</span>
          <span className="text-gray-900 font-medium">Generar Remesas</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">Generación de Remesas por Lotes</h1>
        <p className="text-gray-600 mt-1">Procese archivos Excel para generar múltiples remesas automáticamente</p>
      </div>

      {/* Upload and Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* File Upload */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Cargar Archivo Excel</CardTitle>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Descargar Plantilla
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <FileUpload
                onFileSelect={uploadFile}
                isUploading={isUploading}
                error={uploadError}
                accept=".xlsx,.xls,.csv"
                maxSize={10 * 1024 * 1024} // 10MB
                description="Formatos soportados: .xlsx, .xls, .csv (máx. 10MB)"
              />
              
              {uploadResult && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="text-emerald-600 text-lg" />
                      <div>
                        <p className="font-medium text-gray-900">{uploadResult.filename}</p>
                        <p className="text-sm text-gray-500">
                          {uploadResult.totalRows} registros • {uploadResult.validRows} válidos • {uploadResult.invalidRows} con errores
                        </p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      ×
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Configuración</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Próximo Consecutivo
              </label>
              <div className="flex items-center space-x-2">
                <div className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600">
                  {nextConsecutivo?.consecutivo || "Loading..."}
                </div>
                <Button variant="outline" size="sm">
                  ↻
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Usuario RNDC
              </label>
              <div className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600">
                {config?.usuario || "No configurado"}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modo de Procesamiento
              </label>
              <Select value={processingMode} onValueChange={setProcessingMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preview">Vista Previa + Envío</SelectItem>
                  <SelectItem value="direct">Envío Directo</SelectItem>
                  <SelectItem value="preview_only">Solo Vista Previa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              className="w-full" 
              onClick={handleStartProcessing}
              disabled={!uploadResult?.data || processRemesasMutation.isPending}
            >
              <Play className="h-4 w-4 mr-2" />
              {processRemesasMutation.isPending ? "Procesando..." : "Iniciar Procesamiento"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Processing Tabs */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start border-b border-gray-200 bg-transparent">
            <TabsTrigger value="preview" className="data-[state=active]:bg-primary-50 data-[state=active]:text-primary-600">
              <Eye className="h-4 w-4 mr-2" />
              Vista Previa de Datos
            </TabsTrigger>
            <TabsTrigger value="xml" className="data-[state=active]:bg-primary-50 data-[state=active]:text-primary-600">
              <FileText className="h-4 w-4 mr-2" />
              XML Generado
            </TabsTrigger>
            <TabsTrigger value="results" className="data-[state=active]:bg-primary-50 data-[state=active]:text-primary-600">
              <CheckCircle className="h-4 w-4 mr-2" />
              Resultados
            </TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-primary-50 data-[state=active]:text-primary-600">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Logs de Procesamiento
            </TabsTrigger>
          </TabsList>

          {/* Data Preview Tab */}
          <TabsContent value="preview" className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Vista Previa de Datos del Excel</h3>
              {uploadResult && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">{uploadResult.totalRows} registros encontrados</span>
                  <Button variant="outline" size="sm">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Validar Mapeo
                  </Button>
                </div>
              )}
            </div>

            {uploadResult?.data ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        GRANJA
                        <div className="text-primary-600 text-xs normal-case mt-1">→ CODSEDEREMITENTE</div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        PLANTA
                        <div className="text-primary-600 text-xs normal-case mt-1">→ CODSEDEDESTINATARIO</div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        PLACA
                        <div className="text-primary-600 text-xs normal-case mt-1">→ CANTIDADCARGADA</div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        FECHA_CITA
                        <div className="text-primary-600 text-xs normal-case mt-1">→ FECHACITAPACTADA</div>
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        IDENTIFICACIÓN
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        TONELADAS
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {uploadResult.data.slice(0, 10).map((row: any, index: number) => {
                      const validation = uploadResult.validation?.results?.[index];
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {row.GRANJA}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {row.PLANTA}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {row.PLACA}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {row.FECHA_CITA}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {row.IDENTIFICACION}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {row.TONELADAS}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge 
                              variant={validation?.success ? "default" : "destructive"}
                              className={validation?.success ? "bg-emerald-100 text-emerald-800" : ""}
                            >
                              {validation?.success ? (
                                <>
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Válido
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Error
                                </>
                              )}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Upload className="mx-auto h-12 w-12 mb-4" />
                <p className="text-lg font-medium mb-2">No hay datos para mostrar</p>
                <p>Cargue un archivo Excel para ver la vista previa</p>
              </div>
            )}
          </TabsContent>

          {/* XML Preview Tab */}
          <TabsContent value="xml" className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">XML Generado para Remesas</h3>
              {uploadResult?.data && (
                <div className="flex items-center space-x-2">
                  <Select 
                    value={selectedRecord.toString()} 
                    onValueChange={(value) => setSelectedRecord(parseInt(value))}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {uploadResult.data.slice(0, 5).map((row: any, index: number) => (
                        <SelectItem key={index} value={index.toString()}>
                          Registro {index + 1} - {row.GRANJA}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    Copiar
                  </Button>
                  <Button variant="outline" size="sm">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Validar
                  </Button>
                </div>
              )}
            </div>

            {uploadResult?.data?.[selectedRecord] ? (
              <XMLPreview 
                data={uploadResult.data[selectedRecord]} 
                type="remesa"
                config={config}
              />
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FileText className="mx-auto h-12 w-12 mb-4" />
                <p className="text-lg font-medium mb-2">No hay XML para mostrar</p>
                <p>Cargue un archivo Excel para generar la vista previa XML</p>
              </div>
            )}
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="p-6">
            {processingResult ? (
              <ProcessingStatus 
                result={processingResult}
                type="remesas"
              />
            ) : (
              <div className="text-center py-12 text-gray-500">
                <CheckCircle className="mx-auto h-12 w-12 mb-4" />
                <p className="text-lg font-medium mb-2">No hay resultados</p>
                <p>Ejecute el procesamiento para ver los resultados</p>
              </div>
            )}
          </TabsContent>

          {/* Logs Tab */}
          <TabsContent value="logs" className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Logs de Procesamiento</h3>
              <div className="flex items-center space-x-2">
                <Select defaultValue="all">
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los niveles</SelectItem>
                    <SelectItem value="error">Solo errores</SelectItem>
                    <SelectItem value="info">Info y advertencias</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-1" />
                  Exportar
                </Button>
              </div>
            </div>

            <div className="bg-gray-900 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
              <div className="space-y-1 text-gray-300">
                {processingResult?.results?.map((result: any, index: number) => (
                  <div key={index} className="flex">
                    <span className="text-gray-500">{new Date().toLocaleTimeString()}</span>
                    <span className={`mx-2 ${
                      result.success ? "text-green-400" : "text-red-400"
                    }`}>
                      [{result.success ? "SUCCESS" : "ERROR"}]
                    </span>
                    <span>
                      {result.success 
                        ? `Remesa ${result.consecutivo} generada exitosamente`
                        : `Error: ${result.error}`
                      }
                    </span>
                  </div>
                ))}
                
                {!processingResult && (
                  <div className="text-center py-12 text-gray-500">
                    <p>No hay logs disponibles</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
