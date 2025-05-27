import { useEffect } from "react";
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

  // Limpiar campos cuando se cambia el tipo de tercero
  const esEmpresa = form.watch("es_empresa");
  
  // Efecto para limpiar/llenar campos según el tipo
  useEffect(() => {
    if (esEmpresa) {
      // Si es empresa, limpiar nombre y apellido, y usar razón social como nombre si está vacío
      const razonSocial = form.getValues("razon_social");
      if (razonSocial && !form.getValues("nombre")) {
        form.setValue("nombre", razonSocial);
      }
      form.setValue("apellido", "");
    } else {
      // Si no es empresa, asegurar que el nombre no esté vacío
      const nombre = form.getValues("nombre");
      const razonSocial = form.getValues("razon_social");
      if (!nombre && razonSocial) {
        form.setValue("nombre", razonSocial);
      }
    }
  }, [esEmpresa, form]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertTercero) => {
      const response = await apiRequest("/api/terceros", "POST", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/terceros"] });
      toast({ title: "Tercero creado exitosamente" });
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error("Error creating tercero:", error);
      toast({ 
        title: "Error al crear tercero", 
        description: error.message || "Error desconocido",
        variant: "destructive" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertTercero) => {
      const response = await apiRequest(`/api/terceros/${tercero?.id}`, "PUT", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/terceros"] });
      toast({ title: "Tercero actualizado exitosamente" });
      onSuccess?.();
    },
    onError: (error: any) => {
      console.error("Error updating tercero:", error);
      toast({ 
        title: "Error al actualizar tercero", 
        description: error.message || "Error desconocido",
        variant: "destructive" 
      });
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
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{tercero ? "Editar Tercero" : "Nuevo Tercero"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Información Básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Información Básica</h3>
            
            {/* Campos para personas naturales (no empresas) */}
            {!form.watch("es_empresa") && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    {...form.register("nombre")}
                    placeholder="Juan Pérez"
                    disabled={isLoading}
                  />
                  {form.formState.errors.nombre && (
                    <p className="text-sm text-red-500">{form.formState.errors.nombre.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="apellido">Apellido</Label>
                  <Input
                    id="apellido"
                    {...form.register("apellido")}
                    placeholder="García López"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {/* Campo para empresas */}
            {form.watch("es_empresa") && (
              <div>
                <Label htmlFor="razon_social">Razón Social *</Label>
                <Input
                  id="razon_social"
                  {...form.register("razon_social")}
                  placeholder="EMPRESA TRANSPORTE S.A.S."
                  disabled={isLoading}
                />
                {form.formState.errors.razon_social && (
                  <p className="text-sm text-red-500">{form.formState.errors.razon_social.message}</p>
                )}
              </div>
            )}

            {/* Campo opcional para personas naturales */}
            {!form.watch("es_empresa") && (
              <div>
                <Label htmlFor="razon_social">Razón Social (Opcional)</Label>
                <Input
                  id="razon_social"
                  {...form.register("razon_social")}
                  placeholder="EMPRESA PERSONAL LTDA"
                  disabled={isLoading}
                />
              </div>
            )}

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
          </div>

          {/* Información de Contacto */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Información de Contacto</h3>
            
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
                  placeholder="300 123 4567"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                placeholder="correo@ejemplo.com"
                disabled={isLoading}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500">{form.formState.errors.email.message}</p>
              )}
            </div>
          </div>

          {/* Tipo de Tercero */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Tipo de Tercero</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="es_empresa"
                  checked={form.watch("es_empresa")}
                  onCheckedChange={(checked) => form.setValue("es_empresa", checked)}
                  disabled={isLoading}
                />
                <Label htmlFor="es_empresa">Es Empresa</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="es_conductor"
                  checked={form.watch("es_conductor")}
                  onCheckedChange={(checked) => form.setValue("es_conductor", checked)}
                  disabled={isLoading}
                />
                <Label htmlFor="es_conductor">Es Conductor</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="es_propietario"
                  checked={form.watch("es_propietario")}
                  onCheckedChange={(checked) => form.setValue("es_propietario", checked)}
                  disabled={isLoading}
                />
                <Label htmlFor="es_propietario">Es Propietario</Label>
              </div>
            </div>
          </div>

          {/* Información de Licencia (solo si es conductor) */}
          {form.watch("es_conductor") && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Información de Licencia</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="categoria_licencia">Categoría de Licencia</Label>
                  <Select 
                    onValueChange={(value) => form.setValue("categoria_licencia", value)}
                    defaultValue={form.getValues("categoria_licencia")}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A1">A1</SelectItem>
                      <SelectItem value="A2">A2</SelectItem>
                      <SelectItem value="B1">B1</SelectItem>
                      <SelectItem value="B2">B2</SelectItem>
                      <SelectItem value="B3">B3</SelectItem>
                      <SelectItem value="C1">C1</SelectItem>
                      <SelectItem value="C2">C2</SelectItem>
                      <SelectItem value="C3">C3</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="numero_licencia">Número de Licencia</Label>
                  <Input
                    id="numero_licencia"
                    {...form.register("numero_licencia")}
                    placeholder="12345678"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="fecha_vencimiento_licencia">Fecha de Vencimiento</Label>
                <Input
                  id="fecha_vencimiento_licencia"
                  type="date"
                  {...form.register("fecha_vencimiento_licencia")}
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {/* Vehículo Asignado (solo si es conductor) */}
          {form.watch("es_conductor") && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Vehículo Asignado</h3>
              
              <div>
                <Label htmlFor="id_vehiculo_asignado">Vehículo</Label>
                <Select 
                  onValueChange={(value) => form.setValue("id_vehiculo_asignado", value ? parseInt(value) : undefined)}
                  defaultValue={form.getValues("id_vehiculo_asignado")?.toString()}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar vehículo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Sin vehículo asignado</SelectItem>
                    {(vehiculos as any[]).map((vehiculo: any) => (
                      <SelectItem key={vehiculo.id} value={vehiculo.id.toString()}>
                        {vehiculo.placa} - {vehiculo.marca} {vehiculo.modelo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Estado */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="activo"
                checked={form.watch("activo")}
                onCheckedChange={(checked) => form.setValue("activo", checked)}
                disabled={isLoading}
              />
              <Label htmlFor="activo">Tercero activo</Label>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button 
              type="submit" 
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? "Guardando..." : (tercero ? "Actualizar" : "Crear")}
            </Button>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}