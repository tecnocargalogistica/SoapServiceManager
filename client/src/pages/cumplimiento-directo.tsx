import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function CumplimientoDirecto() {
  const [consecutivo, setConsecutivo] = useState("79824058");
  const [xmlPreview, setXmlPreview] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Obtener XML de vista previa
  const previewMutation = useMutation({
    mutationFn: async (consecutivo: string) => {
      const response = await fetch(`/api/cumplimiento/preview/${consecutivo}`);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setXmlPreview(data.xml);
        setShowPreview(true);
      } else {
        toast({
          title: "Error",
          description: data.error || "Error al generar XML",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Error al conectar con el servidor",
        variant: "destructive",
      });
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
        setShowPreview(false);
        setXmlPreview("");
      } else {
        toast({
          title: "Error del RNDC",
          description: data.mensaje || "Error al enviar al RNDC",
          variant: "destructive",
        });
      }
    },
  });

  const handlePreview = () => {
    if (!consecutivo.trim()) {
      toast({
        title: "Error",
        description: "Ingresa un consecutivo de remesa",
        variant: "destructive",
      });
      return;
    }
    previewMutation.mutate(consecutivo);
  };

  const handleEnviar = () => {
    if (xmlPreview) {
      enviarMutation.mutate(xmlPreview);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cumplimiento Directo</h1>
          <p className="text-muted-foreground">
            Cumple remesas directamente con generación automática de XML
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Datos de Cumplimiento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="consecutivo">Consecutivo de Remesa</Label>
              <Input
                id="consecutivo"
                value={consecutivo}
                onChange={(e) => setConsecutivo(e.target.value)}
                placeholder="Ej: 79824058"
              />
            </div>
            
            <div className="flex gap-4">
              <Button 
                onClick={handlePreview}
                disabled={previewMutation.isPending}
              >
                {previewMutation.isPending ? "Generando..." : "Ver XML"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {showPreview && xmlPreview && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                XML de Cumplimiento
                <div className="flex gap-2">
                  <Button 
                    onClick={handleEnviar}
                    disabled={enviarMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {enviarMutation.isPending ? "Enviando..." : "Enviar al RNDC"}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setShowPreview(false)}
                  >
                    Cancelar
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">
                {xmlPreview}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}