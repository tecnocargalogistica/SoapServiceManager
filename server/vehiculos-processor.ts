import * as XLSX from 'xlsx';

export interface VehiculoData {
  PLACA: string;
  CONFIGURACION?: string;
  CLASE?: string;
  MARCA?: string;
  SERVICIO?: string;
  NUMERO_EJES?: number;
  CARROCERIA?: string;
  MODALIDAD?: string;
  LINEA?: string;
  TIPO_COMBUSTIBLE?: string;
  CAPACIDAD_CARGA: number;
  PESO_VACIO?: number;
  FECHA_MATRICULA?: string;
  MODELO_AÑO?: number;
  PESO_BRUTO_VEHICULAR?: number;
  NUMERO_POLIZA?: string;
  ASEGURADORA?: string;
  NIT_ASEGURADORA?: string;
  VENCE_SOAT?: string;
  VENCE_REVISION_TECNOMECANICA?: string;
  PROPIETARIO_TIPO_DOC?: string;
  PROPIETARIO_NUMERO_DOC: string;
  PROPIETARIO_NOMBRE: string;
  TENEDOR_TIPO_DOC?: string;
  TENEDOR_NUMERO_DOC?: string;
  TENEDOR_NOMBRE?: string;
}

export class VehiculosProcessor {
  parseArchivo(buffer: Buffer, filename: string): VehiculoData[] {
    try {
      let data: any[];
      
      if (filename.toLowerCase().endsWith('.csv')) {
        // Procesar CSV
        const csvContent = buffer.toString('utf-8');
        const lines = csvContent.split('\n').filter(line => line.trim() !== '');
        
        if (lines.length < 2) {
          throw new Error('El archivo CSV debe contener al menos un encabezado y una fila de datos');
        }
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        data = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
          const vehiculo: any = {};
          
          headers.forEach((header, index) => {
            vehiculo[header] = values[index] || '';
          });
          
          data.push(vehiculo);
        }
      } else {
        // Procesar Excel
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(worksheet);
      }
      
      console.log(`📊 Procesando ${data.length} vehículos desde ${filename}`);
      return data as VehiculoData[];
      
    } catch (error) {
      console.error('Error procesando archivo de vehículos:', error);
      throw new Error(`Error procesando archivo de vehículos: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  validarVehiculo(vehiculo: VehiculoData): string[] {
    const errores: string[] = [];

    if (!vehiculo.PLACA) {
      errores.push('PLACA es requerida');
    }

    if (!vehiculo.CAPACIDAD_CARGA) {
      errores.push('CAPACIDAD_CARGA es requerida');
    }

    if (!vehiculo.PROPIETARIO_NUMERO_DOC) {
      errores.push('PROPIETARIO_NUMERO_DOC es requerido');
    }

    if (!vehiculo.PROPIETARIO_NOMBRE) {
      errores.push('PROPIETARIO_NOMBRE es requerido');
    }

    return errores;
  }

  mapearVehiculo(vehiculo: VehiculoData): any {
    return {
      placa: vehiculo.PLACA.toUpperCase().trim(),
      configuracion: vehiculo.CONFIGURACION || null,
      clase: vehiculo.CLASE || null,
      marca: vehiculo.MARCA || null,
      servicio: vehiculo.SERVICIO || null,
      numero_ejes: vehiculo.NUMERO_EJES ? parseInt(vehiculo.NUMERO_EJES.toString()) : null,
      carroceria: vehiculo.CARROCERIA || null,
      modalidad: vehiculo.MODALIDAD || null,
      linea: vehiculo.LINEA || null,
      tipo_combustible: vehiculo.TIPO_COMBUSTIBLE || null,
      capacidad_carga: parseInt(vehiculo.CAPACIDAD_CARGA.toString()),
      peso_vacio: vehiculo.PESO_VACIO ? parseInt(vehiculo.PESO_VACIO.toString()) : null,
      fecha_matricula: vehiculo.FECHA_MATRICULA || null,
      modelo_año: vehiculo.MODELO_AÑO ? parseInt(vehiculo.MODELO_AÑO.toString()) : null,
      peso_bruto_vehicular: vehiculo.PESO_BRUTO_VEHICULAR ? parseInt(vehiculo.PESO_BRUTO_VEHICULAR.toString()) : null,
      unidad_medida: 'Kilogramos',
      numero_poliza: vehiculo.NUMERO_POLIZA || null,
      aseguradora: vehiculo.ASEGURADORA || null,
      nit_aseguradora: vehiculo.NIT_ASEGURADORA || null,
      vence_soat: vehiculo.VENCE_SOAT || null,
      vence_revision_tecnomecanica: vehiculo.VENCE_REVISION_TECNOMECANICA || null,
      propietario_tipo_doc: vehiculo.PROPIETARIO_TIPO_DOC || 'N',
      propietario_numero_doc: vehiculo.PROPIETARIO_NUMERO_DOC.toString(),
      propietario_nombre: vehiculo.PROPIETARIO_NOMBRE,
      tenedor_tipo_doc: vehiculo.TENEDOR_TIPO_DOC || vehiculo.PROPIETARIO_TIPO_DOC || 'N',
      tenedor_numero_doc: vehiculo.TENEDOR_NUMERO_DOC || vehiculo.PROPIETARIO_NUMERO_DOC,
      tenedor_nombre: vehiculo.TENEDOR_NOMBRE || vehiculo.PROPIETARIO_NOMBRE,
      activo: true
    };
  }
}

export const vehiculosProcessor = new VehiculosProcessor();