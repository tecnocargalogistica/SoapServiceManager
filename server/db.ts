import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  configuraciones, consecutivos, documentos, logActividades,
  manifiestos, municipios, remesas, sedes, terceros, usuarios, vehiculos
} from "@shared/schema";

// Database connection
const connectionString = process.env.DATABASE_URL || "";
const queryClient = postgres(connectionString);
export const db = drizzle(queryClient);

// Initialize database with default data
export async function initializeDatabase() {
  try {
    console.log("Inicializando base de datos...");

    // Check if tables exist and create initial data
    const existingConfig = await db.select().from(configuraciones).limit(1);
    
    if (existingConfig.length === 0) {
      console.log("Creando datos iniciales...");
      
      // Insert default configuration
      await db.insert(configuraciones).values({
        usuario: "TRANSPORTES@739",
        password: "Alejandro_1971",
        empresa_nit: "9013690938",
        endpoint_primary: "http://rndcws.mintransporte.gov.co:8080/ws",
        endpoint_backup: "http://rndcws2.mintransporte.gov.co:8080/ws",
        timeout: 30000,
        activo: true
      });

      // Insert default consecutivos
      const currentYear = new Date().getFullYear();
      await db.insert(consecutivos).values([
        {
          tipo: "remesa",
          ultimo_numero: 20250419,
          prefijo: "",
          año: currentYear
        },
        {
          tipo: "manifiesto", 
          ultimo_numero: 79154,
          prefijo: "",
          año: currentYear
        }
      ]);

      // Insert default municipios
      await db.insert(municipios).values([
        {
          codigo: "25286000",
          nombre: "FLORENCIA",
          departamento: "CAQUETÁ",
          activo: true
        },
        {
          codigo: "25320000",
          nombre: "MONTAÑITA", 
          departamento: "CAQUETÁ",
          activo: true
        },
        {
          codigo: "11001000",
          nombre: "BOGOTÁ",
          departamento: "CUNDINAMARCA",
          activo: true
        }
      ]);

      // Insert default sedes
      await db.insert(sedes).values([
        {
          codigo_sede: "002",
          nombre: "GRANJA NORTE",
          direccion: "Dirección no especificada",
          municipio_codigo: "25286000",
          telefono: "",
          valor_tonelada: "65000",
          activo: true
        },
        {
          codigo_sede: "003",
          nombre: "GRANJA SUR",
          direccion: "Dirección no especificada", 
          municipio_codigo: "25320000",
          telefono: "",
          valor_tonelada: "70000",
          activo: true
        },
        {
          codigo_sede: "009",
          nombre: "PLANTA CENTRAL",
          direccion: "Dirección no especificada",
          municipio_codigo: "25320000", 
          telefono: "",
          valor_tonelada: "75000",
          activo: true
        },
        {
          codigo_sede: "011",
          nombre: "PLANTA OESTE",
          direccion: "Dirección no especificada",
          municipio_codigo: "25286000",
          telefono: "",
          valor_tonelada: "68000", 
          activo: true
        }
      ]);

      // Insert default vehicles
      await db.insert(vehiculos).values([
        {
          placa: "GIT990",
          capacidad_carga: 10000,
          tipo_vehiculo: "Camión",
          marca: "No especificada",
          modelo: "No especificado",
          propietario_tipo_doc: "C",
          propietario_numero_doc: "4133687",
          propietario_nombre: "PROPIETARIO 1",
          activo: true
        },
        {
          placa: "ABC123",
          capacidad_carga: 8000,
          tipo_vehiculo: "Camión",
          marca: "No especificada", 
          modelo: "No especificado",
          propietario_tipo_doc: "C",
          propietario_numero_doc: "4133688",
          propietario_nombre: "PROPIETARIO 2",
          activo: true
        },
        {
          placa: "XYZ789",
          capacidad_carga: 12000,
          tipo_vehiculo: "Camión",
          marca: "No especificada",
          modelo: "No especificado", 
          propietario_tipo_doc: "C",
          propietario_numero_doc: "4133689",
          propietario_nombre: "PROPIETARIO 3",
          activo: true
        }
      ]);

      // Insert default user
      await db.insert(usuarios).values({
        username: "admin",
        password: "admin123",
        nombre: "Admin Usuario",
        email: "admin@rndc.com",
        rol: "admin",
        activo: true
      });

      console.log("✅ Datos iniciales creados exitosamente");
    } else {
      console.log("✅ Base de datos ya inicializada");
    }

  } catch (error) {
    console.error("❌ Error inicializando base de datos:", error);
    throw error;
  }
}