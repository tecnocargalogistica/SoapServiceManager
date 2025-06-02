import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Search, FileText, Eye, Calendar, Truck, CheckCircle, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ConsultaResponse {
  success: boolean;
  mensaje?: string;
  data?: any;
  error?: string;
  respuesta_xml?: string;
}

export default function Consultas() {
  const [numeroManifiesto, setNumeroManifiesto] = useState("");
  const [fechaIngreso, setFechaIngreso] = useState("");
  const [consultaResponse, setConsultaResponse] = useState<ConsultaResponse | null>(null);
  const [xmlPreview, setXmlPreview] = useState("");
  const [showXmlModal, setShowXmlModal] = useState(false);

  const { toast } = useToast();

  // Obtener configuración activa
  const { data: config } = useQuery({
    queryKey: ["/api/configuracion"],
    queryFn: async () => {
      const response = await fetch("/api/configuracion");
      return response.json();
    },
  });

  // Obtener manifiestos para referencia
  const { data: manifiestos } = useQuery({
    queryKey: ["/api/manifiestos"],
    queryFn: async () => {
      const response = await fetch("/api/manifiestos");
      return response.json();
    },
  });

  // Mutation para generar preview del XML de consulta
  const previewMutation = useMutation({
    mutationFn: async (data: { numeroManifiesto: string; fechaIngreso?: string }) => {
      const response = await fetch("/api/consultas/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setXmlPreview(data.xml);
        setShowXmlModal(true);
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al generar XML de consulta",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al generar preview",
        variant: "destructive",
      });
    },
  });

  // Mutation para realizar consulta al RNDC
  const consultaMutation = useMutation({
    mutationFn: async (data: { numeroManifiesto: string; fechaIngreso?: string }) => {
      const response = await fetch("/api/consultas/manifiesto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: (data) => {
      console.log("Respuesta de consulta RNDC:", data);
      setConsultaResponse(data);
      
      if (data.success) {
        toast({
          title: "Consulta exitosa",
          description: "Información obtenida del RNDC correctamente",
        });
      } else {
        toast({
          title: "Error en consulta",
          description: data.mensaje || "Error al consultar en el RNDC",
          variant: "destructive",
        });
      }
      setShowXmlModal(false);
    },
    onError: (error: any) => {
      console.log("Error en consulta:", error);
      setConsultaResponse({ success: false, error: error.message });
      
      toast({
        title: "Error de conexión",
        description: error.message || "Error al conectar con el RNDC",
        variant: "destructive",
      });
    },
  });

  const handlePreview = () => {
    if (!numeroManifiesto) {
      toast({
        title: "Campo requerido",
        description: "Ingresa el número de manifiesto",
        variant: "destructive",
      });
      return;
    }

    previewMutation.mutate({
      numeroManifiesto,
      fechaIngreso,
    });
  };

  const handleConsultar = () => {
    if (!numeroManifiesto) {
      toast({
        title: "Campo requerido",
        description: "Ingresa el número de manifiesto",
        variant: "destructive",
      });
      return;
    }

    consultaMutation.mutate({
      numeroManifiesto,
      fechaIngreso,
    });
  };

  const handleConsultarDesdeModal = () => {
    consultaMutation.mutate({
      numeroManifiesto,
      fechaIngreso,
    });
  };

  const handleSelectManifiesto = (numero: string) => {
    setNumeroManifiesto(numero);
  };

  // Filtrar manifiestos exitosos para mostrar como referencia
  const manifiestosFiltrados = manifiestos?.filter((m: any) => 
    m.estado === "exitoso" && m.numero_manifiesto.toLowerCase().includes(numeroManifiesto.toLowerCase())
  ) || [];

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-3">
        <Search className="h-8 w-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Consultas RNDC</h1>
          <p className="text-muted-foreground">
            Consulta el estado de manifiestos y remesas en el sistema RNDC
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulario de Consulta */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Consulta de Manifiesto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="numeroManifiesto">Número de Manifiesto</Label>
              <Input
                id="numeroManifiesto"
                placeholder="Ej: 79824071"
                value={numeroManifiesto}
                onChange={(e) => setNumeroManifiesto(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fechaIngreso">Fecha de Ingreso (Opcional)</Label>
              <Input
                id="fechaIngreso"
                type="date"
                value={fechaIngreso}
                onChange={(e) => setFechaIngreso(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Si no se especifica, se usará la fecha actual
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handlePreview}
                variant="outline"
                disabled={previewMutation.isPending}
                className="flex-1"
              >
                <Eye className="h-4 w-4 mr-2" />
                Ver XML
              </Button>
              
              <Button
                onClick={handleConsultar}
                disabled={consultaMutation.isPending}
                className="flex-1"
              >
                <Search className="h-4 w-4 mr-2" />
                {consultaMutation.isPending ? "Consultando..." : "Consultar"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Respuesta del RNDC */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Respuesta del RNDC
            </CardTitle>
          </CardHeader>
          <CardContent>
            {consultaResponse ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  {consultaResponse.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  )}
                  <Badge variant={consultaResponse.success ? "default" : "destructive"}>
                    {consultaResponse.success ? "Exitoso" : "Error"}
                  </Badge>
                </div>

                {consultaResponse.mensaje && (
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm font-medium">Mensaje:</p>
                    <p className="text-sm">{consultaResponse.mensaje}</p>
                  </div>
                )}

                {consultaResponse.data && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm font-medium mb-2">Datos obtenidos:</p>
                    <pre className="text-xs overflow-auto max-h-32">
                      {JSON.stringify(consultaResponse.data, null, 2)}
                    </pre>
                  </div>
                )}

                {consultaResponse.error && (
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="text-sm font-medium text-red-800">Error:</p>
                    <p className="text-sm text-red-700">{consultaResponse.error}</p>
                  </div>
                )}

                {consultaResponse.respuesta_xml && (
                  <details className="mt-4">
                    <summary className="cursor-pointer font-medium">Ver respuesta XML completa</summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                      {consultaResponse.respuesta_xml}
                    </pre>
                  </details>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>Realiza una consulta para ver los resultados aquí</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Manifiestos de Referencia */}
      {manifiestos && manifiestos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Manifiestos Disponibles</CardTitle>
            <p className="text-sm text-muted-foreground">
              Haz clic en un manifiesto para seleccionarlo automáticamente
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 max-h-60 overflow-y-auto">
              {(numeroManifiesto ? manifiestosFiltrados : manifiestos.slice(0, 10)).map((manifiesto: any) => (
                <div
                  key={manifiesto.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => handleSelectManifiesto(manifiesto.numero_manifiesto)}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{manifiesto.numero_manifiesto}</span>
                    <Badge variant="outline">{manifiesto.placa}</Badge>
                    <Badge variant={manifiesto.estado === "exitoso" ? "default" : "secondary"}>
                      {manifiesto.estado}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(manifiesto.created_at), "dd/MM/yyyy", { locale: es })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de Vista Previa XML */}
      {showXmlModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                XML de Consulta - Manifiesto {numeroManifiesto}
                <div className="flex gap-2">
                  <Button
                    onClick={handleConsultarDesdeModal}
                    disabled={consultaMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    {consultaMutation.isPending ? "Consultando..." : "Enviar Consulta"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowXmlModal(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="bg-slate-50 p-4 overflow-auto max-h-[60vh]">
                <pre className="text-sm font-mono whitespace-pre-wrap">
                  {xmlPreview}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}