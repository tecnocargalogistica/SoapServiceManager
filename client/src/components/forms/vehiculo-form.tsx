import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { insertVehiculoSchema, type InsertVehiculo, type Vehiculo } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

interface VehiculoFormProps {
  vehiculo?: Vehiculo;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function VehiculoForm({ vehiculo, onSuccess, onCancel }: VehiculoFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertVehiculo>({
    resolver: zodResolver(insertVehiculoSchema),
    defaultValues: vehiculo ? {
      placa: vehiculo.placa,
      capacidad_carga: vehiculo.capacidad_carga,
      tipo_vehiculo: vehiculo.tipo_vehiculo || "",
      marca: vehiculo.marca || "",
      modelo: vehiculo.modelo || "",
      propietario_tipo_doc: vehiculo.propietario_tipo_doc,
      propietario_numero_doc: vehiculo.propietario_numero_doc,
      propietario_nombre: vehiculo.propietario_nombre,
      activo: vehiculo.activo,
    } : {
      placa: "",
      capacidad_carga: 0,
      tipo_vehiculo: "",
      marca: "",
      modelo: "",
      propietario_tipo_doc: "C",
      propietario_numero_doc: "",
      propietario_nombre: "",
      activo: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertVehiculo) => apiRequest("/api/vehiculos", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehiculos"] });
      toast({ title: "Vehículo creado exitosamente" });
      onSuccess?.();
    },
    onError: () => {
      toast({ title: "Error al crear vehículo", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: InsertVehiculo) => apiRequest(`/api/vehiculos/${vehiculo?.id}`, "PATCH", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehiculos"] });
      toast({ title: "Vehículo actualizado exitosamente" });
      onSuccess?.();
    },
    onError: () => {
      toast({ title: "Error al actualizar vehículo", variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertVehiculo) => {
    if (vehiculo) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{vehiculo ? "Editar Vehículo" : "Nuevo Vehículo"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="placa">Placa *</Label>
              <Input
                id="placa"
                {...form.register("placa")}
                placeholder="ABC123"
                disabled={isLoading}
              />
              {form.formState.errors.placa && (
                <p className="text-sm text-red-500">{form.formState.errors.placa.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="capacidad_carga">Capacidad de Carga (kg) *</Label>
              <Input
                id="capacidad_carga"
                type="number"
                {...form.register("capacidad_carga", { valueAsNumber: true })}
                placeholder="10000"
                disabled={isLoading}
              />
              {form.formState.errors.capacidad_carga && (
                <p className="text-sm text-red-500">{form.formState.errors.capacidad_carga.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="tipo_vehiculo">Tipo Vehículo</Label>
              <Select 
                onValueChange={(value) => form.setValue("tipo_vehiculo", value)}
                defaultValue={form.getValues("tipo_vehiculo")}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Camión">Camión</SelectItem>
                  <SelectItem value="Tractocamión">Tractocamión</SelectItem>
                  <SelectItem value="Camioneta">Camioneta</SelectItem>
                  <SelectItem value="Furgón">Furgón</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="marca">Marca</Label>
              <Input
                id="marca"
                {...form.register("marca")}
                placeholder="Chevrolet"
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="modelo">Modelo</Label>
              <Input
                id="modelo"
                {...form.register("modelo")}
                placeholder="2020"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Información del Propietario</h4>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="propietario_tipo_doc">Tipo Documento *</Label>
                <Select 
                  onValueChange={(value) => form.setValue("propietario_tipo_doc", value)}
                  defaultValue={form.getValues("propietario_tipo_doc")}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo doc" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="C">Cédula</SelectItem>
                    <SelectItem value="N">NIT</SelectItem>
                    <SelectItem value="P">Pasaporte</SelectItem>
                    <SelectItem value="E">Cédula Extranjería</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.propietario_tipo_doc && (
                  <p className="text-sm text-red-500">{form.formState.errors.propietario_tipo_doc.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="propietario_numero_doc">Número Documento *</Label>
                <Input
                  id="propietario_numero_doc"
                  {...form.register("propietario_numero_doc")}
                  placeholder="12345678"
                  disabled={isLoading}
                />
                {form.formState.errors.propietario_numero_doc && (
                  <p className="text-sm text-red-500">{form.formState.errors.propietario_numero_doc.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="propietario_nombre">Nombre Propietario *</Label>
                <Input
                  id="propietario_nombre"
                  {...form.register("propietario_nombre")}
                  placeholder="Juan Pérez"
                  disabled={isLoading}
                />
                {form.formState.errors.propietario_nombre && (
                  <p className="text-sm text-red-500">{form.formState.errors.propietario_nombre.message}</p>
                )}
              </div>
            </div>
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
              {isLoading ? "Guardando..." : vehiculo ? "Actualizar" : "Crear"}
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