import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

// Schema de validación
const consecutivoSchema = z.object({
  tipo: z.enum(["remesa", "manifiesto"], {
    required_error: "Debe seleccionar un tipo"
  }),
  ultimo_numero: z.number().min(1, "Debe ser mayor a 0"),
  prefijo: z.string().optional(),
  año: z.number().min(2020).max(2030, "Año inválido")
});

type ConsecutivoFormData = z.infer<typeof consecutivoSchema>;

interface ConsecutivoFormProps {
  consecutivo?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ConsecutivoForm({ consecutivo, onSuccess, onCancel }: ConsecutivoFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ConsecutivoFormData>({
    resolver: zodResolver(consecutivoSchema),
    defaultValues: {
      tipo: consecutivo?.tipo || "remesa",
      ultimo_numero: consecutivo?.ultimo_numero || 1,
      prefijo: consecutivo?.prefijo || "",
      año: consecutivo?.año || new Date().getFullYear()
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data: ConsecutivoFormData) => {
      const endpoint = consecutivo 
        ? `/api/consecutivos/${consecutivo.id}`
        : "/api/consecutivos";
      
      const method = consecutivo ? "PATCH" : "POST";
      
      const response = await apiRequest(method, endpoint, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/consecutivos"] });
      toast({
        title: "Consecutivo guardado",
        description: "Los cambios se han guardado correctamente"
      });
      onSuccess();
    },
    onError: (error: any) => {
      console.error("Error al guardar consecutivo:", error);
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar el consecutivo",
        variant: "destructive"
      });
    }
  });

  const onSubmit = async (data: ConsecutivoFormData) => {
    setIsSubmitting(true);
    try {
      await saveMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle>
          {consecutivo ? "Editar Consecutivo" : "Nuevo Consecutivo"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Tipo */}
            <FormField
              control={form.control}
              name="tipo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    disabled={!!consecutivo} // No permitir cambiar tipo si está editando
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="remesa">Remesa</SelectItem>
                      <SelectItem value="manifiesto">Manifiesto</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Último Número */}
            <FormField
              control={form.control}
              name="ultimo_numero"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Último Número</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Ej: 20250475"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Prefijo */}
            <FormField
              control={form.control}
              name="prefijo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prefijo (Opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej: REM, MAN"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Año */}
            <FormField
              control={form.control}
              name="año"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Año</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="2025"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || new Date().getFullYear())}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Botones */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}