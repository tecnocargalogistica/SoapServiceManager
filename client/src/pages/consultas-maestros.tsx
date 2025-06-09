import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Search, Download, FileSpreadsheet, AlertCircle, CheckCircle, Clock, Car } from "lucide-react";
import * as XLSX from 'xlsx';

interface ConsultaResultado {
  placa: string;
  fechaVenceRTM?: string;
  clase?: string;
  pesoVehicular?: string;
  fechaMatricula?: string;
  estado: 'exitoso' | 'error' | 'pendiente';
  error?: string;
}

export default function ConsultasMaestros() {
  const [placas, setPlacas] = useState("");
  const [placaIndividual, setPlacaIndividual] = useState("");
  const [resultados, setResultados] = useState<ConsultaResultado[]>([]);
  const [consultaEnProgreso, setConsultaEnProgreso] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const { toast } = useToast();

  const consultarVehiculosMasivo = useMutation({
    mutationFn: async (listaPl: string[]) => {
      setConsultaEnProgreso(true);
      setProgreso(0);
      const resultadosTemp: ConsultaResultado[] = [];
      
      for (let i = 0; i < listaPl.length; i++) {
        const placa = listaPl[i].trim();
        if (!placa) continue;

        // Actualizar estado a pendiente
        const resultadoTemp: ConsultaResultado = {
          placa,
          estado: 'pendiente'
        };
        resultadosTemp.push(resultadoTemp);
        setResultados([...resultadosTemp]);

        try {
          const response = await fetch('/api/rndc/consultar-vehiculo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ placa })
          });

          const data = await response.json();
          
          if (data.success) {
            resultadosTemp[resultadosTemp.length - 1] = {
              placa,
              fechaVenceRTM: data.data.FECHAVENCE_RTM || 'No disponible',
              clase: data.data.CLASE || 'No disponible',
              pesoVehicular: data.data.PBV || 'No disponible',
              fechaMatricula: data.data.FECHA_MATRICULA || 'No disponible',
              estado: 'exitoso'
            };
          } else {
            resultadosTemp[resultadosTemp.length - 1] = {
              placa,
              estado: 'error',
              error: data.error || 'Error desconocido'
            };
          }
        } catch (error: any) {
          resultadosTemp[resultadosTemp.length - 1] = {
            placa,
            estado: 'error',
            error: error.message || 'Error de conexión'
          };
        }

        // Actualizar progreso
        const porcentaje = ((i + 1) / listaPl.length) * 100;
        setProgreso(porcentaje);
        setResultados([...resultadosTemp]);

        // Pequeña pausa para no saturar el servidor
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      setConsultaEnProgreso(false);
      return resultadosTemp;
    },
    onSuccess: (data) => {
      const exitosos = data.filter(r => r.estado === 'exitoso').length;
      const errores = data.filter(r => r.estado === 'error').length;
      
      toast({
        title: "Consulta finalizada",
        description: `${exitosos} exitosas, ${errores} con errores`
      });
    },
    onError: (error: any) => {
      setConsultaEnProgreso(false);
      toast({
        title: "Error en consulta masiva",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const consultarVehiculoIndividual = useMutation({
    mutationFn: async (placa: string) => {
      const response = await fetch('/api/rndc/consultar-vehiculo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placa })
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        const resultado: ConsultaResultado = {
          placa: placaIndividual,
          fechaVenceRTM: data.data.FECHAVENCE_RTM || 'No disponible',
          clase: data.data.CLASE || 'No disponible',
          pesoVehicular: data.data.PBV || 'No disponible',
          fechaMatricula: data.data.FECHA_MATRICULA || 'No disponible',
          estado: 'exitoso'
        };
        setResultados([resultado]);
        toast({
          title: "Consulta exitosa",
          description: `Información obtenida para placa ${placaIndividual}`
        });
      } else {
        const resultado: ConsultaResultado = {
          placa: placaIndividual,
          estado: 'error',
          error: data.error || 'Error desconocido'
        };
        setResultados([resultado]);
        toast({
          title: "Error en consulta",
          description: data.error,
          variant: "destructive"
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error de conexión",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleConsultaMasiva = () => {
    const listePlacas = placas.split('\n').filter(p => p.trim());
    if (listePlacas.length === 0) {
      toast({
        title: "Error",
        description: "Debe ingresar al menos una placa",
        variant: "destructive"
      });
      return;
    }
    consultarVehiculosMasivo.mutate(listePlacas);
  };

  const handleConsultaIndividual = () => {
    if (!placaIndividual.trim()) {
      toast({
        title: "Error",
        description: "Debe ingresar una placa",
        variant: "destructive"
      });
      return;
    }
    consultarVehiculoIndividual.mutate(placaIndividual);
  };

  const exportarExcel = () => {
    if (resultados.length === 0) {
      toast({
        title: "Sin datos",
        description: "No hay resultados para exportar",
        variant: "destructive"
      });
      return;
    }

    const datosExcel = resultados.map(r => ({
      'Placa': r.placa,
      'Fecha Venc. RTM': r.fechaVenceRTM || 'Error',
      'Clase': r.clase || 'Error',
      'Peso Bruto Vehicular': r.pesoVehicular || 'Error',
      'Fecha Matrícula': r.fechaMatricula || 'Error',
      'Estado': r.estado === 'exitoso' ? 'Exitoso' : 'Error',
      'Error': r.error || ''
    }));

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(datosExcel);
    
    // Ajustar ancho de columnas
    const columnWidths = [
      { wch: 12 }, // Placa
      { wch: 15 }, // Fecha Venc. RTM
      { wch: 15 }, // Clase
      { wch: 20 }, // Peso Bruto Vehicular
      { wch: 15 }, // Fecha Matrícula
      { wch: 10 }, // Estado
      { wch: 30 }  // Error
    ];
    worksheet['!cols'] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Consulta Vehículos');
    
    const fecha = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `consulta_vehiculos_${fecha}.xlsx`);
    
    toast({
      title: "Exportación exitosa",
      description: "El archivo Excel ha sido descargado"
    });
  };

  const cargarPlacasPredeterminadas = () => {
    const placasPredeterminadas = `SNK427
SUA918
WLX851
EXZ070
THV551
XMD166
XUF241
XVU026
SVO646
XJA148
SMY613
S86939
SPX104
SRD194
SNL013
WON420
SKG744
GIT990
USB969
EQQ281
WLT280
NOX203
EYY570
ELB367
WSJ314
WNX547
WPT526
HUH024
SMR430
HJG254
SVE930
WPK570
TSS590
TPX480
UQA241
SYR577
WMP872
TGK062
SVD081
KUK903
WPT522
SNC418
OSD675
IND177
WHK426
KMY499
XJA443
CHN307
UFW682
JVK778
SWL473
SVE736
TPX600
SKF693
CLC335
STE103
TAM317
R71700
UFU770
KMY692
AJE382
VAK090
WZH992
WZI225
SXW283
GCH246
WGP153
SKO299
XGJ197
SVF524
ZIE523
XVM387
JTZ488
JUZ298
VKI905
XGJ941
STO593
FDF049
SAK206
WCU103
TRB618
XLF054
ASG748
SAK539
SJQ646
VDA692
SWR115
TZT417
FSU597
SRM119
LFQ638
SKY312
SKO681
SDJ306
SQA785
SOP199
THW234
TNB901
SNL014
SNB197
JRY838
TBZ901
FDA764
AQD045
SRR855
BDA360
S69187
SVA924
R65415
SEY071
S57088
TMY202
KEH220
SRD997
TIP748
WZH215
WZH091
XKF301
THQ957
JAE942
SNE056
SVE757
SNA462
XXB191
SVE606
OQF427
WZH466
SRO568
SRD193
SHB454
VPB224
EMA133
SVM159
S66671
THQ859
R59734
STO582
R77935
UZN449
S55748
UFK178
R37338
SKM930
S51977
SXW023
R44126
SLH113
R62650
TFT564
S57695
SNT050
USD450
SRO552
NUZ311
LJT265
USD747
SJQ704
TTT887
SVA603
CUB462
WPQ150
SNO354
SVD754
UVE838
OBA243
KNM294
LPY281
LPY273
TND676
SLE817
WFI710
UVE539
SOQ402
FUJ607
VMT301
SZX465
SET178
XKD935
LTA352
TAM080`;
    setPlacas(placasPredeterminadas);
  };

  const estadisticas = {
    total: resultados.length,
    exitosos: resultados.filter(r => r.estado === 'exitoso').length,
    errores: resultados.filter(r => r.estado === 'error').length,
    pendientes: resultados.filter(r => r.estado === 'pendiente').length
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Maestros Consulta</h1>
          <p className="text-muted-foreground">
            Consulta masiva de información vehicular RNDC
          </p>
        </div>
        <Car className="h-8 w-8 text-primary" />
      </div>

      <Tabs defaultValue="masiva" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="masiva">Consulta Masiva</TabsTrigger>
          <TabsTrigger value="individual">Consulta Individual</TabsTrigger>
        </TabsList>

        <TabsContent value="masiva" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Consulta Masiva de Vehículos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Lista de Placas (una por línea)</label>
                <Textarea
                  placeholder="Ingrese las placas, una por línea..."
                  value={placas}
                  onChange={(e) => setPlacas(e.target.value)}
                  rows={10}
                  className="font-mono"
                />
              </div>
              
              <div className="flex gap-2">
                <Button
                  onClick={handleConsultaMasiva}
                  disabled={consultaEnProgreso || !placas.trim()}
                  className="flex-1"
                >
                  {consultaEnProgreso ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Consultando...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Iniciar Consulta Masiva
                    </>
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={cargarPlacasPredeterminadas}
                  disabled={consultaEnProgreso}
                >
                  Cargar Lista Completa
                </Button>
              </div>

              {consultaEnProgreso && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progreso de consulta</span>
                    <span>{Math.round(progreso)}%</span>
                  </div>
                  <Progress value={progreso} className="w-full" />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="individual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Consulta Individual
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Placa del Vehículo</label>
                <Input
                  placeholder="Ej: SNC418"
                  value={placaIndividual}
                  onChange={(e) => setPlacaIndividual(e.target.value.toUpperCase())}
                  className="uppercase"
                />
              </div>
              
              <Button
                onClick={handleConsultaIndividual}
                disabled={consultarVehiculoIndividual.isPending || !placaIndividual.trim()}
                className="w-full"
              >
                {consultarVehiculoIndividual.isPending ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Consultando...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Consultar Vehículo
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Estadísticas */}
      {resultados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Estadísticas de Consulta</span>
              <Button
                onClick={exportarExcel}
                variant="outline"
                className="flex items-center gap-2"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Exportar Excel
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{estadisticas.total}</div>
                <div className="text-sm text-blue-600">Total</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{estadisticas.exitosos}</div>
                <div className="text-sm text-green-600">Exitosos</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{estadisticas.errores}</div>
                <div className="text-sm text-red-600">Errores</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{estadisticas.pendientes}</div>
                <div className="text-sm text-yellow-600">Pendientes</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resultados */}
      {resultados.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados de Consulta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {resultados.map((resultado, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {resultado.estado === 'exitoso' && <CheckCircle className="h-5 w-5 text-green-500" />}
                    {resultado.estado === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
                    {resultado.estado === 'pendiente' && <Clock className="h-5 w-5 text-yellow-500 animate-spin" />}
                    
                    <div>
                      <div className="font-medium">{resultado.placa}</div>
                      {resultado.estado === 'exitoso' && (
                        <div className="text-sm text-muted-foreground">
                          RTM: {resultado.fechaVenceRTM} | Clase: {resultado.clase} | PBV: {resultado.pesoVehicular} | Matrícula: {resultado.fechaMatricula}
                        </div>
                      )}
                      {resultado.estado === 'error' && (
                        <div className="text-sm text-red-600">{resultado.error}</div>
                      )}
                    </div>
                  </div>
                  
                  <Badge variant={
                    resultado.estado === 'exitoso' ? 'default' : 
                    resultado.estado === 'error' ? 'destructive' : 'secondary'
                  }>
                    {resultado.estado === 'exitoso' ? 'Exitoso' : 
                     resultado.estado === 'error' ? 'Error' : 'Pendiente'}
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