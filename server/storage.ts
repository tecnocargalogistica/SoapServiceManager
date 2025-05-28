import { 
  configuraciones, consecutivos, documentos, logActividades, 
  manifiestos, municipios, remesas, sedes, terceros, usuarios, vehiculos,
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
  type User, type InsertUser
} from "@shared/schema";

export interface IStorage {
  // Usuarios (legacy compatibility)
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Configuraciones
  getConfiguraciones(): Promise<Configuracion[]>;
  getConfiguracionActiva(): Promise<Configuracion | undefined>;
  createConfiguracion(config: InsertConfiguracion): Promise<Configuracion>;
  updateConfiguracion(id: number, config: Partial<InsertConfiguracion>): Promise<Configuracion>;

  // Consecutivos
  getConsecutivos(): Promise<Consecutivo[]>;
  getConsecutivoByTipo(tipo: string, año: number): Promise<Consecutivo | undefined>;
  getNextConsecutivo(tipo: string): Promise<string>;
  updateConsecutivo(id: number, consecutivo: Partial<InsertConsecutivo>): Promise<Consecutivo>;
  createConsecutivo(consecutivo: InsertConsecutivo): Promise<Consecutivo>;

  // Documentos
  getDocumentos(): Promise<Documento[]>;
  getDocumentoByConsecutivo(consecutivo: string): Promise<Documento | undefined>;
  createDocumento(documento: InsertDocumento): Promise<Documento>;
  updateDocumento(id: number, documento: Partial<InsertDocumento>): Promise<Documento>;

  // Log Actividades
  getLogActividades(limit?: number): Promise<LogActividad[]>;
  createLogActividad(log: InsertLogActividad): Promise<LogActividad>;

  // Manifiestos
  getManifiestos(): Promise<Manifiesto[]>;
  getManifiestoByNumero(numero: string): Promise<Manifiesto | undefined>;
  createManifiesto(manifiesto: InsertManifiesto): Promise<Manifiesto>;
  updateManifiesto(id: number, manifiesto: Partial<InsertManifiesto>): Promise<Manifiesto>;

  // Municipios
  getMunicipios(): Promise<Municipio[]>;
  getMunicipioByCodigo(codigo: string): Promise<Municipio | undefined>;
  createMunicipio(municipio: InsertMunicipio): Promise<Municipio>;
  updateMunicipio(id: number, municipio: Partial<InsertMunicipio>): Promise<Municipio>;

  // Remesas
  getRemesas(): Promise<Remesa[]>;
  getRemesaByConsecutivo(consecutivo: string): Promise<Remesa | undefined>;
  createRemesa(remesa: InsertRemesa): Promise<Remesa>;
  updateRemesa(id: number, remesa: Partial<InsertRemesa>): Promise<Remesa>;

  // Sedes
  getSedes(): Promise<Sede[]>;
  getSedeByNombre(nombre: string): Promise<Sede | undefined>;
  getSedeByCodigo(codigo: string): Promise<Sede | undefined>;
  createSede(sede: InsertSede): Promise<Sede>;

  // Terceros
  getTerceros(): Promise<Tercero[]>;
  getTerceroByDocumento(numero: string): Promise<Tercero | undefined>;
  createTercero(tercero: InsertTercero): Promise<Tercero>;
  updateTercero(id: number, tercero: Partial<InsertTercero>): Promise<Tercero>;
  deleteTercero(id: number): Promise<void>;

