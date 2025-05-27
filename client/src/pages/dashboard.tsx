import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { data: remesas, isLoading: loadingRemesas } = useQuery({
    queryKey: ["/api/remesas"]
  });

  const { data: manifiestos, isLoading: loadingManifiestos } = useQuery({
    queryKey: ["/api/manifiestos"]
  });

  const { data: logs, isLoading: loadingLogs } = useQuery({
    queryKey: ["/api/logs", "20"]
  });

  const { data: connectionStatus, isLoading: loadingConnection } = useQuery({
    queryKey: ["/api/rndc/test"],
    refetchInterval: false, // No auto refresh to avoid blocking
    enabled: false // Disable automatic query, only check manually
  });

  // Calculate stats
  const today = new Date().toDateString();
  const remesasHoy = remesas?.filter((r: any) => 
    new Date(r.created_at).toDateString() === today
  )?.length || 0;

  const manifiestosPendientes = manifiestos?.filter((m: any) => 
    m.estado === "generado"
  )?.length || 0;

  const erroresRecientes = logs?.filter((l: any) => 
    l.tipo === "error" && 
    new Date(l.created_at).getTime() > Date.now() - 24 * 60 * 60 * 1000
  )?.length || 0;

  if (loadingRemesas || loadingManifiestos || loadingLogs) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16 mb-4" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard RNDC</h1>
          <p className="text-gray-600 mt-1">Sistema de Gestión de Carga - Colombia</p>
        </div>
        <div className="flex items-center space-x-2">
          {loadingConnection ? (
            <Skeleton className="h-6 w-32" />
          ) : (
            <Badge 
              variant={connectionStatus?.connected ? "default" : "destructive"}
              className={connectionStatus?.connected ? "bg-emerald-500" : ""}
            >
              <div className={`w-2 h-2 rounded-full mr-2 ${
                connectionStatus?.connected ? "bg-white animate-pulse" : "bg-white"
              }`} />
              {connectionStatus?.connected ? "RNDC Conectado" : "RNDC Desconectado"}
            </Badge>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Remesas Hoy</p>
                <p className="text-2xl font-bold text-gray-900">{remesasHoy}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <FileText className="text-blue-600 text-xl" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-emerald-600 text-sm font-medium">+12%</span>
              <span className="text-gray-500 text-sm ml-2">vs ayer</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Manifiestos</p>
                <p className="text-2xl font-bold text-gray-900">{manifiestos?.length || 0}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-emerald-600 text-xl" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-emerald-600 text-sm font-medium">+8%</span>
              <span className="text-gray-500 text-sm ml-2">vs ayer</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pendientes</p>
                <p className="text-2xl font-bold text-gray-900">{manifiestosPendientes}</p>
              </div>
              <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
                <Clock className="text-amber-600 text-xl" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-red-600 text-sm font-medium">-3</span>
              <span className="text-gray-500 text-sm ml-2">vs ayer</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Errores</p>
                <p className="text-2xl font-bold text-gray-900">{erroresRecientes}</p>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
                <AlertTriangle className="text-red-600 text-xl" />
              </div>
            </div>
            <div className="mt-4 flex items-center">
              <span className="text-red-600 text-sm font-medium">+1</span>
              <span className="text-gray-500 text-sm ml-2">vs ayer</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/generar-remesas" className="block">
              <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-center space-x-3">
                  <FileText className="text-primary-600" />
                  <div>
                    <h3 className="font-medium text-gray-900">Generar Remesas</h3>
                    <p className="text-sm text-gray-500">Procesar archivo Excel para crear remesas por lotes</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/cumplir-remesas" className="block">
              <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="text-emerald-600" />
                  <div>
                    <h3 className="font-medium text-gray-900">Cumplir Remesas</h3>
                    <p className="text-sm text-gray-500">Cumplimiento masivo de remesas desde Excel</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/configuracion" className="block">
              <div className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                <div className="flex items-center space-x-3">
                  <Clock className="text-amber-600" />
                  <div>
                    <h3 className="font-medium text-gray-900">Configuración</h3>
                    <p className="text-sm text-gray-500">Gestionar configuración del sistema</p>
                  </div>
                </div>
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {logs?.slice(0, 5).map((log: any) => (
                <div key={log.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    log.tipo === "success" ? "bg-emerald-500" :
                    log.tipo === "error" ? "bg-red-500" :
                    log.tipo === "warning" ? "bg-amber-500" : "bg-blue-500"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{log.mensaje}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`text-xs ${
                      log.tipo === "success" ? "text-emerald-600" :
                      log.tipo === "error" ? "text-red-600" :
                      log.tipo === "warning" ? "text-amber-600" : "text-blue-600"
                    }`}
                  >
                    {log.tipo}
                  </Badge>
                </div>
              ))}
              
              {!logs?.length && (
                <div className="text-center py-6 text-gray-500">
                  <Clock className="mx-auto h-8 w-8 mb-2" />
                  <p>No hay actividad reciente</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
