import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, Search, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface VerificacionResultado {
  encontrados: Array<{
    cedula: string;
    nombre: string;
    activo: boolean;
    id: number;
  }>;
  faltantes: string[];
  activados: number;
  errores: string[];
}

export default function VerificarCedulas() {
  const [cedulas, setCedulas] = useState("");
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<VerificacionResultado | null>(null);
  const [mensaje, setMensaje] = useState("");

  const verificarCedulas = async () => {
    if (!cedulas.trim()) {
      setMensaje("Por favor ingresa las cédulas a verificar");
      return;
    }

    setLoading(true);
    setResultado(null);
    setMensaje("");

    try {
      // Convertir el texto en array de cédulas
      const listaCedulas = cedulas
        .split('\n')
        .map(linea => linea.trim())
        .filter(linea => linea !== '');

      const response = await apiRequest('/api/terceros/verificar-cedulas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ cedulas: listaCedulas }),
      });

      if (response.success) {
        setResultado(response.datos);
        setMensaje(response.mensaje);
      } else {
        setMensaje(response.mensaje || 'Error en la verificación');
      }
    } catch (error: any) {
      console.error('Error verificando cédulas:', error);
      setMensaje('Error interno del servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Search className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Verificar y Activar Cédulas</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Cédulas</CardTitle>
          <CardDescription>
            Ingresa una cédula por línea para verificar si existe en terceros y activarla automáticamente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="2948514&#10;81754316&#10;81754808&#10;1072592012&#10;..."
            value={cedulas}
            onChange={(e) => setCedulas(e.target.value)}
            rows={10}
            className="font-mono"
          />
          
          <Button 
            onClick={verificarCedulas} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Verificando...' : 'Verificar Cédulas'}
          </Button>

          {mensaje && (
            <Alert>
              <AlertDescription>{mensaje}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {resultado && (
        <div className="grid gap-6">
          {/* Resumen */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Resumen de Verificación
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {resultado.encontrados.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Encontrados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {resultado.faltantes.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Faltantes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {resultado.activados}
                  </div>
                  <div className="text-sm text-muted-foreground">Activados</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {resultado.errores.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Errores</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Terceros Encontrados */}
          {resultado.encontrados.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  Terceros Encontrados ({resultado.encontrados.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {resultado.encontrados.map((tercero, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{tercero.nombre}</div>
                        <div className="text-sm text-muted-foreground">
                          Cédula: {tercero.cedula}
                        </div>
                      </div>
                      <Badge variant={tercero.activo ? "default" : "secondary"}>
                        {tercero.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cédulas Faltantes */}
          {resultado.faltantes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  Cédulas Faltantes ({resultado.faltantes.length})
                </CardTitle>
                <CardDescription>
                  Estas cédulas no se encontraron en la base de datos de terceros
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
                  {resultado.faltantes.map((cedula, index) => (
                    <Badge key={index} variant="destructive" className="justify-center">
                      {cedula}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Errores */}
          {resultado.errores.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-orange-600">
                  Errores durante el proceso
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {resultado.errores.map((error, index) => (
                    <Alert key={index}>
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}