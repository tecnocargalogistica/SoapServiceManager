import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { insertSedeSchema, type InsertSede, type Sede } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface SedeFormProps {
  sede?: Sede;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SedeForm({ sede, onSuccess, onCancel }: SedeFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: municipios = [] } = useQuery({
    queryKey: ["/api/municipios"],
  });

  const form = useForm<InsertSede>({
    resolver: zodResolver(insertSedeSchema),
    defaultValues: sede ? {
      codigo_sede: sede.codigo_sede,
      nombre: sede.nombre,
      direccion: sede.direccion || "",
      municipio_codigo: sede.municipio_codigo,
      telefono: sede.telefono || "",
      valor_tonelada: sede.valor_tonelada || "",
      activo: sede.activo,
    } : {
      codigo_sede: "",
      nombre: "",
      direccion: "",
      municipio_codigo: "",
      telefono: "",
      valor_tonelada: "",
      activo: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertSede) => apiRequest("/api/sedes", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sedes"] });
      toast({ title: "Sede creada exitosamente" });
      onSuccess?.();
    },
    onError: () => {
      toast({ title: "Error al crear sede", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: InsertSede) => apiRequest(`/api/sedes/${sede?.id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sedes"] });
      toast({ title: "Sede actualizada exitosamente" });
      onSuccess?.();
    },
    onError: () => {
      toast({ title: "Error al actualizar sede", variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertSede) => {
    if (sede) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{sede ? "Editar Sede" : "Nueva Sede"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="codigo_sede">Código Sede *</Label>
              <Input
                id="codigo_sede"
                {...form.register("codigo_sede")}
                disabled={isLoading}
              />
              {form.formState.errors.codigo_sede && (
                <p className="text-sm text-red-500">{form.formState.errors.codigo_sede.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                {...form.register("nombre")}
                disabled={isLoading}
              />
              {form.formState.errors.nombre && (
                <p className="text-sm text-red-500">{form.formState.errors.nombre.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="direccion">Dirección</Label>
            <Input
              id="direccion"
              {...form.register("direccion")}
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="municipio_codigo">Municipio *</Label>
              <Select 
                onValueChange={(value) => form.setValue("municipio_codigo", value)}
                defaultValue={form.getValues("municipio_codigo")}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar municipio" />
                </SelectTrigger>
                <SelectContent>
                  {municipios.map((municipio: any) => (
                    <SelectItem key={municipio.codigo} value={municipio.codigo}>
                      {municipio.nombre} - {municipio.departamento}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.municipio_codigo && (
                <p className="text-sm text-red-500">{form.formState.errors.municipio_codigo.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                {...form.register("telefono")}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="valor_tonelada">Valor por Tonelada</Label>
              <Input
                id="valor_tonelada"
                {...form.register("valor_tonelada")}
                placeholder="65000"
                disabled={isLoading}
              />
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
              {isLoading ? "Guardando..." : sede ? "Actualizar" : "Crear"}
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