  // Vehiculos
  getVehiculos(): Promise<Vehiculo[]>;
  getVehiculoByPlaca(placa: string): Promise<Vehiculo | undefined>;
  createVehiculo(vehiculo: InsertVehiculo): Promise<Vehiculo>;
  updateVehiculo(id: number, vehiculo: Partial<InsertVehiculo>): Promise<Vehiculo>;
  deleteVehiculo(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private configuracionesMap: Map<number, Configuracion> = new Map();
  private consecutivosMap: Map<number, Consecutivo> = new Map();
  private documentosMap: Map<number, Documento> = new Map();
  private logActividadesMap: Map<number, LogActividad> = new Map();
  private manifiestosMap: Map<number, Manifiesto> = new Map();
  private municipiosMap: Map<number, Municipio> = new Map();
  private remesasMap: Map<number, Remesa> = new Map();
  private sedesMap: Map<number, Sede> = new Map();
  private tercerosMap: Map<number, Tercero> = new Map();
  private usuariosMap: Map<number, Usuario> = new Map();
  private vehiculosMap: Map<number, Vehiculo> = new Map();

  private currentId = 1;

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create default configuration
    const defaultConfig: Configuracion = {
      id: this.currentId++,
      usuario: "TRANSPORTES@739",
      password: "Alejandro_1971",
      empresa_nit: "9013690938",
      endpoint_primary: "http://rndcws2.mintransporte.gov.co:8080/soap/IBPMServices",
      endpoint_backup: "http://rndcws.mintransporte.gov.co:8080/soap/IBPMServices",
      timeout: 30000,
      activo: true,
      created_at: new Date(),
      updated_at: new Date()
    };
    this.configuracionesMap.set(defaultConfig.id, defaultConfig);

    // Create default consecutivos
    const currentYear = new Date().getFullYear();
    const defaultConsecutivos = [
      { tipo: "remesa", ultimo_numero: 20250420, año: currentYear },
      { tipo: "manifiesto", ultimo_numero: 79154, año: currentYear }
    ];

    defaultConsecutivos.forEach(item => {
      const consecutivo: Consecutivo = {
        id: this.currentId++,
        tipo: item.tipo,
        ultimo_numero: item.ultimo_numero,
        prefijo: "",
        año: item.año,
        created_at: new Date(),
        updated_at: new Date()
      };
      this.consecutivosMap.set(consecutivo.id, consecutivo);
    });

    // Create default sedes
    const defaultSedes = [
      { codigo_sede: "002", nombre: "GRANJA NORTE", municipio_codigo: "25286000", valor_tonelada: "65000" },
      { codigo_sede: "003", nombre: "GRANJA SUR", municipio_codigo: "25320000", valor_tonelada: "70000" },
      { codigo_sede: "009", nombre: "PLANTA CENTRAL", municipio_codigo: "25320000", valor_tonelada: "75000" },
      { codigo_sede: "011", nombre: "PLANTA OESTE", municipio_codigo: "25286000", valor_tonelada: "68000" }
    ];

    defaultSedes.forEach(item => {
      const sede: Sede = {
        id: this.currentId++,
        codigo_sede: item.codigo_sede,
        nombre: item.nombre,
        direccion: "Dirección no especificada",
        municipio_codigo: item.municipio_codigo,
        telefono: "",
        valor_tonelada: item.valor_tonelada,
        activo: true,
        created_at: new Date()
      };
      this.sedesMap.set(sede.id, sede);
    });

    // Create default vehicles
    const defaultVehiculos = [
      { placa: "GIT990", capacidad_carga: 7000, propietario_tipo_doc: "C", propietario_numero_doc: "4133687", propietario_nombre: "PROPIETARIO 1" },
      { placa: "ABC123", capacidad_carga: 8000, propietario_tipo_doc: "C", propietario_numero_doc: "4133688", propietario_nombre: "PROPIETARIO 2" },
      { placa: "XYZ789", capacidad_carga: 12000, propietario_tipo_doc: "C", propietario_numero_doc: "4133689", propietario_nombre: "PROPIETARIO 3" }
    ];

    defaultVehiculos.forEach(item => {
      const vehiculo: Vehiculo = {
        id: this.currentId++,
        placa: item.placa,
        capacidad_carga: item.capacidad_carga,
        tipo_vehiculo: "Camión",
        marca: "No especificada",
        modelo: "No especificado",
        propietario_tipo_doc: item.propietario_tipo_doc,
        propietario_numero_doc: item.propietario_numero_doc,
        propietario_nombre: item.propietario_nombre,
        activo: true,
        created_at: new Date()
      };
      this.vehiculosMap.set(vehiculo.id, vehiculo);
    });

    // Create default municipios
    const defaultMunicipios = [
      { codigo: "25286000", nombre: "FLORENCIA", departamento: "CAQUETÁ" },
      { codigo: "25320000", nombre: "MONTAÑITA", departamento: "CAQUETÁ" },
      { codigo: "11001000", nombre: "BOGOTÁ", departamento: "CUNDINAMARCA" }
    ];

    defaultMunicipios.forEach(item => {
      const municipio: Municipio = {
        id: this.currentId++,
        codigo: item.codigo,
        nombre: item.nombre,
        departamento: item.departamento,
        activo: true
      };
      this.municipiosMap.set(municipio.id, municipio);
    });

    // Create default user
    const defaultUser: Usuario = {
      id: this.currentId++,
      username: "admin",
      password: "admin123",
      nombre: "Admin Usuario",
      email: "admin@rndc.com",
      rol: "admin",
      activo: true,
      ultimo_acceso: null,
      created_at: new Date(),
      updated_at: new Date()
    };
    this.usuariosMap.set(defaultUser.id, defaultUser);
  }

  // Legacy user methods for compatibility
  async getUser(id: number): Promise<User | undefined> {
    return this.usuariosMap.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.usuariosMap.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { 
      ...insertUser, 
      id,
      created_at: new Date(),
      updated_at: new Date(),
      ultimo_acceso: null
    };
    this.usuariosMap.set(id, user);
    return user;
  }

  // Configuraciones
  async getConfiguraciones(): Promise<Configuracion[]> {
    return Array.from(this.configuracionesMap.values());
  }

