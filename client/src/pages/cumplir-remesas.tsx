import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Upload, Play, Pause, FileText, Clock, CheckCircle, AlertTriangle } from "lucide-react";

import FileUpload from "@/components/upload/file-upload";
import XMLPreview from "@/components/xml/xml-preview";
import ProcessingStatus from "@/components/processing/processing-status";
import { useExcelUpload } from "@/hooks/use-excel-upload";
import { apiRequest } from "@/lib/queryClient";

export default function CumplirRemesas() {
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [processingResult, setProcessingResult] = useState<any>(null);
  const [cumplimientoConfig, setCumplimientoConfig] = useState({
    tipo: "total",
    fecha: new Date().toISOString().split('T')[0],
    observaciones: ""
  });
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: config } = useQuery({
    queryKey: ["/api/configuracion"]
  });

  const { data: remesas } = useQuery({
    queryKey: ["/api/remesas"]
  });

  const {
    uploadFile,
    isUploading,
    uploadError
  } = useExcelUpload({
    onSuccess: (result) => {
      setUploadResult(result);
      toast({
        title: "Archivo de cumplimiento cargado",
        description: `${result.totalRows} remesas para cumplir`,
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

  const cumplirRemesasMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('config', JSON.stringify(cumplimientoConfig));
      
      const response = await fetch('/api/remesas/cumplir', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Error en el cumplimiento');
      }
      
      return response.json();
    },
    onSuccess: (result) => {
      setProcessingResult(result);
      setIsProcessing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/remesas"] });
      queryClient.invalidateQueries({ queryKey: ["/api/logs"] });
      
      toast({
        title: "Cumplimiento completado",
        description: `${result.successCount} remesas cumplidas exitosamente`,
      });
    },
    onError: () => {
      setIsProcessing(false);
      toast({
        title: "Error en cumplimiento",
        description: "Ocurrió un error durante el cumplimiento de remesas",
        variant: "destructive"
      });
    }
  });

  const handleStartCumplimiento = () => {
    if (!uploadResult?.file) {
      toast({
        title: "No hay archivo para procesar",
        description: "Primero debe cargar un archivo Excel válido",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    cumplirRemesasMutation.mutate(uploadResult.file);
  };

  const handlePauseCumplimiento = () => {
    setIsProcessing(false);
    toast({
      title: "Procesamiento pausado",
      description: "El cumplimiento ha sido pausado",
    });
  };

  // Calculate stats
  const remesasPendientes = remesas?.filter((r: any) => r.estado === "enviada")?.length || 0;
  const remesasCumplidas = remesas?.filter((r: any) => r.estado === "cumplida")?.length || 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-2">
          <span>Operaciones por Lotes</span>
          <span className="text-gray-400">›</span>
          <span className="text-gray-900 font-medium">Cumplir Remesas</span>
        </nav>
        <h1 className="text-2xl font-bold text-gray-900">Cumplimiento de Remesas por Lotes</h1>
        <p className="text-gray-600 mt-1">Procese el cumplimiento de múltiples remesas desde un archivo Excel</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Remesas Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">{remesasPendientes}</p>
              </div>
              <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
                <Clock className="text-amber-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cumplidas</p>
                <p className="text-2xl font-bold text-gray-900">{remesasCumplidas}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-emerald-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En Procesamiento</p>
                <p className="text-2xl font-bold text-gray-900">{processingResult?.totalProcessed || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <FileText className="text-blue-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Errores</p>
                <p className="text-2xl font-bold text-gray-900">{processingResult?.errorCount || 0}</p>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                <AlertTriangle className="text-red-600 text-xl" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload and Configuration */}
        <div className="space-y-6">
          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Archivo de Cumplimiento</CardTitle>
            </CardHeader>
            <CardContent>
              <FileUpload
                onFileSelect={(file) => {
                  uploadFile(file);
                  setUploadResult({ ...uploadResult, file });
                }}
                isUploading={isUploading}
                error={uploadError}
                accept=".xlsx,.xls,.csv"
                maxSize={10 * 1024 * 1024}
                description="Excel con consecutivos de remesas a cumplir"
              />
            </CardContent>
          </Card>

          {/* Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Cumplimiento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Cumplimiento
                </label>
                <Select 
                  value={cumplimientoConfig.tipo} 
                  onValueChange={(value) => setCumplimientoConfig(prev => ({ ...prev, tipo: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="total">Cumplimiento Total</SelectItem>
                    <SelectItem value="parcial">Cumplimiento Parcial</SelectItem>
                    <SelectItem value="cancelacion">Cancelación</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Cumplimiento
                </label>
                <input 
                  type="date" 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  value={cumplimientoConfig.fecha}
                  onChange={(e) => setCumplimientoConfig(prev => ({ ...prev, fecha: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Observaciones
                </label>
                <Textarea 
                  rows={3}
                  placeholder="Observaciones adicionales..."
                  value={cumplimientoConfig.observaciones}
                  onChange={(e) => setCumplimientoConfig(prev => ({ ...prev, observaciones: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Status and Preview */}
        <div className="space-y-6">
          {/* Processing Status */}
          <Card>
            <CardHeader>
              <CardTitle>Estado del Procesamiento</CardTitle>
            </CardHeader>
            <CardContent>
              {processingResult ? (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-800">Total de remesas:</span>
                    <span className="font-medium text-blue-900">{processingResult.totalProcessed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-800">Procesadas:</span>
                    <span className="font-medium text-emerald-600">{processingResult.successCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-800">Pendientes:</span>
                    <span className="font-medium text-amber-600">
                      {processingResult.totalProcessed - processingResult.successCount - processingResult.errorCount}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-blue-800">Errores:</span>
                    <span className="font-medium text-red-600">{processingResult.errorCount}</span>
                  </div>

                  <div className="mt-4">
                    <div className="w-full bg-blue-100 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ 
                          width: `${(processingResult.successCount / processingResult.totalProcessed) * 100}%` 
                        }}
                      />
                    </div>
                    <p className="text-sm text-blue-700 mt-2">
                      {Math.round((processingResult.successCount / processingResult.totalProcessed) * 100)}% completado
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Clock className="mx-auto h-8 w-8 mb-2" />
                  <p>No hay procesamiento en curso</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* XML Preview */}
          <Card>
            <CardHeader>
              <CardTitle>Vista Previa XML</CardTitle>
            </CardHeader>
            <CardContent>
              {config ? (
                <XMLPreview 
                  data={{
                    consecutivoRemesa: "20250419",
                    fechaCumplimiento: cumplimientoConfig.fecha
                  }}
                  type="cumplimiento"
                  config={config}
                />
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <FileText className="mx-auto h-8 w-8 mb-2" />
                  <p>Configuración no disponible</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <Button 
          onClick={handleStartCumplimiento}
          disabled={!uploadResult?.file || isProcessing || cumplirRemesasMutation.isPending}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <Play className="h-4 w-4 mr-2" />
          {isProcessing ? "Procesando..." : "Iniciar Cumplimiento"}
        </Button>
        
        {isProcessing && (
          <Button 
            variant="outline"
            onClick={handlePauseCumplimiento}
          >
            <Pause className="h-4 w-4 mr-2" />
            Pausar
          </Button>
        )}
      </div>

      {/* Results */}
      {processingResult && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados del Cumplimiento</CardTitle>
          </CardHeader>
          <CardContent>
            <ProcessingStatus 
              result={processingResult}
              type="cumplimiento"
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
