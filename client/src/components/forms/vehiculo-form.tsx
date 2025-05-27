import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Vehiculo, InsertVehiculo } from "../../../../shared/schema";

// Schema de validación del formulario
const vehiculoFormSchema = z.object({
  // Características Generales
  placa: z.string().min(1, "La placa es requerida"),
  configuracion: z.string().optional(),
  clase: z.string().optional(),
  marca: z.string().optional(),
  servicio: z.string().optional(),
  numero_ejes: z.number().optional(),
  carroceria: z.string().optional(),
  modalidad: z.string().optional(),
  linea: z.string().optional(),
  tipo_combustible: z.string().optional(),
  capacidad_carga: z.number().min(1, "La capacidad de carga es requerida"),
  peso_vacio: z.number().optional(),
  fecha_matricula: z.string().optional(),
  modelo_año: z.number().optional(),
  peso_bruto_vehicular: z.number().optional(),
  unidad_medida: z.string().default("Kilogramos"),
  
  // Información SOAT y Revisión Tecnomecánica
  numero_poliza: z.string().optional(),
  aseguradora: z.string().optional(),
  nit_aseguradora: z.string().optional(),
  vence_soat: z.string().optional(),
  vence_revision_tecnomecanica: z.string().optional(),
  
  // Propietario
  propietario_tipo_doc: z.string().min(1, "El tipo de documento del propietario es requerido"),
  propietario_numero_doc: z.string().min(1, "El número de documento del propietario es requerido"),
  propietario_nombre: z.string().min(1, "El nombre del propietario es requerido"),
  
  // Tenedor (opcional)
  tenedor_tipo_doc: z.string().optional(),
  tenedor_numero_doc: z.string().optional(),
  tenedor_nombre: z.string().optional(),
  
  activo: z.boolean().default(true)
});

type VehiculoFormData = z.infer<typeof vehiculoFormSchema>;

interface VehiculoFormProps {
  vehiculo?: Vehiculo;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function VehiculoForm({ vehiculo, onSuccess, onCancel }: VehiculoFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showTenedor, setShowTenedor] = useState(false);
  
  const form = useForm<VehiculoFormData>({
    resolver: zodResolver(vehiculoFormSchema),
    defaultValues: vehiculo ? {
      placa: vehiculo.placa,
      configuracion: vehiculo.configuracion || "",
      clase: vehiculo.clase || "",
      marca: vehiculo.marca || "",
      servicio: vehiculo.servicio || "",
      numero_ejes: vehiculo.numero_ejes || undefined,
      carroceria: vehiculo.carroceria || "",
      modalidad: vehiculo.modalidad || "",
      linea: vehiculo.linea || "",
      tipo_combustible: vehiculo.tipo_combustible || "",
      capacidad_carga: vehiculo.capacidad_carga,
      peso_vacio: vehiculo.peso_vacio || undefined,
      fecha_matricula: vehiculo.fecha_matricula || "",
      modelo_año: vehiculo.modelo_año || undefined,
      peso_bruto_vehicular: vehiculo.peso_bruto_vehicular || undefined,
      unidad_medida: vehiculo.unidad_medida || "Kilogramos",
      numero_poliza: vehiculo.numero_poliza || "",
      aseguradora: vehiculo.aseguradora || "",
      nit_aseguradora: vehiculo.nit_aseguradora || "",
      vence_soat: vehiculo.vence_soat || "",
      vence_revision_tecnomecanica: vehiculo.vence_revision_tecnomecanica || "",
      propietario_tipo_doc: vehiculo.propietario_tipo_doc,
      propietario_numero_doc: vehiculo.propietario_numero_doc,
      propietario_nombre: vehiculo.propietario_nombre,
      tenedor_tipo_doc: vehiculo.tenedor_tipo_doc || "",
      tenedor_numero_doc: vehiculo.tenedor_numero_doc || "",
      tenedor_nombre: vehiculo.tenedor_nombre || "",
      activo: vehiculo.activo
    } : {
      placa: "",
      configuracion: "",
      clase: "",
      marca: "",
      servicio: "",
      numero_ejes: undefined,
      carroceria: "",
      modalidad: "",
      linea: "",
      tipo_combustible: "",
      capacidad_carga: 0,
      peso_vacio: undefined,
      fecha_matricula: "",
      modelo_año: undefined,
      peso_bruto_vehicular: undefined,
      unidad_medida: "Kilogramos",
      numero_poliza: "",
      aseguradora: "",
      nit_aseguradora: "",
      vence_soat: "",
      vence_revision_tecnomecanica: "",
      propietario_tipo_doc: "",
      propietario_numero_doc: "",
      propietario_nombre: "",
      tenedor_tipo_doc: "",
      tenedor_numero_doc: "",
      tenedor_nombre: "",
      activo: true
    }
  });