  async getConfiguracionActiva(): Promise<Configuracion | undefined> {
    return Array.from(this.configuracionesMap.values()).find(config => config.activo);
  }

  async createConfiguracion(insertConfig: InsertConfiguracion): Promise<Configuracion> {
    const id = this.currentId++;
    const config: Configuracion = {
      ...insertConfig,
      id,
      created_at: new Date(),
      updated_at: new Date()
    };
    this.configuracionesMap.set(id, config);
    return config;
  }

  async updateConfiguracion(id: number, updates: Partial<InsertConfiguracion>): Promise<Configuracion> {
    const existing = this.configuracionesMap.get(id);
    if (!existing) throw new Error("Configuración no encontrada");
    
    const updated: Configuracion = {
      ...existing,
      ...updates,
      updated_at: new Date()
    };
    this.configuracionesMap.set(id, updated);
    return updated;
  }

  // Consecutivos
  async getConsecutivos(): Promise<Consecutivo[]> {
    return Array.from(this.consecutivosMap.values());
  }

  async getConsecutivoByTipo(tipo: string, año: number): Promise<Consecutivo | undefined> {
    return Array.from(this.consecutivosMap.values()).find(c => c.tipo === tipo && c.año === año);
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
    const existing = this.consecutivosMap.get(id);
    if (!existing) throw new Error("Consecutivo no encontrado");
    
    const updated: Consecutivo = {
      ...existing,
      ...updates,
      updated_at: new Date()
    };
    this.consecutivosMap.set(id, updated);
    return updated;
  }

  async createConsecutivo(insertConsecutivo: InsertConsecutivo): Promise<Consecutivo> {
    const id = this.currentId++;
    const consecutivo: Consecutivo = {
      ...insertConsecutivo,
      id,
      created_at: new Date(),
      updated_at: new Date()
    };
    this.consecutivosMap.set(id, consecutivo);
    return consecutivo;
  }

  // Documentos
  async getDocumentos(): Promise<Documento[]> {
    return Array.from(this.documentosMap.values());
  }

  async getDocumentoByConsecutivo(consecutivo: string): Promise<Documento | undefined> {
    return Array.from(this.documentosMap.values()).find(doc => doc.consecutivo === consecutivo);
  }

  async createDocumento(insertDocumento: InsertDocumento): Promise<Documento> {
    const id = this.currentId++;
    const documento: Documento = {
      ...insertDocumento,
      id,
      created_at: new Date()
    };
    this.documentosMap.set(id, documento);
    return documento;
  }

  async updateDocumento(id: number, updates: Partial<InsertDocumento>): Promise<Documento> {
    const existing = this.documentosMap.get(id);
    if (!existing) throw new Error("Documento no encontrado");
    
    const updated: Documento = { ...existing, ...updates };
    this.documentosMap.set(id, updated);
    return updated;
  }

  // Log Actividades
  async getLogActividades(limit = 100): Promise<LogActividad[]> {
    const logs = Array.from(this.logActividadesMap.values());
    return logs.sort((a, b) => b.created_at!.getTime() - a.created_at!.getTime()).slice(0, limit);
  }

  async createLogActividad(insertLog: InsertLogActividad): Promise<LogActividad> {
    const id = this.currentId++;
    const log: LogActividad = {
      ...insertLog,
      id,
      created_at: new Date()
    };
    this.logActividadesMap.set(id, log);
    return log;
  }

  // Manifiestos
  async getManifiestos(): Promise<Manifiesto[]> {
    return Array.from(this.manifiestosMap.values());
  }

  async getManifiestoByNumero(numero: string): Promise<Manifiesto | undefined> {
    return Array.from(this.manifiestosMap.values()).find(m => m.numero_manifiesto === numero);
  }

  async createManifiesto(insertManifiesto: InsertManifiesto): Promise<Manifiesto> {
    const id = this.currentId++;
    const manifiesto: Manifiesto = {
      ...insertManifiesto,
      id,
      created_at: new Date()
    };
    this.manifiestosMap.set(id, manifiesto);
    return manifiesto;
  }

  async updateManifiesto(id: number, updates: Partial<InsertManifiesto>): Promise<Manifiesto> {
    const existing = this.manifiestosMap.get(id);
    if (!existing) throw new Error("Manifiesto no encontrado");
    
    const updated: Manifiesto = { ...existing, ...updates };
    this.manifiestosMap.set(id, updated);
    return updated;
  }

  // Municipios
  async getMunicipios(): Promise<Municipio[]> {
    return Array.from(this.municipiosMap.values());
  }

  async getMunicipioByCodigo(codigo: string): Promise<Municipio | undefined> {
    return Array.from(this.municipiosMap.values()).find(m => m.codigo === codigo);
  }

