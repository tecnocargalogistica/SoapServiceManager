import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search,
  Filter,
  Download,
  Trash2,
  RefreshCw
} from "lucide-react";

export default function Logs() {
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [filtroModulo, setFiltroModulo] = useState<string>("todos");
  const [busqueda, setBusqueda] = useState<string>("");
  const [limite, setLimite] = useState<number>(100);

  const { data: logs = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/logs", { limit: limite }],
  });

  const { data: estadisticas } = useQuery({
    queryKey: ["/api/logs/estadisticas"],
  });

  // Filtrar logs según criterios seleccionados
  const logsFiltrados = logs.filter((log: any) => {
    const cumpleTipo = filtroTipo === "todos" || log.tipo === filtroTipo;
    const cumpleModulo = filtroModulo === "todos" || log.modulo === filtroModulo;
    const cumpleBusqueda = !busqueda || 
      log.mensaje?.toLowerCase().includes(busqueda.toLowerCase()) ||
      log.detalles?.toLowerCase().includes(busqueda.toLowerCase());
    
    return cumpleTipo && cumpleModulo && cumpleBusqueda;
  });

  const getIconoTipo = (tipo: string) => {
    switch (tipo) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />;
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case "info":
        return <Activity className="h-4 w-4 text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getVarianteBadge = (tipo: string) => {
    switch (tipo) {
      case "success":
        return "default";
      case "error":
        return "destructive";
      case "warning":
        return "secondary";
      case "info":
        return "outline";
      default:
        return "secondary";
    }
  };

  const exportarLogs = () => {
    const logsTexto = logsFiltrados.map((log: any) => 
      `[${format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss")}] [${log.tipo.toUpperCase()}] [${log.modulo}] ${log.mensaje}${log.detalles ? ` - ${log.detalles}` : ""}`
    ).join('\n');

    const blob = new Blob([logsTexto], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-transpetromira-${format(new Date(), "yyyy-MM-dd")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Logs del Sistema</h1>
          <p className="text-gray-600 mt-1">Historial de actividades y eventos del sistema RNDC</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button variant="outline" onClick={exportarLogs}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Éxitos</p>
                  <p className="text-2xl font-bold text-green-600">{estadisticas.success || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Errores</p>
                  <p className="text-2xl font-bold text-red-600">{estadisticas.error || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Advertencias</p>
                  <p className="text-2xl font-bold text-yellow-600">{estadisticas.warning || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total</p>
                  <p className="text-2xl font-bold text-blue-600">{logs.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filtros y Búsqueda</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tipo</label>
              <Select value={filtroTipo} onValueChange={setFiltroTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="success">Éxito</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warning">Advertencia</SelectItem>
                  <SelectItem value="info">Información</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Módulo</label>
              <Select value={filtroModulo} onValueChange={setFiltroModulo}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar módulo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="cumplimiento">Cumplimiento</SelectItem>
                  <SelectItem value="manifiestos">Manifiestos</SelectItem>
                  <SelectItem value="remesas">Remesas</SelectItem>
                  <SelectItem value="sistema">Sistema</SelectItem>
                  <SelectItem value="rndc">RNDC</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Búsqueda</label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar en logs..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Límite</label>
              <Select value={limite.toString()} onValueChange={(value) => setLimite(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50 registros</SelectItem>
                  <SelectItem value="100">100 registros</SelectItem>
                  <SelectItem value="200">200 registros</SelectItem>
                  <SelectItem value="500">500 registros</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Registros ({logsFiltrados.length})</span>
            {busqueda && (
              <Button variant="ghost" size="sm" onClick={() => setBusqueda("")}>
                Limpiar búsqueda
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {logsFiltrados.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No se encontraron logs con los filtros aplicados</p>
                </div>
              ) : (
                logsFiltrados.map((log: any) => (
                  <div
                    key={log.id}
                    className="flex items-start space-x-3 p-4 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-shrink-0 mt-1">
                      {getIconoTipo(log.tipo)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge variant={getVarianteBadge(log.tipo)}>
                          {log.tipo}
                        </Badge>
                        <Badge variant="outline">
                          {log.modulo}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {format(new Date(log.created_at), "dd/MM/yyyy HH:mm:ss", { locale: es })}
                        </span>
                      </div>
                      
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {log.mensaje}
                      </p>
                      
                      {log.detalles && (
                        <p className="text-sm text-gray-600 break-all">
                          {typeof log.detalles === 'string' ? log.detalles : JSON.stringify(log.detalles)}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}