  const mutation = useMutation({
    mutationFn: async (data: VehiculoFormData) => {
      const cleanData: InsertVehiculo = {
        ...data,
        fecha_matricula: data.fecha_matricula || null,
        vence_soat: data.vence_soat || null,
        vence_revision_tecnomecanica: data.vence_revision_tecnomecanica || null,
        tenedor_tipo_doc: data.tenedor_tipo_doc || null,
        tenedor_numero_doc: data.tenedor_numero_doc || null,
        tenedor_nombre: data.tenedor_nombre || null
      };

      if (vehiculo) {
        return apiRequest(`/api/vehiculos/${vehiculo.id}`, "PATCH", cleanData);
      } else {
        return apiRequest("/api/vehiculos", "POST", cleanData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/vehiculos"] });
      toast({
        title: vehiculo ? "Vehículo actualizado" : "Vehículo creado",
        description: vehiculo ? "El vehículo ha sido actualizado exitosamente." : "El vehículo ha sido creado exitosamente."
      });
      onSuccess?.();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Hubo un error al procesar la solicitud.",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: VehiculoFormData) => {
    mutation.mutate(data);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <DialogHeader>
        <DialogTitle>{vehiculo ? "Editar Vehículo" : "Nuevo Vehículo"}</DialogTitle>
      </DialogHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          {/* CARACTERÍSTICAS GENERALES DEL VEHÍCULO */}
          <div className="space-y-4">
            <div className="bg-blue-500 text-white px-4 py-2 rounded-md">
              <h3 className="font-semibold">CARACTERÍSTICAS GENERALES DEL VEHÍCULO</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="placa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Placa *</FormLabel>
                    <FormControl>
                      <Input placeholder="AAA123" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="configuracion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Configuración *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: CAMIÓN RÍGIDO DE 2 EJES" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="clase"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clase</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: CAMION" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="marca"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Marca</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="servicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Servicio</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: PÚBLICO" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="numero_ejes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número Ejes</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="carroceria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carrocería</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: ESTACAS" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="modalidad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modalidad</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: CARGA" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="linea"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Línea</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="tipo_combustible"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo Combustible</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: DIESEL" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="capacidad_carga"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacidad de Carga *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="peso_vacio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peso Vacío</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="fecha_matricula"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha Matrícula</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="modelo_año"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo (Año)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="peso_bruto_vehicular"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peso Bruto Vehicular (PBV)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        {...field} 
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="unidad_medida"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unidad de Medida</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione unidad" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Kilogramos">Kilogramos</SelectItem>
                        <SelectItem value="Toneladas">Toneladas</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="activo"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Estado del Vehículo</FormLabel>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* INFORMACIÓN DEL SOAT Y REVISIÓN TECNOMECÁNICA */}
          <div className="space-y-4">
            <div className="bg-blue-500 text-white px-4 py-2 rounded-md">
              <h3 className="font-semibold">INFORMACIÓN DEL SOAT Y REVISIÓN TECNOMECÁNICA</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="numero_poliza"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número Póliza</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="aseguradora"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aseguradora</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="nit_aseguradora"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nit Aseguradora</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="vence_soat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vence SOAT</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="vence_revision_tecnomecanica"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vence Revisión TecnoMeca</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* PROPIETARIO Y TENEDOR */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-base font-semibold">Propietario *</Label>
                <div className="space-y-3 mt-2">
                  <FormField
                    control={form.control}
                    name="propietario_tipo_doc"
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccione propietario" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="C">Cédula</SelectItem>
                            <SelectItem value="N">NIT</SelectItem>
                            <SelectItem value="P">Pasaporte</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="propietario_numero_doc"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Número documento" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="propietario_nombre"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Nombre completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                >
                  + Nuevo
                </Button>
              </div>
              
              <div>
                <Label className="text-base font-semibold">Tenedor (si es diferente al propietario)</Label>
                <div className="space-y-3 mt-2">
                  <FormField
                    control={form.control}
                    name="tenedor_tipo_doc"
                    render={({ field }) => (
                      <FormItem>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="No aplica / Mismo propietario" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="NO_APLICA">No aplica / Mismo propietario</SelectItem>
                            <SelectItem value="C">Cédula</SelectItem>
                            <SelectItem value="N">NIT</SelectItem>
                            <SelectItem value="P">Pasaporte</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="tenedor_numero_doc"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Número documento" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="tenedor_nombre"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input placeholder="Nombre completo" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                >
                  + Nuevo
                </Button>
              </div>
            </div>
          </div>

          {/* BOTONES */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}