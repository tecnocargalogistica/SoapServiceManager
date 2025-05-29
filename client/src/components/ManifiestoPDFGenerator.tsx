import jsPDF from 'jspdf';
import type { Manifiesto } from "@/../../shared/schema";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ManifiestoPDFGeneratorProps {
  manifiesto: Manifiesto;
}

export class ManifiestoPDFGenerator {
  private doc: jsPDF;
  private manifiesto: Manifiesto;

  // Coordenadas para cada campo basadas en la plantilla (ajustar según la imagen real)
  private campos = {
    // Encabezado derecho
    numeroManifiesto: { x: 167, y: 83 },
    
    // Tabla de fechas
    fechaExpedicion: { x: 28, y: 138 },
    origenViaje: { x: 287, y: 138 },
    destinoViaje: { x: 410, y: 138 },
    
    // Información del vehículo
    placa: { x: 45, y: 225 },
    
    // Conductor
    documentoConductor: { x: 308, y: 258 },
    
    // Mercancía
    numeroRemesa: { x: 41, y: 384 },
    
    // Configuración de fuente
    fontSize: {
      normal: 8,
      small: 7,
      large: 10
    }
  };

  constructor(manifiesto: Manifiesto) {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    this.manifiesto = manifiesto;
  }

  async generatePDF(): Promise<void> {
    try {
      // Cargar la imagen de plantilla desde assets
      const plantillaImage = await this.loadImage('/attached_assets/Manifiesto3_img_0.jpg');
      
      // Agregar la imagen de fondo (plantilla)
      this.doc.addImage(plantillaImage, 'JPEG', 0, 0, 210, 297);
      
      // Configurar fuente
      this.doc.setFont('arial', 'normal');
      this.doc.setTextColor(0, 0, 0);
      
      // Agregar los datos dinámicos
      this.addManifiestoData();
      
    } catch (error) {
      console.error('Error generando PDF:', error);
      // Generar PDF sin imagen de fondo como fallback
      this.generateFallbackPDF();
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
          resolve(canvas.toDataURL('image/jpeg', 0.8));
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = () => reject(new Error('Error cargando la imagen'));
      img.src = src;
    });
  }

  private addManifiestoData(): void {
    const { campos } = this;

    // Número de manifiesto (destacado)
    this.doc.setFontSize(campos.fontSize.normal);
    this.doc.setFont('arial', 'bold');
    this.doc.text(this.manifiesto.numero_manifiesto, campos.numeroManifiesto.x, campos.numeroManifiesto.y);

    // Fecha de expedición
    this.doc.setFont('arial', 'normal');
    this.doc.setFontSize(campos.fontSize.small);
    const fechaFormateada = format(new Date(this.manifiesto.fecha_expedicion), "yyyy/MM/dd", { locale: es });
    this.doc.text(fechaFormateada, campos.fechaExpedicion.x, campos.fechaExpedicion.y);

    // Origen y destino del viaje
    this.doc.text(this.manifiesto.municipio_origen, campos.origenViaje.x, campos.origenViaje.y);
    this.doc.text(this.manifiesto.municipio_destino, campos.destinoViaje.x, campos.destinoViaje.y);

    // Placa del vehículo (destacado)
    this.doc.setFont('arial', 'bold');
    this.doc.setFontSize(campos.fontSize.normal);
    this.doc.text(this.manifiesto.placa, campos.placa.x, campos.placa.y);

    // Documento del conductor
    this.doc.setFont('arial', 'normal');
    this.doc.setFontSize(campos.fontSize.small);
    this.doc.text(this.manifiesto.conductor_id, campos.documentoConductor.x, campos.documentoConductor.y);

    // Número de remesa
    this.doc.setFont('arial', 'bold');
    this.doc.text(this.manifiesto.consecutivo_remesa, campos.numeroRemesa.x, campos.numeroRemesa.y);
  }

  private generateFallbackPDF(): void {
    // PDF básico sin imagen de fondo
    this.doc.setFontSize(16);
    this.doc.text('MANIFIESTO ELECTRÓNICO DE CARGA', 20, 30);
    
    this.doc.setFontSize(12);
    this.doc.text('TRANSPETROMIRA S.A.S', 20, 45);
    
    this.doc.setFontSize(10);
    this.doc.text(`Manifiesto: ${this.manifiesto.numero_manifiesto}`, 20, 65);
    this.doc.text(`Placa: ${this.manifiesto.placa}`, 20, 75);
    this.doc.text(`Conductor ID: ${this.manifiesto.conductor_id}`, 20, 85);
    this.doc.text(`Remesa: ${this.manifiesto.consecutivo_remesa}`, 20, 95);
    
    const fechaFormateada = format(new Date(this.manifiesto.fecha_expedicion), "yyyy/MM/dd", { locale: es });
    this.doc.text(`Fecha: ${fechaFormateada}`, 20, 105);
    this.doc.text(`Origen: ${this.manifiesto.municipio_origen}`, 20, 115);
    this.doc.text(`Destino: ${this.manifiesto.municipio_destino}`, 20, 125);
  }

  public async save(): Promise<void> {
    await this.generatePDF();
    this.doc.save(`Manifiesto_${this.manifiesto.numero_manifiesto}.pdf`);
  }

  public async getBlob(): Promise<Blob> {
    await this.generatePDF();
    return this.doc.output('blob');
  }
}

// Componente React para usar el generador
export const ManifiestoPDFButton: React.FC<ManifiestoPDFGeneratorProps> = ({ manifiesto }) => {
  const handleGeneratePDF = async () => {
    try {
      const generator = new ManifiestoPDFGenerator(manifiesto);
      await generator.save();
    } catch (error) {
      console.error('Error generando PDF:', error);
    }
  };

  return (
    <button
      onClick={handleGeneratePDF}
      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 flex items-center gap-2"
    >
      📄 Generar PDF con Plantilla
    </button>
  );
};

export default ManifiestoPDFButton;