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

export class ManifiestoPDFHorizontalGenerator {
  private doc: jsPDF;
  private manifiesto: Manifiesto;

  // Coordenadas en píxeles (se convertirán a mm automáticamente)
  public campos = {
    // CONSECUTIVO: coordenadas en píxeles según tu imagen
    numeroManifiesto: { x: 1076, y: 170 },
    
    // ID (respuesta XML): coordenadas en píxeles según tu imagen
    idRespuesta: { x: 1101, y: 213 },
    
    // Otros campos (ajustar según tu imagen)
    fechaExpedicion: { x: 200, y: 300 },
    origenViaje: { x: 500, y: 300 },
    destinoViaje: { x: 800, y: 300 },
    placa: { x: 200, y: 400 },
    documentoConductor: { x: 600, y: 450 },
    numeroRemesa: { x: 200, y: 600 },
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

    // Documento del conductor
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(this.manifiesto.conductor_id || '', this.pixelToMM(campos.documentoConductor.x), this.pixelToMM(campos.documentoConductor.y, false));

    // Número de remesa
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(this.manifiesto.consecutivo_remesa || '', this.pixelToMM(campos.numeroRemesa.x), this.pixelToMM(campos.numeroRemesa.y, false));
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