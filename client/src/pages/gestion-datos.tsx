import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DataTable } from "@/components/data-table";
import { SedeForm } from "@/components/forms/sede-form";
import { VehiculoForm } from "@/components/forms/vehiculo-form";
import { TerceroForm } from "@/components/forms/tercero-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Search, UserCheck, UserX, Filter } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function GestionDatos() {
  const [activeTab, setActiveTab] = useState("sedes");
  const [showSedeForm, setShowSedeForm] = useState(false);
  const [showVehiculoForm, setShowVehiculoForm] = useState(false);
  const [showTerceroForm, setShowTerceroForm] = useState(false);
  const [showConsecutivoForm, setShowConsecutivoForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  
  // Estados para filtrado de terceros
  const [terceroFilter, setTerceroFilter] = useState("todos");
  const [terceroSearch, setTerceroSearch] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Queries para datos
  const { data: sedes = [], isLoading: loadingSedes } = useQuery({
    queryKey: ["/api/sedes"],
  });

  const { data: vehiculos = [], isLoading: loadingVehiculos } = useQuery({
    queryKey: ["/api/vehiculos"],
  });

  const { data: terceros = [], isLoading: loadingTerceros } = useQuery({
    queryKey: ["/api/terceros"],
  });

  const { data: consecutivos = [], isLoading: loadingConsecutivos } = useQuery({
    queryKey: ["/api/consecutivos"],
  });

  const { data: municipios = [] } = useQuery({
    queryKey: ["/api/municipios"],
  });

  // Configuración de columnas para cada tabla
  const sedeColumns = [
    { key: "codigo_sede", title: "Código" },
    { key: "nombre", title: "Nombre" },
    { 
      key: "tipo_sede", 
      title: "Tipo",
      render: (value: string) => (
        <Badge variant={value === "planta" ? "default" : "outline"} className={
          value === "planta" ? "bg-blue-600" : "bg-green-600 text-white border-green-600"
        }>
          {value === "planta" ? "🏭 Planta" : "🚜 Granja"}
        </Badge>
      )
    },
    { 
      key: "municipio_codigo", 
      title: "Municipio",
      render: (value: string) => {
        const municipio = municipios.find((m: any) => m.codigo === value);
        return municipio ? (
          <div className="text-sm">
            <div className="font-medium">{municipio.nombre}, {municipio.departamento}</div>
            <div className="text-gray-500">Código: {value}</div>
          </div>
        ) : value;
      }
    },
    { key: "direccion", title: "Dirección" },
    { key: "telefono", title: "Teléfono" },
    { 
      key: "valor_tonelada", 
      title: "Valor/Ton",
      render: (value: string) => value ? `$${Number(value).toLocaleString()}` : ""
    },
    { 
      key: "tercero_responsable_id", 
      title: "Responsable",
      render: (value: number, item: any) => {
        if (!value) return <span className="text-gray-400">Sin asignar</span>;
        const tercero = terceros.find((t: any) => t.id === value);
        return tercero ? (
          <span className="text-sm">
            {tercero.es_empresa ? tercero.razon_social : `${tercero.nombre} ${tercero.apellido}`}
          </span>
        ) : <span className="text-gray-400">No encontrado</span>;
      }
    },
    { 
      key: "activo", 
      title: "Estado",
      render: (value: boolean) => (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? "Activo" : "Inactivo"}
        </Badge>
      )
    },
  ];

  const vehiculoColumns = [
    { key: "placa", title: "Placa" },
    { key: "tipo_vehiculo", title: "Tipo" },
    { key: "marca", title: "Marca" },
    { key: "modelo", title: "Modelo" },
    { 
      key: "capacidad_carga", 
      title: "Capacidad",
      render: (value: number) => `${value.toLocaleString()} kg`
    },
    { key: "propietario_nombre", title: "Propietario" },
    { 
      key: "propietario_numero_doc", 
      title: "Documento",
      render: (value: string, item: any) => `${item.propietario_tipo_doc}-${value}`
    },
    { 
      key: "activo", 
      title: "Estado",
      render: (value: boolean) => (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? "Activo" : "Inactivo"}
        </Badge>
      )
    },
  ];

  const terceroColumns = [
    { key: "nombre", title: "Nombre/Razón Social" },
    { 
      key: "tipo_documento", 
      title: "Tipo Doc",
      render: (value: string) => {
        const tipos: { [key: string]: string } = {
          'C': 'Cédula',
          'N': 'NIT',
          'P': 'Pasaporte',
          'E': 'C. Extranjería',
          'T': 'T. Identidad'
        };
        return tipos[value] || value;
      }
    },
    { key: "numero_documento", title: "Número Documento" },
    { key: "direccion", title: "Dirección" },
    { 
      key: "municipio_codigo", 
      title: "Municipio",
      render: (value: string) => {
        if (!value) return "";
        const municipio = (municipios as any[]).find((m: any) => m.codigo === value);
        return municipio ? (
          <div className="text-sm">
            <div className="font-medium">{municipio.nombre}, {municipio.departamento}</div>
            <div className="text-gray-500">Código: {value}</div>
          </div>
        ) : value;
      }
    },
    { key: "telefono", title: "Teléfono" },
    { key: "email", title: "Email" },
    { 
      key: "roles", 
      title: "Roles",
      render: (value: any, item: any) => (
        <div className="flex gap-1 flex-wrap">
          {item.es_conductor && (
            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
              🚗 Conductor
            </Badge>
          )}
          {item.es_propietario && (
            <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
              🏠 Propietario
            </Badge>
          )}
          {item.es_responsable_sede && (
            <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
              🏢 Resp. Sede
            </Badge>
          )}
        </div>
      )
    },
    { 
      key: "activo", 
      title: "Estado",
      render: (value: boolean) => (
        <Badge variant={value ? "default" : "secondary"}>
          {value ? "Activo" : "Inactivo"}
        </Badge>
      )
    },
  ];

  const consecutivoColumns = [
    { key: "tipo", title: "Tipo" },
    { key: "ultimo_numero", title: "Último Número" },
    { key: "prefijo", title: "Prefijo" },
    { key: "año", title: "Año" },
    { 
      key: "updated_at", 
      title: "Última Actualización",
      render: (value: string) => value ? format(new Date(value), "dd/MM/yyyy HH:mm", { locale: es }) : ""
    },
  ];

  // Handlers para formularios
  const handleAddSede = () => {
    setEditingItem(null);
    setShowSedeForm(true);
  };

  const handleEditSede = (sede: any) => {
    setEditingItem(sede);
    setShowSedeForm(true);
  };

  const handleAddVehiculo = () => {
    setEditingItem(null);
    setShowVehiculoForm(true);
  };

  const handleEditVehiculo = (vehiculo: any) => {
    setEditingItem(vehiculo);
    setShowVehiculoForm(true);
  };

  const handleAddTercero = () => {
    setEditingItem(null);
    setShowTerceroForm(true);
  };

  const handleEditTercero = (tercero: any) => {
    setEditingItem(tercero);
    setShowTerceroForm(true);
  };

  const handleFormSuccess = () => {
    setShowSedeForm(false);
    setShowVehiculoForm(false);
    setShowTerceroForm(false);
    setShowConsecutivoForm(false);
    setEditingItem(null);
  };

  const handleFormCancel = () => {
    setShowSedeForm(false);
    setShowVehiculoForm(false);
    setShowTerceroForm(false);
    setShowConsecutivoForm(false);
    setEditingItem(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Gestión de Datos</h1>
        <p className="text-muted-foreground">
          Administra las sedes, vehículos y consecutivos del sistema RNDC
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sedes">Sedes</TabsTrigger>
          <TabsTrigger value="vehiculos">Vehículos</TabsTrigger>
          <TabsTrigger value="terceros">Terceros</TabsTrigger>
        </TabsList>

        <TabsContent value="sedes" className="space-y-6">
          <DataTable
            title="Gestión de Sedes"
            data={sedes}
            columns={sedeColumns}
            isLoading={loadingSedes}
            onAdd={handleAddSede}
            onEdit={handleEditSede}
            onView={(sede) => console.log("Ver sede:", sede)}
            searchPlaceholder="Buscar sedes..."
            apiEndpoint="/api/sedes"
            queryKey={["/api/sedes"]}
          />
        </TabsContent>

        <TabsContent value="vehiculos" className="space-y-6">
          <DataTable
            title="Gestión de Vehículos"
            data={vehiculos}
            columns={vehiculoColumns}
            isLoading={loadingVehiculos}
            onAdd={handleAddVehiculo}
            onEdit={handleEditVehiculo}
            onView={(vehiculo) => console.log("Ver vehículo:", vehiculo)}
            searchPlaceholder="Buscar vehículos..."
            apiEndpoint="/api/vehiculos"
            queryKey={["/api/vehiculos"]}
          />
        </TabsContent>

        <TabsContent value="terceros" className="space-y-6">
          <DataTable
            title="Gestión de Terceros"
            data={terceros}
            columns={terceroColumns}
            isLoading={loadingTerceros}
            onAdd={handleAddTercero}
            onEdit={handleEditTercero}
            onView={(tercero) => console.log("Ver tercero:", tercero)}
            searchPlaceholder="Buscar terceros..."
            apiEndpoint="/api/terceros"
            queryKey={["/api/terceros"]}
          />
        </TabsContent>


      </Tabs>

      {/* Formulario de Sede */}
      <Dialog open={showSedeForm} onOpenChange={setShowSedeForm}>
        <DialogContent className="max-w-2xl">
          <SedeForm
            sede={editingItem}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </DialogContent>
      </Dialog>

      {/* Formulario de Vehículo */}
      <Dialog open={showVehiculoForm} onOpenChange={setShowVehiculoForm}>
        <DialogContent className="max-w-7xl w-[95vw] max-h-[85vh] overflow-y-auto">
          <VehiculoForm
            vehiculo={editingItem}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
            onCreateTercero={() => {
              setEditingItem(null);
              setShowVehiculoForm(false);
              setShowTerceroForm(true);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Formulario de Tercero */}
      <Dialog open={showTerceroForm} onOpenChange={setShowTerceroForm}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <TerceroForm
            tercero={editingItem}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </DialogContent>
      </Dialog>


    </div>
  );
}