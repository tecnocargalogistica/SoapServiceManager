import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface UseExcelUploadOptions {
  onSuccess?: (result: any) => void;
  onError?: (error: string) => void;
  endpoint?: string;
}

export function useExcelUpload(options: UseExcelUploadOptions = {}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { toast } = useToast();

  const uploadFile = async (file: File) => {
    if (!file) {
      const error = "No se ha seleccionado ningún archivo";
      setUploadError(error);
      options.onError?.(error);
      return;
    }

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];

    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls|csv)$/i)) {
      const error = "Tipo de archivo no válido. Solo se permiten archivos Excel (.xlsx, .xls) o CSV";
      setUploadError(error);
      options.onError?.(error);
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      const error = `El archivo es demasiado grande. Tamaño máximo: ${(maxSize / 1024 / 1024).toFixed(1)}MB`;
      setUploadError(error);
      options.onError?.(error);
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const endpoint = options.endpoint || '/api/remesas/upload';
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(errorData.error || `Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      // Validate response structure
      if (!result.totalRows && result.totalRows !== 0) {
        throw new Error("Respuesta del servidor inválida");
      }

      options.onSuccess?.(result);
      
      toast({
        title: "Archivo procesado exitosamente",
        description: `${result.totalRows} registros encontrados, ${result.validRows} válidos`,
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error al procesar archivo";
      setUploadError(errorMessage);
      options.onError?.(errorMessage);
      
      toast({
        title: "Error al procesar archivo",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const resetUpload = () => {
    setIsUploading(false);
    setUploadError(null);
  };

  return {
    uploadFile,
    isUploading,
    uploadError,
    resetUpload
  };
}
