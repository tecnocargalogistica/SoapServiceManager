import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, Clock, Download, Eye } from "lucide-react";

interface ProcessingStatusProps {
  result: {
    totalProcessed: number;
    successCount: number;
    errorCount: number;
    results: Array<{
      success: boolean;
      consecutivo?: string;
      granja?: string;
      placa?: string;
      error?: string;
      soapResponse?: any;
    }>;
  };
  type: "remesas" | "cumplimiento" | "manifiestos";
}

export default function ProcessingStatus({ result, type }: ProcessingStatusProps) {
  const progressPercentage = (result.successCount / result.totalProcessed) * 100;

  const getTypeLabel = () => {
    switch (type) {
      case "remesas": return "Remesas";
      case "cumplimiento": return "Cumplimiento";
      case "manifiestos": return "Manifiestos";
      default: return "Procesamiento";
    }
  };

  const handleExportResults = () => {
    const csvContent = [
      ["Consecutivo", "Estado", "Granja", "Placa", "Mensaje", "Timestamp"].join(","),
      ...result.results.map(r => [
        r.consecutivo || "-",
        r.success ? "Exitoso" : "Error",
        r.granja || "-",
        r.placa || "-",
        r.success ? "Procesado exitosamente" : (r.error || "Error desconocido"),
        new Date().toISOString()
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resultados_${type}_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="text-white" />
              </div>
              <div className="ml-3">
                <p className="text-emerald-600 text-sm font-medium">Exitosas</p>
                <p className="text-2xl font-bold text-emerald-900">{result.successCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-red-600 rounded-lg flex items-center justify-center">
                <XCircle className="text-white" />
              </div>
              <div className="ml-3">
                <p className="text-red-600 text-sm font-medium">Fallidas</p>
                <p className="text-2xl font-bold text-red-900">{result.errorCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Clock className="text-white" />
              </div>
              <div className="ml-3">
                <p className="text-blue-600 text-sm font-medium">Total</p>
                <p className="text-2xl font-bold text-blue-900">{result.totalProcessed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Progreso del {getTypeLabel()}</h4>
              <span className="text-sm font-medium text-gray-600">
                {result.successCount} de {result.totalProcessed}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <p className="text-sm text-gray-600">
              {progressPercentage.toFixed(1)}% completado
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Detalle de Resultados</CardTitle>
            <Button variant="outline" size="sm" onClick={handleExportResults}>
              <Download className="h-4 w-4 mr-2" />
              Exportar Resultados
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Consecutivo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Granja/Origen
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Placa
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Respuesta
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {result.results.slice(0, 10).map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.consecutivo || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.granja || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.placa || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge 
                        variant={item.success ? "default" : "destructive"}
                        className={item.success ? "bg-emerald-100 text-emerald-800" : ""}
                      >
                        {item.success ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Exitosa
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Error
                          </>
                        )}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-48 truncate">
                      {item.success 
                        ? (item.soapResponse?.mensaje || "Procesado exitosamente")
                        : (item.error || "Error desconocido")
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {result.results.length > 10 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">
                Mostrando 10 de {result.results.length} resultados
              </p>
              <Button variant="outline" size="sm" className="mt-2">
                Ver todos los resultados
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
