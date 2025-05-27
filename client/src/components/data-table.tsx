import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { MoreHorizontal, Eye, Edit, Trash2, Plus, Search, CheckSquare, ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Column {
  key: string;
  title: string;
  render?: (value: any, item: any) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps {
  title: string;
  data: any[];
  columns: Column[];
  isLoading?: boolean;
  onAdd?: () => void;
  onEdit?: (item: any) => void;
  onView?: (item: any) => void;
  onDelete?: (item: any) => void;
  onBulkDelete?: (items: any[]) => void;
  searchPlaceholder?: string;
  apiEndpoint?: string;
  queryKey?: string[];
}

export function DataTable({
  title,
  data,
  columns,
  isLoading = false,
  onAdd,
  onEdit,
  onView,
  onDelete,
  onBulkDelete,
  searchPlaceholder = "Buscar...",
  apiEndpoint,
  queryKey = []
}: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [viewItem, setViewItem] = useState<any>(null);
  const [deleteItem, setDeleteItem] = useState<any>(null);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`${apiEndpoint}/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: "Elemento eliminado exitosamente" });
      setDeleteItem(null);
    },
    onError: () => {
      toast({ title: "Error al eliminar elemento", variant: "destructive" });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: number[]) => 
      Promise.all(ids.map(id => apiRequest(`${apiEndpoint}/${id}`, "DELETE"))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: `${selectedItems.size} elementos eliminados exitosamente` });
      setSelectedItems(new Set());
      setShowBulkDeleteDialog(false);
    },
    onError: () => {
      toast({ title: "Error al eliminar elementos", variant: "destructive" });
    },
  });

  // Filtrar datos basado en búsqueda
  const filteredData = data.filter(item =>
    Object.values(item).some(value => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Cálculos de paginación
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Resetear página cuando cambia la búsqueda
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(new Set(filteredData.map(item => item.id)));
    } else {
      setSelectedItems(new Set());
    }
  };

  const handleSelectItem = (id: number, checked: boolean) => {
    const newSelected = new Set(selectedItems);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedItems(newSelected);
  };

  const handleDelete = (item: any) => {
    if (onDelete) {
      onDelete(item);
    } else if (apiEndpoint) {
      deleteMutation.mutate(item.id);
    }
  };

  const handleBulkDelete = () => {
    if (onBulkDelete) {
      const itemsToDelete = filteredData.filter(item => selectedItems.has(item.id));
      onBulkDelete(itemsToDelete);
    } else if (apiEndpoint) {
      bulkDeleteMutation.mutate(Array.from(selectedItems));
    }
  };

  const allSelected = filteredData.length > 0 && filteredData.every(item => selectedItems.has(item.id));
  const someSelected = selectedItems.size > 0 && !allSelected;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{title}</CardTitle>
            <div className="flex gap-2">
              {selectedItems.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowBulkDeleteDialog(true)}
                  disabled={bulkDeleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar ({selectedItems.size})
                </Button>
              )}
              {onAdd && (
                <Button onClick={onAdd} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar
                </Button>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-8"
              />
            </div>
            {selectedItems.size > 0 && (
              <Badge variant="secondary">
                {selectedItems.size} seleccionados
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No se encontraron resultados" : "No hay datos disponibles"}
            </div>
          ) : (
            <>
              <div className="border rounded-md">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="p-2 text-left">
                          <Checkbox
                            checked={allSelected}
                            onCheckedChange={handleSelectAll}
                          />
                        </th>
                        {columns.map((column) => (
                          <th key={column.key} className="p-2 text-left font-medium">
                            {column.title}
                          </th>
                        ))}
                        <th className="p-2 text-right font-medium">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedData.map((item) => (
                        <tr key={item.id} className="border-b hover:bg-muted/25">
                          <td className="p-2">
                            <Checkbox
                              checked={selectedItems.has(item.id)}
                              onCheckedChange={(checked) => handleSelectItem(item.id, checked as boolean)}
                            />
                          </td>
                          {columns.map((column) => (
                            <td key={column.key} className="p-2">
                              {column.render 
                                ? column.render(item[column.key], item)
                                : String(item[column.key] || '')
                              }
                            </td>
                          ))}
                          <td className="p-2 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {onView && (
                                  <DropdownMenuItem onClick={() => setViewItem(item)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Vista previa
                                  </DropdownMenuItem>
                                )}
                                {onEdit && (
                                  <DropdownMenuItem onClick={() => onEdit(item)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                )}
                                {(onDelete || apiEndpoint) && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem 
                                      onClick={() => setDeleteItem(item)}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Eliminar
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Controles de paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Mostrando {startIndex + 1} a {Math.min(endIndex, filteredData.length)} de {filteredData.length} resultados
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => 
                          page === 1 || 
                          page === totalPages || 
                          Math.abs(page - currentPage) <= 2
                        )
                        .map((page, index, array) => (
                          <div key={page} className="flex items-center">
                            {index > 0 && array[index - 1] !== page - 1 && (
                              <span className="mx-1 text-muted-foreground">...</span>
                            )}
                            <Button
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="w-8 h-8 p-0"
                            >
                              {page}
                            </Button>
                          </div>
                        ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Vista previa Dialog */}
      {viewItem && (
        <Dialog open={!!viewItem} onOpenChange={() => setViewItem(null)}>
          <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                Vista Previa - {title}
                {viewItem.placa && ` - ${viewItem.placa}`}
                {viewItem.nombre && ` - ${viewItem.nombre}`}
              </DialogTitle>
            </DialogHeader>
            
            {/* Vista previa específica para vehículos */}
            {viewItem.placa ? (
              <div className="space-y-6">
                {/* Información Básica */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-800 mb-3">Información Básica</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div><span className="font-medium">Placa:</span> {viewItem.placa}</div>
                    <div><span className="font-medium">Tipo de Vehículo:</span> {viewItem.tipo_vehiculo || 'No especificado'}</div>
                    <div><span className="font-medium">Marca:</span> {viewItem.marca || 'No especificada'}</div>
                    <div><span className="font-medium">Modelo:</span> {viewItem.modelo || 'No especificado'}</div>
                    <div><span className="font-medium">Configuración:</span> {viewItem.configuracion || 'No especificada'}</div>
                    <div><span className="font-medium">Clase:</span> {viewItem.clase || 'No especificada'}</div>
                  </div>
                </div>

                {/* Características Técnicas */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-800 mb-3">Características Técnicas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div><span className="font-medium">Servicio:</span> {viewItem.servicio || 'No especificado'}</div>
                    <div><span className="font-medium">Número de Ejes:</span> {viewItem.numero_ejes || 'No especificado'}</div>
                    <div><span className="font-medium">Carrocería:</span> {viewItem.carroceria || 'No especificada'}</div>
                    <div><span className="font-medium">Modalidad:</span> {viewItem.modalidad || 'No especificada'}</div>
                    <div><span className="font-medium">Línea:</span> {viewItem.linea || 'No especificada'}</div>
                    <div><span className="font-medium">Tipo de Combustible:</span> {viewItem.tipo_combustible || 'No especificado'}</div>
                  </div>
                </div>

                {/* Capacidades y Pesos */}
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-yellow-800 mb-3">Capacidades y Pesos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div><span className="font-medium">Capacidad de Carga:</span> {viewItem.capacidad_carga?.toLocaleString()} kg</div>
                    <div><span className="font-medium">Peso Vacío:</span> {viewItem.peso_vacio ? `${viewItem.peso_vacio.toLocaleString()} kg` : 'No especificado'}</div>
                    <div><span className="font-medium">Peso Bruto Vehicular:</span> {viewItem.peso_bruto_vehicular ? `${viewItem.peso_bruto_vehicular.toLocaleString()} kg` : 'No especificado'}</div>
                    <div><span className="font-medium">Unidad de Medida:</span> {viewItem.unidad_medida || 'Kilogramos'}</div>
                    <div><span className="font-medium">Fecha de Matrícula:</span> {viewItem.fecha_matricula ? new Date(viewItem.fecha_matricula).toLocaleDateString('es-CO') : 'No especificada'}</div>
                    <div><span className="font-medium">Modelo/Año:</span> {viewItem.modelo_año || 'No especificado'}</div>
                  </div>
                </div>

                {/* Información del SOAT */}
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-purple-800 mb-3">Información del SOAT</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div><span className="font-medium">Número de Póliza:</span> {viewItem.numero_poliza || 'No especificado'}</div>
                    <div><span className="font-medium">Aseguradora:</span> {viewItem.aseguradora || 'No especificada'}</div>
                    <div><span className="font-medium">NIT Aseguradora:</span> {viewItem.nit_aseguradora || 'No especificado'}</div>
                    <div>
                      <span className="font-medium">Vence SOAT:</span> 
                      <span className={`ml-2 px-2 py-1 rounded text-sm ${
                        viewItem.vence_soat && new Date(viewItem.vence_soat) < new Date() 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {viewItem.vence_soat ? new Date(viewItem.vence_soat).toLocaleDateString('es-CO') : 'No especificada'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Vence Revisión Tecnomecánica:</span>
                      <span className={`ml-2 px-2 py-1 rounded text-sm ${
                        viewItem.vence_revision_tecnomecanica && new Date(viewItem.vence_revision_tecnomecanica) < new Date() 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {viewItem.vence_revision_tecnomecanica ? new Date(viewItem.vence_revision_tecnomecanica).toLocaleDateString('es-CO') : 'No especificada'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Información del Propietario */}
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-orange-800 mb-3">Información del Propietario</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><span className="font-medium">Nombre:</span> {viewItem.propietario_nombre}</div>
                    <div><span className="font-medium">Documento:</span> {viewItem.propietario_tipo_doc}-{viewItem.propietario_numero_doc}</div>
                  </div>
                </div>

                {/* Información del Tenedor (si existe) */}
                {(viewItem.tenedor_nombre || viewItem.tenedor_numero_doc) && (
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-indigo-800 mb-3">Información del Tenedor</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><span className="font-medium">Nombre:</span> {viewItem.tenedor_nombre || 'No especificado'}</div>
                      <div><span className="font-medium">Documento:</span> {viewItem.tenedor_tipo_doc && viewItem.tenedor_numero_doc ? `${viewItem.tenedor_tipo_doc}-${viewItem.tenedor_numero_doc}` : 'No especificado'}</div>
                    </div>
                  </div>
                )}

                {/* Estado y Fechas */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Estado y Fechas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">Estado:</span>
                      <Badge variant={viewItem.activo ? "default" : "secondary"} className="ml-2">
                        {viewItem.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                    <div><span className="font-medium">Fecha de Registro:</span> {viewItem.created_at ? new Date(viewItem.created_at).toLocaleDateString('es-CO') : 'No disponible'}</div>
                  </div>
                </div>
              </div>
            ) : viewItem.numero_documento ? (
              /* Vista previa específica para terceros */
              <div className="space-y-6">
                {/* Información Personal/Empresarial */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-800 mb-3">
                    {viewItem.es_empresa ? 'Información Empresarial' : 'Información Personal'}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {viewItem.es_empresa ? (
                      <>
                        <div><span className="font-medium">Razón Social:</span> {viewItem.razon_social || 'No especificada'}</div>
                        <div><span className="font-medium">Tipo de Documento:</span> {viewItem.tipo_documento}</div>
                        <div><span className="font-medium">Número de Documento:</span> {viewItem.numero_documento}</div>
                      </>
                    ) : (
                      <>
                        <div><span className="font-medium">Nombre:</span> {viewItem.nombre || 'No especificado'}</div>
                        <div><span className="font-medium">Apellido:</span> {viewItem.apellido || 'No especificado'}</div>
                        <div><span className="font-medium">Tipo de Documento:</span> {viewItem.tipo_documento}</div>
                        <div><span className="font-medium">Número de Documento:</span> {viewItem.numero_documento}</div>
                      </>
                    )}
                    <div><span className="font-medium">Email:</span> {viewItem.email || 'No especificado'}</div>
                    <div><span className="font-medium">Teléfono:</span> {viewItem.telefono || 'No especificado'}</div>
                  </div>
                </div>

                {/* Información de Dirección */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-800 mb-3">Información de Dirección</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><span className="font-medium">Dirección:</span> {viewItem.direccion || 'No especificada'}</div>
                    <div><span className="font-medium">Ciudad:</span> {viewItem.ciudad || 'No especificada'}</div>
                  </div>
                </div>

                {/* Roles y Características */}
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-purple-800 mb-3">Roles y Características</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Es Empresa:</span>
                      <Badge variant={viewItem.es_empresa ? "default" : "secondary"}>
                        {viewItem.es_empresa ? "Sí" : "No"}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Es Conductor:</span>
                      <Badge variant={viewItem.es_conductor ? "default" : "secondary"}>
                        {viewItem.es_conductor ? "Sí" : "No"}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">Es Propietario:</span>
                      <Badge variant={viewItem.es_propietario ? "default" : "secondary"}>
                        {viewItem.es_propietario ? "Sí" : "No"}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Información de Licencia de Conducir (solo si es conductor) */}
                {viewItem.es_conductor && (
                  <div className="bg-amber-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-amber-800 mb-3">Información de Licencia de Conducir</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div><span className="font-medium">Categoría de Licencia:</span> {viewItem.categoria_licencia || 'No especificada'}</div>
                      <div><span className="font-medium">Número de Licencia:</span> {viewItem.numero_licencia || 'No especificado'}</div>
                      <div>
                        <span className="font-medium">Fecha de Vencimiento:</span>
                        {viewItem.fecha_vencimiento_licencia ? (
                          <span className={`ml-2 px-2 py-1 rounded text-sm ${
                            new Date(viewItem.fecha_vencimiento_licencia) < new Date() 
                              ? 'bg-red-100 text-red-800' 
                              : new Date(viewItem.fecha_vencimiento_licencia).getTime() - new Date().getTime() < 30 * 24 * 60 * 60 * 1000
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-green-100 text-green-800'
                          }`}>
                            {new Date(viewItem.fecha_vencimiento_licencia).toLocaleDateString('es-CO')}
                          </span>
                        ) : (
                          <span className="text-gray-500 ml-2">No especificada</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Vehículo Asignado (si aplica) */}
                {viewItem.id_vehiculo_asignado && (
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-indigo-800 mb-3">Vehículo Asignado</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div><span className="font-medium">ID del Vehículo:</span> {viewItem.id_vehiculo_asignado}</div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Nota:</span> Para ver detalles completos, consulte la sección de vehículos
                      </div>
                    </div>
                  </div>
                )}

                {/* Estado y Fechas */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">Estado y Fechas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium">Estado:</span>
                      <Badge variant={viewItem.activo ? "default" : "secondary"} className="ml-2">
                        {viewItem.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </div>
                    <div><span className="font-medium">Fecha de Registro:</span> {viewItem.created_at ? new Date(viewItem.created_at).toLocaleDateString('es-CO') : 'No disponible'}</div>
                  </div>
                </div>
              </div>
            ) : (
              /* Vista previa genérica para otros tipos de datos */
              <div className="space-y-4">
                {columns.map((column) => (
                  <div key={column.key} className="grid grid-cols-3 gap-4">
                    <div className="font-medium">{column.title}:</div>
                    <div className="col-span-2">
                      {column.render 
                        ? column.render(viewItem[column.key], viewItem)
                        : String(viewItem[column.key] || '')
                      }
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Confirmar eliminación individual */}
      {deleteItem && (
        <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Confirmar eliminación?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. El elemento será eliminado permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => handleDelete(deleteItem)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {/* Confirmar eliminación múltiple */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Confirmar eliminación múltiple?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán {selectedItems.size} elementos permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar {selectedItems.size} elementos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}