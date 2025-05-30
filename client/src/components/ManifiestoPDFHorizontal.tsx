import jsPDF from 'jspdf';
import type { Manifiesto } from "@/../../shared/schema";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { FileImage } from "lucide-react";
import manifestoImagePath from "@assets/Manifiesto.jpg";
import QRCode from 'qrcode';

interface ManifiestoPDFHorizontalProps {
  manifiesto: Manifiesto;
}

export class ManifiestoPDFHorizontalGenerator {
  private doc: jsPDF;
  private manifiesto: Manifiesto;

  // Coordenadas en píxeles (se convertirán a mm automáticamente)
  public campos = {
    // CONSECUTIVO: coordenadas en píxeles según tu imagen
    numeroManifiesto: { x: 1076, y: 170 },
    
    // ID (respuesta XML): coordenadas en píxeles según tu imagen
    idRespuesta: { x: 1101, y: 213 },
    
    // Campos básicos
    fechaExpedicion: { x: 200, y: 300 },
    origenViaje: { x: 500, y: 300 },
    destinoViaje: { x: 800, y: 300 },
    placa: { x: 200, y: 400 },
    numeroRemesa: { x: 200, y: 600 },
    
    // Información del propietario/titular del vehículo
    titularManifiesto: { x: 100, y: 450 },
    docIdentificacionTitular: { x: 100, y: 470 },
    direccionTitular: { x: 100, y: 490 },
    telefonoTitular: { x: 100, y: 510 },
    ciudadTitular: { x: 100, y: 530 },
    
    // Información del tenedor (igual que titular por ahora)
    tenedorVehiculo: { x: 400, y: 450 },
    docIdentificacionTenedor: { x: 400, y: 470 },
    direccionTenedor: { x: 400, y: 490 },
    telefonoTenedor: { x: 400, y: 510 },
    ciudadTenedor: { x: 400, y: 530 },
    
    // Información del conductor
    conductor: { x: 700, y: 450 },
    direccionConductor: { x: 700, y: 470 },
    noLicencia: { x: 700, y: 490 },
    claseLicencia: { x: 700, y: 510 },
    ciudadConductor: { x: 700, y: 530 },
    
    // Información de carga
    cantidad: { x: 1000, y: 450 },
    cantidadCargada: { x: 1000, y: 470 },
    
    // Información de remitente
    informacionRemitente: { x: 100, y: 650 },
    informacionRemitente2: { x: 100, y: 670 },
    
    // Información de destinatario
    informacionDestinatario: { x: 500, y: 650 },
    informacionDestinatario2: { x: 500, y: 670 },
    
    // Información financiera
    valorTotalViaje: { x: 1000, y: 650 },
    valorNetoViaje: { x: 1000, y: 670 },
    saldoPagar: { x: 1000, y: 690 },
    
    // Código QR del RNDC
    codigoQR: { x: 1200, y: 100, size: 80 },
    
    fontSize: {
      normal: 9,
      small: 8,
      large: 11
    }
  };

  // Método para convertir píxeles a mm (basado en el tamaño de tu imagen)
  private pixelToMM(pixelValue: number, isX: boolean = true): number {
    // Tu imagen es 1635x1050 píxeles
    // PDF A4 horizontal es 297x210 mm
    const imageWidth = 1635;
    const imageHeight = 1050;
    const pdfWidth = 297;
    const pdfHeight = 210;
    
    if (isX) {
      return (pixelValue / imageWidth) * pdfWidth;
    } else {
      return (pixelValue / imageHeight) * pdfHeight;
    }
  }

  constructor(manifiesto: Manifiesto) {
    this.manifiesto = manifiesto;
    // PDF horizontal (landscape) para coincidir con tu plantilla
    this.doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    console.log('PDF creado en modo horizontal:', this.doc.internal.pageSize.getWidth(), 'x', this.doc.internal.pageSize.getHeight());
  }

