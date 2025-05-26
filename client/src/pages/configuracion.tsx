import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Save, TestTube, Settings, Database, Wifi, WifiOff } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function Configuracion() {
  const [formData, setFormData] = useState<any>({});
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  
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

  const updateConfigMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/configuracion", data);
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="soap" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Configuración SOAP</span>
          </TabsTrigger>
          <TabsTrigger value="consecutivos" className="flex items-center space-x-2">
            <Database className="h-4 w-4" />
            <span>Consecutivos</span>
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
                          <Button variant="outline" size="sm">
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
    </div>
  );
}
