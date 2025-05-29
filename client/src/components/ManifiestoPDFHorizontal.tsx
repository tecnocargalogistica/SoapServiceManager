import jsPDF from 'jspdf';
import type { Manifiesto } from "@/../../shared/schema";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { FileImage } from "lucide-react";
import manifestoImagePath from "@assets/Manifiesto.jpg";

interface ManifiestoPDFHorizontalProps {
  manifiesto: Manifiesto;
}

class ManifiestoPDFHorizontalGenerator {
  private doc: jsPDF;
  private manifiesto: Manifiesto;

  // Coordenadas ajustadas para el formato horizontal basadas en tu plantilla
  // Conversión aproximada de píxeles a mm (asumiendo 72 DPI): pixel * 0.352778
  public campos = {
    // CONSECUTIVO: X 1076, Y 170 (píxeles) -> X ~380, Y ~60 (mm)
    numeroManifiesto: { x: 380, y: 60 },
    
    // ID (respuesta XML): X 1101, Y 213 (píxeles) -> X ~389, Y ~75 (mm)  
    idRespuesta: { x: 389, y: 75 },
    
    fechaExpedicion: { x: 50, y: 85 },
    origenViaje: { x: 130, y: 85 },
    destinoViaje: { x: 200, y: 85 },
    placa: { x: 50, y: 125 },
    documentoConductor: { x: 160, y: 140 },
    numeroRemesa: { x: 50, y: 195 },
    fontSize: {
      normal: 9,
      small: 8,
      large: 11
    }
  };

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

  async generate(): Promise<void> {
    try {
      console.log('Iniciando generación de PDF horizontal...');
      
      // Cargar y agregar la imagen de fondo
      await this.addBackgroundImage();
      
      // Agregar los datos del manifiesto
      this.addManifiestoData();
      
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

    // Número de manifiesto (CONSECUTIVO)
    this.doc.setFontSize(campos.fontSize.large);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(this.manifiesto.numero_manifiesto, campos.numeroManifiesto.x, campos.numeroManifiesto.y);

    // ID de respuesta (simulando ID del XML de respuesta)
    this.doc.setFontSize(campos.fontSize.normal);
    this.doc.setFont('helvetica', 'normal');
    const idRespuesta = this.manifiesto.id ? this.manifiesto.id.toString() : 'ID_XML_RESPONSE';
    this.doc.text(idRespuesta, campos.idRespuesta.x, campos.idRespuesta.y);

    // Cambiar a fuente normal para el resto
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(campos.fontSize.normal);

    // Fecha de expedición
    const fechaFormateada = format(new Date(this.manifiesto.fecha_expedicion), 'dd/MM/yyyy', { locale: es });
    this.doc.text(fechaFormateada, campos.fechaExpedicion.x, campos.fechaExpedicion.y);

    // Origen del viaje
    this.doc.text(this.manifiesto.municipio_origen || '', campos.origenViaje.x, campos.origenViaje.y);

    // Destino del viaje
    this.doc.text(this.manifiesto.municipio_destino || '', campos.destinoViaje.x, campos.destinoViaje.y);

    // Placa del vehículo
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(this.manifiesto.placa || '', campos.placa.x, campos.placa.y);

    // Documento del conductor
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(this.manifiesto.conductor_id || '', campos.documentoConductor.x, campos.documentoConductor.y);

    // Número de remesa
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(this.manifiesto.consecutivo_remesa || '', campos.numeroRemesa.x, campos.numeroRemesa.y);
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