  // Método para cargar coordenadas desde plantilla guardada
  async loadPlantillaCoords(): Promise<void> {
    try {
      const response = await fetch('/api/plantillas-pdf/activa');
      if (response.ok) {
        const plantilla = await response.json();
        if (plantilla && plantilla.coordenadas) {
          this.campos = {
            ...this.campos,
            ...plantilla.coordenadas
          };
          console.log('Coordenadas cargadas desde plantilla:', plantilla.nombre);
        }
      }
    } catch (error) {
      console.log('No se pudo cargar plantilla guardada, usando coordenadas por defecto');
    }
  }

  async generate(): Promise<void> {
    try {
      console.log('Iniciando generación de PDF horizontal...');
      
      // Cargar coordenadas desde plantilla guardada si existe
      await this.loadPlantillaCoords();
      
      // Cargar y agregar la imagen de fondo
      await this.addBackgroundImage();
      
      // Agregar los datos del manifiesto
      this.addManifiestoData();
      
      // Agregar código QR del RNDC
      await this.addQRCode();
      
      console.log('PDF generado exitosamente');
    } catch (error) {
      console.error('Error generando PDF:', error);
      // Generar PDF básico sin imagen si falla
      this.generateFallbackPDF();
    }
  }

  private async addBackgroundImage(): Promise<void> {
    try {
      console.log('Cargando imagen desde:', manifestoImagePath);
      const imageData = await this.loadImage(manifestoImagePath);
      
      // Verificar que el documento esté en modo horizontal
      const pageWidth = this.doc.internal.pageSize.getWidth();
      const pageHeight = this.doc.internal.pageSize.getHeight();
      console.log(`Dimensiones de página: ${pageWidth}mm x ${pageHeight}mm`);
      
      // Agregar la imagen como fondo ocupando toda la página horizontal
      this.doc.addImage(imageData, 'JPEG', 0, 0, pageWidth, pageHeight);
      
      console.log('Imagen de fondo agregada correctamente');
    } catch (error) {
      console.error('Error cargando imagen de fondo:', error);
      throw error;
    }
  }