  async createMunicipio(insertMunicipio: InsertMunicipio): Promise<Municipio> {
    const id = this.currentId++;
    const municipio: Municipio = { ...insertMunicipio, id };
    this.municipiosMap.set(id, municipio);
    return municipio;
  }

  async updateMunicipio(id: number, updates: Partial<InsertMunicipio>): Promise<Municipio> {
    const existing = this.municipiosMap.get(id);
    if (!existing) throw new Error("Municipio no encontrado");
    
    const updated: Municipio = { ...existing, ...updates };
    this.municipiosMap.set(id, updated);
    return updated;
  }

  // Remesas
  async getRemesas(): Promise<Remesa[]> {
    return Array.from(this.remesasMap.values());
  }

  async getRemesaByConsecutivo(consecutivo: string): Promise<Remesa | undefined> {
    return Array.from(this.remesasMap.values()).find(r => r.consecutivo === consecutivo);
  }

  async createRemesa(insertRemesa: InsertRemesa): Promise<Remesa> {
    const id = this.currentId++;
    const remesa: Remesa = {
      ...insertRemesa,
      id,
      created_at: new Date()
    };
    this.remesasMap.set(id, remesa);
    return remesa;
  }

  async updateRemesa(id: number, updates: Partial<InsertRemesa>): Promise<Remesa> {
    const existing = this.remesasMap.get(id);
    if (!existing) throw new Error("Remesa no encontrada");
    
    const updated: Remesa = { ...existing, ...updates };
    this.remesasMap.set(id, updated);
    return updated;
  }

  // Sedes
  async getSedes(): Promise<Sede[]> {
    return Array.from(this.sedesMap.values());
  }

  async getSedeByNombre(nombre: string): Promise<Sede | undefined> {
    return Array.from(this.sedesMap.values()).find(s => s.nombre.toLowerCase().includes(nombre.toLowerCase()));
  }

  async getSedeByCodigo(codigo: string): Promise<Sede | undefined> {
    return Array.from(this.sedesMap.values()).find(s => s.codigo_sede === codigo);
  }

  async createSede(insertSede: InsertSede): Promise<Sede> {
    const id = this.currentId++;
    const sede: Sede = {
      ...insertSede,
      id,
      created_at: new Date()
    };
    this.sedesMap.set(id, sede);
    return sede;
  }

  // Terceros
  async getTerceros(): Promise<Tercero[]> {
    return Array.from(this.tercerosMap.values());
  }

  async getTerceroByDocumento(numero: string): Promise<Tercero | undefined> {
    return Array.from(this.tercerosMap.values()).find(t => t.numero_documento === numero);
  }

  async createTercero(insertTercero: InsertTercero): Promise<Tercero> {
    const id = this.currentId++;
    const tercero: Tercero = {
      ...insertTercero,
      id,
      created_at: new Date()
    };
    this.tercerosMap.set(id, tercero);
    return tercero;
  }

  async updateTercero(id: number, updates: Partial<InsertTercero>): Promise<Tercero> {
    const existing = this.tercerosMap.get(id);
    if (!existing) {
      throw new Error(`Tercero con ID ${id} no encontrado`);
    }
    const updated: Tercero = { 
      ...existing, 
      ...updates,
      updated_at: new Date()
    };
    this.tercerosMap.set(id, updated);
    return updated;
  }

  async deleteTercero(id: number): Promise<void> {
    if (!this.tercerosMap.has(id)) {
      throw new Error(`Tercero con ID ${id} no encontrado`);
    }
    this.tercerosMap.delete(id);
  }

  // Vehiculos
  async getVehiculos(): Promise<Vehiculo[]> {
    return Array.from(this.vehiculosMap.values());
  }

  async getVehiculoByPlaca(placa: string): Promise<Vehiculo | undefined> {
    return Array.from(this.vehiculosMap.values()).find(v => v.placa === placa);
  }

  async createVehiculo(insertVehiculo: InsertVehiculo): Promise<Vehiculo> {
    const id = this.currentId++;
    const vehiculo: Vehiculo = {
      ...insertVehiculo,
      id,
      created_at: new Date()
    };
    this.vehiculosMap.set(id, vehiculo);
    return vehiculo;
  }

  async updateVehiculo(id: number, updates: Partial<InsertVehiculo>): Promise<Vehiculo> {
    const existing = this.vehiculosMap.get(id);
    if (!existing) {
      throw new Error("Vehículo no encontrado");
    }

    const updated: Vehiculo = { 
      ...existing, 
      ...updates,
      id // Ensure ID doesn't change
    };
    this.vehiculosMap.set(id, updated);
    return updated;
  }

  async deleteVehiculo(id: number): Promise<void> {
    this.vehiculosMap.delete(id);
  }
}

// Import database storage for production
import { DatabaseStorage } from "./db-storage";

// Use database storage in production, memory storage for development/testing
export const storage = new DatabaseStorage();
