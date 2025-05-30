import jsPDF from "jspdf";
import { Manifiesto } from "@/shared/schema";
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
  public campos: any;

  constructor(manifiesto: Manifiesto) {
    this.manifiesto = manifiesto;
    this.doc = new jsPDF('landscape', 'mm', 'a4');
    
    // Coordenadas por defecto
    this.campos = {
      numeroManifiesto: { x: 1076, y: 170 },
      idRespuesta: { x: 1101, y: 213 },
      fechaExpedicion: { x: 200, y: 300 },
      origenViaje: { x: 500, y: 300 },
      destinoViaje: { x: 800, y: 300 },
      placa: { x: 200, y: 400 },
      valorEnLetras: { x: 280, y: 827 },
      ingresoId: { x: 1101, y: 213 },
      fontSize: {
        normal: 9,
        small: 8,
        large: 11
      }
    };
    
    console.log('PDF creado en modo horizontal:', this.doc.internal.pageSize.getWidth(), 'x', this.doc.internal.pageSize.getHeight());
  }

  // Método para convertir píxeles a mm
  private pixelToMM(pixelValue: number, isX: boolean = true): number {
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

  // Cargar coordenadas desde plantilla guardada
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

    if (numero >= 1000000) {
      const millones = Math.floor(numero / 1000000);
      resultado += this.numeroALetras(millones) + (millones === 1 ? ' MILLÓN ' : ' MILLONES ');
      numero %= 1000000;
    }

    if (numero >= 1000) {
      const miles = Math.floor(numero / 1000);
      if (miles === 1) {
        resultado += 'MIL ';
      } else {
        resultado += this.numeroALetras(miles) + ' MIL ';
      }
      numero %= 1000;
    }

    if (numero >= 100) {
      const cientos = Math.floor(numero / 100);
      resultado += centenas[cientos] + ' ';
      numero %= 100;
    }

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
    
    await this.loadPlantillaCoords();
    
    try {
      const image = await this.loadImageAsBase64(manifestoImagePath);
      
      if (image) {
        console.log('Imagen de fondo agregada correctamente');
        this.doc.addImage(image, 'JPEG', 0, 0, 297, 210);
        this.addTexts();
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
    
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(this.campos.fontSize.normal);
    this.doc.setTextColor(0, 0, 0);
    
    const campos = this.campos;

    // === CAMPOS PRINCIPALES ===
    
    // CONSECUTIVO
    console.log('CONSECUTIVO: píxeles(' + campos.numeroManifiesto.x + ', ' + campos.numeroManifiesto.y + ') → mm(' + this.pixelToMM(campos.numeroManifiesto.x) + ', ' + this.pixelToMM(campos.numeroManifiesto.y, false) + ')');
    this.doc.text(this.manifiesto.numero_manifiesto, this.pixelToMM(campos.numeroManifiesto.x), this.pixelToMM(campos.numeroManifiesto.y, false));
    
    // ID RESPUESTA
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
    
    // === TITULAR DEL MANIFIESTO (PROPIETARIO) ===
    
    // Nombre: FABRICIANO QUINTERO MUÑOZ
    if (campos.titularNombre) {
      this.doc.text('FABRICIANO QUINTERO MUÑOZ', this.pixelToMM(campos.titularNombre.x), this.pixelToMM(campos.titularNombre.y, false));
    }
    
    // Documento: 4133687
    if (campos.titularDocumento) {
      this.doc.text('4133687', this.pixelToMM(campos.titularDocumento.x), this.pixelToMM(campos.titularDocumento.y, false));
    }
    
    // Dirección: FUNZA
    if (campos.titularDireccion) {
      this.doc.text('FUNZA', this.pixelToMM(campos.titularDireccion.x), this.pixelToMM(campos.titularDireccion.y, false));
    }
    
    // Teléfono: 300000000
    if (campos.titularTelefono) {
      this.doc.text('300000000', this.pixelToMM(campos.titularTelefono.x), this.pixelToMM(campos.titularTelefono.y, false));
    }
    
    // Ciudad: FUNZA
    if (campos.titularCiudad) {
      this.doc.text('FUNZA', this.pixelToMM(campos.titularCiudad.x), this.pixelToMM(campos.titularCiudad.y, false));
    }
    
    // === TENEDOR DEL VEHÍCULO ===
    
    // Nombre: FABRICIANO QUINTERO MUÑOZ (mismo que titular)
    if (campos.tenedorNombre) {
      this.doc.text('FABRICIANO QUINTERO MUÑOZ', this.pixelToMM(campos.tenedorNombre.x), this.pixelToMM(campos.tenedorNombre.y, false));
    }
    
    // Documento: 4133687 (mismo que titular)
    if (campos.tenedorDocumento) {
      this.doc.text('4133687', this.pixelToMM(campos.tenedorDocumento.x), this.pixelToMM(campos.tenedorDocumento.y, false));
    }
    
    // Dirección: FUNZA
    if (campos.tenedorDireccion) {
      this.doc.text('FUNZA', this.pixelToMM(campos.tenedorDireccion.x), this.pixelToMM(campos.tenedorDireccion.y, false));
    }
    
    // Teléfono: 300000000
    if (campos.tenedorTelefono) {
      this.doc.text('300000000', this.pixelToMM(campos.tenedorTelefono.x), this.pixelToMM(campos.tenedorTelefono.y, false));
    }
    
    // Ciudad: 25286000
    if (campos.tenedorCiudad) {
      this.doc.text('25286000', this.pixelToMM(campos.tenedorCiudad.x), this.pixelToMM(campos.tenedorCiudad.y, false));
    }
    
    // === CONDUCTOR ===
    
    // Nombre: JAROL ANDRES DURAN SALDAÑA
    if (campos.conductorNombre) {
      this.doc.text('JAROL ANDRES DURAN SALDAÑA', this.pixelToMM(campos.conductorNombre.x), this.pixelToMM(campos.conductorNombre.y, false));
    }
    
    // Dirección: DIAGONAL 18 #3-105 VILLA MARIA ETAPA 3
    if (campos.conductorDireccion) {
      this.doc.text('DIAGONAL 18 #3-105 VILLA MARIA ETAPA 3', this.pixelToMM(campos.conductorDireccion.x), this.pixelToMM(campos.conductorDireccion.y, false));
    }
    
    // No. Licencia: 1073511288
    if (campos.conductorLicencia) {
      this.doc.text(this.manifiesto.conductor_id || '1073511288', this.pixelToMM(campos.conductorLicencia.x), this.pixelToMM(campos.conductorLicencia.y, false));
    }
    
    // Clase Licencia: C2
    if (campos.conductorClaseLicencia) {
      this.doc.text('C2', this.pixelToMM(campos.conductorClaseLicencia.x), this.pixelToMM(campos.conductorClaseLicencia.y, false));
    }
    
    // Ciudad Conductor: FUNZA
    if (campos.conductorCiudad) {
      this.doc.text('FUNZA', this.pixelToMM(campos.conductorCiudad.x), this.pixelToMM(campos.conductorCiudad.y, false));
    }
    
    // === INFORMACIÓN DE CARGA ===
    
    // Cantidad (Kg): 7.000
    if (campos.cantidadKg) {
      this.doc.text('7.000', this.pixelToMM(campos.cantidadKg.x), this.pixelToMM(campos.cantidadKg.y, false));
    }
    
    // Toneladas: 9.00
    if (campos.toneladas) {
      this.doc.text('9.00', this.pixelToMM(campos.toneladas.x), this.pixelToMM(campos.toneladas.y, false));
    }
    
    // Unidad Medida: Kilogramos
    if (campos.unidadMedida) {
      this.doc.text('Kilogramos', this.pixelToMM(campos.unidadMedida.x), this.pixelToMM(campos.unidadMedida.y, false));
    }
    
    // Naturaleza Carga: Carga Normal
    if (campos.naturalezaCarga) {
      this.doc.text('Carga Normal', this.pixelToMM(campos.naturalezaCarga.x), this.pixelToMM(campos.naturalezaCarga.y, false));
    }
    
    // Producto: Alimento para animales
    if (campos.producto) {
      this.doc.text('Alimento para animales', this.pixelToMM(campos.producto.x), this.pixelToMM(campos.producto.y, false));
    }
    
    // Empaque: A granel
    if (campos.empaque) {
      this.doc.text('A granel', this.pixelToMM(campos.empaque.x), this.pixelToMM(campos.empaque.y, false));
    }
    
    // === INFORMACIÓN REMITENTE ===
    
    // NIT y Razón Social: 8600588314 ALBATEQ-ALBATEQ
    if (campos.remitenteNit) {
      this.doc.text('8600588314 ALBATEQ-ALBATEQ', this.pixelToMM(campos.remitenteNit.x), this.pixelToMM(campos.remitenteNit.y, false));
    }
    
    // Dirección y Municipio: VIA FUNZA COTA KILOMETRO 2, FUNZA - CUNDINAMARCA
    if (campos.remitenteDireccion) {
      this.doc.text('VIA FUNZA COTA KILOMETRO 2, FUNZA - CUNDINAMARCA', this.pixelToMM(campos.remitenteDireccion.x), this.pixelToMM(campos.remitenteDireccion.y, false));
    }
    
    // Lugar Cargue: FUNZA - CUNDINAMARCA
    if (campos.lugarCargue) {
      this.doc.text('FUNZA - CUNDINAMARCA', this.pixelToMM(campos.lugarCargue.x), this.pixelToMM(campos.lugarCargue.y, false));
    }
    
    // === INFORMACIÓN DESTINATARIO ===
    
    // NIT y Razón Social: 8600588314 PORVENIR (UVE)2
    if (campos.destinatarioNit) {
      this.doc.text('8600588314 PORVENIR (UVE)2', this.pixelToMM(campos.destinatarioNit.x), this.pixelToMM(campos.destinatarioNit.y, false));
    }
    
    // Dirección y Municipio: GRANJAS EN LA ZONA DE GUADUAS, GUADUAS - CUNDINAMARCA
    if (campos.destinatarioDireccion) {
      this.doc.text('GRANJAS EN LA ZONA DE GUADUAS, GUADUAS - CUNDINAMARCA', this.pixelToMM(campos.destinatarioDireccion.x), this.pixelToMM(campos.destinatarioDireccion.y, false));
    }
    
    // Lugar Descargue: GUADUAS - CUNDINAMARCA
    if (campos.lugarDescargue) {
      this.doc.text('GUADUAS - CUNDINAMARCA', this.pixelToMM(campos.lugarDescargue.x), this.pixelToMM(campos.lugarDescargue.y, false));
    }
    
    // === VALORES ECONÓMICOS ===
    
    // Valor Total Viaje: $765.684
    if (campos.valorTotalViaje) {
      this.doc.text('$765.684', this.pixelToMM(campos.valorTotalViaje.x), this.pixelToMM(campos.valorTotalViaje.y, false));
    }
    
    // Valor Neto a Pagar: $765.684
    if (campos.valorNetoViaje) {
      this.doc.text('$765.684', this.pixelToMM(campos.valorNetoViaje.x), this.pixelToMM(campos.valorNetoViaje.y, false));
    }
    
    // Saldo a Pagar: $765.684
    if (campos.saldoPagar) {
      this.doc.text('$765.684', this.pixelToMM(campos.saldoPagar.x), this.pixelToMM(campos.saldoPagar.y, false));
    }
    
    // Valor Anticipo: $0
    if (campos.valorAnticipo) {
      this.doc.text('$0', this.pixelToMM(campos.valorAnticipo.x), this.pixelToMM(campos.valorAnticipo.y, false));
    }
    
    // Valor en letras: SETECIENTOS SESENTA Y CINCO MIL SEISCIENTOS OCHENTA Y CUATRO PESOS
    const valorEnLetras = this.numeroALetras(765684) + ' PESOS';
    this.doc.text(valorEnLetras, this.pixelToMM(campos.valorEnLetras.x), this.pixelToMM(campos.valorEnLetras.y, false));
    
    // === TÉRMINOS DE PAGO ===
    
    // Lugar de Pago: FUNZA - CUNDINAMARCA
    if (campos.lugarPago) {
      this.doc.text('FUNZA - CUNDINAMARCA', this.pixelToMM(campos.lugarPago.x), this.pixelToMM(campos.lugarPago.y, false));
    }
    
    // Cargue pagado por: DESTINATARIO
    if (campos.carguePagadoPor) {
      this.doc.text('DESTINATARIO', this.pixelToMM(campos.carguePagadoPor.x), this.pixelToMM(campos.carguePagadoPor.y, false));
    }
    
    // Descargue pagado por: DESTINATARIO
    if (campos.descarguePagadoPor) {
      this.doc.text('DESTINATARIO', this.pixelToMM(campos.descarguePagadoPor.x), this.pixelToMM(campos.descarguePagadoPor.y, false));
    }
    
    // === ID DE CONFIRMACIÓN RNDC ===
    
    // ID de Ingreso RNDC: 104518661
    const ingresoId = this.manifiesto.ingreso_id ? this.manifiesto.ingreso_id.toString() : '104518661';
    this.doc.text(ingresoId, this.pixelToMM(campos.ingresoId.x), this.pixelToMM(campos.ingresoId.y, false));
  }

  private generateFallbackPDF(): void {
    console.log('Generando PDF básico sin imagen de fondo...');
    
    this.doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });
    
    this.doc.setFontSize(16);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('MANIFIESTO ELECTRÓNICO DE CARGA', 148.5, 30, { align: 'center' });
    
    this.doc.setFontSize(12);
    this.doc.text('TRANSPORTEMIRA S.A.S', 148.5, 45, { align: 'center' });
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    let y = 70;
    
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(12);
    this.doc.text('CONSECUTIVO:', 20, y);
    this.doc.text(this.manifiesto.numero_manifiesto, 80, y);
    y += 15;
    
    this.doc.text('ID RESPUESTA:', 20, y);
    const idRespuesta = this.manifiesto.id ? this.manifiesto.id.toString() : 'ID_XML_RESPONSE';
    this.doc.text(idRespuesta, 80, y);
    y += 15;
    
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