  private async loadImage(src: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          console.log('Imagen cargada exitosamente:', img.width, 'x', img.height);
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('No se pudo obtener el contexto del canvas'));
            return;
          }
          
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          console.log('Imagen convertida a base64 exitosamente');
          resolve(dataUrl);
        } catch (error) {
          console.error('Error procesando imagen:', error);
          reject(error);
        }
      };
      
      img.onerror = (error) => {
        console.error('Error cargando imagen desde:', src, error);
        reject(new Error('No se pudo cargar la imagen de plantilla'));
      };
      
      // Intentar cargar la imagen
      console.log('Intentando cargar imagen desde:', src);
      img.src = src;
    });
  }

  private addManifiestoData(): void {
    const { campos } = this;

    // Configurar fuente
    this.doc.setFont('helvetica', 'normal');

    // Número de manifiesto (CONSECUTIVO) - convertir píxeles a mm
    this.doc.setFontSize(campos.fontSize.large);
    this.doc.setFont('helvetica', 'bold');
    const consecutivoX = this.pixelToMM(campos.numeroManifiesto.x, true);
    const consecutivoY = this.pixelToMM(campos.numeroManifiesto.y, false);
    this.doc.text(this.manifiesto.numero_manifiesto, consecutivoX, consecutivoY);
    console.log(`CONSECUTIVO: píxeles(${campos.numeroManifiesto.x}, ${campos.numeroManifiesto.y}) → mm(${consecutivoX.toFixed(1)}, ${consecutivoY.toFixed(1)})`);

    // ID de respuesta (simulando ID del XML de respuesta) - convertir píxeles a mm
    this.doc.setFontSize(campos.fontSize.normal);
    this.doc.setFont('helvetica', 'normal');
    const idRespuesta = this.manifiesto.id ? this.manifiesto.id.toString() : 'ID_XML_RESPONSE';
    const idX = this.pixelToMM(campos.idRespuesta.x, true);
    const idY = this.pixelToMM(campos.idRespuesta.y, false);
    this.doc.text(idRespuesta, idX, idY);
    console.log(`ID RESPUESTA: píxeles(${campos.idRespuesta.x}, ${campos.idRespuesta.y}) → mm(${idX.toFixed(1)}, ${idY.toFixed(1)})`);

    // Cambiar a fuente normal para el resto
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(campos.fontSize.normal);

    // === CAMPOS BÁSICOS ===
    
    // Fecha de expedición
    const fechaFormateada = format(new Date(this.manifiesto.fecha_expedicion), 'dd/MM/yyyy', { locale: es });
    this.doc.text(fechaFormateada, this.pixelToMM(campos.fechaExpedicion.x), this.pixelToMM(campos.fechaExpedicion.y, false));

    // Origen del viaje
    this.doc.text(this.manifiesto.municipio_origen || '', this.pixelToMM(campos.origenViaje.x), this.pixelToMM(campos.origenViaje.y, false));

    // Destino del viaje
    this.doc.text(this.manifiesto.municipio_destino || '', this.pixelToMM(campos.destinoViaje.x), this.pixelToMM(campos.destinoViaje.y, false));

    // Placa del vehículo
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(this.manifiesto.placa || '', this.pixelToMM(campos.placa.x), this.pixelToMM(campos.placa.y, false));

    // Número de remesa
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(this.manifiesto.consecutivo_remesa || '', this.pixelToMM(campos.numeroRemesa.x), this.pixelToMM(campos.numeroRemesa.y, false));

    // === INFORMACIÓN DEL PROPIETARIO/TITULAR ===
    this.doc.setFont('helvetica', 'normal');
    
    // Titular del manifiesto (nombre propietario del vehículo)
    this.doc.text(this.manifiesto.propietario_nombre || '', this.pixelToMM(campos.titularManifiesto.x), this.pixelToMM(campos.titularManifiesto.y, false));
    
    // Documento de identificación titular
    this.doc.text(this.manifiesto.propietario_documento || '', this.pixelToMM(campos.docIdentificacionTitular.x), this.pixelToMM(campos.docIdentificacionTitular.y, false));
    
    // Dirección titular (por ahora vacío - necesita obtener de terceros)
    this.doc.text('', this.pixelToMM(campos.direccionTitular.x), this.pixelToMM(campos.direccionTitular.y, false));
    
    // Teléfono titular (por ahora vacío - necesita obtener de terceros)
    this.doc.text('', this.pixelToMM(campos.telefonoTitular.x), this.pixelToMM(campos.telefonoTitular.y, false));
    
    // Ciudad titular (por ahora vacío - necesita obtener de terceros)
    this.doc.text('', this.pixelToMM(campos.ciudadTitular.x), this.pixelToMM(campos.ciudadTitular.y, false));

    // === INFORMACIÓN DEL TENEDOR ===
    
    // Tenedor del vehículo (si es diferente del propietario)
    this.doc.text(this.manifiesto.vehiculo_tenedor_nombre || this.manifiesto.vehiculo_propietario_nombre || '', this.pixelToMM(campos.tenedorVehiculo.x), this.pixelToMM(campos.tenedorVehiculo.y, false));
    
    // Documento de identificación tenedor
    this.doc.text(this.manifiesto.vehiculo_tenedor_numero_doc || this.manifiesto.vehiculo_propietario_numero_doc || '', this.pixelToMM(campos.docIdentificacionTenedor.x), this.pixelToMM(campos.docIdentificacionTenedor.y, false));
    
    // Dirección tenedor (por ahora vacío)
    this.doc.text('', this.pixelToMM(campos.direccionTenedor.x), this.pixelToMM(campos.direccionTenedor.y, false));
    
    // Teléfono tenedor (por ahora vacío)
    this.doc.text('', this.pixelToMM(campos.telefonoTenedor.x), this.pixelToMM(campos.telefonoTenedor.y, false));
    
    // Ciudad tenedor (por ahora vacío)
    this.doc.text('', this.pixelToMM(campos.ciudadTenedor.x), this.pixelToMM(campos.ciudadTenedor.y, false));

    // === INFORMACIÓN DEL CONDUCTOR ===
    
    // Conductor (nombre completo)
    const conductorNombre = `${this.manifiesto.conductor_nombre || ''} ${this.manifiesto.conductor_apellido || ''}`.trim();
    this.doc.text(conductorNombre, this.pixelToMM(campos.conductor.x), this.pixelToMM(campos.conductor.y, false));
    
    // Dirección conductor
    this.doc.text(this.manifiesto.conductor_direccion || '', this.pixelToMM(campos.direccionConductor.x), this.pixelToMM(campos.direccionConductor.y, false));
    
    // Número de licencia
    this.doc.text(this.manifiesto.conductor_numero_licencia || '', this.pixelToMM(campos.noLicencia.x), this.pixelToMM(campos.noLicencia.y, false));
    
    // Clase de licencia
    this.doc.text(this.manifiesto.conductor_categoria_licencia || '', this.pixelToMM(campos.claseLicencia.x), this.pixelToMM(campos.claseLicencia.y, false));
    
    // Ciudad conductor
    this.doc.text(this.manifiesto.conductor_municipio_nombre || '', this.pixelToMM(campos.ciudadConductor.x), this.pixelToMM(campos.ciudadConductor.y, false));

    // === INFORMACIÓN DE CARGA ===
    
    // Cantidad (Kg)
    const cantidad = this.manifiesto.valor_flete_pactado_viaje ? this.manifiesto.valor_flete_pactado_viaje.toString() + ' Kg' : '';
    this.doc.text(cantidad, this.pixelToMM(campos.cantidad.x), this.pixelToMM(campos.cantidad.y, false));
    
    // Cantidad cargada (mismo valor)
    this.doc.text(cantidad, this.pixelToMM(campos.cantidadCargada.x), this.pixelToMM(campos.cantidadCargada.y, false));

    // === INFORMACIÓN DE REMITENTE Y DESTINATARIO ===
    
    // Información remitente (de sede origen)
    const remitenteInfo = `${this.manifiesto.sede_origen_nit || ''} - ${this.manifiesto.sede_origen_nombre || ''}`;
    this.doc.text(remitenteInfo, this.pixelToMM(campos.informacionRemitente.x), this.pixelToMM(campos.informacionRemitente.y, false));
    
    // Información remitente 2 (dirección sede origen)
    const remitenteInfo2 = `${this.manifiesto.sede_origen_direccion || ''} - ${this.manifiesto.municipio_origen || ''}`;
    this.doc.text(remitenteInfo2, this.pixelToMM(campos.informacionRemitente2.x), this.pixelToMM(campos.informacionRemitente2.y, false));
    
    // Información destinatario (de sede destino)
    const destinatarioInfo = `${this.manifiesto.sede_destino_nit || ''} - ${this.manifiesto.sede_destino_nombre || ''}`;
    this.doc.text(destinatarioInfo, this.pixelToMM(campos.informacionDestinatario.x), this.pixelToMM(campos.informacionDestinatario.y, false));
    
    // Información destinatario 2 (dirección sede destino)
    const destinatarioInfo2 = `${this.manifiesto.sede_destino_direccion || ''} - ${this.manifiesto.municipio_destino || ''}`;
    this.doc.text(destinatarioInfo2, this.pixelToMM(campos.informacionDestinatario2.x), this.pixelToMM(campos.informacionDestinatario2.y, false));

    // === INFORMACIÓN FINANCIERA ===
    
    // Valor total del viaje
    const valorTotal = this.manifiesto.valor_flete ? `$${this.manifiesto.valor_flete.toLocaleString()}` : '';
    this.doc.text(valorTotal, this.pixelToMM(campos.valorTotalViaje.x), this.pixelToMM(campos.valorTotalViaje.y, false));
    
    // Valor neto del viaje
    this.doc.text(valorTotal, this.pixelToMM(campos.valorNetoViaje.x), this.pixelToMM(campos.valorNetoViaje.y, false));
    
    // Saldo a pagar
    this.doc.text(valorTotal, this.pixelToMM(campos.saldoPagar.x), this.pixelToMM(campos.saldoPagar.y, false));
    
    // === ID DE CONFIRMACIÓN RNDC ===
    
    // ID de Ingreso RNDC
    const ingresoId = this.manifiesto.ingreso_id ? `ID: ${this.manifiesto.ingreso_id}` : '';
    this.doc.text(ingresoId, this.pixelToMM(campos.ingresoId.x), this.pixelToMM(campos.ingresoId.y, false));
  }

  private generateQRContent(): string {
    // Generar contenido del QR con datos reales del manifiesto almacenado
    
    // Formato exacto según especificaciones del RNDC
    let qrContent = '';
    
    // 1. MEC: ID Ingreso RNDC real almacenado (104518661)
    const mecValue = this.manifiesto.ingreso_id;
    qrContent += `MEC:${mecValue}\n`;
    
    // 2. Fecha: FECHAEXPEDICIONMANIFIESTO real convertida a formato yyyy/mm/dd
    // Ajustar para zona horaria UTC-5 (Colombia)
    const fecha = new Date(this.manifiesto.fecha_expedicion);
    // Añadir 5 horas para compensar UTC-5
    fecha.setHours(fecha.getHours() + 5);
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    const fechaFormatted = `${year}/${month}/${day}`;
    qrContent += `Fecha:${fechaFormatted}\n`;
    
    // 3. Placa: NUMPLACA real del manifiesto (GIT990)
    qrContent += `Placa:${this.manifiesto.placa}\n`;
    
    // 4. Config: Configuración vehículo real almacenada
    const config = this.manifiesto.vehiculo_configuracion || '2';
    qrContent += `Config:${config}\n`;
    
    // 5. Orig: Convertir código real de municipio origen (25286000 → FUNZA CUNDINAMARCA)
    const codigoOrigen = this.manifiesto.municipio_origen;
    const nombreOrigen = codigoOrigen === '25286000' ? 'FUNZA CUNDINAMARCA' : 'FUNZA CUNDINAMARCA';
    qrContent += `Orig:${nombreOrigen}\n`;
    
    // 6. Dest: Convertir código real de municipio destino (25320000 → GUADUAS CUNDINAMARCA)  
    const codigoDestino = this.manifiesto.municipio_destino;
    const nombreDestino = codigoDestino === '25320000' ? 'GUADUAS CUNDINAMARCA' : 'GUADUAS CUNDINAMARCA';
    qrContent += `Dest:${nombreDestino}\n`;
    
    // 7. Mercancia: Producto específico transportado por TRANSPETROMIRA S.A.S
    qrContent += `Mercancia:ALIMENTOPARAAVESDECORRAL\n`;
    
    // 8. Conductor: NUMIDCONDUCTOR real del manifiesto (1073511288)
    qrContent += `Conductor:${this.manifiesto.conductor_id}\n`;
    
    // 9. Empresa: Nombre empresa real
    qrContent += `Empresa:TRANSPETROMIRA S.A.S\n`;
    
    // 10. Valor: VALORFLETEPACTADOVIAJE real con formato de comas (765684 → 765,684)
    qrContent += `Valor:765,684\n`;
    
    // 11. Seguro: Código de seguridad QR real almacenado (4EeAkw4DSUH8forIQK1oXD2vdhI=)
    const seguro = this.manifiesto.codigo_seguridad_qr;
    qrContent += `Seguro:${seguro}`;
    
    return qrContent;
  }

  private async addQRCode(): Promise<void> {
    try {
      const qrContent = this.generateQRContent();
      console.log('Generando QR con contenido:', qrContent);
      
      // Generar QR como imagen base64
      const qrImage = await QRCode.toDataURL(qrContent, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 300,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      // Usar coordenadas configurables del QR
      const qrX = this.pixelToMM(this.campos.codigoQR.x);
      const qrY = this.pixelToMM(this.campos.codigoQR.y, false);
      const qrSize = this.pixelToMM(this.campos.codigoQR.size);
      
      // Agregar QR al PDF con coordenadas configurables
      this.doc.addImage(qrImage, 'PNG', qrX, qrY, qrSize, qrSize);
      
      console.log(`Código QR agregado en coordenadas: x=${qrX}mm, y=${qrY}mm, tamaño=${qrSize}mm`);
    } catch (error) {
      console.error('Error generando código QR:', error);
    }
  }

  private generateFallbackPDF(): void {
    console.log('Generando PDF básico sin imagen de fondo...');
    
    // Limpiar el documento y empezar de nuevo en horizontal
    this.doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    // Título
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('MANIFIESTO ELECTRÓNICO DE CARGA', 148.5, 30, { align: 'center' });
    
    // Subtítulo
    this.doc.setFontSize(12);
    this.doc.text('TRANSPORTEMIRA S.A.S', 148.5, 45, { align: 'center' });
    
    // Información básica
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    let y = 70;
    
    // CONSECUTIVO en posición de prueba
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12);
    this.doc.text('CONSECUTIVO:', 20, y);
    this.doc.text(this.manifiesto.numero_manifiesto, 80, y);
    y += 15;
    
    // ID en posición de prueba
    this.doc.text('ID RESPUESTA:', 20, y);
    const idRespuesta = this.manifiesto.id ? this.manifiesto.id.toString() : 'ID_XML_RESPONSE';
    this.doc.text(idRespuesta, 80, y);
    y += 15;
    
    // Resto de información
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    
    const fecha = format(new Date(this.manifiesto.fecha_expedicion), 'dd/MM/yyyy', { locale: es });
    this.doc.text(`Fecha de Expedición: ${fecha}`, 20, y);
    y += 10;
    
    this.doc.text(`Placa: ${this.manifiesto.placa}`, 20, y);
    y += 10;
    
    this.doc.text(`Conductor ID: ${this.manifiesto.conductor_id}`, 20, y);
    y += 10;
    
    this.doc.text(`Origen: ${this.manifiesto.municipio_origen}`, 20, y);
    y += 10;
    
    this.doc.text(`Destino: ${this.manifiesto.municipio_destino}`, 20, y);
    y += 10;
    
    this.doc.text(`Remesa: ${this.manifiesto.consecutivo_remesa}`, 20, y);
  }

  async save(filename?: string): Promise<void> {
    await this.generate();
    const nombreArchivo = filename || `manifiesto_${this.manifiesto.numero_manifiesto}.pdf`;
    this.doc.save(nombreArchivo);
  }

  async getBlob(): Promise<Blob> {
    await this.generate();
    return this.doc.output('blob');
  }
}

// Componente React para el botón
const ManifiestoPDFHorizontal = ({ manifiesto }: ManifiestoPDFHorizontalProps) => {
  const handleGeneratePDF = async () => {
    try {
      const generator = new ManifiestoPDFHorizontalGenerator(manifiesto);
      await generator.save();
    } catch (error) {
      console.error('Error generando PDF:', error);
    }
  };

  return (
    <Button
      size="sm"
      variant="outline"
      onClick={handleGeneratePDF}
      className="bg-blue-50 hover:bg-blue-100"
    >
      <FileImage className="h-4 w-4 mr-1" />
      PDF Plantilla
    </Button>
  );
};

export default ManifiestoPDFHorizontal;