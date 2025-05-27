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

      // Log upload activity
      await storage.createLogActividad({
        tipo: "info",
        modulo: "excel-upload",
        mensaje: `Archivo Excel cargado: ${req.file.originalname}`,
        detalles: { fileSize: req.file.size, originalName: req.file.originalname }
      });

      // Convert buffer to string (assuming CSV format for simplicity)
      const csvContent = req.file.buffer.toString('utf8');
      
      // Parse Excel data
      const excelRows = excelProcessor.parseExcelData(csvContent);
      
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
          const sedeRemitente = await storage.getSedeByNombre(row.GRANJA);
          const sedeDestinatario = await storage.getSedeByNombre(row.PLANTA);
          
          if (!sedeRemitente) {
            throw new Error(`Sede remitente "${row.GRANJA}" no encontrada`);
          }
          
          if (!sedeDestinatario) {
            throw new Error(`Sede destinatario "${row.PLANTA}" no encontrada`);
          }

          // Get vehicle info
          const vehiculo = await storage.getVehiculoByPlaca(row.PLACA);
          if (!vehiculo) {
            throw new Error(`Vehículo con placa "${row.PLACA}" no encontrado`);
          }

          // Get next consecutive
          const consecutivo = await storage.getNextConsecutivo("remesa");
          
          // Format dates
          const fechaCita = excelProcessor.formatDateForXML(row.FECHA_CITA);
          
          // Generate XML
          const xmlData = {
            consecutivo,
            codigoSedeRemitente: sedeRemitente.codigo_sede,
            codigoSedeDestinatario: sedeDestinatario.codigo_sede,
            cantidadCargada: vehiculo.capacidad_carga,
            fechaCitaCargue: fechaCita,
            fechaCitaDescargue: fechaCita,
            conductorId: row.IDENTIFICACION,
            config
          };

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

          // Store remesa
          await storage.createRemesa({
            consecutivo,
            codigo_sede_remitente: sedeRemitente.codigo_sede,
            codigo_sede_destinatario: sedeDestinatario.codigo_sede,
            placa: row.PLACA,
            cantidad_cargada: vehiculo.capacidad_carga,
            fecha_cita_cargue: new Date(row.FECHA_CITA),
            fecha_cita_descargue: new Date(row.FECHA_CITA),
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
      console.log("📋 Obteniendo vehículos desde la API...");
      const vehiculos = await storage.getVehiculos();
      console.log(`📋 Enviando ${vehiculos.length} vehículos al frontend`);
      res.json(vehiculos);
    } catch (error) {
      console.error("❌ Error completo en API vehiculos:", error);
      res.status(500).json({ error: "Error al obtener vehículos", details: error.message });
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

  const httpServer = createServer(app);
  return httpServer;
}
