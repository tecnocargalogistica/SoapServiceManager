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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Vista Previa</DialogTitle>
            </DialogHeader>
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