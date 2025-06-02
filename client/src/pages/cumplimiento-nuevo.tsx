import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Eye, Send, Clock, Truck, Square, CheckSquare, Play, Pause } from "lucide-react";
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
  const [selectedRemesas, setSelectedRemesas] = useState<string[]>([]);
  const [selectedManifiesto, setSelectedManifiesto] = useState("");
  const [selectedManifiestos, setSelectedManifiestos] = useState<string[]>([]);
  const [showXmlModal, setShowXmlModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showBatchModalManifiestos, setShowBatchModalManifiestos] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, processing: false });
  const [batchResults, setBatchResults] = useState<Array<{consecutivo: string, success: boolean, message: string}>>([]);
  const [rndcResponse, setRndcResponse] = useState<any>(null);
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
      console.log("Respuesta completa del RNDC:", data);
      setRndcResponse(data);
      
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
    onError: (error: any) => {
      console.log("Error en la solicitud:", error);
      setRndcResponse({ success: false, error: error.message });
      
      toast({
        title: "Error de conexión",
        description: error.message || "Error al conectar con el RNDC",
        variant: "destructive",
      });
    }
  });

  const handlePreviewCumplimiento = (consecutivo: string) => {
    setSelectedRemesa(consecutivo);
    previewMutation.mutate(consecutivo);
  };

  // Preview de cumplimiento de manifiesto
  const previewManifiestoMutation = useMutation({
    mutationFn: async (numeroManifiesto: string) => {
      const response = await fetch(`/api/cumplimiento-manifiesto/preview/${numeroManifiesto}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error);
      }
      
      return data;
    },
    onSuccess: (data) => {
      setXmlPreview(data.xml);
      setShowXmlModal(true);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Error al generar preview: ${error}`,
        variant: "destructive",
      });
    },
  });

  const handleEnviarCumplimiento = () => {
    if (selectedRemesa) {
      cumplirRemesaMutation.mutate({
        consecutivo: selectedRemesa,
        fecha: new Date().toISOString().split('T')[0]
      });
    }
  };

  // Mutación para cumplir remesa directamente
  const cumplirRemesaMutation = useMutation({
    mutationFn: async (data: { consecutivo: string; fecha: string }) => {
      const response = await fetch(`/api/cumplimiento/remesa`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: (data) => {
      console.log("Respuesta completa del RNDC:", data);
      setRndcResponse(data);
      
      if (data.success) {
        toast({
          title: "Cumplimiento exitoso",
          description: "La remesa ha sido cumplida correctamente en el RNDC",
        });
        setShowXmlModal(false);
        setXmlPreview("");
        queryClient.invalidateQueries({ queryKey: ["/api/remesas/exitosas"] });
      } else {
        toast({
          title: "Error en cumplimiento",
          description: data.mensaje || "Error al cumplir remesa en el RNDC",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.log("Error en la solicitud:", error);
      setRndcResponse({ success: false, error: error.message });
      
      toast({
        title: "Error de conexión",
        description: error.message || "Error al conectar con el RNDC",
        variant: "destructive",
      });
    }
  });

  // Procesamiento en lotes
  const procesarLoteMutation = useMutation({
    mutationFn: async (consecutivos: string[]) => {
      setBatchProgress({ current: 0, total: consecutivos.length, processing: true });
      setBatchResults([]);
      
      const results = [];
      
      for (let i = 0; i < consecutivos.length; i++) {
        const consecutivo = consecutivos[i];
        setBatchProgress(prev => ({ ...prev, current: i + 1 }));
        
        try {
          // Usar el mismo endpoint que funciona en envío individual
          const response = await fetch(`/api/cumplimiento/remesa`, {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              consecutivo: consecutivo, 
              fecha: new Date().toISOString().split('T')[0] 
            }),
          });
          const sendData = await response.json();
          
          results.push({ 
            consecutivo, 
            success: sendData.success, 
            message: sendData.success ? "Enviado exitosamente" : sendData.mensaje 
          });
          
          // Pausa de 2 segundos entre envíos
          if (i < consecutivos.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
        } catch (error) {
          results.push({ consecutivo, success: false, message: `Error: ${error}` });
        }
      }
      
      setBatchResults(results);
      setBatchProgress(prev => ({ ...prev, processing: false }));
      return results;
    },
    onSuccess: (results) => {
      const exitosos = results.filter(r => r.success).length;
      toast({
        title: "Procesamiento Completado",
        description: `${exitosos} de ${results.length} cumplimientos enviados exitosamente`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/remesas/exitosas"] });
    },
  });

  // Manejo de selección múltiple
  const toggleRemesaSelection = (consecutivo: string) => {
    setSelectedRemesas(prev => 
      prev.includes(consecutivo) 
        ? prev.filter(r => r !== consecutivo)
        : [...prev, consecutivo]
    );
  };

  const selectAllRemesas = () => {
    if (selectedRemesas.length === remesasPendientes.length) {
      setSelectedRemesas([]);
    } else {
      setSelectedRemesas(remesasPendientes.map(r => r.consecutivo));
    }
  };

  const handleProcesarLote = () => {
    if (selectedRemesas.length === 0) {
      toast({
        title: "Sin selección",
        description: "Selecciona al menos una remesa para procesar",
        variant: "destructive",
      });
      return;
    }
    setShowBatchModal(true);
  };

  const confirmarProcesarLote = () => {
    procesarLoteMutation.mutate(selectedRemesas);
    setShowBatchModal(false);
  };

  // Manejo de selección múltiple para manifiestos
  const toggleManifiestoSelection = (numeroManifiesto: string) => {
    setSelectedManifiestos(prev => 
      prev.includes(numeroManifiesto) 
        ? prev.filter(m => m !== numeroManifiesto)
        : [...prev, numeroManifiesto]
    );
  };

  const selectAllManifiestos = () => {
    if (selectedManifiestos.length === manifiestosPendientes.length) {
      setSelectedManifiestos([]);
    } else {
      setSelectedManifiestos(manifiestosPendientes.map(m => m.numero_manifiesto));
    }
  };

  // Función para procesar lote de manifiestos
  const handleProcesarLoteManifiestos = () => {
    if (selectedManifiestos.length === 0) {
      toast({
        title: "Error",
        description: "Selecciona al menos un manifiesto para procesar",
        variant: "destructive",
      });
      return;
    }
    setShowBatchModalManifiestos(true);
  };

  // Función para previsualizar XML de cumplimiento de manifiesto
  const handlePreviewCumplimientoManifiesto = (numeroManifiesto: string) => {
    setSelectedManifiesto(numeroManifiesto);
    previewManifiestoMutation.mutate(numeroManifiesto);
  };

  // Mutación para cumplir manifiesto directamente
  const cumplirManifiestoMutation = useMutation({
    mutationFn: async (data: { numeroManifiesto: string; fecha: string }) => {
      const response = await fetch(`/api/cumplimiento/manifiesto`, {
        method: 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: (data) => {
      console.log("Respuesta cumplimiento manifiesto:", data);
      setRndcResponse(data);
      
      if (data.success) {
        toast({
          title: "Cumplimiento exitoso",
          description: "El manifiesto ha sido cumplido correctamente en el RNDC",
        });
        setShowXmlModal(false);
        setXmlPreview("");
        queryClient.invalidateQueries({ queryKey: ["/api/manifiestos/completos"] });
      } else {
        toast({
          title: "Error en cumplimiento",
          description: data.mensaje || "Error al cumplir manifiesto en el RNDC",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.log("Error en cumplimiento manifiesto:", error);
      setRndcResponse({ success: false, error: error.message });
      
      toast({
        title: "Error de conexión",
        description: error.message || "Error al conectar con el RNDC",
        variant: "destructive",
      });
    }
  });

  // Procesamiento en lotes para manifiestos
  const procesarLoteManifiestosMutation = useMutation({
    mutationFn: async (numeroManifiestos: string[]) => {
      const results = [];
      setBatchProgress({ processing: true, current: 0, total: numeroManifiestos.length });
      
      for (let i = 0; i < numeroManifiestos.length; i++) {
        const numeroManifiesto = numeroManifiestos[i];
        setBatchProgress(prev => ({ ...prev, current: i + 1 }));
        
        try {
          const response = await fetch(`/api/cumplimiento/manifiesto`, {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              numeroManifiesto,
              fecha: new Date().toISOString().split('T')[0]
            }),
          });
          const data = await response.json();
          
          results.push({ 
            consecutivo: numeroManifiesto, 
            success: data.success, 
            message: data.success ? "Enviado exitosamente" : data.mensaje 
          });
          
          // Pausa de 2 segundos entre envíos
          if (i < numeroManifiestos.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
        } catch (error) {
          results.push({ consecutivo: numeroManifiesto, success: false, message: `Error: ${error}` });
        }
      }
      
      setBatchResults(results);
      setBatchProgress(prev => ({ ...prev, processing: false }));
      return results;
    },
    onSuccess: (results) => {
      const exitosos = results.filter(r => r.success).length;
      toast({
        title: "Procesamiento Completado",
        description: `${exitosos} de ${results.length} cumplimientos de manifiestos enviados exitosamente`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/manifiestos/completos"] });
    },
  });

  const confirmarProcesarLoteManifiestos = () => {
    procesarLoteManifiestosMutation.mutate(selectedManifiestos);
    setShowBatchModalManifiestos(false);
  };

  const remesasPendientes = remesasExitosas || [];
  const manifiestosPendientes = Array.isArray(manifiestos) ? 
    manifiestos.filter((m: any) => 
      m.estado === "exitoso" && m.ingreso_id
    ) : [];

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
                Procesamiento Masivo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Mostrar respuesta del RNDC si existe */}
                {rndcResponse && (
                  <div className="p-4 border rounded-lg bg-slate-50">
                    <h4 className="font-semibold mb-2">Última Respuesta del RNDC:</h4>
                    <div className="text-sm space-y-2">
                      <div>
                        <span className="font-medium">Estado:</span>{" "}
                        <span className={rndcResponse.success ? "text-green-600" : "text-red-600"}>
                          {rndcResponse.success ? "Exitoso" : "Error"}
                        </span>
                      </div>
                      {rndcResponse.mensaje && (
                        <div>
                          <span className="font-medium">Mensaje:</span> {rndcResponse.mensaje}
                        </div>
                      )}
                      {rndcResponse.data?.ingresoId && (
                        <div>
                          <span className="font-medium">ID de Ingreso:</span> {rndcResponse.data.ingresoId}
                        </div>
                      )}
                      {rndcResponse.data?.rawResponse && (
                        <details className="mt-2">
                          <summary className="cursor-pointer font-medium">Ver respuesta completa del RNDC</summary>
                          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32">
                            {rndcResponse.data.rawResponse}
                          </pre>
                        </details>
                      )}
                      {rndcResponse.error && (
                        <div>
                          <span className="font-medium">Error:</span>{" "}
                          <span className="text-red-600">{rndcResponse.error}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <Button 
                  className="w-full"
                  onClick={() => handlePreviewCumplimiento("79824058")}
                  disabled={previewMutation.isPending}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Cumplir Individual
                </Button>
                
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={handleProcesarLote}
                  disabled={selectedRemesas.length === 0 || batchProgress.processing}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Procesar {selectedRemesas.length} Remesas
                </Button>

                <Button 
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  onClick={handleProcesarLoteManifiestos}
                  disabled={selectedManifiestos.length === 0 || batchProgress.processing}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Procesar {selectedManifiestos.length} Manifiestos
                </Button>
                
                {batchProgress.processing && (
                  <div className="text-sm text-center text-muted-foreground">
                    Procesando {batchProgress.current} de {batchProgress.total}...
                  </div>
                )}
                
                <p className="text-sm text-muted-foreground">
                  Selecciona múltiples remesas o manifiestos para procesamiento automático con pausas de 2 segundos entre envíos
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Remesas Listas para Cumplimiento</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Estas remesas han sido enviadas exitosamente al RNDC y están listas para cumplir
                    </p>
                  </div>
                  {remesasPendientes.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAllRemesas}
                    >
                      {selectedRemesas.length === remesasPendientes.length ? (
                        <>
                          <CheckSquare className="h-4 w-4 mr-2" />
                          Deseleccionar Todas
                        </>
                      ) : (
                        <>
                          <Square className="h-4 w-4 mr-2" />
                          Seleccionar Todas
                        </>
                      )}
                    </Button>
                  )}
                </div>
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
                        className={`flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors ${
                          selectedRemesas.includes(remesa.consecutivo) ? 'bg-blue-50 border-blue-200' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedRemesas.includes(remesa.consecutivo)}
                            onChange={() => toggleRemesaSelection(remesa.consecutivo)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
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
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Manifiestos Exitosos</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Manifiestos que han sido enviados exitosamente al RNDC
                    </p>
                  </div>
                  {manifiestosPendientes.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAllManifiestos}
                    >
                      {selectedManifiestos.length === manifiestosPendientes.length ? (
                        <>
                          <CheckSquare className="h-4 w-4 mr-2" />
                          Deseleccionar Todos
                        </>
                      ) : (
                        <>
                          <Square className="h-4 w-4 mr-2" />
                          Seleccionar Todos
                        </>
                      )}
                    </Button>
                  )}
                </div>
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
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedManifiestos.includes(manifiesto.numero_manifiesto)}
                            onChange={() => toggleManifiestoSelection(manifiesto.numero_manifiesto)}
                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                          />
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
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePreviewCumplimientoManifiesto(manifiesto.numero_manifiesto)}
                            disabled={previewManifiestoMutation.isPending}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver XML
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Botón de procesamiento masivo para manifiestos */}
                {selectedManifiestos.length > 0 && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-blue-900">
                          {selectedManifiestos.length} manifiesto{selectedManifiestos.length > 1 ? 's' : ''} seleccionado{selectedManifiestos.length > 1 ? 's' : ''}
                        </p>
                        <p className="text-sm text-blue-700">
                          Enviar cumplimiento al RNDC para todos los manifiestos seleccionados
                        </p>
                      </div>
                      <Button
                        onClick={handleProcesarLoteManifiestos}
                        disabled={procesarLoteManifiestosMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Procesar Lote
                      </Button>
                    </div>
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
                  XML de Cumplimiento - {selectedRemesa ? `Remesa ${selectedRemesa}` : `Manifiesto ${selectedManifiesto}`}
                  <div className="flex gap-2">
                    <Button
                      onClick={selectedRemesa ? handleEnviarCumplimiento : () => {
                        if (selectedManifiesto) {
                          cumplirManifiestoMutation.mutate({
                            numeroManifiesto: selectedManifiesto,
                            fecha: new Date().toISOString().split('T')[0]
                          });
                        }
                      }}
                      disabled={selectedRemesa ? cumplirRemesaMutation.isPending : cumplirManifiestoMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {(selectedRemesa ? cumplirRemesaMutation.isPending : cumplirManifiestoMutation.isPending) ? "Enviando..." : "Enviar al RNDC"}
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

        {/* Modal de Confirmación de Procesamiento en Lote */}
        {showBatchModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Confirmar Procesamiento en Lote</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  ¿Deseas procesar {selectedRemesas.length} remesas seleccionadas? 
                  Este proceso enviará cada remesa al RNDC con pausas de 2 segundos entre envíos.
                </p>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowBatchModal(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={confirmarProcesarLote}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Procesar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Modal de Confirmación de Procesamiento en Lote para Manifiestos */}
        {showBatchModalManifiestos && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Confirmar Procesamiento en Lote - Manifiestos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  ¿Deseas procesar {selectedManifiestos.length} manifiestos seleccionados? 
                  Este proceso enviará cada manifiesto al RNDC con pausas de 2 segundos entre envíos.
                </p>
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowBatchModalManifiestos(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={confirmarProcesarLoteManifiestos}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Procesar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}