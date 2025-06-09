import * as XLSX from 'xlsx';

export interface ExcelRow {
  GRANJA: string;
  PLANTA: string;
  PLACA: string;
  FECHA_CITA: string;
  IDENTIFICACION: string;
  TONELADAS: number;
  [key: string]: any;
}

export interface ProcessingResult {
  success: boolean;
  rowNumber: number;
  data: ExcelRow;
  mappedData?: any;
  errors: string[];
  warnings: string[];
}

export interface BatchProcessingResult {
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  results: ProcessingResult[];
  errors: string[];
  warnings: string[];
}

export class ExcelProcessor {
  
  parseExcelData(buffer: Buffer, filename: string): ExcelRow[] {
    try {
      let workbook: XLSX.WorkBook;
      
      // Handle different file types
      if (filename.endsWith('.csv')) {
        const csvContent = buffer.toString('utf8');
        const lines = csvContent.split('\n');
        
        // Detect separator (semicolon or comma)
        const separator = lines[0].includes(';') ? ';' : ',';
        console.log(`📋 CSV separator detected: "${separator}"`);
        
        const headers = lines[0].split(separator).map(h => h.trim().replace(/"/g, ''));
        console.log(`📋 CSV headers:`, headers);
        const rows: ExcelRow[] = [];

        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          const values = line.split(separator).map(v => v.trim().replace(/"/g, ''));
          const row: any = {};

          headers.forEach((header, index) => {
            // Map CSV fields to expected field names
            let fieldName = header;
            if (header === 'CEDULA') fieldName = 'IDENTIFICACION';
            if (header === 'UBICACIÓN') fieldName = 'UBICACION';
            
            row[fieldName] = values[index] || '';
          });

          // Ensure required fields exist
          if (row.GRANJA || row.PLANTA || row.PLACA) {
            rows.push({
              GRANJA: row.GRANJA || '',
              PLANTA: row.PLANTA || '',
              PLACA: row.PLACA || '',
              FECHA_CITA: row.FECHA_CITA || '',
              IDENTIFICACION: row.IDENTIFICACION || '',
              TONELADAS: parseFloat(row.TONELADAS) || 0
            });
          }
        }
        return rows;
      } else {
        // Handle Excel files (.xlsx, .xls)
        workbook = XLSX.read(buffer, { type: 'buffer' });
      }
      
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length === 0) {
        return [];
      }
      
      const headers = jsonData[0] as string[];
      console.log('Excel headers found:', headers);
      const rows: ExcelRow[] = [];
      
      for (let i = 1; i < jsonData.length; i++) {
        const rowData = jsonData[i] as any[];
        if (!rowData || rowData.length === 0) continue;
        
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = rowData[index] || '';
        });
        
        console.log(`Raw row ${i}:`, row);
        
        // Map headers more flexibly - handle different column names
        const mappedRow = {
          GRANJA: String(row.GRANJA || row.Granja || row.granja || '').trim(),
          PLANTA: String(row.PLANTA || row.Planta || row.planta || '').trim(),
          PLACA: String(row.PLACA || row.Placa || row.placa || '').trim(),
          FECHA_CITA: String(row.FECHA_CITA || row['FECHA CITA'] || row.fecha_cita || '').trim(),
          IDENTIFICACION: String(row.IDENTIFICACION || row.Identificacion || row.identificacion || row.CEDULA || row.Cedula || row.cedula || row.CONDUCTOR || '').trim(),
          TONELADAS: parseFloat(row.TONELADAS || row.Toneladas || row.toneladas || 0)
        };
        
        console.log(`Mapped row ${i}:`, mappedRow);
        
        // Ensure at least one field has data
        if (mappedRow.GRANJA || mappedRow.PLANTA || mappedRow.PLACA) {
          rows.push(mappedRow);
        }
      }
      
      return rows;
    } catch (error) {
      console.error('Error parsing Excel data:', error);
      return [];
    }
  }

  validateExcelRow(row: ExcelRow, rowNumber: number): ProcessingResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation
    if (!row.GRANJA) {
      errors.push('Campo GRANJA es requerido');
    }
    if (!row.PLANTA) {
      errors.push('Campo PLANTA es requerido');
    }
    if (!row.PLACA) {
      errors.push('Campo PLACA es requerido');
    }
    if (!row.FECHA_CITA) {
      errors.push('Campo FECHA_CITA es requerido');
    }
    if (!row.IDENTIFICACION) {
      errors.push('Campo IDENTIFICACION es requerido');
    }

