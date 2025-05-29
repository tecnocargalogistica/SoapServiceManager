import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "./db";
import { 
  configuraciones, consecutivos, documentos, logActividades, 
  manifiestos, municipios, remesas, sedes, terceros, usuarios, vehiculos,
  plantillasPdf,
  type Configuracion, type InsertConfiguracion,
  type Consecutivo, type InsertConsecutivo,
  type Documento, type InsertDocumento,
  type LogActividad, type InsertLogActividad,
  type Manifiesto, type InsertManifiesto,
  type Municipio, type InsertMunicipio,
  type Remesa, type InsertRemesa,
  type Sede, type InsertSede,
  type Tercero, type InsertTercero,
  type Usuario, type InsertUsuario,
  type Vehiculo, type InsertVehiculo,
  type PlantillaPdf, type InsertPlantillaPdf,
  type User, type InsertUser
} from "@shared/schema";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {

  // Legacy user methods for compatibility
  async getUser(id: number): Promise<User | undefined> {
    const users = await db.select().from(usuarios).where(eq(usuarios.id, id));
    return users[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const users = await db.select().from(usuarios).where(eq(usuarios.username, username));
    return users[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(usuarios).values(insertUser).returning();
    return user;
  }

  // Configuraciones
  async getConfiguraciones(): Promise<Configuracion[]> {
    return await db.select().from(configuraciones);
  }

  async getConfiguracionActiva(): Promise<Configuracion | undefined> {
    const configs = await db.select().from(configuraciones).where(eq(configuraciones.activo, true));
    return configs[0];
  }

  async createConfiguracion(insertConfig: InsertConfiguracion): Promise<Configuracion> {
    const [config] = await db.insert(configuraciones).values(insertConfig).returning();
    return config;
  }

  async updateConfiguracion(id: number, updates: Partial<InsertConfiguracion>): Promise<Configuracion> {
    const [updated] = await db.update(configuraciones)
      .set({ ...updates, updated_at: new Date() })
      .where(eq(configuraciones.id, id))
      .returning();
    return updated;
  }

  // Consecutivos
  async getConsecutivos(): Promise<Consecutivo[]> {
    return await db.select().from(consecutivos);
  }

  async getConsecutivoByTipo(tipo: string, año: number): Promise<Consecutivo | undefined> {
    const results = await db.select().from(consecutivos)
      .where(and(eq(consecutivos.tipo, tipo), eq(consecutivos.año, año)));
    return results[0];
  }

  async getNextConsecutivo(tipo: string): Promise<string> {
    const currentYear = new Date().getFullYear();
    const consecutivo = await this.getConsecutivoByTipo(tipo, currentYear);
    
    if (consecutivo) {
      const nextNumber = consecutivo.ultimo_numero + 1;
      await this.updateConsecutivo(consecutivo.id, { ultimo_numero: nextNumber });
      return nextNumber.toString();
    }
    
    // Create new consecutivo if doesn't exist
    const newConsecutivo = await this.createConsecutivo({
      tipo,
      ultimo_numero: 1,
      prefijo: "",
      año: currentYear
    });
    return "1";
  }

  async updateConsecutivo(id: number, updates: Partial<InsertConsecutivo>): Promise<Consecutivo> {
    const [updated] = await db.update(consecutivos)
      .set({ ...updates, updated_at: new Date() })
      .where(eq(consecutivos.id, id))
      .returning();
    return updated;
  }

  async createConsecutivo(insertConsecutivo: InsertConsecutivo): Promise<Consecutivo> {
    const [consecutivo] = await db.insert(consecutivos).values(insertConsecutivo).returning();
    return consecutivo;
  }

  // Documentos
  async getDocumentos(): Promise<Documento[]> {
    return await db.select().from(documentos).orderBy(desc(documentos.created_at));
  }

  async getDocumentoByConsecutivo(consecutivo: string): Promise<Documento | undefined> {
    const docs = await db.select().from(documentos).where(eq(documentos.consecutivo, consecutivo));
    return docs[0];
  }

  async createDocumento(insertDocumento: InsertDocumento): Promise<Documento> {
    const [documento] = await db.insert(documentos).values(insertDocumento).returning();
    return documento;
  }

  async updateDocumento(id: number, updates: Partial<InsertDocumento>): Promise<Documento> {
    const [updated] = await db.update(documentos)
      .set(updates)
      .where(eq(documentos.id, id))
      .returning();
    return updated;
  }

  // Log Actividades
  async getLogActividades(limit = 100): Promise<LogActividad[]> {
    return await db.select().from(logActividades)
      .orderBy(desc(logActividades.created_at))
      .limit(limit);
  }

  async createLogActividad(insertLog: InsertLogActividad): Promise<LogActividad> {
    const [log] = await db.insert(logActividades).values(insertLog).returning();
    return log;
  }

  // Manifiestos
  async getManifiestos(): Promise<Manifiesto[]> {
    return await db.select().from(manifiestos).orderBy(desc(manifiestos.created_at));
  }

  async getManifiestosCompletos(): Promise<any[]> {
    try {
      // Por ahora, simplemente devolvemos los manifiestos básicos
      // hasta que podamos resolver los problemas del esquema
      const manifiestosList = await db
        .select()
        .from(manifiestos)
        .orderBy(desc(manifiestos.created_at));

      return manifiestosList;
    } catch (error) {
      console.error("❌ Error en getManifiestosCompletos:", error);
      return [];
    }
  }

  async getManifiestoByNumero(numero: string): Promise<Manifiesto | undefined> {
    const manifiestoList = await db.select().from(manifiestos)
      .where(eq(manifiestos.numero_manifiesto, numero));
    return manifiestoList[0];
  }

  async createManifiesto(insertManifiesto: InsertManifiesto): Promise<Manifiesto> {
    const [manifiesto] = await db.insert(manifiestos).values(insertManifiesto).returning();
    return manifiesto;
  }

  async updateManifiesto(id: number, updates: Partial<InsertManifiesto>): Promise<Manifiesto> {
    const [updated] = await db.update(manifiestos)
      .set(updates)
      .where(eq(manifiestos.id, id))
      .returning();
    return updated;
  }

  // Municipios
  async getMunicipios(): Promise<Municipio[]> {
    return await db.select().from(municipios).where(eq(municipios.activo, true));
  }

  async getMunicipioByCodigo(codigo: string): Promise<Municipio | undefined> {
    const municipioList = await db.select().from(municipios)
      .where(eq(municipios.codigo, codigo));
    return municipioList[0];
  }

  async createMunicipio(insertMunicipio: InsertMunicipio): Promise<Municipio> {
    const [municipio] = await db.insert(municipios).values(insertMunicipio).returning();
    return municipio;
  }

  async updateMunicipio(id: number, updates: Partial<InsertMunicipio>): Promise<Municipio> {
    const [municipio] = await db.update(municipios)
      .set(updates)
      .where(eq(municipios.id, id))
      .returning();
    if (!municipio) {
      throw new Error(`Municipio con ID ${id} no encontrado`);
    }
    return municipio;
  }

  // Remesas
  async getRemesas(): Promise<Remesa[]> {
    return await db.select().from(remesas).orderBy(desc(remesas.created_at));
  }

  async getRemesaByConsecutivo(consecutivo: string): Promise<Remesa | undefined> {
    const remesaList = await db.select().from(remesas)
      .where(eq(remesas.consecutivo, consecutivo));
    return remesaList[0];
  }

  async createRemesa(insertRemesa: InsertRemesa): Promise<Remesa> {
    const [remesa] = await db.insert(remesas).values(insertRemesa).returning();
    return remesa;
  }

  async updateRemesa(id: number, updates: Partial<InsertRemesa>): Promise<Remesa> {
    const [updated] = await db.update(remesas)
      .set(updates)
      .where(eq(remesas.id, id))
      .returning();
    return updated;
  }

  // Sedes
  async getSedes(): Promise<Sede[]> {
    return await db.select().from(sedes).where(eq(sedes.activo, true));
  }

  async getSedeByNombre(nombre: string): Promise<Sede | undefined> {
    const sedeList = await db.select().from(sedes)
      .where(eq(sedes.nombre, nombre));
    return sedeList[0];
  }

  async getSedeByCodigo(codigo: string): Promise<Sede | undefined> {
    const sedeList = await db.select().from(sedes)
      .where(eq(sedes.codigo_sede, codigo));
    return sedeList[0];
  }

  async createSede(insertSede: InsertSede): Promise<Sede> {
    const [sede] = await db.insert(sedes).values(insertSede).returning();
    return sede;
  }

  // Terceros
  async getTerceros(): Promise<Tercero[]> {
    return await db.select().from(terceros).where(eq(terceros.activo, true));
  }

  async getTerceroByDocumento(numero: string): Promise<Tercero | undefined> {
    const terceroList = await db.select().from(terceros)
      .where(eq(terceros.numero_documento, numero));
    return terceroList[0];
  }

  async createTercero(insertTercero: InsertTercero): Promise<Tercero> {
    const [tercero] = await db.insert(terceros).values(insertTercero).returning();
    return tercero;
  }

  async updateTercero(id: number, updates: Partial<InsertTercero>): Promise<Tercero> {
    const [tercero] = await db.update(terceros)
      .set(updates)
      .where(eq(terceros.id, id))
      .returning();
    
    if (!tercero) {
      throw new Error(`Tercero con ID ${id} no encontrado`);
    }
    
    return tercero;
  }

  async deleteTercero(id: number): Promise<void> {
    // First check if tercero exists
    const existing = await db.select().from(terceros).where(eq(terceros.id, id));
    
    if (existing.length === 0) {
      throw new Error(`Tercero con ID ${id} no encontrado`);
    }
    
    // Delete the tercero
    await db.delete(terceros).where(eq(terceros.id, id));
  }

  // Vehiculos
  async getVehiculos(): Promise<Vehiculo[]> {
    try {
      console.log("🚗 Obteniendo vehículos directamente de PostgreSQL...");
      const result = await db.execute(`
        SELECT 
          id, placa, tipo_vehiculo, marca, modelo, capacidad_carga,
          propietario_nombre, propietario_tipo_doc, propietario_numero_doc, 
          activo, created_at, configuracion, clase, servicio, numero_ejes,
          carroceria, modalidad, linea, tipo_combustible, peso_vacio,
          fecha_matricula, "modelo_año", peso_bruto_vehicular, unidad_medida,
          numero_poliza, aseguradora, nit_aseguradora, vence_soat,
          vence_revision_tecnomecanica, propietario_id, tenedor_tipo_doc,
          tenedor_numero_doc, tenedor_nombre, tenedor_id
        FROM vehiculos 
        WHERE activo = true
        ORDER BY created_at DESC
      `);
      console.log(`✅ Vehículos obtenidos: ${result.length}`);
      return result as any[];
    } catch (error) {
      console.error("❌ Error en getVehiculos:", error);
      return [];
    }
  }

  async getVehiculoByPlaca(placa: string): Promise<Vehiculo | undefined> {
    const vehiculoList = await db.select().from(vehiculos)
      .where(eq(vehiculos.placa, placa));
    return vehiculoList[0];
  }

  async createVehiculo(insertVehiculo: InsertVehiculo): Promise<Vehiculo> {
    const [vehiculo] = await db.insert(vehiculos).values(insertVehiculo).returning();
    return vehiculo;
  }

  async updateVehiculo(id: number, updates: Partial<InsertVehiculo>): Promise<Vehiculo> {
    const [vehiculo] = await db.update(vehiculos)
      .set(updates)
      .where(eq(vehiculos.id, id))
      .returning();
    return vehiculo;
  }

  async deleteVehiculo(id: number): Promise<void> {
    await db.update(vehiculos)
      .set({ activo: false })
      .where(eq(vehiculos.id, id));
  }

  // Plantillas PDF
  async getPlantillasPdf(): Promise<PlantillaPdf[]> {
    return await db.select().from(plantillasPdf).orderBy(desc(plantillasPdf.created_at));
  }

  async getPlantillaPdfActiva(): Promise<PlantillaPdf | undefined> {
    const plantillas = await db.select().from(plantillasPdf).where(eq(plantillasPdf.activa, true));
    return plantillas[0];
  }

  async getPlantillaPdfById(id: number): Promise<PlantillaPdf | undefined> {
    const plantillas = await db.select().from(plantillasPdf).where(eq(plantillasPdf.id, id));
    return plantillas[0];
  }

  async createPlantillaPdf(insertPlantilla: InsertPlantillaPdf): Promise<PlantillaPdf> {
    // Si la nueva plantilla está marcada como activa, desactivar las otras
    if (insertPlantilla.activa) {
      await db.update(plantillasPdf).set({ activa: false });
    }
    
    const [plantilla] = await db.insert(plantillasPdf).values(insertPlantilla).returning();
    return plantilla;
  }

  async updatePlantillaPdf(id: number, updates: Partial<InsertPlantillaPdf>): Promise<PlantillaPdf> {
    // Si se está activando esta plantilla, desactivar las otras
    if (updates.activa) {
      await db.update(plantillasPdf).set({ activa: false });
    }
    
    const [plantilla] = await db.update(plantillasPdf)
      .set({ ...updates, updated_at: sql`now()` })
      .where(eq(plantillasPdf.id, id))
      .returning();
    return plantilla;
  }

  async deletePlantillaPdf(id: number): Promise<void> {
    await db.delete(plantillasPdf).where(eq(plantillasPdf.id, id));
  }
}