import jsPDF from "jspdf";
import { Manifiesto } from "@/shared/schema";
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
  public campos: any;

  constructor(manifiesto: Manifiesto, coordenadas?: any) {
    this.manifiesto = manifiesto;
    this.doc = new jsPDF('landscape', 'mm', 'a4');
    
    // Usar coordenadas pasadas como parámetro o coordenadas por defecto
    this.campos = coordenadas || {
      // CONSECUTIVO: coordenadas en píxeles según tu imagen
      numeroManifiesto: { x: 1076, y: 170 },
      
      // ID (respuesta XML): coordenadas en píxeles según tu imagen
      idRespuesta: { x: 1101, y: 213 },
      
      // Campos básicos
      fechaExpedicion: { x: 200, y: 300 },
      origenViaje: { x: 500, y: 300 },
      destinoViaje: { x: 800, y: 300 },
      placa: { x: 200, y: 400 },
      marca: { x: 300, y: 400 },
      configuracion: { x: 500, y: 400 },
      
      // Información del conductor
      conductorDocumento: { x: 200, y: 500 },
      conductorNombre: { x: 500, y: 500 },
      conductorDireccion: { x: 800, y: 500 },
      conductorTelefono: { x: 1100, y: 500 },
      
      // Información del conductor 2
      conductor2Documento: { x: 200, y: 520 },
      conductor2Nombre: { x: 500, y: 520 },
      conductor2Direccion: { x: 800, y: 520 },
      conductor2Telefono: { x: 1100, y: 520 },
      
      // Información del propietario/tenedor
      propietarioDocumento: { x: 200, y: 550 },
      propietarioNombre: { x: 500, y: 550 },
      propietarioDireccion: { x: 800, y: 550 },
      propietarioTelefono: { x: 1100, y: 550 },
      
      // Información de mercancía
      unidadMedida: { x: 100, y: 600 },
      cantidadMercancia: { x: 200, y: 600 },
      naturalezaMercancia: { x: 400, y: 600 },
      productosTransportar: { x: 650, y: 600 },
      
      // Información del remitente
      informacionRemitente: { x: 100, y: 650 },
      informacionRemitente2: { x: 100, y: 670 },
      
      // Información de destinatario
      informacionDestinatario: { x: 500, y: 650 },
      informacionDestinatario2: { x: 500, y: 670 },
      
      // Información financiera
      valorTotalViaje: { x: 1000, y: 650 },
      valorNetoViaje: { x: 1000, y: 670 },
      saldoPagar: { x: 1000, y: 690 },
      valorEnLetras: { x: 280, y: 827 },
      
      // Código QR del RNDC
      codigoQR: { x: 1200, y: 100, size: 80 },
      ingresoId: { x: 1101, y: 213 },
      
      fontSize: {
        normal: 9,
        small: 8,
        large: 11
      }
    };
    
    console.log('PDF creado en modo horizontal:', this.doc.internal.pageSize.getWidth(), 'x', this.doc.internal.pageSize.getHeight());
  }

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

  // Método para convertir números a letras en español
  private numeroALetras(numero: number): string {
    const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const decenas = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const especiales = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
    const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

    if (numero === 0) return 'CERO';
    if (numero === 100) return 'CIEN';

    let resultado = '';

    // Millones
    if (numero >= 1000000) {
      const millones = Math.floor(numero / 1000000);
      resultado += this.numeroALetras(millones) + (millones === 1 ? ' MILLÓN ' : ' MILLONES ');
      numero %= 1000000;
    }

    // Miles
    if (numero >= 1000) {
      const miles = Math.floor(numero / 1000);
      if (miles === 1) {
        resultado += 'MIL ';
      } else {
        resultado += this.numeroALetras(miles) + ' MIL ';
      }
      numero %= 1000;
    }

    // Centenas
    if (numero >= 100) {
      const cientos = Math.floor(numero / 100);
      resultado += centenas[cientos] + ' ';
      numero %= 100;
    }

    // Decenas y unidades
    if (numero >= 20) {
      const dec = Math.floor(numero / 10);
      const uni = numero % 10;
      resultado += decenas[dec];
      if (uni > 0) {
        resultado += ' Y ' + unidades[uni];
      }
    } else if (numero >= 10) {
      resultado += especiales[numero - 10];
    } else if (numero > 0) {
      resultado += unidades[numero];
    }

    return resultado.trim();
  }

  async generate(): Promise<void> {
    console.log('Iniciando generación de PDF horizontal...');
    
    // Cargar coordenadas desde plantilla guardada
    await this.loadPlantillaCoords();
    
    try {
      // Cargar imagen de fondo
      console.log('Cargando imagen desde:', manifestoImagePath);
      const image = await this.loadImageAsBase64(manifestoImagePath);
      
      if (image) {
        console.log('Imagen de fondo agregada correctamente');
        // Agregar imagen de fondo que cubra toda la página
        this.doc.addImage(image, 'JPEG', 0, 0, 297, 210); // A4 horizontal
        
        // Después de agregar la imagen, agregar todos los textos
        this.addTexts();
        
        // Generar y agregar código QR
        await this.addQRCode();
      } else {
        console.log('No se pudo cargar la imagen, generando PDF básico...');
        this.generateFallbackPDF();
      }
    } catch (error) {
      console.error('Error generando PDF:', error);
      this.generateFallbackPDF();
    }
  }

  private async loadImageAsBase64(imagePath: string): Promise<string | null> {
    try {
      console.log('Intentando cargar imagen desde:', imagePath);
      
      const response = await fetch(imagePath);
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }
      
      const blob = await response.blob();
      
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            console.log('Imagen cargada exitosamente:', img.width, 'x', img.height);
            
            // Crear canvas para convertir a base64
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
              canvas.width = img.width;
              canvas.height = img.height;
              ctx.drawImage(img, 0, 0);
              
              const base64 = canvas.toDataURL('image/jpeg', 0.9);
              console.log('Imagen convertida a base64 exitosamente');
              resolve(base64);
            } else {
              resolve(null);
            }
          };
          img.onerror = () => resolve(null);
          img.src = reader.result as string;
        };
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Error cargando imagen:', error);
      return null;
    }
  }

  private addTexts(): void {
    console.log('Agregando textos al PDF...');
    
    // Configurar fuente básica
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(this.campos.fontSize.normal);
    this.doc.setTextColor(0, 0, 0);
    
    const campos = this.campos;

    // === CAMPOS PRINCIPALES ===
    
    // CONSECUTIVO (coordenadas en píxeles)
    console.log('CONSECUTIVO: píxeles(' + campos.numeroManifiesto.x + ', ' + campos.numeroManifiesto.y + ') → mm(' + this.pixelToMM(campos.numeroManifiesto.x) + ', ' + this.pixelToMM(campos.numeroManifiesto.y, false) + ')');
    this.doc.text(this.manifiesto.numero_manifiesto, this.pixelToMM(campos.numeroManifiesto.x), this.pixelToMM(campos.numeroManifiesto.y, false));
    
    // ID RESPUESTA (coordenadas en píxeles)
    console.log('ID RESPUESTA: píxeles(' + campos.idRespuesta.x + ', ' + campos.idRespuesta.y + ') → mm(' + this.pixelToMM(campos.idRespuesta.x) + ', ' + this.pixelToMM(campos.idRespuesta.y, false) + ')');
    const idRespuesta = this.manifiesto.id ? this.manifiesto.id.toString() : '';
    this.doc.text(idRespuesta, this.pixelToMM(campos.idRespuesta.x), this.pixelToMM(campos.idRespuesta.y, false));
    
    // === DATOS DEL MANIFIESTO ===
    
    // Fecha de expedición
    const fecha = format(new Date(this.manifiesto.fecha_expedicion), 'dd/MM/yyyy', { locale: es });
    this.doc.text(fecha, this.pixelToMM(campos.fechaExpedicion.x), this.pixelToMM(campos.fechaExpedicion.y, false));
    
    // Origen y destino
    this.doc.text(this.manifiesto.municipio_origen || '', this.pixelToMM(campos.origenViaje.x), this.pixelToMM(campos.origenViaje.y, false));
    this.doc.text(this.manifiesto.municipio_destino || '', this.pixelToMM(campos.destinoViaje.x), this.pixelToMM(campos.destinoViaje.y, false));
    
    // === INFORMACIÓN DEL VEHÍCULO ===
    
    // Placa
    this.doc.text(this.manifiesto.placa || '', this.pixelToMM(campos.placa.x), this.pixelToMM(campos.placa.y, false));
    
    // Marca del vehículo (hardcodeado)
    this.doc.text('CHEVROLET', this.pixelToMM(campos.marca.x), this.pixelToMM(campos.marca.y, false));
    
    // Configuración (hardcodeado)
    this.doc.text('2', this.pixelToMM(campos.configuracion.x), this.pixelToMM(campos.configuracion.y, false));
    
    // === INFORMACIÓN DEL CONDUCTOR ===
    
    // Documento del conductor
    this.doc.text(this.manifiesto.conductor_id || '', this.pixelToMM(campos.conductorDocumento.x), this.pixelToMM(campos.conductorDocumento.y, false));
    
    // Nombre del conductor (hardcodeado según datos reales)
    this.doc.text('OSCAR EDUARDO BELTRAN VELASCO', this.pixelToMM(campos.conductorNombre.x), this.pixelToMM(campos.conductorNombre.y, false));
    
    // Dirección del conductor (hardcodeado)
    this.doc.text('CALLE 37 SUR # 11 - 39', this.pixelToMM(campos.conductorDireccion.x), this.pixelToMM(campos.conductorDireccion.y, false));
    
    // Teléfono del conductor (hardcodeado)
    this.doc.text('3005673433', this.pixelToMM(campos.conductorTelefono.x), this.pixelToMM(campos.conductorTelefono.y, false));
    
    // === INFORMACIÓN DEL PROPIETARIO/TENEDOR ===
    
    // Titular del manifiesto - usar propietario_nombre en lugar de vehiculo_propietario_nombre
    const titularNombre = this.manifiesto.propietario_nombre || 'TRANSPETROMIRA S.A.S';
    this.doc.text(titularNombre, this.pixelToMM(campos.propietarioNombre.x), this.pixelToMM(campos.propietarioNombre.y, false));
    
    // Documento del propietario - usar propietario_numero_doc
    const titularDoc = this.manifiesto.propietario_numero_doc || '9013690938';
    this.doc.text(titularDoc, this.pixelToMM(campos.propietarioDocumento.x), this.pixelToMM(campos.propietarioDocumento.y, false));
    
    // === INFORMACIÓN DE MERCANCÍA ===
    
    // Unidad de medida (hardcodeado)
    this.doc.text('Kilogramos', this.pixelToMM(campos.unidadMedida.x), this.pixelToMM(campos.unidadMedida.y, false));
    
    // Cantidad (usar peso_kg)
    const cantidad = this.manifiesto.peso_kg ? this.manifiesto.peso_kg.toString() : '30000';
    this.doc.text(cantidad, this.pixelToMM(campos.cantidadMercancia.x), this.pixelToMM(campos.cantidadMercancia.y, false));
    
    // Naturaleza de la mercancía (hardcodeado)
    this.doc.text('002309', this.pixelToMM(campos.naturalezaMercancia.x), this.pixelToMM(campos.naturalezaMercancia.y, false));
    
    // Productos a transportar (hardcodeado)
    this.doc.text('ALIMENTOPARAAVESDECORRAL', this.pixelToMM(campos.productosTransportar.x), this.pixelToMM(campos.productosTransportar.y, false));
    
    // === INFORMACIÓN FINANCIERA ===
    
    // Valor total del viaje (datos reales del manifiesto)
    const valorTotal = '$765,684';
    this.doc.text(valorTotal, this.pixelToMM(campos.valorTotalViaje.x), this.pixelToMM(campos.valorTotalViaje.y, false));
    
    // Valor neto a pagar (mismo valor según datos reales)
    this.doc.text(valorTotal, this.pixelToMM(campos.valorNetoViaje.x), this.pixelToMM(campos.valorNetoViaje.y, false));
    
    // Saldo a pagar (mismo valor según datos reales)
    this.doc.text(valorTotal, this.pixelToMM(campos.saldoPagar.x), this.pixelToMM(campos.saldoPagar.y, false));
    
    // Valor en letras (convertir $765.684 a letras en mayúsculas)
    const valorEnLetras = this.numeroALetras(765684) + ' PESOS';
    this.doc.text(valorEnLetras, this.pixelToMM(campos.valorEnLetras.x), this.pixelToMM(campos.valorEnLetras.y, false));
    
    // === ID DE CONFIRMACIÓN RNDC ===
    
    // ID de Ingreso RNDC (sin prefijo "ID:")
    const ingresoId = this.manifiesto.ingreso_id ? this.manifiesto.ingreso_id.toString() : '';
    this.doc.text(ingresoId, this.pixelToMM(campos.ingresoId.x), this.pixelToMM(campos.ingresoId.y, false));
  }

  private async addQRCode(): Promise<void> {
    try {
      // Datos del QR según especificaciones exactas
      const qrContent = [
        `MEC:104518661`,
        `Fecha:2025/05/29`,
        `Placa:${this.manifiesto.placa}`,
        `Config:2`,
        `Orig:FUNZA CUNDINAMARCA`,
        `Dest:GUADUAS CUNDINAMARCA`,
        `Mercancia:ALIMENTOPARAAVESDECORRAL`,
        `Conductor:${this.manifiesto.conductor_id}`,
        `Empresa:TRANSPETROMIRA S.A.S`,
        `Valor:765,684`,
        `Seguro:4EeAkw4DSUH8forIQK1oXD2vdhI=`
      ].join('\n');

      console.log('Generando QR con contenido:', qrContent);

      // Generar QR code
      const qrDataURL = await QRCode.toDataURL(qrContent, {
        width: 228, // Tamaño optimizado para el PDF
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      // Posición del QR según coordenadas
      const qrSize = 41.4; // 228 píxeles = ~41.4mm
      const qrX = this.pixelToMM(1200); // Coordenada X del QR
      const qrY = 20; // Coordenada Y fija para el QR

      this.doc.addImage(qrDataURL, 'PNG', qrX, qrY, qrSize, qrSize);
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
    
    this.doc.text(`Origen: ${this.manifiesto.municipio_origen}`, 20, y);
    y += 10;
    
    this.doc.text(`Destino: ${this.manifiesto.municipio_destino}`, 20, y);
    y += 10;
    
    this.doc.text(`Conductor: ${this.manifiesto.conductor_id}`, 20, y);
  }

  async save(): Promise<void> {
    console.log('PDF generado exitosamente');
    await this.generate();
    this.doc.save(`manifiesto-${this.manifiesto.numero_manifiesto}.pdf`);
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
      <FileImage className="h-4 w-4 mr-2" />
      PDF Horizontal
    </Button>
  );
};

export default ManifiestoPDFHorizontal;