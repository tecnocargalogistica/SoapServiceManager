import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Copy, Send, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function SOAPCliente() {
  const [endpoint, setEndpoint] = useState("http://rndcws.mintransporte.gov.co:8080/ws");
  const [modoProduccion, setModoProduccion] = useState(true);
  const [xmlRequest, setXmlRequest] = useState("");
  const [xmlResponse, setXmlResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [lastRequestStatus, setLastRequestStatus] = useState<"success" | "error" | null>(null);
  const { toast } = useToast();

  const cargarXMLEjemplo = async () => {
    try {
      const response = await fetch('/api/rndc/test-specific-xml', { method: 'POST' });
      const data = await response.json();
      
      if (data.success && data.xmlSent) {
        setXmlRequest(data.xmlSent);
        toast({
          title: "XML cargado",
          description: "Se ha cargado el XML de ejemplo de una remesa real"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo cargar el XML de ejemplo",
        variant: "destructive"
      });
    }
  };

  const formatearXML = () => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlRequest, "application/xml");
      const serializer = new XMLSerializer();
      const formatted = serializer.serializeToString(xmlDoc);
      
      // Formatear manualmente para mejor visualización
      const formattedXML = formatted
        .replace(/></g, '>\n<')
        .split('\n')
        .map((line, index) => {
          const depth = (line.match(/</g) || []).length - (line.match(/\//g) || []).length;
          return '  '.repeat(Math.max(0, depth)) + line.trim();
        })
        .join('\n');
      
      setXmlRequest(formattedXML);
      toast({
        title: "XML formateado",
        description: "El XML ha sido formateado correctamente"
      });
    } catch (error) {
      toast({
        title: "Error de formato",
        description: "El XML no tiene un formato válido",
        variant: "destructive"
      });
    }
  };

  const enviarSolicitud = async () => {
    if (!xmlRequest.trim()) {
      toast({
        title: "XML requerido",
        description: "Debes proporcionar un XML de solicitud",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    setXmlResponse("");
    setLastRequestStatus(null);

    try {
      const response = await apiRequest('/api/rndc/test-specific-xml', 'POST', { xmlContent: xmlRequest });
      
      if (response.ok) {
        const responseData = await response.json();
        
        // Formatear la respuesta de manera clara y legible
        let formattedResponse = `=== RESPUESTA DEL RNDC ===\n\n`;
        
        if (responseData.success) {
          formattedResponse += `✅ Estado: EXITOSO\n\n`;
          
          if (responseData.data?.rawResponse) {
            // Extraer y formatear el XML interno del RNDC
            const rawXml = responseData.data.rawResponse;
            
            // Buscar el contenido dentro de <return>
            const returnMatch = rawXml.match(/<return[^>]*>(.*?)<\/return>/s);
            if (returnMatch) {
              const innerXml = returnMatch[1]
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&amp;/g, '&');
              
              formattedResponse += `📄 Respuesta procesada por el RNDC:\n${innerXml}\n\n`;
            }
            
            formattedResponse += `🔍 Respuesta SOAP completa:\n${rawXml}`;
          }
          
          if (responseData.consecutivo) {
            formattedResponse += `\n\n🔢 Consecutivo: ${responseData.consecutivo}`;
          }
          
        } else {
          formattedResponse += `❌ Estado: ERROR\n\n`;
          formattedResponse += `💬 Mensaje: ${responseData.mensaje || 'Error desconocido'}\n\n`;
          if (responseData.error) {
            formattedResponse += `🚨 Error: ${responseData.error}`;
          }
        }
        
        setXmlResponse(formattedResponse);
        setLastRequestStatus(responseData.success ? "success" : "error");
        
        toast({
          title: responseData.success ? "¡Respuesta exitosa del RNDC!" : "Respuesta del RNDC",
          description: responseData.success ? "El RNDC procesó tu solicitud correctamente" : "Revisa la respuesta para más detalles",
          variant: responseData.success ? "default" : "destructive"
        });
      } else {
        const errorText = await response.text();
        setXmlResponse(`Error HTTP ${response.status}: ${errorText}`);
        setLastRequestStatus("error");
        toast({
          title: "Error en solicitud",
          description: `Error ${response.status} del servidor`,
          variant: "destructive"
        });
      }
    } catch (error) {
      setXmlResponse(`Error de conexión: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      setLastRequestStatus("error");
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con el servidor",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copiarAlPortapapeles = (texto: string, tipo: string) => {
    navigator.clipboard.writeText(texto);
    toast({
      title: "Copiado",
      description: `${tipo} copiado al portapapeles`
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <Card className="mb-6">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-blue-600">
            Cliente SOAP para RNDC
          </CardTitle>
          <CardDescription className="text-gray-600">
            Envía solicitudes al Web Service del Registro Nacional de Despachos de Carga
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel de Solicitud */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Solicitud</CardTitle>
              <Badge variant={modoProduccion ? "destructive" : "secondary"}>
                {modoProduccion ? "Realizando solicitudes reales al servidor" : "Modo Prueba"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Configuración del Endpoint */}
            <div className="space-y-2">
              <Label htmlFor="endpoint">Endpoint SOAP</Label>
              <Input
                id="endpoint"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="URL del servicio SOAP"
              />
            </div>

            {/* Switch de Modo Producción */}
            <div className="flex items-center justify-between">
              <Label htmlFor="modo-produccion">Modo Producción</Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="modo-produccion"
                  checked={modoProduccion}
                  onCheckedChange={setModoProduccion}
                />
                <span className="text-sm text-orange-600">
                  Realizando solicitudes reales al servidor
                </span>
              </div>
            </div>

            {/* Área de XML Request */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>XML Request</Label>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={cargarXMLEjemplo}
                  >
                    Cargar Ejemplo
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={formatearXML}
                  >
                    Formatear XML
                  </Button>
                </div>
              </div>
              <Textarea
                value={xmlRequest}
                onChange={(e) => setXmlRequest(e.target.value)}
                placeholder="Ingresa o pega aquí tu XML de solicitud SOAP..."
                className="min-h-[400px] font-mono text-sm"
              />
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copiarAlPortapapeles(xmlRequest, "XML de solicitud")}
                  disabled={!xmlRequest}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar
                </Button>
                <Button 
                  onClick={enviarSolicitud}
                  disabled={isLoading || !xmlRequest.trim()}
                  className="bg-orange-500 hover:bg-orange-600"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 mr-2" />
                  )}
                  Enviar Solicitud Real
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Panel de Respuesta */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Respuesta</CardTitle>
              {lastRequestStatus && (
                <div className="flex items-center space-x-1">
                  {lastRequestStatus === "success" ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className={`text-sm ${lastRequestStatus === "success" ? "text-green-600" : "text-red-600"}`}>
                    {lastRequestStatus === "success" ? "Éxito" : "Error"}
                  </span>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-[400px]">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                  <p className="text-gray-600">Enviando solicitud al RNDC...</p>
                </div>
              </div>
            ) : xmlResponse ? (
              <div className="space-y-4">
                <Tabs defaultValue="raw" className="w-full">
                  <TabsList>
                    <TabsTrigger value="raw">Respuesta Cruda</TabsTrigger>
                    <TabsTrigger value="formatted">Formateada</TabsTrigger>
                  </TabsList>
                  <TabsContent value="raw">
                    <Textarea
                      value={xmlResponse}
                      readOnly
                      className="min-h-[400px] font-mono text-sm"
                    />
                  </TabsContent>
                  <TabsContent value="formatted">
                    <div className="border rounded-md p-4 min-h-[400px] bg-gray-50">
                      <pre className="text-sm overflow-auto whitespace-pre-wrap">
                        {xmlResponse}
                      </pre>
                    </div>
                  </TabsContent>
                </Tabs>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copiarAlPortapapeles(xmlResponse, "Respuesta")}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar Respuesta
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-center h-[400px] text-gray-500">
                <div className="text-center">
                  <Send className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p>La respuesta del RNDC aparecerá aquí</p>
                  <p className="text-sm">Envía una solicitud para ver los resultados</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {modoProduccion && (
        <Alert className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Modo Producción Activo:</strong> Las solicitudes se envían al servidor real del RNDC. 
            Asegúrate de que tu XML sea válido y contenga datos reales antes de enviar.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}