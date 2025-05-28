import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { insertMunicipioSchema, type InsertMunicipio, type Municipio } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface MunicipioFormProps {
  municipio?: Municipio;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function MunicipioForm({ municipio, onSuccess, onCancel }: MunicipioFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertMunicipio>({
    resolver: zodResolver(insertMunicipioSchema),
    defaultValues: municipio ? {
      codigo: municipio.codigo,
      nombre: municipio.nombre,
      departamento: municipio.departamento,
      activo: municipio.activo,
    } : {
      codigo: "",
      nombre: "",
      departamento: "",
      activo: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertMunicipio) => apiRequest("/api/municipios", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/municipios"] });
      toast({ title: "Municipio creado exitosamente" });
      onSuccess?.();
    },
    onError: () => {
      toast({ title: "Error al crear municipio", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: InsertMunicipio) => apiRequest(`/api/municipios/${municipio?.id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/municipios"] });
      toast({ title: "Municipio actualizado exitosamente" });
      onSuccess?.();
    },
    onError: () => {
      toast({ title: "Error al actualizar municipio", variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertMunicipio) => {
    if (municipio) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{municipio ? "Editar Municipio" : "Nuevo Municipio"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="codigo">Código DANE *</Label>
              <Input
                id="codigo"
                {...form.register("codigo")}
                placeholder="25286000"
                disabled={isLoading}
              />
              {form.formState.errors.codigo && (
                <p className="text-sm text-red-500">{form.formState.errors.codigo.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="nombre">Nombre del Municipio *</Label>
              <Input
                id="nombre"
                {...form.register("nombre")}
                placeholder="Funza"
                disabled={isLoading}
              />
              {form.formState.errors.nombre && (
                <p className="text-sm text-red-500">{form.formState.errors.nombre.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="departamento">Departamento *</Label>
              <Input
                id="departamento"
                {...form.register("departamento")}
                placeholder="Cundinamarca"
                disabled={isLoading}
              />
              {form.formState.errors.departamento && (
                <p className="text-sm text-red-500">{form.formState.errors.departamento.message}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="activo"
                checked={form.watch("activo")}
                onCheckedChange={(checked) => form.setValue("activo", checked)}
                disabled={isLoading}
              />
              <Label htmlFor="activo">Activo</Label>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : municipio ? "Actualizar" : "Crear"}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}