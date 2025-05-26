import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DataTable } from "@/components/data-table";
import { SedeForm } from "@/components/forms/sede-form";
import { VehiculoForm } from "@/components/forms/vehiculo-form";
import { TerceroForm } from "@/components/forms/tercero-form";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function GestionDatos() {
  const [activeTab, setActiveTab] = useState("sedes");
  const [showSedeForm, setShowSedeForm] = useState(false);
  const [showVehiculoForm, setShowVehiculoForm] = useState(false);
  const [showTerceroForm, setShowTerceroForm] = useState(false);
  const [showConsecutivoForm, setShowConsecutivoForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

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
      key: "municipio_codigo", 
      title: "Municipio",
      render: (value: string) => {
        const municipio = municipios.find((m: any) => m.codigo === value);
        return municipio ? `${municipio.nombre}, ${municipio.departamento}` : value;
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
        return municipio ? `${municipio.nombre}, ${municipio.departamento}` : value;
      }
    },
    { key: "telefono", title: "Teléfono" },
    { key: "email", title: "Email" },
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sedes">Sedes</TabsTrigger>
          <TabsTrigger value="vehiculos">Vehículos</TabsTrigger>
          <TabsTrigger value="terceros">Terceros</TabsTrigger>
          <TabsTrigger value="consecutivos">Consecutivos</TabsTrigger>
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

        <TabsContent value="consecutivos" className="space-y-6">
          <DataTable
            title="Gestión de Consecutivos"
            data={consecutivos}
            columns={consecutivoColumns}
            isLoading={loadingConsecutivos}
            onAdd={() => setShowConsecutivoForm(true)}
            onEdit={(consecutivo) => {
              setEditingItem(consecutivo);
              setShowConsecutivoForm(true);
            }}
            onView={(consecutivo) => console.log("Ver consecutivo:", consecutivo)}
            searchPlaceholder="Buscar consecutivos..."
            apiEndpoint="/api/consecutivos"
            queryKey={["/api/consecutivos"]}
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
        <DialogContent className="max-w-2xl">
          <VehiculoForm
            vehiculo={editingItem}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </DialogContent>
      </Dialog>

      {/* Formulario de Tercero */}
      <Dialog open={showTerceroForm} onOpenChange={setShowTerceroForm}>
        <DialogContent className="max-w-2xl">
          <TerceroForm
            tercero={editingItem}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </DialogContent>
      </Dialog>

      {/* Formulario de Consecutivo */}
      <Dialog open={showConsecutivoForm} onOpenChange={setShowConsecutivoForm}>
        <DialogContent className="max-w-lg">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              {editingItem ? "Editar Consecutivo" : "Nuevo Consecutivo"}
            </h3>
            <p className="text-sm text-muted-foreground">
              Los consecutivos se actualizan automáticamente al generar remesas y manifiestos.
            </p>
            {/* Aquí iría el formulario de consecutivos */}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}