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
import { insertTerceroSchema, type InsertTercero, type Tercero } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface TerceroFormProps {
  tercero?: Tercero;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function TerceroForm({ tercero, onSuccess, onCancel }: TerceroFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: municipios = [] } = useQuery({
    queryKey: ["/api/municipios"],
  });

  const { data: vehiculos = [] } = useQuery({
    queryKey: ["/api/vehiculos"],
  });

  const form = useForm<InsertTercero>({
    resolver: zodResolver(insertTerceroSchema),
    defaultValues: tercero ? {
      nombre: tercero.nombre,
      tipo_documento: tercero.tipo_documento,
      numero_documento: tercero.numero_documento,
      razon_social: tercero.razon_social || "",
      apellido: tercero.apellido || "",
      direccion: tercero.direccion || "",
      municipio_codigo: tercero.municipio_codigo || "",
      telefono: tercero.telefono || "",
      email: tercero.email || "",
      es_empresa: tercero.es_empresa || false,
      es_conductor: tercero.es_conductor || false,
      es_propietario: tercero.es_propietario || false,
      categoria_licencia: tercero.categoria_licencia || "",
      numero_licencia: tercero.numero_licencia || "",
      fecha_vencimiento_licencia: tercero.fecha_vencimiento_licencia || "",
      id_vehiculo_asignado: tercero.id_vehiculo_asignado || undefined,
      activo: tercero.activo,
    } : {
      nombre: "",
      tipo_documento: "C",
      numero_documento: "",
      razon_social: "",
      apellido: "",
      direccion: "",
      municipio_codigo: "",
      telefono: "",
      email: "",
      es_empresa: false,
      es_conductor: false,
      es_propietario: false,
      categoria_licencia: "",
      numero_licencia: "",
      fecha_vencimiento_licencia: "",
      id_vehiculo_asignado: undefined,
      activo: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertTercero) => apiRequest("/api/terceros", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/terceros"] });
      toast({ title: "Tercero creado exitosamente" });
      onSuccess?.();
    },
    onError: () => {
      toast({ title: "Error al crear tercero", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: InsertTercero) => apiRequest(`/api/terceros/${tercero?.id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/terceros"] });
      toast({ title: "Tercero actualizado exitosamente" });
      onSuccess?.();
    },
    onError: () => {
      toast({ title: "Error al actualizar tercero", variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertTercero) => {
    if (tercero) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tercero ? "Editar Tercero" : "Nuevo Tercero"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="nombre">Nombre o Razón Social *</Label>
            <Input
              id="nombre"
              {...form.register("nombre")}
              placeholder="Juan Pérez / EMPRESA TRANSPORTE S.A.S."
              disabled={isLoading}
            />
            {form.formState.errors.nombre && (
              <p className="text-sm text-red-500">{form.formState.errors.nombre.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tipo_documento">Tipo de Documento *</Label>
              <Select 
                onValueChange={(value) => form.setValue("tipo_documento", value)}
                defaultValue={form.getValues("tipo_documento")}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="C">Cédula de Ciudadanía</SelectItem>
                  <SelectItem value="N">NIT</SelectItem>
                  <SelectItem value="P">Pasaporte</SelectItem>
                  <SelectItem value="E">Cédula de Extranjería</SelectItem>
                  <SelectItem value="T">Tarjeta de Identidad</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.tipo_documento && (
                <p className="text-sm text-red-500">{form.formState.errors.tipo_documento.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="numero_documento">Número de Documento *</Label>
              <Input
                id="numero_documento"
                {...form.register("numero_documento")}
                placeholder="12345678 / 900123456-1"
                disabled={isLoading}
              />
              {form.formState.errors.numero_documento && (
                <p className="text-sm text-red-500">{form.formState.errors.numero_documento.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="direccion">Dirección</Label>
            <Input
              id="direccion"
              {...form.register("direccion")}
              placeholder="Calle 123 #45-67"
              disabled={isLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="municipio_codigo">Municipio</Label>
              <Select 
                onValueChange={(value) => form.setValue("municipio_codigo", value)}
                defaultValue={form.getValues("municipio_codigo")}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar municipio" />
                </SelectTrigger>
                <SelectContent>
                  {(municipios as any[]).map((municipio: any) => (
                    <SelectItem key={municipio.codigo} value={municipio.codigo}>
                      {municipio.nombre} - {municipio.departamento}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                {...form.register("telefono")}
                placeholder="3001234567"
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              type="email"
              {...form.register("email")}
              placeholder="correo@ejemplo.com"
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

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Guardando..." : tercero ? "Actualizar" : "Crear"}
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