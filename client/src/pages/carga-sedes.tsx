import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Download, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ResultadoCarga {
  fila: number;
  codigo: string;
  estado: 'exitoso' | 'error';
  mensaje: string;
  id?: number;
}

interface ResumenCarga {
  total: number;
  exitosos: number;
  errores: number;
}

export default function CargaSedes() {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [cargando, setCargando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [resultados, setResultados] = useState<ResultadoCarga[]>([]);
  const [resumen, setResumen] = useState<ResumenCarga | null>(null);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const extension = file.name.toLowerCase();
      if (extension.endsWith('.xlsx') || extension.endsWith('.xls') || extension.endsWith('.csv')) {
        setArchivo(file);
        setResultados([]);
        setResumen(null);
      } else {
        toast({
          title: "Formato no válido",
          description: "Por favor selecciona un archivo Excel (.xlsx, .xls) o CSV (.csv)",
          variant: "destructive"
        });
      }
    }
  };

  const descargarPlantilla = async () => {
    try {
      const response = await fetch('/api/sedes/plantilla');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'plantilla_sedes.csv';
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

      const response = await fetch('/api/sedes/carga-masiva', {
        method: 'POST',
        body: formData,
      });

      const resultado = await response.json();

      if (resultado.success) {
        setResultados(resultado.resultados);
        setResumen(resultado.resumen);
        setProgreso(100);
        
        toast({
          title: "Carga completada",
          description: resultado.mensaje,
        });
      } else {
        throw new Error(resultado.error || 'Error procesando archivo');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || 'Error procesando archivo',
        variant: "destructive"
      });
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Carga Masiva de Sedes</h1>
          <p className="text-muted-foreground">
            Sube un archivo Excel o CSV con la información de las sedes
          </p>
        </div>
      </div>

      {/* Instrucciones y plantilla */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Plantilla de Excel
          </CardTitle>
          <CardDescription>
            Descarga la plantilla con los campos requeridos para cargar sedes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Campos obligatorios:</strong> codigo_sede, nombre
              <br />
              <strong>Campos opcionales:</strong> direccion, municipio_codigo, telefono, valor_tonelada, activo, created_at, tipo_sede, tercero_responsable_id, nit, responsable
              <br />
              <strong>Formato de código:</strong> Máximo 10 caracteres alfanuméricos
              <br />
              <strong>Formato de fecha:</strong> DD/MM/YYYY HH:MM (ejemplo: 28/05/2025 2:19)
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
            Subir Archivo
          </CardTitle>
          <CardDescription>
            Selecciona tu archivo Excel o CSV con los datos de las sedes
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="flex-1"
              disabled={cargando}
            />
            
            {archivo && (
              <Button 
                onClick={procesarArchivo}
                disabled={cargando}
                className="min-w-[120px]"
              >
                {cargando ? 'Procesando...' : 'Procesar Archivo'}
              </Button>
            )}
          </div>

          {archivo && (
            <div className="text-sm text-muted-foreground">
              Archivo seleccionado: {archivo.name} ({(archivo.size / 1024).toFixed(1)} KB)
            </div>
          )}

          {cargando && (
            <div className="space-y-2">
              <Progress value={progreso} className="w-full" />
              <p className="text-sm text-center">Procesando sedes...</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumen de resultados */}
      {resumen && (
        <Card>
          <CardHeader>
            <CardTitle>Resumen de Carga</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{resumen.total}</div>
                <div className="text-sm text-muted-foreground">Total de filas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{resumen.exitosos}</div>
                <div className="text-sm text-muted-foreground">Sedes creadas</div>
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
            <CardTitle>Detalles de Procesamiento</CardTitle>
            <CardDescription>
              Resultado detallado de cada fila procesada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {resultados.map((resultado, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {resultado.estado === 'exitoso' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    <div>
                      <div className="font-medium">
                        Fila {resultado.fila} - {resultado.codigo}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {resultado.mensaje}
                      </div>
                    </div>
                  </div>
                  <Badge variant={resultado.estado === 'exitoso' ? 'default' : 'destructive'}>
                    {resultado.estado === 'exitoso' ? 'Éxito' : 'Error'}
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