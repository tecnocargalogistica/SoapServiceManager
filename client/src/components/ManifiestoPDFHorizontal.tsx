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
  public campos = {
    numeroManifiesto: { x: 220, y: 45 },
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
    this.doc = new jsPDF('landscape', 'mm', 'a4');
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
      const imageData = await this.loadImage(manifestoImagePath);
      
      // Agregar la imagen como fondo ocupando toda la página
      // A4 horizontal: 297mm x 210mm
      this.doc.addImage(imageData, 'JPEG', 0, 0, 297, 210);
      
      console.log('Imagen de fondo agregada correctamente');
    } catch (error) {
      console.error('Error cargando imagen de fondo:', error);
      throw error;
    }
  }

  private async loadImage(src: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('No se pudo obtener el contexto del canvas'));
            return;
          }
          
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(dataUrl);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = () => reject(new Error('Error cargando la imagen: ' + src));
      img.src = src;
    });
  }

  private addManifiestoData(): void {
    const { campos } = this;

    // Configurar fuente
    this.doc.setFont('helvetica', 'normal');

    // Número de manifiesto (campo principal)
    this.doc.setFontSize(campos.fontSize.large);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(this.manifiesto.numero_manifiesto, campos.numeroManifiesto.x, campos.numeroManifiesto.y);

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
    
    // Limpiar el documento y empezar de nuevo
    this.doc = new jsPDF('landscape', 'mm', 'a4');
    
    // Título
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('MANIFIESTO ELECTRÓNICO DE CARGA', 148.5, 30, { align: 'center' });
    
    // Información básica
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');
    let y = 50;
    
    this.doc.text(`Número de Manifiesto: ${this.manifiesto.numero_manifiesto}`, 20, y);
    y += 10;
    
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