    // Date validation
    if (row.FECHA_CITA) {
      const datePattern = /^\d{2}\/\d{2}\/\d{4}$|^\d{4}-\d{2}-\d{2}$/;
      if (!datePattern.test(row.FECHA_CITA)) {
        errors.push('Formato de FECHA_CITA inválido. Use DD/MM/YYYY o YYYY-MM-DD');
      }
    }

    // Numeric validation
    if (row.TONELADAS && (isNaN(row.TONELADAS) || row.TONELADAS <= 0)) {
      errors.push('TONELADAS debe ser un número mayor que 0');
    }

    // Vehicle plate validation
    if (row.PLACA) {
      const platePattern = /^[A-Z]{3}\d{3}$|^[A-Z]{3}\d{2}[A-Z]$/;
      if (!platePattern.test(row.PLACA.replace(/\s/g, ''))) {
        warnings.push('Formato de placa puede ser inválido');
      }
    }

    return {
      success: errors.length === 0,
      rowNumber,
      data: row,
      errors,
      warnings
    };
  }

  async validateBatch(rows: ExcelRow[]): Promise<BatchProcessingResult> {
    const results: ProcessingResult[] = [];
    const globalErrors: string[] = [];
    const globalWarnings: string[] = [];
    
    let successfulRows = 0;
    let failedRows = 0;

    // Validate each row
    for (let i = 0; i < rows.length; i++) {
      const result = this.validateExcelRow(rows[i], i + 1);
      results.push(result);

      if (result.success) {
        successfulRows++;
      } else {
        failedRows++;
      }
    }

    // Global validations
    if (rows.length === 0) {
      globalErrors.push('El archivo no contiene datos válidos');
    }

    if (rows.length > 1000) {
      globalWarnings.push('El archivo contiene más de 1000 registros. El procesamiento puede tomar más tiempo.');
    }

    // Check for duplicate plates in the same batch
    const plates = rows.map(r => r.PLACA).filter(Boolean);
    const duplicatePlates = plates.filter((plate, index) => plates.indexOf(plate) !== index);
    if (duplicatePlates.length > 0) {
      globalWarnings.push(`Placas duplicadas encontradas: ${[...new Set(duplicatePlates)].join(', ')}`);
    }

    return {
      totalRows: rows.length,
      successfulRows,
      failedRows,
      results,
      errors: globalErrors,
      warnings: globalWarnings
    };
  }

  parseCumplimientoExcel(csvContent: string): Array<{consecutivo: string, fecha?: string}> {
    const lines = csvContent.split('\n');
    const firstLine = lines[0];
    const delimiter = firstLine.includes(';') ? ';' : ',';
    
    const headers = firstLine.split(delimiter).map(h => h.trim().replace(/"/g, ''));
    const rows: Array<{consecutivo: string, fecha?: string}> = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split(delimiter).map(v => v.trim().replace(/"/g, ''));
      const row: any = {};

      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      // Look for consecutivo in various possible column names
      const consecutivo = row.CONSECUTIVO || row.CONSECUTIVOREMESA || row.NUMERO || row.consecutivo || '';
      const fecha = row.FECHA || row.FECHACUMPLIMIENTO || row.fecha || '';

      if (consecutivo) {
        rows.push({
          consecutivo: consecutivo.toString(),
          fecha: fecha || ''
        });
      }
    }

    return rows;
  }

  formatDateForXML(dateString: string): string {
    // Handle different date formats
    if (!dateString || dateString.trim() === '') return '';

    let date: Date;

    // Check if it's an Excel serial number (numeric value > 1000)
    const numericValue = parseFloat(dateString);
    if (!isNaN(numericValue) && numericValue > 1000) {
      // Excel date serial number - convert from Excel date
      // Excel epoch is January 1, 1900, but Excel incorrectly treats 1900 as a leap year
      // So dates after Feb 28, 1900 are off by one day
      const millisecondsPerDay = 24 * 60 * 60 * 1000;
      const excelEpochOffset = new Date(1899, 11, 30); // December 30, 1899
      
      date = new Date(excelEpochOffset.getTime() + (numericValue * millisecondsPerDay));
    }
    // Try parsing different text formats
    else if (dateString.includes('/')) {
      // DD/MM/YYYY or MM/DD/YYYY format
      const parts = dateString.split('/');
      if (parts.length === 3) {
        // Assume DD/MM/YYYY format first
        const day = parseInt(parts[0]);
        const month = parseInt(parts[1]);
        const year = parseInt(parts[2]);
        
        // Create date in YYYY-MM-DD format to avoid ambiguity
        date = new Date(year, month - 1, day);
      } else {
        return '';
      }
    } else if (dateString.includes('-')) {
      // YYYY-MM-DD or DD-MM-YYYY format
      date = new Date(dateString);
    } else {
      // Try direct parsing as last resort
      date = new Date(dateString);
    }

    if (isNaN(date.getTime())) {
      console.error('Error parsing date:', dateString);
      return '';
    }

    // Return in DD/MM/YYYY format for XML
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  }

  parseTercerosExcel(buffer: Buffer, filename: string): Array<any> {
    try {
      let data: any;
      
      if (filename.toLowerCase().endsWith('.csv')) {
        // Parse CSV with semicolon delimiter
        const csvContent = buffer.toString('utf-8');
        const lines = csvContent.split('\n');
        const headers = lines[0].split(';').map(h => h.trim().replace(/"/g, ''));
        
        data = [];
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const values = line.split(';').map(v => v.trim().replace(/"/g, ''));
          const row: any = {};
          
          headers.forEach((header, index) => {
            row[header] = values[index] || '';
          });
          
          data.push(row);
        }
      } else {
        // Parse Excel file
        const XLSX = require('xlsx');
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(worksheet);
      }

      console.log(`Parsed ${data.length} terceros from ${filename}`);
      return data || [];
      
    } catch (error: any) {
      console.error('Error parsing terceros file:', error);
      throw new Error(`Error procesando archivo de terceros: ${error.message}`);
    }
  }

  parseVehiculosExcel(buffer: Buffer, filename: string): Array<any> {
    try {
      let data: any;
      
      if (filename.toLowerCase().endsWith('.csv')) {
        // Procesar CSV
        const csvContent = buffer.toString('utf-8');
        console.log(`📄 Contenido del archivo (primeros 500 caracteres): ${csvContent.substring(0, 500)}`);
        
        const lines = csvContent.split('\n').filter((line: string) => line.trim() !== '');
        console.log(`📝 Total de líneas encontradas: ${lines.length}`);
        
        if (lines.length < 2) {
          throw new Error('El archivo CSV debe contener al menos un encabezado y una fila de datos');
        }
        
        // Detectar delimitador (coma o punto y coma)
        const firstLine = lines[0];
        const delimiter = firstLine.includes(';') ? ';' : ',';
        
        const headers = firstLine.split(delimiter).map((h: string) => h.trim().replace(/"/g, ''));
        console.log(`📋 Headers detectados: ${headers.join(', ')}`);
        console.log(`🔍 Delimitador usado: "${delimiter}"`);
        
        const vehiculos = [];
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          
          // Saltar líneas vacías
          if (!line) {
            console.log(`⚠️ Línea ${i + 1} vacía, saltando...`);
            continue;
          }
          
          const values = line.split(delimiter).map((v: string) => v.trim().replace(/"/g, ''));
          const vehiculo: any = {};
          
          headers.forEach((header: string, index: number) => {
            vehiculo[header] = values[index] || '';
          });
          
          const placa = vehiculo.PLACA || vehiculo.placa || '';
          console.log(`🔍 Línea ${i + 1}: PLACA="${placa}"`);
          
          // Solo procesar si tiene placa válida
          if (placa && placa.trim() !== '') {
            // Mapear y validar campos específicos de vehículos
            const vehiculoMapeado = this.mapearCamposVehiculo(vehiculo);
            vehiculos.push(vehiculoMapeado);
            console.log(`✅ Vehículo agregado: ${placa}`);
          } else {
            console.log(`❌ Línea ${i + 1} rechazada: placa vacía o inválida`);
          }
        }
        
        return vehiculos;
      } else {
        // Procesar Excel
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(worksheet);
        
        // Mapear campos para cada vehículo
        data = data.map((vehiculo: any) => this.mapearCamposVehiculo(vehiculo));
      }
      
      console.log(`📊 Procesando ${data.length} vehículos desde ${filename}`);
      return data;
      
    } catch (error) {
      console.error('Error procesando archivo de vehículos:', error);
      throw new Error(`Error procesando archivo de vehículos: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private mapearCamposVehiculo(vehiculo: any): any {
    // Función auxiliar para convertir fechas
    const convertirFecha = (fecha: string): Date | null => {
      if (!fecha || fecha.trim() === '') return null;
      
      // Intentar varios formatos de fecha
      const formatos = [
        /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
        /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
        /^\d{2}-\d{2}-\d{4}$/, // DD-MM-YYYY
      ];
      
      for (const formato of formatos) {
        if (formato.test(fecha)) {
          const fechaObj = new Date(fecha);
          if (!isNaN(fechaObj.getTime())) {
            return fechaObj;
          }
        }
      }
      return null;
    };

    // Función auxiliar para convertir números
    const convertirNumero = (valor: any): number | null => {
      if (valor === null || valor === undefined || valor === '') return null;
      const numero = Number(valor);
      return isNaN(numero) ? null : numero;
    };

    return {
      placa: (vehiculo.PLACA || vehiculo.placa || '').toString().toUpperCase().trim(),
      capacidad_carga: convertirNumero(vehiculo.CAPACIDAD_CARGA || vehiculo.capacidad_carga) || 0,
      tipo_vehiculo: vehiculo.TIPO_VEHICULO || vehiculo.tipo_vehiculo || null,
      marca: vehiculo.MARCA || vehiculo.marca || null,
      modelo: vehiculo.MODELO || vehiculo.modelo || null,
      propietario_tipo_doc: vehiculo.PROPIETARIO_TIPO_DOC || vehiculo.propietario_tipo_doc || 'C',
      propietario_numero_doc: vehiculo.PROPIETARIO_NUMERO_DOC || vehiculo.propietario_numero_doc || '',
      propietario_nombre: vehiculo.PROPIETARIO_NOMBRE || vehiculo.propietario_nombre || '',
      activo: true,
      configuracion: vehiculo.CONFIGURACION || vehiculo.configuracion || null,
      clase: vehiculo.CLASE || vehiculo.clase || null,
      servicio: vehiculo.SERVICIO || vehiculo.servicio || null,
      numero_ejes: convertirNumero(vehiculo.NUMERO_EJES || vehiculo.numero_ejes) || null,
      carroceria: vehiculo.CARROCERIA || vehiculo.carroceria || null,
      modalidad: vehiculo.MODALIDAD || vehiculo.modalidad || null,
      linea: vehiculo.LINEA || vehiculo.linea || null,
      tipo_combustible: vehiculo.TIPO_COMBUSTIBLE || vehiculo.tipo_combustible || null,
      peso_vacio: convertirNumero(vehiculo.PESO_VACIO || vehiculo.peso_vacio) || null,
      fecha_matricula: convertirFecha(vehiculo.FECHA_MATRICULA || vehiculo.fecha_matricula),
      modelo_año: convertirNumero(vehiculo.MODELO_AÑO || vehiculo.modelo_año) || null,
      peso_bruto_vehicular: convertirNumero(vehiculo.PESO_BRUTO_VEHICULAR || vehiculo.peso_bruto_vehicular) || null,
      unidad_medida: vehiculo.UNIDAD_MEDIDA || vehiculo.unidad_medida || null,
      numero_poliza: vehiculo.NUMERO_POLIZA || vehiculo.numero_poliza || null,
      aseguradora: vehiculo.ASEGURADORA || vehiculo.aseguradora || null,
      nit_aseguradora: vehiculo.NIT_ASEGURADORA || vehiculo.nit_aseguradora || null,
      vence_soat: convertirFecha(vehiculo.VENCE_SOAT || vehiculo.vence_soat),
      vence_revision_tecnomecanica: convertirFecha(vehiculo.VENCE_REVISION_TECNOMECANICA || vehiculo.vence_revision_tecnomecanica),
      propietario_id: null, // Se asignará más tarde si existe el tercero
      tenedor_id: null, // Se asignará más tarde si existe el tercero
      tenedor_tipo_doc: vehiculo.TENEDOR_TIPO_DOC || vehiculo.tenedor_tipo_doc || null,
      tenedor_numero_doc: vehiculo.TENEDOR_NUMERO_DOC || vehiculo.tenedor_numero_doc || null,
      tenedor_nombre: vehiculo.TENEDOR_NOMBRE || vehiculo.tenedor_nombre || null
    };
  }
}

export const excelProcessor = new ExcelProcessor();
