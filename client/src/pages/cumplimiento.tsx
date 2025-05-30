import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, CheckCircle, Clock, Package, Truck } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

interface Remesa {
  id: number;
  consecutivo: string;
  fecha_creacion: string;
  codigo_sede_remitente: string;
  codigo_sede_destinatario: string;
  placa: string;
  conductor_id: string;
  toneladas: number;
  estado: string;
}

interface Manifiesto {
  id: number;
  numero_manifiesto: string;
  consecutivo_remesa: string;
  fecha_expedicion: string;
  estado: string;
  ingreso_id: string | null;
  codigo_seguridad_qr: string | null;
}

export default function CumplimientoPage() {
  const [selectedRemesaDate, setSelectedRemesaDate] = useState<Date>();
  const [selectedManifiestoDate, setSelectedManifiestoDate] = useState<Date>();
  const [selectedRemesa, setSelectedRemesa] = useState<string | null>(null);
  const [selectedManifiesto, setSelectedManifiesto] = useState<string | null>(null);
  const [rndcResponse, setRndcResponse] = useState<any>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para obtener remesas exitosas listas para cumplir
  const { data: remesasExitosas = [], isLoading: loadingRemesas } = useQuery({
    queryKey: ['/api/remesas/exitosas'],
  });

  // Query para obtener manifiestos exitosos
  const { data: manifiestos = [], isLoading: loadingManifiestos } = useQuery({
    queryKey: ['/api/manifiestos'],
  });

  const manifiestosPendientes = manifiestos.filter((m: Manifiesto) => 
    m.estado === 'exitoso' && m.ingreso_id
  );

  // Mutación para cumplir remesa
  const cumplirRemesaMutation = useMutation({
    mutationFn: async (data: { consecutivo: string; fecha: string }) => {
      return apiRequest(`/api/cumplimiento/remesa`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: (data) => {
      console.log("Respuesta completa del RNDC:", data);
      setRndcResponse(data);
      
      toast({
        title: data.success ? "✅ Remesa cumplida" : "❌ Error en cumplimiento",
        description: data.mensaje || (data.success ? "La remesa ha sido cumplida exitosamente en el RNDC" : "Error en el proceso de cumplimiento"),
        variant: data.success ? "default" : "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/remesas'] });
      setSelectedRemesa(null);
      setSelectedRemesaDate(undefined);
    },
    onError: (error: any) => {
      console.log("Error en la solicitud:", error);
      setRndcResponse({ success: false, error: error.message });
      
      toast({
        title: "❌ Error al cumplir remesa",
        description: error.message || "Error en el proceso de cumplimiento",
        variant: "destructive",
      });
    },
  });

  // Mutación para cumplir manifiesto
  const cumplirManifiestoMutation = useMutation({
    mutationFn: async (data: { numeroManifiesto: string; fecha: string }) => {
      return apiRequest(`/api/cumplimiento/manifiesto`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "✅ Manifiesto cumplido",
        description: "El manifiesto ha sido cumplido exitosamente en el RNDC",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/manifiestos'] });
      setSelectedManifiesto(null);
      setSelectedManifiestoDate(undefined);
    },
    onError: (error: any) => {
      toast({
        title: "❌ Error al cumplir manifiesto",
        description: error.message || "Error en el proceso de cumplimiento",
        variant: "destructive",
      });
    },
  });

  const handleCumplirRemesa = () => {
    if (!selectedRemesa || !selectedRemesaDate) {
      toast({
        title: "⚠️ Datos incompletos",
        description: "Selecciona una remesa y una fecha de cumplimiento",
        variant: "destructive",
      });
      return;
    }

    const fechaFormateada = format(selectedRemesaDate, 'dd/MM/yyyy');
    cumplirRemesaMutation.mutate({
      consecutivo: selectedRemesa,
      fecha: fechaFormateada
    });
  };

  const handleCumplirManifiesto = () => {
    if (!selectedManifiesto || !selectedManifiestoDate) {
      toast({
        title: "⚠️ Datos incompletos",
        description: "Selecciona un manifiesto y una fecha de cumplimiento",
        variant: "destructive",
      });
      return;
    }

    const fechaFormateada = format(selectedManifiestoDate, 'dd/MM/yyyy');
    cumplirManifiestoMutation.mutate({
      numeroManifiesto: selectedManifiesto,
      fecha: fechaFormateada
    });
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <CheckCircle className="h-8 w-8 text-green-600" />
        <h1 className="text-3xl font-bold">Cumplimiento RNDC</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cumplimiento de Remesas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-600" />
              <span>Cumplir Remesas</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingRemesas ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <h3 className="font-medium">Remesas exitosas ({remesasExitosas.length})</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {remesasExitosas.map((remesa: Remesa) => (
                      <div 
                        key={remesa.id}
                        className={cn(
                          "p-3 border rounded-lg cursor-pointer hover:bg-gray-50",
                          selectedRemesa === remesa.consecutivo && "border-blue-500 bg-blue-50"
                        )}
                        onClick={() => setSelectedRemesa(remesa.consecutivo)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">Remesa {remesa.consecutivo}</div>
                            <div className="text-sm text-gray-600">
                              Placa: {remesa.placa} • {remesa.toneladas} ton
                            </div>
                          </div>
                          <Badge variant="secondary">
                            {remesa.estado}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">Fecha de cumplimiento</h3>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedRemesaDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedRemesaDate ? (
                          format(selectedRemesaDate, "PPP", { locale: es })
                        ) : (
                          "Seleccionar fecha"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedRemesaDate}
                        onSelect={setSelectedRemesaDate}
                        initialFocus
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <Button 
                  onClick={handleCumplirRemesa}
                  disabled={!selectedRemesa || !selectedRemesaDate || cumplirRemesaMutation.isPending}
                  className="w-full"
                >
                  {cumplirRemesaMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Cumpliendo...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Cumplir Remesa
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Cumplimiento de Manifiestos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Truck className="h-5 w-5 text-green-600" />
              <span>Cumplir Manifiestos</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loadingManifiestos ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <h3 className="font-medium">Manifiestos exitosos ({manifiestosPendientes.length})</h3>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {manifiestosPendientes.map((manifiesto: Manifiesto) => (
                      <div 
                        key={manifiesto.id}
                        className={cn(
                          "p-3 border rounded-lg cursor-pointer hover:bg-gray-50",
                          selectedManifiesto === manifiesto.numero_manifiesto && "border-green-500 bg-green-50"
                        )}
                        onClick={() => setSelectedManifiesto(manifiesto.numero_manifiesto)}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-medium">Manifiesto {manifiesto.numero_manifiesto}</div>
                            <div className="text-sm text-gray-600">
                              Remesa: {manifiesto.consecutivo_remesa}
                            </div>
                            {manifiesto.ingreso_id && (
                              <div className="text-xs text-green-600">
                                ID RNDC: {manifiesto.ingreso_id}
                              </div>
                            )}
                          </div>
                          <Badge variant="secondary">
                            {manifiesto.estado}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium">Fecha de cumplimiento</h3>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !selectedManifiestoDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedManifiestoDate ? (
                          format(selectedManifiestoDate, "PPP", { locale: es })
                        ) : (
                          "Seleccionar fecha"
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedManifiestoDate}
                        onSelect={setSelectedManifiestoDate}
                        initialFocus
                        locale={es}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <Button 
                  onClick={handleCumplirManifiesto}
                  disabled={!selectedManifiesto || !selectedManifiestoDate || cumplirManifiestoMutation.isPending}
                  className="w-full"
                >
                  {cumplirManifiestoMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Cumpliendo...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Cumplir Manifiesto
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Respuesta del RNDC */}
      {rndcResponse && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-600" />
              <span>Respuesta del RNDC</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Badge variant={rndcResponse.success ? "default" : "destructive"}>
                  {rndcResponse.success ? "Exitoso" : "Error"}
                </Badge>
                {rndcResponse.consecutivo && (
                  <span className="text-sm text-gray-600">Remesa: {rndcResponse.consecutivo}</span>
                )}
              </div>
              
              {rndcResponse.mensaje && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="font-medium text-sm">Mensaje:</div>
                  <div className="text-sm">{rndcResponse.mensaje}</div>
                </div>
              )}
              
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="font-medium text-sm">Respuesta completa:</div>
                <pre className="text-xs mt-2 overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(rndcResponse, null, 2)}
                </pre>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setRndcResponse(null)}
              >
                Cerrar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Información sobre el proceso */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-orange-600" />
            <span>Información del Proceso</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs mt-0.5">1</div>
              <div>
                <div className="font-medium">Cumplir Remesa</div>
                <div className="text-gray-600">Reporta que la carga fue entregada en el destino. Debe hacerse primero.</div>
              </div>
            </div>
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-xs mt-0.5">2</div>
              <div>
                <div className="font-medium">Cumplir Manifiesto</div>
                <div className="text-gray-600">Reporta que el manifiesto fue completado. Solo después de cumplir la remesa.</div>
              </div>
            </div>
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="font-medium text-yellow-800">⚠️ Importante</div>
              <div className="text-yellow-700">El cumplimiento solo se puede hacer cuando las condiciones reales de entrega se han cumplido.</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}