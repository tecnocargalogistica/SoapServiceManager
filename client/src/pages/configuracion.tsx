import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DataTable } from "@/components/data-table";
import { MunicipioForm } from "@/components/forms/municipio-form";
import { ConsecutivoForm } from "@/components/forms/consecutivo-form";
import { useToast } from "@/hooks/use-toast";
import { Save, TestTube, Settings, Database, Wifi, WifiOff, MapPin, Upload, Plus, FileText, Edit } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";

export default function Configuracion() {
  const [formData, setFormData] = useState<any>({});
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [showMunicipioForm, setShowMunicipioForm] = useState(false);
  const [editingMunicipio, setEditingMunicipio] = useState<any>(null);
  const [showExcelUpload, setShowExcelUpload] = useState(false);
  const [uploadingExcel, setUploadingExcel] = useState(false);
  const [showConsecutivoForm, setShowConsecutivoForm] = useState(false);
  const [editingConsecutivo, setEditingConsecutivo] = useState<any>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ["/api/configuracion"],
    onSuccess: (data) => {
      setFormData(data || {});
    }
  });

  const { data: connectionStatus } = useQuery({
    queryKey: ["/api/rndc/test"],
    refetchInterval: 60000 // Test connection every minute
  });

  const { data: consecutivos } = useQuery({
    queryKey: ["/api/consecutivos"]
  });

  const { data: municipios = [] } = useQuery({
    queryKey: ["/api/municipios"]
  });

  const updateConfigMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("/api/configuracion", "POST", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/configuracion"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rndc/test"] });
      toast({
        title: "Configuración actualizada",
        description: "Los cambios se han guardado correctamente",
      });
    },
    onError: () => {
      toast({
        title: "Error al actualizar",
        description: "No se pudo guardar la configuración",
        variant: "destructive"
      });
    }
  });

  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/rndc/test");
      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: result.connected ? "Conexión exitosa" : "Conexión fallida",
        description: result.connected 
          ? "La conexión con RNDC se estableció correctamente"
          : "No se pudo conectar con el servicio RNDC",
        variant: result.connected ? "default" : "destructive"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/rndc/test"] });
    }
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    updateConfigMutation.mutate(formData);
  };

  const handleTestConnection = () => {
    setIsTestingConnection(true);
    testConnectionMutation.mutate();
    setTimeout(() => setIsTestingConnection(false), 2000);
  };

  const handleAddMunicipio = () => {
    setEditingMunicipio(null);
    setShowMunicipioForm(true);
  };

  const handleEditMunicipio = (municipio: any) => {
    setEditingMunicipio(municipio);
    setShowMunicipioForm(true);
  };

  const handleEditConsecutivo = (consecutivo: any) => {
    setEditingConsecutivo(consecutivo);
    setShowConsecutivoForm(true);
  };

  const handleMunicipioFormSuccess = () => {
    setShowMunicipioForm(false);
    setEditingMunicipio(null);
  };

  const handleExcelUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const file = formData.get('file') as File;
    
    if (!file) {
      toast({ title: "Por favor selecciona un archivo", variant: "destructive" });
      return;
    }

    setUploadingExcel(true);
    
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      
      const response = await fetch('/api/municipios/bulk', {
        method: 'POST',
        body: uploadFormData,
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({ 
          title: "Municipios cargados exitosamente",
          description: `${result.successCount} municipios creados, ${result.errorCount} errores`
        });
        queryClient.invalidateQueries({ queryKey: ["/api/municipios"] });
        setShowExcelUpload(false);
      } else {
        toast({ title: "Error al procesar archivo", variant: "destructive" });
      }
      
    } catch (error) {
      toast({ title: "Error al cargar archivo", variant: "destructive" });
    } finally {
      setUploadingExcel(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-64"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuración del Sistema</h1>
          <p className="text-gray-600 mt-1">Gestione la configuración de conexión y parámetros del sistema</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Badge 
            variant={connectionStatus?.connected ? "default" : "destructive"}
            className={connectionStatus?.connected ? "bg-emerald-500" : ""}
          >
            {connectionStatus?.connected ? (
              <><Wifi className="h-3 w-3 mr-1" /> Conectado</>
            ) : (
              <><WifiOff className="h-3 w-3 mr-1" /> Desconectado</>
            )}
          </Badge>
          
          <Button
            onClick={async () => {
              try {
                const response = await fetch('/api/rndc/test-specific-xml', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' }
                });
                const data = await response.json();
                console.log('🎯 RESPUESTA EXACTA DEL RNDC (XML ESPECÍFICO):', data);
                
                // Mostrar información detallada
                const mensaje = data.response?.mensaje || data.response?.error || 'Sin mensaje';
                const detalles = JSON.stringify(data.response?.data || {}, null, 2);
                
                alert(`RESPUESTA DEL RNDC (XML ESPECÍFICO):\n\nÉxito: ${data.success}\nConsecutivo: 79824014\nMensaje: ${mensaje}\n\nDetalles completos en la consola del navegador.`);
                
                // También mostrar en consola con más detalle
                console.log('📄 XML Enviado:', data.xmlSent);
                console.log('📥 Respuesta completa:', data.response);
                console.log('🔍 Data del RNDC:', data.response?.data);
                
              } catch (error) {
                console.error('Error al enviar XML específico:', error);
                alert('Error al probar XML específico: ' + error);
              }
            }}
            variant="outline"
            size="sm"
          >
            <TestTube className="h-4 w-4 mr-2" />
            Probar XML Específico
          </Button>
          
          <Button 
            variant="outline"
            onClick={handleTestConnection}
            disabled={isTestingConnection || testConnectionMutation.isPending}
          >
            <TestTube className="h-4 w-4 mr-2" />
            {isTestingConnection ? "Probando..." : "Probar Conexión"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="soap" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="soap" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Configuración SOAP</span>
          </TabsTrigger>
          <TabsTrigger value="consecutivos" className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span>Consecutivos</span>
          </TabsTrigger>
          <TabsTrigger value="municipios" className="flex items-center space-x-2">
            <MapPin className="h-4 w-4" />
            <span>Municipios</span>
          </TabsTrigger>
          <TabsTrigger value="plantillas" className="flex items-center space-x-2">
            <Upload className="h-4 w-4" />
            <span>Plantillas PDF</span>
          </TabsTrigger>
          <TabsTrigger value="sistema" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Sistema</span>
          </TabsTrigger>
        </TabsList>

        {/* SOAP Configuration */}
        <TabsContent value="soap">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Credenciales RNDC</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="usuario">Usuario RNDC</Label>
                  <Input
                    id="usuario"
                    value={formData.usuario || ""}
                    onChange={(e) => handleInputChange("usuario", e.target.value)}
                    placeholder="TRANSPORTES@739"
                  />
                </div>

                <div>
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password || ""}
                    onChange={(e) => handleInputChange("password", e.target.value)}
                    placeholder="••••••••••••"
                  />
                </div>

                <div>
                  <Label htmlFor="empresa_nit">NIT Empresa</Label>
                  <Input
                    id="empresa_nit"
                    value={formData.empresa_nit || ""}
                    onChange={(e) => handleInputChange("empresa_nit", e.target.value)}
                    placeholder="9013690938"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Endpoints de Servicio</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="endpoint_primary">Endpoint Principal</Label>
                  <Input
                    id="endpoint_primary"
                    value={formData.endpoint_primary || ""}
                    onChange={(e) => handleInputChange("endpoint_primary", e.target.value)}
                    placeholder="http://rndcws.mintransporte.gov.co:8080/ws"
                  />
                </div>

                <div>
                  <Label htmlFor="endpoint_backup">Endpoint de Respaldo</Label>
                  <Input
                    id="endpoint_backup"
                    value={formData.endpoint_backup || ""}
                    onChange={(e) => handleInputChange("endpoint_backup", e.target.value)}
                    placeholder="http://rndcws2.mintransporte.gov.co:8080/ws"
                  />
                </div>

                <div>
                  <Label htmlFor="timeout">Timeout (ms)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    value={formData.timeout || ""}
                    onChange={(e) => handleInputChange("timeout", e.target.value)}
                    placeholder="30000"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end space-x-3">
            <Button variant="outline">
              Cancelar
            </Button>
            <Button 
              onClick={handleSave}
              disabled={updateConfigMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {updateConfigMutation.isPending ? "Guardando..." : "Guardar Configuración"}
            </Button>
          </div>
        </TabsContent>

        {/* Consecutivos */}
        <TabsContent value="consecutivos">
          <Card>
            <CardHeader>
              <CardTitle>Gestión de Consecutivos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Último Número
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Año
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Prefijo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {consecutivos?.map((consecutivo: any) => (
                      <tr key={consecutivo.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant="outline" className="capitalize">
                            {consecutivo.tipo}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {consecutivo.ultimo_numero}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {consecutivo.año}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {consecutivo.prefijo || "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditConsecutivo(consecutivo)}
                          >
                            Editar
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Municipios */}
        <TabsContent value="municipios">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Gestión de Municipios</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-4 space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowExcelUpload(true)}
                  className="flex items-center space-x-2"
                >
                  <Upload className="h-4 w-4" />
                  <span>Cargar desde Excel</span>
                </Button>
                <Button 
                  onClick={handleAddMunicipio}
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Agregar Municipio</span>
                </Button>
              </div>
              
              <DataTable
                title="Catálogo de Municipios RNDC"
                data={municipios}
                columns={[
                  { key: "codigo", title: "Código DANE" },
                  { key: "nombre", title: "Municipio" },
                  { key: "departamento", title: "Departamento" },
                  { 
                    key: "activo", 
                    title: "Estado",
                    render: (value: boolean) => (
                      <Badge variant={value ? "default" : "secondary"}>
                        {value ? "Activo" : "Inactivo"}
                      </Badge>
                    )
                  }
                ]}
                isLoading={false}
                searchPlaceholder="Buscar municipios por nombre o código..."
                apiEndpoint="/api/municipios"
                queryKey={["/api/municipios"]}
                onAdd={handleAddMunicipio}
                onEdit={handleEditMunicipio}
                onView={(municipio) => console.log("Ver municipio:", municipio)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plantillas PDF */}
        <TabsContent value="plantillas">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Editor Visual de Plantillas</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">
                  Configura visualmente las coordenadas de los campos en tus plantillas PDF usando el editor drag-and-drop.
                </p>
                
                <div className="space-y-3">
                  <Link href="/editor-plantilla-visual">
                    <Button className="w-full justify-start">
                      <Edit className="h-4 w-4 mr-2" />
                      Editor Visual de Coordenadas
                    </Button>
                  </Link>
                  
                  <Link href="/test-pdf-plantilla">
                    <Button variant="outline" className="w-full justify-start">
                      <FileText className="h-4 w-4 mr-2" />
                      Editor Manual de Coordenadas
                    </Button>
                  </Link>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Funcionalidades:</h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>• Arrastra y posiciona campos visualmente</p>
                    <p>• Sube imágenes de plantillas personalizadas</p>
                    <p>• Previsualiza resultados en tiempo real</p>
                    <p>• Guarda configuraciones automáticamente</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Plantillas Guardadas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600">
                  Gestiona tus plantillas PDF guardadas y selecciona la plantilla activa.
                </p>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium text-green-800 mb-2">Plantilla Activa:</h4>
                  <p className="text-sm text-green-700">
                    Plantilla Visual RNDC (Última guardada)
                  </p>
                </div>

                <div className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Database className="h-4 w-4 mr-2" />
                    Ver Todas las Plantillas
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Upload className="h-4 w-4 mr-2" />
                    Importar Plantilla
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sistema */}
        <TabsContent value="sistema">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Información del Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-gray-600">Versión:</span>
                  <span className="text-sm text-gray-900">1.0.0</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-gray-600">Última actualización:</span>
                  <span className="text-sm text-gray-900">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-gray-600">Estado RNDC:</span>
                  <Badge 
                    variant={connectionStatus?.connected ? "default" : "destructive"}
                    className={connectionStatus?.connected ? "bg-emerald-500" : ""}
                  >
                    {connectionStatus?.connected ? "Conectado" : "Desconectado"}
                  </Badge>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-medium text-gray-600">Endpoint activo:</span>
                  <span className="text-sm text-gray-900 truncate max-w-48">
                    {formData.endpoint_primary || "No configurado"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Acciones del Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  <Database className="h-4 w-4 mr-2" />
                  Respaldar Base de Datos
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Limpiar Logs Antiguos
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <TestTube className="h-4 w-4 mr-2" />
                  Verificar Integridad
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Diálogo para formulario de municipio */}
      <Dialog open={showMunicipioForm} onOpenChange={setShowMunicipioForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingMunicipio ? "Editar Municipio" : "Nuevo Municipio"}
            </DialogTitle>
          </DialogHeader>
          <MunicipioForm
            municipio={editingMunicipio}
            onSuccess={handleMunicipioFormSuccess}
            onCancel={() => setShowMunicipioForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Diálogo para formulario de consecutivo */}
      <Dialog open={showConsecutivoForm} onOpenChange={setShowConsecutivoForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingConsecutivo ? "Editar Consecutivo" : "Nuevo Consecutivo"}
            </DialogTitle>
          </DialogHeader>
          <ConsecutivoForm
            consecutivo={editingConsecutivo}
            onSuccess={() => {
              setShowConsecutivoForm(false);
              setEditingConsecutivo(null);
              queryClient.invalidateQueries({ queryKey: ["/api/consecutivos"] });
            }}
            onCancel={() => {
              setShowConsecutivoForm(false);
              setEditingConsecutivo(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Diálogo para carga masiva desde Excel */}
      <Dialog open={showExcelUpload} onOpenChange={setShowExcelUpload}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Cargar Municipios desde Excel</DialogTitle>
          </DialogHeader>
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleExcelUpload} className="space-y-4">
                <div>
                  <Label htmlFor="file">Archivo Excel</Label>
                  <Input
                    id="file"
                    name="file"
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    className="mt-1"
                    required
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    Formatos soportados: .xlsx, .xls, .csv
                  </p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2">Formato requerido:</h4>
                  <div className="text-sm text-blue-700">
                    <p><strong>Columnas necesarias:</strong></p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li><strong>CODIGO</strong> - Código DANE del municipio</li>
                      <li><strong>NOMBRE</strong> - Nombre del municipio</li>
                      <li><strong>DEPARTAMENTO</strong> - Nombre del departamento</li>
                      <li><strong>ACTIVO</strong> - "SI" o "NO" (opcional, por defecto "SI")</li>
                    </ul>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowExcelUpload(false)}
                    disabled={uploadingExcel}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={uploadingExcel}>
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadingExcel ? "Cargando..." : "Cargar Municipios"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    </div>
  );
}
