import { pgTable, text, serial, integer, boolean, timestamp, decimal, jsonb, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// TABLA CONFIGURACIONES
export const configuraciones = pgTable("configuraciones", {
  id: serial("id").primaryKey(),
  usuario: text("usuario").notNull(), // Usuario RNDC
  password: text("password").notNull(), // Password RNDC
  empresa_nit: text("empresa_nit").notNull().default("9013690938"),
  endpoint_primary: text("endpoint_primary").notNull().default("http://rndcws.mintransporte.gov.co:8080/ws"),
  endpoint_backup: text("endpoint_backup").notNull().default("http://rndcws2.mintransporte.gov.co:8080/ws"),
  timeout: integer("timeout").notNull().default(30000),
  activo: boolean("activo").notNull().default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// TABLA CONSECUTIVOS
export const consecutivos = pgTable("consecutivos", {
  id: serial("id").primaryKey(),
  tipo: text("tipo").notNull(), // remesa, manifiesto
  ultimo_numero: integer("ultimo_numero").notNull().default(0),
  prefijo: text("prefijo"),
  año: integer("año").notNull(),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// TABLA DOCUMENTOS
export const documentos = pgTable("documentos", {
  id: serial("id").primaryKey(),
  tipo: text("tipo").notNull(), // remesa, manifiesto, cumplimiento
  consecutivo: text("consecutivo").notNull(),
  xml_request: text("xml_request").notNull(),
  xml_response: text("xml_response"),
  estado: text("estado").notNull().default("pendiente"), // pendiente, enviado, exitoso, error
  mensaje_respuesta: text("mensaje_respuesta"),
  fecha_envio: timestamp("fecha_envio"),
  datos_excel: jsonb("datos_excel"), // Datos originales del Excel
  created_at: timestamp("created_at").defaultNow()
});

// TABLA LOG_ACTIVIDADES
export const logActividades = pgTable("log_actividades", {
  id: serial("id").primaryKey(),
  tipo: text("tipo").notNull(), // info, warning, error, success
  modulo: text("modulo").notNull(), // excel-upload, xml-generation, soap-request
  mensaje: text("mensaje").notNull(),
  detalles: jsonb("detalles"),
  usuario_id: integer("usuario_id"),
  created_at: timestamp("created_at").defaultNow()
});

// TABLA MANIFIESTOS
export const manifiestos = pgTable("manifiestos", {
  id: serial("id").primaryKey(),
  numero_manifiesto: text("numero_manifiesto").notNull().unique(),
  consecutivo_remesa: text("consecutivo_remesa").notNull(),
  fecha_expedicion: timestamp("fecha_expedicion").notNull(),
  municipio_origen: text("municipio_origen").notNull(),
  municipio_destino: text("municipio_destino").notNull(),
  placa: text("placa").notNull(),
  conductor_id: text("conductor_id").notNull(),
  valor_flete: decimal("valor_flete", { precision: 12, scale: 2 }),
  estado: text("estado").notNull().default("generado"),
  xml_enviado: text("xml_enviado"),
  respuesta_rndc: text("respuesta_rndc"),
  ingreso_id: text("ingreso_id"), // ID único del RNDC para el manifiesto
  codigo_seguridad_qr: text("codigo_seguridad_qr"), // Código para generar QR
  
  // Campos adicionales para el manifiesto oficial RNDC
  fecha_hora_radicacion: timestamp("fecha_hora_radicacion"),
  tipo_manifiesto: text("tipo_manifiesto").default("General"),
  autorizacion_numero: text("autorizacion_numero"),
  
  // Información del titular del manifiesto
  titular_manifiesto_nombre: text("titular_manifiesto_nombre"),
  titular_manifiesto_documento: text("titular_manifiesto_documento"),
  
  // Información detallada del vehículo
  vehiculo_marca: text("vehiculo_marca"),
  vehiculo_configuracion: text("vehiculo_configuracion"),
  vehiculo_peso_vacio: integer("vehiculo_peso_vacio"),
  vehiculo_peso_cargado: integer("vehiculo_peso_cargado"),
  vehiculo_codigo_seguridad: text("vehiculo_codigo_seguridad"),
  vehiculo_vencimiento_soat: date("vehiculo_vencimiento_soat"),
  vehiculo_poliza: text("vehiculo_poliza"),
  
  // Información detallada del conductor principal
  conductor_nombre_completo: text("conductor_nombre_completo"),
  conductor_documento_tipo: text("conductor_documento_tipo"),
  conductor_direccion: text("conductor_direccion"),
  conductor_telefono: text("conductor_telefono"),
  conductor_licencia_numero: text("conductor_licencia_numero"),
  conductor_licencia_categoria: text("conductor_licencia_categoria"),
  conductor_ciudad: text("conductor_ciudad"),
  
  // Información del conductor 2 (si aplica)
  conductor2_nombre: text("conductor2_nombre"),
  conductor2_documento: text("conductor2_documento"),
  conductor2_direccion: text("conductor2_direccion"),
  conductor2_telefono: text("conductor2_telefono"),
  conductor2_licencia: text("conductor2_licencia"),
  conductor2_ciudad: text("conductor2_ciudad"),
  
  // Información del propietario/tenedor del vehículo
  propietario_nombre: text("propietario_nombre"),
  propietario_documento: text("propietario_documento"),
  propietario_direccion: text("propietario_direccion"),
  propietario_telefono: text("propietario_telefono"),
  propietario_ciudad: text("propietario_ciudad"),
  
  // Información de la mercancía
  mercancia_unidad_medida: text("mercancia_unidad_medida").default("Kilogramos"),
  mercancia_cantidad: decimal("mercancia_cantidad", { precision: 10, scale: 2 }),
  mercancia_naturaleza: text("mercancia_naturaleza").default("Carga Normal"),
  mercancia_empaque: text("mercancia_empaque").default("Paquetes"),
  mercancia_producto_transportado: text("mercancia_producto_transportado"),
  mercancia_informacion_remitente: text("mercancia_informacion_remitente"),
  mercancia_lugar_cargue: text("mercancia_lugar_cargue"),
  mercancia_informacion_destinatario: text("mercancia_informacion_destinatario"),
  mercancia_lugar_descargue: text("mercancia_lugar_descargue"),
  mercancia_dueno_poliza: text("mercancia_dueno_poliza"),
  mercancia_numero_poliza: text("mercancia_numero_poliza"),
  
  // Información de valores económicos
  valor_total_viaje: decimal("valor_total_viaje", { precision: 12, scale: 2 }),
  retencion_fuente: decimal("retencion_fuente", { precision: 12, scale: 2 }).default("0"),
  retencion_ica: decimal("retencion_ica", { precision: 12, scale: 2 }).default("0"),
  valor_neto_pagar: decimal("valor_neto_pagar", { precision: 12, scale: 2 }),
  valor_anticipo: decimal("valor_anticipo", { precision: 12, scale: 2 }).default("0"),
  saldo_pagar: decimal("saldo_pagar", { precision: 12, scale: 2 }),
  valor_total_letras: text("valor_total_letras"),
  
  // Observaciones y términos
  lugar_pago: text("lugar_pago"),
  fecha_pago: date("fecha_pago"),
  cargue_pagado_por: text("cargue_pagado_por").default("DESTINATARIO"),
  descargue_pagado_por: text("descargue_pagado_por").default("DESTINATARIO"),
  observaciones_adicionales: text("observaciones_adicionales"),
  
  created_at: timestamp("created_at").defaultNow()
});

// TABLA MUNICIPIOS
export const municipios = pgTable("municipios", {
  id: serial("id").primaryKey(),
  codigo: text("codigo").notNull().unique(),
  nombre: text("nombre").notNull(),
  departamento: text("departamento").notNull(),
  activo: boolean("activo").notNull().default(true)
});

// TABLA REMESAS
export const remesas = pgTable("remesas", {
  id: serial("id").primaryKey(),
  consecutivo: text("consecutivo").notNull().unique(),
  codigo_sede_remitente: text("codigo_sede_remitente").notNull(),
  codigo_sede_destinatario: text("codigo_sede_destinatario").notNull(),
  placa: text("placa").notNull(),
  cantidad_cargada: integer("cantidad_cargada").notNull(),
  fecha_cita_cargue: timestamp("fecha_cita_cargue").notNull(),
  fecha_cita_descargue: timestamp("fecha_cita_descargue").notNull(),
  conductor_id: text("conductor_id").notNull(),
  toneladas: decimal("toneladas", { precision: 8, scale: 2 }),
  estado: text("estado").notNull().default("generada"), // generada, enviada, cumplida
  xml_enviado: text("xml_enviado"),
  respuesta_rndc: text("respuesta_rndc"),
  created_at: timestamp("created_at").defaultNow()
});

// TABLA SEDES
export const sedes = pgTable("sedes", {
  id: serial("id").primaryKey(),
  codigo_sede: text("codigo_sede").notNull(),
  nombre: text("nombre").notNull(),
  tipo_sede: text("tipo_sede").notNull().default("granja"), // 'planta', 'granja'
  direccion: text("direccion"),
  municipio_codigo: text("municipio_codigo").notNull(),
  telefono: text("telefono"),
  valor_tonelada: decimal("valor_tonelada", { precision: 8, scale: 2 }),
  tercero_responsable_id: integer("tercero_responsable_id").references(() => terceros.id),
  activo: boolean("activo").notNull().default(true),
  created_at: timestamp("created_at").defaultNow()
});

// TABLA TERCEROS
export const terceros = pgTable("terceros", {
  id: serial("id").primaryKey(),
  tipo_documento: text("tipo_documento").notNull(), // C, N, P
  numero_documento: text("numero_documento").notNull().unique(),
  razon_social: text("razon_social"),
  nombre: text("nombre").notNull(),
  apellido: text("apellido"),
  direccion: text("direccion"),
  telefono: text("telefono"),
  email: text("email"),
  municipio_codigo: text("municipio_codigo"),
  es_empresa: boolean("es_empresa"),
  es_conductor: boolean("es_conductor"),
  es_propietario: boolean("es_propietario"),
  es_responsable_sede: boolean("es_responsable_sede").notNull().default(false),
  categoria_licencia: text("categoria_licencia"),
  numero_licencia: text("numero_licencia"),
  fecha_vencimiento_licencia: date("fecha_vencimiento_licencia"),
  id_vehiculo_asignado: integer("id_vehiculo_asignado"),
  activo: boolean("activo").notNull().default(true),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// TABLA USUARIOS
export const usuarios = pgTable("usuarios", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  nombre: text("nombre").notNull(),
  email: text("email"),
  rol: text("rol").notNull().default("usuario"), // admin, usuario
  activo: boolean("activo").notNull().default(true),
  ultimo_acceso: timestamp("ultimo_acceso"),
  created_at: timestamp("created_at").defaultNow(),
  updated_at: timestamp("updated_at").defaultNow()
});

// TABLA VEHICULOS
export const vehiculos = pgTable("vehiculos", {
  id: serial("id").primaryKey(),
  placa: text("placa").notNull().unique(),
  
  // Características Generales
  configuracion: text("configuracion"), // Ej: CAMIÓN RÍGIDO DE 2 EJES
  clase: text("clase"), // Ej: CAMION
  marca: text("marca"),
  servicio: text("servicio"), // Ej: PÚBLICO
  numero_ejes: integer("numero_ejes"),
  carroceria: text("carroceria"), // Ej: ESTACAS
  modalidad: text("modalidad"), // Ej: CARGA
  linea: text("linea"),
  tipo_combustible: text("tipo_combustible"), // Ej: DIESEL
  capacidad_carga: integer("capacidad_carga").notNull(), // En kilogramos
  peso_vacio: integer("peso_vacio"),
  fecha_matricula: date("fecha_matricula"),
  modelo_año: integer("modelo_año"),
  peso_bruto_vehicular: integer("peso_bruto_vehicular"),
  unidad_medida: text("unidad_medida").default("Kilogramos"),
  
  // Información SOAT y Revisión Tecnomecánica
  numero_poliza: text("numero_poliza"),
  aseguradora: text("aseguradora"),
  nit_aseguradora: text("nit_aseguradora"),
  vence_soat: date("vence_soat"),
  vence_revision_tecnomecanica: date("vence_revision_tecnomecanica"),
  
  // Propietario
  propietario_tipo_doc: text("propietario_tipo_doc").notNull(), // C, N, P
  propietario_numero_doc: text("propietario_numero_doc").notNull(),
  propietario_nombre: text("propietario_nombre").notNull(),
  propietario_id: integer("propietario_id"),
  
  // Tenedor (si es diferente al propietario)
  tenedor_tipo_doc: text("tenedor_tipo_doc"),
  tenedor_numero_doc: text("tenedor_numero_doc"),
  tenedor_nombre: text("tenedor_nombre"),
  tenedor_id: integer("tenedor_id"),
  
  // Campos adicionales que faltaban
  tipo_vehiculo: text("tipo_vehiculo"),
  modelo: text("modelo"),
  
  activo: boolean("activo").notNull().default(true),
  created_at: timestamp("created_at").defaultNow()
});

// Insert Schemas
export const insertConfiguracionSchema = createInsertSchema(configuraciones).omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const insertConsecutivoSchema = createInsertSchema(consecutivos).omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const insertDocumentoSchema = createInsertSchema(documentos).omit({
  id: true,
  created_at: true
});

export const insertLogActividadSchema = createInsertSchema(logActividades).omit({
  id: true,
  created_at: true
});

export const insertManifiestoSchema = createInsertSchema(manifiestos).omit({
  id: true,
  created_at: true
});

export const insertMunicipioSchema = createInsertSchema(municipios).omit({
  id: true
});

export const insertRemesaSchema = createInsertSchema(remesas).omit({
  id: true,
  created_at: true
});

export const insertSedeSchema = createInsertSchema(sedes).omit({
  id: true,
  created_at: true
});

export const insertTerceroSchema = createInsertSchema(terceros).omit({
  id: true,
  created_at: true
});

export const insertUsuarioSchema = createInsertSchema(usuarios).omit({
  id: true,
  created_at: true,
  updated_at: true
});

export const insertVehiculoSchema = createInsertSchema(vehiculos).omit({
  id: true,
  created_at: true
});

// Types
export type Configuracion = typeof configuraciones.$inferSelect;
export type InsertConfiguracion = z.infer<typeof insertConfiguracionSchema>;

export type Consecutivo = typeof consecutivos.$inferSelect;
export type InsertConsecutivo = z.infer<typeof insertConsecutivoSchema>;

export type Documento = typeof documentos.$inferSelect;
export type InsertDocumento = z.infer<typeof insertDocumentoSchema>;

export type LogActividad = typeof logActividades.$inferSelect;
export type InsertLogActividad = z.infer<typeof insertLogActividadSchema>;

export type Manifiesto = typeof manifiestos.$inferSelect;
export type InsertManifiesto = z.infer<typeof insertManifiestoSchema>;

export type Municipio = typeof municipios.$inferSelect;
export type InsertMunicipio = z.infer<typeof insertMunicipioSchema>;

export type Remesa = typeof remesas.$inferSelect;
export type InsertRemesa = z.infer<typeof insertRemesaSchema>;

export type Sede = typeof sedes.$inferSelect;
export type InsertSede = z.infer<typeof insertSedeSchema>;

export type Tercero = typeof terceros.$inferSelect;
export type InsertTercero = z.infer<typeof insertTerceroSchema>;

export type Usuario = typeof usuarios.$inferSelect;
export type InsertUsuario = z.infer<typeof insertUsuarioSchema>;

export type Vehiculo = typeof vehiculos.$inferSelect;
export type InsertVehiculo = z.infer<typeof insertVehiculoSchema>;

// Keep existing users table for compatibility
export const users = usuarios;
export type User = Usuario;
export type InsertUser = InsertUsuario;
export const insertUserSchema = insertUsuarioSchema;
