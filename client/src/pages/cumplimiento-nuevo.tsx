import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Eye, Send, Clock, Truck } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface RemesaExitosa {
  id: number;
  consecutivo: string;
  codigo_sede_remitente: string;
  codigo_sede_destinatario: string;
  placa: string;
  cantidad_cargada: number;
  fecha_cita_cargue: Date;
  fecha_cita_descargue: Date;
  conductor_id: string;
  estado_rndc: string;
  created_at: Date;
}

interface Manifiesto {
  id: number;
  numero_manifiesto: string;
  consecutivo_remesa: string;
  fecha_expedicion: Date;
  municipio_origen: string;
  municipio_destino: string;
  placa: string;
  conductor_id: string;
  valor_flete: number;
  fecha_pago_saldo: Date;
  propietario_tipo: string;
  propietario_numero: string;
  estado_rndc: string;
  ingreso_id?: string;
  codigo_seguridad_qr?: string;
  created_at: Date;
}

export default function CumplimientoNuevo() {
  const [xmlPreview, setXmlPreview] = useState("");
  const [selectedRemesa, setSelectedRemesa] = useState("");
  const [showXmlModal, setShowXmlModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener remesas exitosas
  const { data: remesasExitosas, isLoading: loadingRemesas } = useQuery({
    queryKey: ["/api/remesas/exitosas"],
    queryFn: async () => {
      const response = await fetch("/api/remesas/exitosas");
      return response.json() as Promise<RemesaExitosa[]>;
    },
  });

  // Obtener manifiestos
  const { data: manifiestos, isLoading: loadingManifiestos } = useQuery({
    queryKey: ["/api/manifiestos"],
    queryFn: async () => {
      const response = await fetch("/api/manifiestos");
      return response.json() as Promise<Manifiesto[]>;
    },
  });

  // Generar vista previa del XML
  const previewMutation = useMutation({
    mutationFn: async (consecutivo: string) => {
      const response = await fetch(`/api/cumplimiento/preview/${consecutivo}`);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setXmlPreview(data.xml);
        setShowXmlModal(true);
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al generar XML",
          variant: "destructive",
        });
      }
    },
  });

  // Enviar cumplimiento al RNDC
  const enviarMutation = useMutation({
    mutationFn: async (xmlContent: string) => {
      const response = await fetch("/api/rndc/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xmlContent }),
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "¡Éxito!",
          description: "Cumplimiento enviado correctamente al RNDC",
        });
        setShowXmlModal(false);
        setXmlPreview("");
        queryClient.invalidateQueries({ queryKey: ["/api/remesas/exitosas"] });
      } else {
        toast({
          title: "Error del RNDC",
          description: data.mensaje || "Error al enviar al RNDC",
          variant: "destructive",
        });
      }
    },
  });

  const handlePreviewCumplimiento = (consecutivo: string) => {
    setSelectedRemesa(consecutivo);
    previewMutation.mutate(consecutivo);
  };

  const handleEnviarCumplimiento = () => {
    if (xmlPreview) {
      enviarMutation.mutate(xmlPreview);
    }
  };

  const remesasPendientes = remesasExitosas?.filter(r => r.estado_rndc === "exitoso") || [];
  const manifiestosPendientes = manifiestos?.filter(m => 
    m.estado_rndc === "exitoso" && m.ingreso_id
  ) || [];

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cumplimiento de Transporte</h1>
          <p className="text-muted-foreground">
            Completa las remesas y manifiestos exitosos enviando el cumplimiento al RNDC
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Estadísticas */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Resumen de Estado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Remesas pendientes:</span>
                  <Badge variant="outline">{remesasPendientes.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Manifiestos pendientes:</span>
                  <Badge variant="outline">{manifiestosPendientes.length}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Acciones rápidas */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Acciones Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button 
                  className="w-full"
                  onClick={() => handlePreviewCumplimiento("79824058")}
                  disabled={previewMutation.isPending}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Cumplir Remesa 79824058
                </Button>
                <p className="text-sm text-muted-foreground">
                  Cumple directamente la remesa más reciente
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="remesas" className="space-y-4">
          <TabsList>
            <TabsTrigger value="remesas">
              Remesas Exitosas ({remesasPendientes.length})
            </TabsTrigger>
            <TabsTrigger value="manifiestos">
              Manifiestos Exitosos ({manifiestosPendientes.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="remesas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Remesas Listas para Cumplimiento</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Estas remesas han sido enviadas exitosamente al RNDC y están listas para cumplir
                </p>
              </CardHeader>
              <CardContent>
                {loadingRemesas ? (
                  <div className="text-center py-4">Cargando remesas...</div>
                ) : remesasPendientes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay remesas pendientes de cumplimiento
                  </div>
                ) : (
                  <div className="space-y-3">
                    {remesasPendientes.map((remesa) => (
                      <div
                        key={remesa.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold">
                              Remesa {remesa.consecutivo}
                            </span>
                            <Badge variant="secondary">{remesa.placa}</Badge>
                            <Badge variant="outline">
                              {remesa.cantidad_cargada} ton
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Conductor: {remesa.conductor_id} • 
                            Cargue: {format(new Date(remesa.fecha_cita_cargue), "dd/MM/yyyy", { locale: es })} • 
                            Descargue: {format(new Date(remesa.fecha_cita_descargue), "dd/MM/yyyy", { locale: es })}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePreviewCumplimiento(remesa.consecutivo)}
                            disabled={previewMutation.isPending}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver XML
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manifiestos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Manifiestos Exitosos</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Manifiestos que han sido enviados exitosamente al RNDC
                </p>
              </CardHeader>
              <CardContent>
                {loadingManifiestos ? (
                  <div className="text-center py-4">Cargando manifiestos...</div>
                ) : manifiestosPendientes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay manifiestos exitosos
                  </div>
                ) : (
                  <div className="space-y-3">
                    {manifiestosPendientes.map((manifiesto) => (
                      <div
                        key={manifiesto.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold">
                              Manifiesto {manifiesto.numero_manifiesto}
                            </span>
                            <Badge variant="secondary">{manifiesto.placa}</Badge>
                            <Badge variant="outline" className="text-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Exitoso
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {manifiesto.municipio_origen} → {manifiesto.municipio_destino} • 
                            Valor: ${manifiesto.valor_flete.toLocaleString()} • 
                            ID: {manifiesto.ingreso_id}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Modal de Vista Previa XML */}
        {showXmlModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  XML de Cumplimiento - Remesa {selectedRemesa}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleEnviarCumplimiento}
                      disabled={enviarMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {enviarMutation.isPending ? "Enviando..." : "Enviar al RNDC"}
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
    </div>
  );
}