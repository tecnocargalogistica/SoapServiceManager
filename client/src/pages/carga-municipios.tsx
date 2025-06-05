import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, Download, AlertCircle, CheckCircle, XCircle, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ResultadoCarga {
  fila: number;
  codigo: string;
  nombre: string;
  estado: 'exitoso' | 'error';
  mensaje: string;
}

interface ResumenCarga {
  total: number;
  exitosos: number;
  errores: number;
}

export default function CargaMunicipios() {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [cargando, setCargando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [resultados, setResultados] = useState<ResultadoCarga[]>([]);
  const [resumen, setResumen] = useState<ResumenCarga | null>(null);
  const { toast } = useToast();

  const descargarPlantilla = async () => {
    try {
      const response = await fetch('/api/municipios/plantilla');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'plantilla_municipios.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo descargar la plantilla",
        variant: "destructive"
      });
    }
  };

  const procesarArchivo = async () => {
    if (!archivo) return;

    setCargando(true);
    setProgreso(0);
    setResultados([]);
    setResumen(null);

    try {
      const formData = new FormData();
      formData.append('archivo', archivo);

      const response = await fetch('/api/municipios/carga-masiva', {
        method: 'POST',
        body: formData,
      });

      const resultado = await response.json();

      if (resultado.success) {
        setResultados(resultado.resultados || []);
        setResumen(resultado.resumen);
        setProgreso(100);
        
        toast({
          title: "Carga completada",
          description: resultado.mensaje,
          variant: "default"
        });
      } else {
        throw new Error(resultado.error || 'Error desconocido');
      }
    } catch (error: any) {
      console.error('Error procesando archivo:', error);
      toast({
        title: "Error en la carga",
        description: error.message || "Error procesando el archivo",
        variant: "destructive"
      });
    } finally {
      setCargando(false);
    }
  };

  const handleArchivoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      const allowedTypes = ['.csv', '.xlsx', '.xls'];
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      
      if (!allowedTypes.includes(fileExtension)) {
        toast({
          title: "Archivo no válido",
          description: "Solo se permiten archivos CSV o Excel",
          variant: "destructive"
        });
        return;
      }
      
      setArchivo(file);
      setResultados([]);
      setResumen(null);
      setProgreso(0);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Carga Masiva de Municipios</h1>
        <p className="text-muted-foreground mt-2">
          Cargar múltiples municipios desde un archivo CSV o Excel
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Instrucciones y plantilla */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Plantilla de Excel
            </CardTitle>
            <CardDescription>
              Descarga la plantilla con los campos requeridos para cargar municipios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Campos obligatorios:</strong> codigo, nombre, departamento
                <br />
                <strong>Campos opcionales:</strong> activo
                <br />
                <strong>Formato de código:</strong> Código DANE de 8 dígitos (ej: 11001000)
                <br />
                <strong>Valores booleanos:</strong> true o false para el campo activo
              </AlertDescription>
            </Alert>
            
            <Button onClick={descargarPlantilla} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Descargar Plantilla CSV
            </Button>
          </CardContent>
        </Card>

        {/* Carga de archivo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Cargar Archivo
            </CardTitle>
            <CardDescription>
              Selecciona el archivo con los datos de municipios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleArchivoChange}
                disabled={cargando}
              />
              {archivo && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  {archivo.name} ({(archivo.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>

            {cargando && (
              <div className="space-y-2">
                <Progress value={progreso} className="w-full" />
                <p className="text-sm text-muted-foreground">
                  Procesando archivo... {progreso}%
                </p>
              </div>
            )}

            <Button 
              onClick={procesarArchivo} 
              disabled={!archivo || cargando}
              className="w-full"
            >
              {cargando ? 'Procesando...' : 'Procesar Archivo'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Resumen de resultados */}
      {resumen && (
        <Card>
          <CardHeader>
            <CardTitle>Resumen de Carga</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{resumen.total}</div>
                <div className="text-sm text-muted-foreground">Total registros</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{resumen.exitosos}</div>
                <div className="text-sm text-muted-foreground">Exitosos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{resumen.errores}</div>
                <div className="text-sm text-muted-foreground">Errores</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detalles de resultados */}
      {resultados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Detalle de Resultados</CardTitle>
            <CardDescription>
              Resultado detallado de cada registro procesado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {resultados.map((resultado) => (
                <div
                  key={resultado.fila}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {resultado.estado === 'exitoso' ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    <div>
                      <div className="font-medium">
                        Fila {resultado.fila}: {resultado.codigo} - {resultado.nombre}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {resultado.mensaje}
                      </div>
                    </div>
                  </div>
                  <Badge variant={resultado.estado === 'exitoso' ? 'default' : 'destructive'}>
                    {resultado.estado === 'exitoso' ? 'Exitoso' : 'Error'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}