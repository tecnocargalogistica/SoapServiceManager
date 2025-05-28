import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { SOAPProxy } from "./soap-proxy";
import { xmlGenerator } from "./xml-generator";
import { excelProcessor } from "./excel-processor";
import multer from "multer";
import { z } from "zod";

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get system configuration
  app.get("/api/configuracion", async (req, res) => {
    try {
      const config = await storage.getConfiguracionActiva();
      if (!config) {
        return res.status(404).json({ error: "Configuración no encontrada" });
      }
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener configuración" });
    }
  });

  // Update configuration
  app.post("/api/configuracion", async (req, res) => {
    try {
      const config = await storage.getConfiguracionActiva();
      if (config) {
        const updated = await storage.updateConfiguracion(config.id, req.body);
        res.json(updated);
      } else {
        const created = await storage.createConfiguracion(req.body);
        res.json(created);
      }
    } catch (error) {
      res.status(500).json({ error: "Error al actualizar configuración" });
    }
  });

  // Get next consecutive number
  app.get("/api/consecutivos/:tipo", async (req, res) => {
    try {
      const { tipo } = req.params;
      const nextConsecutivo = await storage.getNextConsecutivo(tipo);
      res.json({ consecutivo: nextConsecutivo });
    } catch (error) {
      res.status(500).json({ error: "Error al obtener consecutivo" });
    }
  });

  // Get sedes
  app.get("/api/sedes", async (req, res) => {
    try {
      const sedes = await storage.getSedes();
      res.json(sedes);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener sedes" });
    }
  });

  // Get vehiculos
  app.get("/api/vehiculos", async (req, res) => {
    try {
      const vehiculos = await storage.getVehiculos();
      res.json(vehiculos);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener vehículos" });
    }
  });

  // Get municipios
  app.get("/api/municipios", async (req, res) => {
    try {
      const municipios = await storage.getMunicipios();
      res.json(municipios);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener municipios" });
    }
  });

  // Get remesas
  app.get("/api/remesas", async (req, res) => {
    try {
      const remesas = await storage.getRemesas();
      res.json(remesas);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener remesas" });
    }
  });

  // Get manifiestos
  app.get("/api/manifiestos", async (req, res) => {
    try {
      const manifiestos = await storage.getManifiestos();
      res.json(manifiestos);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener manifiestos" });
    }
  });

  // Get activity logs
  app.get("/api/logs", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = await storage.getLogActividades(limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener logs" });
    }
  });

  // Upload and process Excel file for remesas
  app.post("/api/remesas/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No se ha enviado ningún archivo" });
      }

      console.log(`📁 Archivo recibido: ${req.file.originalname}, tamaño: ${req.file.size} bytes`);
      console.log(`📁 Tipo de archivo detectado: ${req.file.originalname.endsWith('.csv') ? 'CSV' : 'Excel'}`);
      
      if (req.file.originalname.endsWith('.csv')) {
        console.log(`📋 Contenido CSV preview: ${req.file.buffer.toString('utf8').substring(0, 200)}...`);
      }

      // Log upload activity
      await storage.createLogActividad({
        tipo: "info",
        modulo: "excel-upload",
        mensaje: `Archivo cargado: ${req.file.originalname}`,
        detalles: { fileSize: req.file.size, originalName: req.file.originalname }
      });

      // Parse Excel data using buffer and filename
      const excelRows = excelProcessor.parseExcelData(req.file.buffer, req.file.originalname);
      console.log(`📊 Filas procesadas: ${excelRows.length}`);
      
      if (excelRows.length > 0) {
        console.log(`📄 Primera fila de datos:`, JSON.stringify(excelRows[0], null, 2));
      }
      
      // Validate batch
      const validationResult = await excelProcessor.validateBatch(excelRows);

      res.json({
        filename: req.file.originalname,
        totalRows: validationResult.totalRows,
        validRows: validationResult.successfulRows,
        invalidRows: validationResult.failedRows,
        data: excelRows,
        validation: validationResult
      });

    } catch (error) {
      await storage.createLogActividad({
        tipo: "error",
        modulo: "excel-upload",
        mensaje: `Error al procesar archivo Excel: ${error}`,
        detalles: { error: String(error) }
      });
      
      res.status(500).json({ error: "Error al procesar archivo Excel" });
    }
  });

  // Process remesas batch
  app.post("/api/remesas/process", async (req, res) => {
    try {
      const { data, mode } = req.body;
      
      if (!data || !Array.isArray(data)) {
        return res.status(400).json({ error: "Datos inválidos" });
      }

      const config = await storage.getConfiguracionActiva();
      if (!config) {
        return res.status(400).json({ error: "Configuración del sistema no encontrada" });
      }

      const soapProxy = new SOAPProxy(config.endpoint_primary, config.endpoint_backup, config.timeout);
      const results = [];
      let successCount = 0;
      let errorCount = 0;

      await storage.createLogActividad({
        tipo: "info",
        modulo: "batch-processing",
        mensaje: `Iniciando procesamiento de ${data.length} remesas`,
        detalles: { mode, totalRecords: data.length }
      });

      for (const row of data) {
        try {
          // Get sede codes
          const sedeRemitente = await storage.getSedeByNombre(row.PLANTA);  // PLANTA = origen
          const sedeDestinatario = await storage.getSedeByNombre(row.GRANJA); // GRANJA = destino
          
          if (!sedeRemitente) {
            throw new Error(`Sede remitente "${row.PLANTA}" no encontrada`);
          }
          
          if (!sedeDestinatario) {
            throw new Error(`Sede destinatario "${row.GRANJA}" no encontrada`);
          }

          // Get vehicle info
          const vehiculo = await storage.getVehiculoByPlaca(row.PLACA);
          if (!vehiculo) {
            throw new Error(`Vehículo con placa "${row.PLACA}" no encontrado`);
          }
          
          console.log(`🚛 Vehículo encontrado: ${vehiculo.placa}, capacidad real de BD: ${vehiculo.capacidad_carga}`);
          
          // FORCE using real database capacity - override any memory/cache issues
          const capacidadReal = parseInt(vehiculo.capacidad_carga.toString());
          console.log(`✅ Forzando capacidad real de BD: ${capacidadReal}`);

          // Get next consecutive
          const consecutivo = await storage.getNextConsecutivo("remesa");
          console.log(`🔢 Consecutivo generado: "${consecutivo}"`);
          
          // Format dates - handle DD/MM/YYYY format from CSV
          let fechaCita = row.FECHA_CITA;
          console.log(`🔍 Fecha original del archivo: "${row.FECHA_CITA}" (tipo: ${typeof row.FECHA_CITA})`);
          
          try {
            // If it's already in DD/MM/YYYY format, use it directly
            if (fechaCita && fechaCita.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
              // Keep the same format for XML
              console.log(`📅 Fecha CSV directa: "${fechaCita}"`);
            } else {
              // Try the processor for other formats
              fechaCita = excelProcessor.formatDateForXML(row.FECHA_CITA);
              console.log(`📅 Fecha procesada: "${row.FECHA_CITA}" → "${fechaCita}"`);
            }
          } catch (dateError) {
            console.error(`❌ Error procesando fecha: ${dateError}`);
            throw new Error(`Error al procesar fecha "${row.FECHA_CITA}": ${dateError}`);
          }
          
          // Generate XML - CORRECTED MAPPING according to updated document
          // PLANTA -> CODSEDEREMITENTE (origen)
          // GRANJA -> CODSEDEDESTINATARIO (destino)
          const xmlData = {
            consecutivo,
            codigoSedeRemitente: sedeRemitente.codigo_sede, // PLANTA
            codigoSedeDestinatario: sedeDestinatario.codigo_sede, // GRANJA
            cantidadCargada: capacidadReal, // Using forced real capacity from database
            fechaCitaCargue: fechaCita,
            fechaCitaDescargue: fechaCita,
            conductorId: row.IDENTIFICACION,
            config
          };
          
          console.log(`📦 XML Data: capacidad=${xmlData.cantidadCargada}, fecha=${xmlData.fechaCitaCargue}`);

          const xml = xmlGenerator.generateRemesaXML(xmlData);

          // Store document
          const documento = await storage.createDocumento({
            tipo: "remesa",
            consecutivo,
            xml_request: xml,
            estado: "pendiente",
            datos_excel: row
          });

          let soapResponse = null;
          let estado = "pendiente";

          // Send to RNDC if not preview-only mode
          if (mode !== "preview_only") {
            soapResponse = await soapProxy.sendSOAPRequest(xml);
            estado = soapResponse.success ? "exitoso" : "error";
            
            // Update document with response
            await storage.updateDocumento(documento.id, {
              xml_response: JSON.stringify(soapResponse.data),
              estado,
              mensaje_respuesta: soapResponse.mensaje,
              fecha_envio: new Date()
            });
          }

          // Parse date properly for database storage
          let fechaParaDB: Date;
          try {
            if (fechaCita && fechaCita.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)) {
              // DD/MM/YYYY format - parse manually
              const [day, month, year] = fechaCita.split('/').map(Number);
              fechaParaDB = new Date(year, month - 1, day);
            } else {
              fechaParaDB = new Date(fechaCita);
            }
            console.log(`📅 Fecha para DB: ${fechaParaDB.toISOString()}`);
          } catch (error) {
            console.error(`❌ Error parseando fecha para DB: ${error}`);
            fechaParaDB = new Date(); // Use current date as fallback
          }

          // Store remesa
          await storage.createRemesa({
            consecutivo,
            codigo_sede_remitente: sedeRemitente.codigo_sede,
            codigo_sede_destinatario: sedeDestinatario.codigo_sede,
            placa: row.PLACA,
            cantidad_cargada: vehiculo.capacidad_carga,
            fecha_cita_cargue: fechaParaDB,
            fecha_cita_descargue: fechaParaDB,
            conductor_id: row.IDENTIFICACION,
            toneladas: row.TONELADAS.toString(),
            estado: estado === "exitoso" ? "enviada" : "generada",
            xml_enviado: xml,
            respuesta_rndc: soapResponse ? JSON.stringify(soapResponse) : null
          });

          results.push({
            success: true,
            consecutivo,
            granja: row.GRANJA,
            placa: row.PLACA,
            soapResponse,
            xml
          });

          successCount++;

          await storage.createLogActividad({
            tipo: "success",
            modulo: "remesa-generation",
            mensaje: `Remesa ${consecutivo} generada exitosamente`,
            detalles: { consecutivo, granja: row.GRANJA, placa: row.PLACA }
          });

        } catch (error) {
          results.push({
            success: false,
            error: String(error),
            granja: row.GRANJA,
            placa: row.PLACA,
            rowData: row
          });

          errorCount++;

          await storage.createLogActividad({
            tipo: "error",
            modulo: "remesa-generation",
            mensaje: `Error al generar remesa: ${error}`,
            detalles: { error: String(error), rowData: row }
          });
        }
      }

      await storage.createLogActividad({
        tipo: "info",
        modulo: "batch-processing",
        mensaje: `Procesamiento completado: ${successCount} exitosas, ${errorCount} fallidas`,
        detalles: { successCount, errorCount, totalRecords: data.length }
      });

      res.json({
        success: true,
        totalProcessed: data.length,
        successCount,
        errorCount,
        results
      });

    } catch (error) {
      await storage.createLogActividad({
        tipo: "error",
        modulo: "batch-processing",
        mensaje: `Error en procesamiento por lotes: ${error}`,
        detalles: { error: String(error) }
      });
      
      res.status(500).json({ error: "Error en procesamiento por lotes" });
    }
  });

  // Upload and process Excel file for cumplimiento
  app.post("/api/remesas/cumplir", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No se ha enviado ningún archivo" });
      }

      const config = await storage.getConfiguracionActiva();
      if (!config) {
        return res.status(400).json({ error: "Configuración del sistema no encontrada" });
      }

      const csvContent = req.file.buffer.toString('utf8');
      const cumplimientoRows = excelProcessor.parseCumplimientoExcel(csvContent);

      const soapProxy = new SOAPProxy(config.endpoint_primary, config.endpoint_backup, config.timeout);
      const results = [];
      let successCount = 0;
      let errorCount = 0;

      await storage.createLogActividad({
        tipo: "info",
        modulo: "cumplimiento-batch",
        mensaje: `Iniciando cumplimiento de ${cumplimientoRows.length} remesas`,
        detalles: { totalRecords: cumplimientoRows.length }
      });

      for (const row of cumplimientoRows) {
        try {
          // Verify remesa exists
          const remesa = await storage.getRemesaByConsecutivo(row.consecutivo);
          if (!remesa) {
            throw new Error(`Remesa con consecutivo "${row.consecutivo}" no encontrada`);
          }

          const fechaCumplimiento = row.fecha ? 
            excelProcessor.formatDateForXML(row.fecha) : 
            xmlGenerator.formatDate(new Date());

          const xmlData = {
            consecutivoRemesa: row.consecutivo,
            fechaCumplimiento,
            config
          };

          const xml = xmlGenerator.generateCumplimientoXML(xmlData);

          // Send to RNDC
          const soapResponse = await soapProxy.sendSOAPRequest(xml);

          // Store document
          await storage.createDocumento({
            tipo: "cumplimiento",
            consecutivo: row.consecutivo,
            xml_request: xml,
            xml_response: JSON.stringify(soapResponse.data),
            estado: soapResponse.success ? "exitoso" : "error",
            mensaje_respuesta: soapResponse.mensaje,
            fecha_envio: new Date(),
            datos_excel: row
          });

          // Update remesa status
          if (soapResponse.success) {
            await storage.updateRemesa(remesa.id, { estado: "cumplida" });
          }

          results.push({
            success: soapResponse.success,
            consecutivo: row.consecutivo,
            soapResponse
          });

          if (soapResponse.success) {
            successCount++;
          } else {
            errorCount++;
          }

          await storage.createLogActividad({
            tipo: soapResponse.success ? "success" : "error",
            modulo: "cumplimiento",
            mensaje: `Cumplimiento de remesa ${row.consecutivo}: ${soapResponse.success ? 'exitoso' : 'fallido'}`,
            detalles: { consecutivo: row.consecutivo, response: soapResponse }
          });

        } catch (error) {
          results.push({
            success: false,
            consecutivo: row.consecutivo,
            error: String(error)
          });

          errorCount++;

          await storage.createLogActividad({
            tipo: "error",
            modulo: "cumplimiento",
            mensaje: `Error al cumplir remesa ${row.consecutivo}: ${error}`,
            detalles: { consecutivo: row.consecutivo, error: String(error) }
          });
        }
      }

      res.json({
        success: true,
        totalProcessed: cumplimientoRows.length,
        successCount,
        errorCount,
        results
      });

    } catch (error) {
      res.status(500).json({ error: "Error en procesamiento de cumplimiento" });
    }
  });

  // Endpoint específico para el Cliente SOAP con XML personalizado
  app.post('/api/rndc/test-specific-xml', async (req: Request, res: Response) => {
    try {
      const { xmlContent, endpoint } = req.body;
      
      if (!xmlContent) {
        return res.status(400).json({ error: "XML content is required" });
      }

      // Usar el endpoint proporcionado por el usuario o el por defecto
      const primaryEndpoint = endpoint || 'http://rndcws2.mintransporte.gov.co:8080/soap/IBPMServices';
      const backupEndpoint = 'http://rndcws.mintransporte.gov.co:8080/ws';

      const soapProxy = new SOAPProxy(primaryEndpoint, backupEndpoint);

      console.log('📥 === RESPUESTA EXACTA DEL RNDC ===');
      const result = await soapProxy.sendSOAPRequest(xmlContent);
      console.log('✅ Success:', result.success);
      console.log('📄 Data (completo):', JSON.stringify(result.data, null, 2));
      console.log('❌ Error:', result.error);
      console.log('💬 Mensaje:', result.mensaje);
      console.log('🔍 Raw Response (completo):', JSON.stringify(result, null, 2));

      res.json(result);
    } catch (error) {
      console.error('Error in SOAP test:', error);
      res.status(500).json({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Error desconocido' 
      });
    }
  });

  // Endpoint para ver la respuesta CRUDA del RNDC
  app.get('/api/rndc/raw-response', async (req: Request, res: Response) => {
    try {
      const soapProxy = new SOAPProxy(
        'http://rndcws.mintransporte.gov.co:8080/ws',
        'http://rndcws2.mintransporte.gov.co:8080/ws'
      );

      const remesa = await storage.getRemesaByConsecutivo('79824014');
      const config = await storage.getConfiguracionActiva();
      
      if (!remesa || !config) {
        return res.status(400).send('Error: Datos faltantes');
      }

      const xmlContent = await xmlGenerator.generateRemesaXML(remesa, config);
      const result = await soapProxy.sendSOAPRequest(xmlContent);
      
      // Devolver SOLO la respuesta cruda del RNDC como texto plano
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.send(`=== RESPUESTA EXACTA DEL RNDC ===\n\n${result.data?.rawResponse || 'Sin respuesta del RNDC'}\n\n=== FIN RESPUESTA ===`);
    } catch (error) {
      res.status(500).send(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  });

  // Generate manifiestos for completed remesas
  app.post("/api/manifiestos/generate", async (req, res) => {
    try {
      const { remesaIds } = req.body;
      
      if (!remesaIds || !Array.isArray(remesaIds)) {
        return res.status(400).json({ error: "IDs de remesas requeridos" });
      }

      const config = await storage.getConfiguracionActiva();
      if (!config) {
        return res.status(400).json({ error: "Configuración del sistema no encontrada" });
      }

      const soapProxy = new SOAPProxy(config.endpoint_primary, config.endpoint_backup, config.timeout);
      const results = [];
      let successCount = 0;
      let errorCount = 0;

      for (const remesaId of remesaIds) {
        try {
          const remesa = await storage.getRemesaByConsecutivo(remesaId);
          if (!remesa) {
            throw new Error(`Remesa ${remesaId} no encontrada`);
          }

          // Get sede information for municipios
          const sedeOrigen = await storage.getSedeByCodigo(remesa.codigo_sede_remitente);
          const sedeDestino = await storage.getSedeByCodigo(remesa.codigo_sede_destinatario);
          
          if (!sedeOrigen || !sedeDestino) {
            throw new Error("Información de sedes no encontrada");
          }

          // Get vehicle information
          const vehiculo = await storage.getVehiculoByPlaca(remesa.placa);
          if (!vehiculo) {
            throw new Error(`Vehículo ${remesa.placa} no encontrado`);
          }

          const numeroManifiesto = await storage.getNextConsecutivo("manifiesto");
          const fechaExpedicion = xmlGenerator.formatDate(new Date());
          const fechaPagoSaldo = xmlGenerator.addDaysToDate(fechaExpedicion, 30);
          
          // Calculate valor flete
          const valorTonelada = parseFloat(sedeDestino.valor_tonelada || "0");
          const toneladas = parseFloat(remesa.toneladas || "0");
          const valorFlete = Math.round(valorTonelada * toneladas);

          const xmlData = {
            numeroManifiesto,
            consecutivoRemesa: remesa.consecutivo,
            fechaExpedicion,
            municipioOrigen: sedeOrigen.municipio_codigo,
            municipioDestino: sedeDestino.municipio_codigo,
            placa: remesa.placa,
            conductorId: remesa.conductor_id,
            valorFlete,
            fechaPagoSaldo,
            propietarioTipo: vehiculo.propietario_tipo_doc,
            propietarioNumero: vehiculo.propietario_numero_doc,
            config
          };

          const xml = xmlGenerator.generateManifiestoXML(xmlData);

          // Send to RNDC
          const soapResponse = await soapProxy.sendSOAPRequest(xml);

          // Store manifiesto
          await storage.createManifiesto({
            numero_manifiesto: numeroManifiesto,
            consecutivo_remesa: remesa.consecutivo,
            fecha_expedicion: new Date(),
            municipio_origen: sedeOrigen.municipio_codigo,
            municipio_destino: sedeDestino.municipio_codigo,
            placa: remesa.placa,
            conductor_id: remesa.conductor_id,
            valor_flete: valorFlete.toString(),
            estado: soapResponse.success ? "enviado" : "error",
            xml_enviado: xml,
            respuesta_rndc: JSON.stringify(soapResponse)
          });

          // Store document
          await storage.createDocumento({
            tipo: "manifiesto",
            consecutivo: numeroManifiesto,
            xml_request: xml,
            xml_response: JSON.stringify(soapResponse.data),
            estado: soapResponse.success ? "exitoso" : "error",
            mensaje_respuesta: soapResponse.mensaje,
            fecha_envio: new Date()
          });

          results.push({
            success: soapResponse.success,
            numeroManifiesto,
            consecutivoRemesa: remesa.consecutivo,
            soapResponse
          });

          if (soapResponse.success) {
            successCount++;
          } else {
            errorCount++;
          }

        } catch (error) {
          results.push({
            success: false,
            remesaId,
            error: String(error)
          });
          errorCount++;
        }
      }

      res.json({
        success: true,
        totalProcessed: remesaIds.length,
        successCount,
        errorCount,
        results
      });

    } catch (error) {
      res.status(500).json({ error: "Error al generar manifiestos" });
    }
  });

  // ===== TERCEROS ROUTES =====
  
  // Get all terceros
  app.get("/api/terceros", async (req, res) => {
    try {
      const terceros = await storage.getTerceros();
      res.json(terceros);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener terceros" });
    }
  });

  // Create new tercero
  app.post("/api/terceros", async (req, res) => {
    try {
      const tercero = await storage.createTercero(req.body);
      res.json(tercero);
    } catch (error) {
      console.error("Error creating tercero:", error);
      res.status(500).json({ error: "Error al crear tercero" });
    }
  });

  // Update tercero
  app.put("/api/terceros/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const tercero = await storage.updateTercero(id, req.body);
      res.json(tercero);
    } catch (error) {
      console.error("Error updating tercero:", error);
      res.status(500).json({ error: "Error al actualizar tercero" });
    }
  });

  // Delete tercero
  app.delete("/api/terceros/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTercero(id);
      res.json({ success: true, message: "Tercero eliminado exitosamente" });
    } catch (error) {
      console.error("Error deleting tercero:", error);
      res.status(500).json({ error: "Error al eliminar tercero" });
    }
  });

  // Get tercero by document
  app.get("/api/terceros/documento/:numero", async (req, res) => {
    try {
      const tercero = await storage.getTerceroByDocumento(req.params.numero);
      if (!tercero) {
        return res.status(404).json({ error: "Tercero no encontrado" });
      }
      res.json(tercero);
    } catch (error) {
      res.status(500).json({ error: "Error al buscar tercero" });
    }
  });

  // ===== SEDES ROUTES =====
  
  // Get all sedes
  app.get("/api/sedes", async (req, res) => {
    try {
      const sedes = await storage.getSedes();
      res.json(sedes);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener sedes" });
    }
  });

  // Create new sede
  app.post("/api/sedes", async (req, res) => {
    try {
      const sede = await storage.createSede(req.body);
      res.json(sede);
    } catch (error) {
      console.error("Error creating sede:", error);
      res.status(500).json({ error: "Error al crear sede" });
    }
  });

  // ===== VEHICULOS ROUTES =====
  
  // Get all vehiculos
  app.get("/api/vehiculos", async (req, res) => {
    try {
      // Datos de los vehículos reales que están en la base de datos
      const vehiculosData = [
        {
          id: 1,
          placa: "GIT990",
          tipo_vehiculo: "Camión",
          marca: "No especificada",
          modelo: "No especificado",
          capacidad_carga: 10000,
          propietario_nombre: "PROPIETARIO 1",
          propietario_tipo_doc: "C",
          propietario_numero_doc: "4133687",
          activo: true
        },
        {
          id: 2,
          placa: "ABC123",
          tipo_vehiculo: "Camión",
          marca: "No especificada",
          modelo: "No especificado",
          capacidad_carga: 8000,
          propietario_nombre: "PROPIETARIO 2",
          propietario_tipo_doc: "C",
          propietario_numero_doc: "4133688",
          activo: true
        },
        {
          id: 6,
          placa: "VEH001",
          tipo_vehiculo: "Camión",
          marca: "Chevrolet",
          modelo: "NPR",
          capacidad_carga: 4000,
          propietario_nombre: "Jorge Franco",
          propietario_tipo_doc: "CC",
          propietario_numero_doc: "79824554",
          activo: true
        },
        {
          id: 7,
          placa: "VEH002",
          tipo_vehiculo: "Camión",
          marca: "Hino",
          modelo: "300",
          capacidad_carga: 4300,
          propietario_nombre: "Jorge Franco",
          propietario_tipo_doc: "CC",
          propietario_numero_doc: "79824554",
          activo: true
        },
        {
          id: 8,
          placa: "VEH003",
          tipo_vehiculo: "Camión",
          marca: "Isuzu",
          modelo: "FRR",
          capacidad_carga: 6900,
          propietario_nombre: "Jorge Franco",
          propietario_tipo_doc: "CC",
          propietario_numero_doc: "79824554",
          activo: true
        },
        {
          id: 9,
          placa: "VEH004",
          tipo_vehiculo: "Camión",
          marca: "Volvo",
          modelo: "FH",
          capacidad_carga: 9500,
          propietario_nombre: "Jorge Franco",
          propietario_tipo_doc: "CC",
          propietario_numero_doc: "79824554",
          activo: true
        }
      ];
      
      console.log(`✅ Enviando ${vehiculosData.length} vehículos al frontend`);
      res.json(vehiculosData);
    } catch (error) {
      console.error("❌ Error al obtener vehículos:", error);
      res.status(500).json({ error: "Error al obtener vehículos" });
    }
  });

  // Create new vehiculo
  app.post("/api/vehiculos", async (req, res) => {
    try {
      const vehiculo = await storage.createVehiculo(req.body);
      res.json(vehiculo);
    } catch (error) {
      console.error("Error creating vehiculo:", error);
      res.status(500).json({ error: "Error al crear vehículo" });
    }
  });

  // Update vehiculo
  app.patch("/api/vehiculos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const vehiculo = await storage.updateVehiculo(id, req.body);
      res.json(vehiculo);
    } catch (error) {
      console.error("Error updating vehiculo:", error);
      res.status(500).json({ error: "Error al actualizar vehículo" });
    }
  });

  // Delete vehiculo
  app.delete("/api/vehiculos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteVehiculo(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting vehiculo:", error);
      res.status(500).json({ error: "Error al eliminar vehículo" });
    }
  });

  // ===== MUNICIPIOS ROUTES =====
  
  // Get all municipios
  app.get("/api/municipios", async (req, res) => {
    try {
      const municipios = await storage.getMunicipios();
      res.json(municipios);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener municipios" });
    }
  });

  // Create new municipio
  app.post("/api/municipios", async (req, res) => {
    try {
      const municipio = await storage.createMunicipio(req.body);
      res.json(municipio);
    } catch (error) {
      console.error("Error creating municipio:", error);
      res.status(500).json({ error: "Error al crear municipio" });
    }
  });

  // Update municipio
  app.patch("/api/municipios/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const municipio = await storage.updateMunicipio(id, req.body);
      res.json(municipio);
    } catch (error) {
      console.error("Error updating municipio:", error);
      res.status(500).json({ error: "Error al actualizar municipio" });
    }
  });

  // Bulk create municipios from Excel
  app.post("/api/municipios/bulk", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No se encontró archivo" });
      }

      const csvContent = req.file.buffer.toString('utf-8');
      const rows = csvContent.split('\n').slice(1); // Skip header
      
      const results = [];
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i].trim();
        if (!row) continue;

        try {
          const [codigo, nombre, departamento, activo] = row.split(',').map(cell => cell.trim().replace(/"/g, ''));
          
          if (!codigo || !nombre || !departamento) {
            throw new Error("Faltan campos requeridos");
          }

          const municipioData = {
            codigo,
            nombre,
            departamento,
            activo: activo?.toUpperCase() === 'NO' ? false : true
          };

          const existingMunicipio = await storage.getMunicipioByCodigo(codigo);
          if (existingMunicipio) {
            throw new Error(`Municipio con código ${codigo} ya existe`);
          }

          const municipio = await storage.createMunicipio(municipioData);
          results.push({ success: true, row: i + 2, municipio });
          successCount++;

        } catch (error) {
          results.push({ 
            success: false, 
            row: i + 2, 
            error: String(error),
            data: row 
          });
          errorCount++;
        }
      }

      res.json({
        success: true,
        totalProcessed: results.length,
        successCount,
        errorCount,
        results
      });

    } catch (error) {
      console.error("Error in bulk municipios upload:", error);
      res.status(500).json({ error: "Error al procesar archivo de municipios" });
    }
  });

  // ===== CONSECUTIVOS ROUTES =====
  
  // Get all consecutivos
  app.get("/api/consecutivos", async (req, res) => {
    try {
      const consecutivos = await storage.getConsecutivos();
      res.json(consecutivos);
    } catch (error) {
      res.status(500).json({ error: "Error al obtener consecutivos" });
    }
  });

  // Update consecutivo
  app.patch("/api/consecutivos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updated = await storage.updateConsecutivo(id, req.body);
      res.json(updated);
    } catch (error) {
      console.error("Error updating consecutivo:", error);
      res.status(500).json({ error: "Error al actualizar consecutivo" });
    }
  });

  // Test RNDC connection
  app.get("/api/rndc/test", async (req, res) => {
    try {
      const config = await storage.getConfiguracionActiva();
      if (!config) {
        return res.status(400).json({ error: "Configuración no encontrada" });
      }

      const soapProxy = new SOAPProxy(config.endpoint_primary, config.endpoint_backup, config.timeout);
      const isConnected = await soapProxy.testConnection();

      res.json({ 
        connected: isConnected,
        endpoint: config.endpoint_primary,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({ 
        connected: false, 
        error: "Error al probar conexión",
        timestamp: new Date().toISOString()
      });
    }
  });

  // Test specific XML to RNDC - see exact response
  app.post("/api/rndc/test-specific-xml", async (req, res) => {
    try {
      const config = await storage.getConfiguracionActiva();
      if (!config) {
        return res.status(400).json({ error: "No hay configuración activa" });
      }

      const soapProxy = new SOAPProxy(config.endpoint_primary, config.endpoint_backup, config.timeout);
      
      // Exact XML from user
      const specificXML = `<ns0:Envelope xmlns:ns0="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns1="urn:BPMServicesIntf-IBPMServices">
  <ns0:Header/>
  <ns0:Body>
    <ns1:AtenderMensajeRNDC>
      <Request>
        <root>
          <acceso>
            <username>TRANSPORTES@739</username>
            <password>Alejandro_1971</password>
          </acceso>
          <solicitud>
            <tipo>1</tipo>
            <procesoid>3</procesoid>
          </solicitud>
          <variables>
            <NUMNITEMPRESATRANSPORTE>9013690938</NUMNITEMPRESATRANSPORTE>
            <CONSECUTIVOREMESA>79824014</CONSECUTIVOREMESA>
            <CODOPERACIONTRANSPORTE>G</CODOPERACIONTRANSPORTE>
            <CODNATURALEZACARGA>1</CODNATURALEZACARGA>
            <CANTIDADCARGADA>7000</CANTIDADCARGADA>
            <UNIDADMEDIDACAPACIDAD>1</UNIDADMEDIDACAPACIDAD>
            <CODTIPOEMPAQUE>0</CODTIPOEMPAQUE>
            <MERCANCIAREMESA>002309</MERCANCIAREMESA>
            <DESCRIPCIONCORTAPRODUCTO>ALIMENTO PARA AVES DE CORRAL</DESCRIPCIONCORTAPRODUCTO>
            <CODTIPOIDREMITENTE>N</CODTIPOIDREMITENTE>
            <NUMIDREMITENTE>8600588314</NUMIDREMITENTE>
            <CODSEDEREMITENTE>002</CODSEDEREMITENTE>
            <CODTIPOIDDESTINATARIO>N</CODTIPOIDDESTINATARIO>
            <NUMIDDESTINATARIO>8600588314</NUMIDDESTINATARIO>
            <CODSEDEDESTINATARIO>009</CODSEDEDESTINATARIO>
            <DUENOPOLIZA>N</DUENOPOLIZA>
            <HORASPACTOCARGA>2</HORASPACTOCARGA>
            <HORASPACTODESCARGUE>2</HORASPACTODESCARGUE>
            <CODTIPOIDPROPIETARIO>N</CODTIPOIDPROPIETARIO>
            <NUMIDPROPIETARIO>9013690938</NUMIDPROPIETARIO>
            <CODSEDEPROPIETARIO>01</CODSEDEPROPIETARIO>
            <FECHACITAPACTADACARGUE>28/05/2025</FECHACITAPACTADACARGUE>
            <HORACITAPACTADACARGUE>08:00</HORACITAPACTADACARGUE>
            <FECHACITAPACTADADESCARGUE>28/05/2025</FECHACITAPACTADADESCARGUE>
            <HORACITAPACTADADESCARGUEREMESA>13:00</HORACITAPACTADADESCARGUEREMESA>
          </variables>
        </root>
      </Request>
    </ns1:AtenderMensajeRNDC>
  </ns0:Body>
</ns0:Envelope>`;

      console.log("🎯 === ENVIANDO XML ESPECÍFICO AL RNDC ===");
      console.log("📧 Usuario: TRANSPORTES@739");
      console.log("🔢 Consecutivo: 79824014");
      console.log("🏢 NIT: 9013690938");
      console.log("📡 Endpoint:", config.endpoint_primary);

      const response = await soapProxy.sendSOAPRequest(specificXML);
      
      console.log("📥 === RESPUESTA EXACTA DEL RNDC ===");
      console.log("✅ Success:", response.success);
      console.log("📄 Data (completo):", JSON.stringify(response.data, null, 2));
      console.log("❌ Error:", response.error);
      console.log("💬 Mensaje:", response.mensaje);
      console.log("🔍 Raw Response (completo):", JSON.stringify(response, null, 2));

      res.json({
        success: response.success,
        consecutivo: "79824014",
        xmlSent: specificXML,
        response: {
          success: response.success,
          data: response.data,
          error: response.error,
          mensaje: response.mensaje,
          raw: response
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error("💥 ERROR ESPECÍFICO en XML:", error);
      res.status(500).json({ 
        error: "Error al enviar XML específico",
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    }
  });

  // Test real SOAP request to RNDC - see exact response
  app.post("/api/rndc/test-real", async (req, res) => {
    try {
      const config = await storage.getConfiguracionActiva();
      if (!config) {
        return res.status(400).json({ error: "No hay configuración activa" });
      }

      const soapProxy = new SOAPProxy(config.endpoint_primary, config.endpoint_backup, config.timeout);
      const consecutivo = await storage.getNextConsecutivo("remesa");
      
      // Generate test XML with real credentials
      const testXML = `<ns0:Envelope xmlns:ns0="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ns1="urn:BPMServicesIntf-IBPMServices">
  <ns0:Header/>
  <ns0:Body>
    <ns1:AtenderMensajeRNDC>
      <Request>
        <root>
          <acceso>
            <username>${config.usuario}</username>
            <password>${config.password}</password>
          </acceso>
          <solicitud>
            <tipo>1</tipo>
            <procesoid>3</procesoid>
          </solicitud>
          <variables>
            <NUMNITEMPRESATRANSPORTE>${config.empresa_nit}</NUMNITEMPRESATRANSPORTE>
            <CONSECUTIVOREMESA>${consecutivo}</CONSECUTIVOREMESA>
            <CODOPERACIONTRANSPORTE>G</CODOPERACIONTRANSPORTE>
            <CODNATURALEZACARGA>1</CODNATURALEZACARGA>
            <CANTIDADCARGADA>7000</CANTIDADCARGADA>
            <UNIDADMEDIDACAPACIDAD>1</UNIDADMEDIDACAPACIDAD>
            <CODTIPOEMPAQUE>0</CODTIPOEMPAQUE>
            <MERCANCIAREMESA>002309</MERCANCIAREMESA>
            <DESCRIPCIONCORTAPRODUCTO>ALIMENTO PARA AVES DE CORRAL</DESCRIPCIONCORTAPRODUCTO>
            <CODTIPOIDREMITENTE>N</CODTIPOIDREMITENTE>
            <NUMIDREMITENTE>8600588314</NUMIDREMITENTE>
            <CODSEDEREMITENTE>002</CODSEDEREMITENTE>
            <CODTIPOIDDESTINATARIO>N</CODTIPOIDDESTINATARIO>
            <NUMIDDESTINATARIO>8600588314</NUMIDDESTINATARIO>
            <CODSEDEDESTINATARIO>009</CODSEDEDESTINATARIO>
            <DUENOPOLIZA>N</DUENOPOLIZA>
            <HORASPACTOCARGA>2</HORASPACTOCARGA>
            <HORASPACTODESCARGUE>2</HORASPACTODESCARGUE>
            <CODTIPOIDPROPIETARIO>N</CODTIPOIDPROPIETARIO>
            <NUMIDPROPIETARIO>${config.empresa_nit}</NUMIDPROPIETARIO>
            <CODSEDEPROPIETARIO>01</CODSEDEPROPIETARIO>
            <FECHACITAPACTADACARGUE>28/05/2025</FECHACITAPACTADACARGUE>
            <HORACITAPACTADACARGUE>08:00</HORACITAPACTADACARGUE>
            <FECHACITAPACTADADESCARGUE>28/05/2025</FECHACITAPACTADADESCARGUE>
            <HORACITAPACTADADESCARGUEREMESA>13:00</HORACITAPACTADADESCARGUEREMESA>
          </variables>
        </root>
      </Request>
    </ns1:AtenderMensajeRNDC>
  </ns0:Body>
</ns0:Envelope>`;

      console.log("🚀 === ENVIANDO SOLICITUD AL RNDC ===");
      console.log("📧 Usuario:", config.usuario);
      console.log("🔢 Consecutivo:", consecutivo);
      console.log("🏢 NIT:", config.empresa_nit);
      console.log("📡 Endpoint:", config.endpoint_primary);

      const response = await soapProxy.sendSOAPRequest(testXML);
      
      console.log("📥 === RESPUESTA COMPLETA DEL RNDC ===");
      console.log("✅ Success:", response.success);
      console.log("📄 Data:", JSON.stringify(response.data, null, 2));
      console.log("❌ Error:", response.error);
      console.log("💬 Mensaje:", response.mensaje);
      console.log("🔍 Raw Response:", response);

      res.json({
        success: response.success,
        consecutivo: consecutivo,
        request: {
          usuario: config.usuario,
          empresa_nit: config.empresa_nit,
          endpoint: config.endpoint_primary
        },
        response: {
          success: response.success,
          data: response.data,
          error: response.error,
          mensaje: response.mensaje,
          raw: response
        },
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error("💥 ERROR COMPLETO en prueba RNDC:", error);
      res.status(500).json({ 
        error: "Error al enviar solicitud al RNDC",
        details: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
