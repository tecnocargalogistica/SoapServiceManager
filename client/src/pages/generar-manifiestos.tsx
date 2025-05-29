import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, FileText, Truck, Play, AlertTriangle, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface Remesa {
  id: number;
  consecutivo: string;
  placa: string;
  codigo_sede_remitente: string;
  codigo_sede_destinatario: string;
  cantidad_cargada: number;
  conductor_id: string;
  fecha_cita_cargue: string;
  fecha_cita_descargue: string;
  estado: string;
  granja?: string;
  planta?: string;
}

export default function GenerarManifiestos() {
  const [selectedRemesas, setSelectedRemesas] = useState<number[]>([]);
  const [processingResult, setProcessingResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("remesas");
  const { toast } = useToast();

  // Fetch remesas exitosas
  const { data: remesasExitosas, isLoading, error } = useQuery({
    queryKey: ['/api/remesas/exitosas'],
    queryFn: async () => {
      const response = await fetch('/api/remesas/exitosas');
      if (!response.ok) throw new Error('Error al cargar remesas exitosas');
      return response.json();
    }
  });

  const processManifiestosMutation = useMutation({
    mutationFn: async (remesaIds: number[]) => {
      const response = await apiRequest('POST', '/api/manifiestos/process', { remesaIds });
      return response.json();
    },
    onSuccess: (data) => {
      setProcessingResult(data);
      setActiveTab("results");
      toast({
        title: "Manifiestos procesados",
        description: `${data.successCount} manifiestos generados exitosamente`
      });
      queryClient.invalidateQueries({ queryKey: ['/api/manifiestos'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error al procesar manifiestos",
        description: error.message || "Error desconocido",
        variant: "destructive"
      });
    }
  });

  const handleSelectRemesa = (remesaId: number, checked: boolean) => {
    if (checked) {
      setSelectedRemesas(prev => [...prev, remesaId]);
    } else {
      setSelectedRemesas(prev => prev.filter(id => id !== remesaId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && remesasExitosas) {
      setSelectedRemesas(remesasExitosas.map((r: Remesa) => r.id));
    } else {
      setSelectedRemesas([]);
    }
  };

  const handleProcessManifiestos = () => {
    if (selectedRemesas.length === 0) {
      toast({
        title: "Error",
        description: "Selecciona al menos una remesa para generar manifiestos",
        variant: "destructive"
      });
      return;
    }

    processManifiestosMutation.mutate(selectedRemesas);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-gray-600">Cargando remesas exitosas...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Error al cargar las remesas exitosas. Intenta recargar la página.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Generar Manifiestos de Carga</h1>
        <p className="text-gray-600">
          Selecciona las remesas exitosas para generar sus manifiestos correspondientes
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-white h-4 w-4" />
              </div>
              <div className="ml-3">
                <p className="text-green-600 text-sm font-medium">Remesas Exitosas</p>
                <p className="text-2xl font-bold text-green-900">
                  {remesasExitosas?.length || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="text-white h-4 w-4" />
              </div>
              <div className="ml-3">
                <p className="text-blue-600 text-sm font-medium">Seleccionadas</p>
                <p className="text-2xl font-bold text-blue-900">{selectedRemesas.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <Truck className="text-white h-4 w-4" />
              </div>
              <div className="ml-3">
                <p className="text-purple-600 text-sm font-medium">Por Procesar</p>
                <p className="text-2xl font-bold text-purple-900">
                  {(remesasExitosas?.length || 0) - selectedRemesas.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full justify-start border-b border-gray-200 bg-transparent">
            <TabsTrigger value="remesas" className="data-[state=active]:bg-primary-50 data-[state=active]:text-primary-600">
              <CheckCircle className="h-4 w-4 mr-2" />
              Remesas Exitosas
            </TabsTrigger>
            <TabsTrigger value="results" className="data-[state=active]:bg-primary-50 data-[state=active]:text-primary-600">
              <FileText className="h-4 w-4 mr-2" />
              Resultados
            </TabsTrigger>
          </TabsList>

          {/* Remesas Tab */}
          <TabsContent value="remesas" className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Remesas Disponibles para Manifiestos</h3>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedRemesas.length === remesasExitosas?.length && remesasExitosas?.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                  <label htmlFor="select-all" className="text-sm font-medium">
                    Seleccionar todas
                  </label>
                  <Button 
                    onClick={handleProcessManifiestos}
                    disabled={selectedRemesas.length === 0 || processManifiestosMutation.isPending}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {processManifiestosMutation.isPending ? "Generando..." : "Generar Manifiestos"}
                  </Button>
                </div>
              </div>

              {remesasExitosas && remesasExitosas.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Seleccionar
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Consecutivo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Granja/Destino
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Placa
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Conductor
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Cantidad (Kg)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {remesasExitosas.map((remesa: Remesa) => (
                        <tr key={remesa.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Checkbox
                              checked={selectedRemesas.includes(remesa.id)}
                              onCheckedChange={(checked) => handleSelectRemesa(remesa.id, checked as boolean)}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {remesa.consecutivo}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {remesa.granja || remesa.codigo_sede_destinatario}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {remesa.placa}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {remesa.conductor_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {remesa.cantidad_cargada?.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              {remesa.estado}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="mx-auto h-12 w-12 mb-4" />
                  <p className="text-lg font-medium mb-2">No hay remesas exitosas disponibles</p>
                  <p>Genera remesas exitosas primero para poder crear manifiestos</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="p-6">
            {processingResult ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                          <CheckCircle className="text-white" />
                        </div>
                        <div className="ml-3">
                          <p className="text-emerald-600 text-sm font-medium">Exitosos</p>
                          <p className="text-2xl font-bold text-emerald-900">{processingResult.successCount}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                          <AlertTriangle className="text-white" />
                        </div>
                        <div className="ml-3">
                          <p className="text-red-600 text-sm font-medium">Errores</p>
                          <p className="text-2xl font-bold text-red-900">{processingResult.errorCount}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                          <FileText className="text-white" />
                        </div>
                        <div className="ml-3">
                          <p className="text-blue-600 text-sm font-medium">Total</p>
                          <p className="text-2xl font-bold text-blue-900">{processingResult.totalProcessed}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Detalle de Resultados</CardTitle>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Exportar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {processingResult.results?.map((result: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <Badge variant={result.success ? "default" : "destructive"}>
                              {result.success ? "Exitoso" : "Error"}
                            </Badge>
                            <div>
                              <p className="font-medium">Manifiesto: {result.numeroManifiesto}</p>
                              <p className="text-sm text-gray-600">Remesa: {result.consecutivoRemesa}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm">{result.mensaje}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FileText className="mx-auto h-12 w-12 mb-4" />
                <p className="text-lg font-medium mb-2">No hay resultados</p>
                <p>Genera manifiestos para ver los resultados aquí</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}