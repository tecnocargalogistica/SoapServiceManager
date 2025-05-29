import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function TestCumplimiento() {
  const [xmlContent, setXmlContent] = useState("");

  const generarXML = async () => {
    try {
      const response = await fetch("/api/cumplimiento/preview/79824058");
      const data = await response.json();
      
      if (data.success) {
        setXmlContent(data.xml);
      } else {
        setXmlContent(`Error: ${data.error}`);
      }
    } catch (error) {
      setXmlContent(`Error de conexión: ${error}`);
    }
  };

  const enviarAlRNDC = async () => {
    if (!xmlContent) return;
    
    try {
      const response = await fetch("/api/rndc/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xmlContent }),
      });
      const data = await response.json();
      
      alert(data.success ? "¡Enviado exitosamente!" : `Error: ${data.mensaje}`);
    } catch (error) {
      alert(`Error: ${error}`);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>Cumplimiento Remesa 79824058</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={generarXML}>
            Ver XML de Cumplimiento
          </Button>
          
          {xmlContent && (
            <div className="space-y-4">
              <div className="bg-slate-100 p-4 rounded">
                <pre className="text-sm overflow-auto">{xmlContent}</pre>
              </div>
              
              <Button 
                onClick={enviarAlRNDC}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Enviar al RNDC
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}