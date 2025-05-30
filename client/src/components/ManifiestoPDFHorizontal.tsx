import jsPDF from "jspdf";
import { Manifiesto } from "@/shared/schema";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { FileImage } from "lucide-react";
import manifestoImagePath from "@assets/Manifiesto_PNG_Página_1.jpg";
import QRCode from 'qrcode';

interface ManifiestoPDFHorizontalProps {
  manifiesto: Manifiesto;
}

export class ManifiestoPDFHorizontalGenerator {
  private doc: jsPDF;
  private manifiesto: Manifiesto;
  public campos: any;
  private usarCoordenadasPersonalizadas: boolean;
  private imagenPath: string;

  constructor(manifiesto: Manifiesto, coordenadas?: any, imagenCustom?: string) {
    this.manifiesto = manifiesto;
    this.doc = new jsPDF('landscape', 'mm', 'a4');
    this.usarCoordenadasPersonalizadas = !!coordenadas;
    
    // Inicializar la ruta de imagen por defecto
    this.imagenPath = manifestoImagePath;
    
    // Si se proporciona una imagen custom, usarla
    if (imagenCustom) {
      this.imagenPath = `/@fs/home/runner/workspace/attached_assets/${imagenCustom}`;
    }
    
    // Usar coordenadas pasadas como parámetro o coordenadas por defecto
    this.campos = coordenadas || {
      numeroManifiesto: { x: 1076, y: 170 },
      idRespuesta: { x: 1101, y: 213 },
      fechaExpedicion: { x: 200, y: 300 },
      origenViaje: { x: 500, y: 300 },
      destinoViaje: { x: 800, y: 300 },
      placa: { x: 200, y: 400 },
      numeroRemesa: { x: 200, y: 600 },
      
      // Titular del manifiesto
      titularManifiesto: { x: 100, y: 450 },
      docIdentificacionTitular: { x: 100, y: 470 },
      direccionTitular: { x: 100, y: 490 },
      telefonoTitular: { x: 100, y: 510 },
      ciudadTitular: { x: 100, y: 530 },
      
      // Tenedor del vehículo  
      tenedorVehiculo: { x: 400, y: 450 },
      docIdentificacionTenedor: { x: 400, y: 470 },
      direccionTenedor: { x: 400, y: 490 },
      telefonoTenedor: { x: 400, y: 510 },
      ciudadTenedor: { x: 400, y: 530 },
      
      // Conductor
      conductor: { x: 700, y: 450 },
      direccionConductor: { x: 700, y: 470 },
      noLicencia: { x: 700, y: 490 },
      claseLicencia: { x: 700, y: 510 },
      ciudadConductor: { x: 700, y: 530 },
      
      // Cantidad
      cantidad: { x: 1000, y: 450 },
      cantidadCargada: { x: 1000, y: 470 },
      
      // Información remitente/destinatario
      informacionRemitente: { x: 100, y: 650 },
      informacionRemitente2: { x: 100, y: 670 },
      informacionDestinatario: { x: 500, y: 650 },
      informacionDestinatario2: { x: 500, y: 670 },
      
      // Valores económicos
      valorTotalViaje: { x: 1000, y: 650 },
      valorNetoViaje: { x: 1000, y: 670 },
      saldoPagar: { x: 1000, y: 690 },
      valorEnLetras: { x: 50, y: 180 },
      
      // Código QR e ID
      codigoQR: { x: 1200, y: 100, size: 80 },
      ingresoId: { x: 200, y: 200 },
      
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

  // Cargar coordenadas desde plantilla guardada solo si no se pasaron coordenadas al constructor
  async loadPlantillaCoords(usarPlantilla: boolean = true): Promise<void> {
    if (!usarPlantilla) {
      console.log('Usando coordenadas del panel de ajuste');
      return;
    }
    
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
    
    // Solo cargar coordenadas de plantilla si no se pasaron coordenadas personalizadas
    await this.loadPlantillaCoords(!this.usarCoordenadasPersonalizadas);
    
    try {
      const image = await this.loadImageAsBase64(this.imagenPath);
      
      if (image) {
        console.log('Imagen de fondo agregada correctamente');
        this.doc.addImage(image, 'JPEG', 0, 0, 297, 210);
        this.addTexts();
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
    
    try {
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(this.campos.fontSize?.normal || 10);
      this.doc.setTextColor(0, 0, 0);
      
      const campos = this.campos;

      // === CAMPOS PRINCIPALES ===
    
    // CONSECUTIVO (EN NEGRITA Y TAMAÑO MAYOR)
    console.log('CONSECUTIVO: píxeles(' + campos.numeroManifiesto.x + ', ' + campos.numeroManifiesto.y + ') → mm(' + this.pixelToMM(campos.numeroManifiesto.x) + ', ' + this.pixelToMM(campos.numeroManifiesto.y, false) + ')');
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(14);
    this.doc.text(this.manifiesto.numero_manifiesto, this.pixelToMM(campos.numeroManifiesto.x), this.pixelToMM(campos.numeroManifiesto.y, false));
    
    // ID RESPUESTA (EN NEGRITA Y TAMAÑO MAYOR)
    console.log('ID RESPUESTA: píxeles(' + campos.idRespuesta.x + ', ' + campos.idRespuesta.y + ') → mm(' + this.pixelToMM(campos.idRespuesta.x) + ', ' + this.pixelToMM(campos.idRespuesta.y, false) + ')');
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(14);
    const idRespuesta = this.manifiesto.id ? this.manifiesto.id.toString() : '';
    this.doc.text(idRespuesta, this.pixelToMM(campos.idRespuesta.x), this.pixelToMM(campos.idRespuesta.y, false));
    
    // Restaurar fuente normal para el resto de campos
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(this.campos.fontSize?.normal || 10);
    
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
    if (campos.titularManifiesto) {
      this.doc.text('FABRICIANO QUINTERO MUÑOZ', this.pixelToMM(campos.titularManifiesto.x), this.pixelToMM(campos.titularManifiesto.y, false));
    }
    
    // Documento: 4133687
    if (campos.docIdentificacionTitular) {
      this.doc.text('4133687', this.pixelToMM(campos.docIdentificacionTitular.x), this.pixelToMM(campos.docIdentificacionTitular.y, false));
    }
    
    // Dirección: FUNZA
    if (campos.direccionTitular) {
      this.doc.text('FUNZA', this.pixelToMM(campos.direccionTitular.x), this.pixelToMM(campos.direccionTitular.y, false));
    }
    
    // Teléfono: 300000000
    if (campos.telefonoTitular) {
      this.doc.text('300000000', this.pixelToMM(campos.telefonoTitular.x), this.pixelToMM(campos.telefonoTitular.y, false));
    }
    
    // Ciudad: FUNZA
    if (campos.ciudadTitular) {
      this.doc.text('FUNZA', this.pixelToMM(campos.ciudadTitular.x), this.pixelToMM(campos.ciudadTitular.y, false));
    }
    
    // === TENEDOR DEL VEHÍCULO ===
    
    // Nombre: FABRICIANO QUINTERO MUÑOZ (mismo que titular)
    if (campos.tenedorVehiculo) {
      this.doc.text('FABRICIANO QUINTERO MUÑOZ', this.pixelToMM(campos.tenedorVehiculo.x), this.pixelToMM(campos.tenedorVehiculo.y, false));
    }
    
    // Documento: 4133687 (mismo que titular)
    if (campos.docIdentificacionTenedor) {
      this.doc.text('4133687', this.pixelToMM(campos.docIdentificacionTenedor.x), this.pixelToMM(campos.docIdentificacionTenedor.y, false));
    }
    
    // Dirección: FUNZA
    if (campos.direccionTenedor) {
      this.doc.text('FUNZA', this.pixelToMM(campos.direccionTenedor.x), this.pixelToMM(campos.direccionTenedor.y, false));
    }
    
    // Teléfono: 300000000
    if (campos.telefonoTenedor) {
      this.doc.text('300000000', this.pixelToMM(campos.telefonoTenedor.x), this.pixelToMM(campos.telefonoTenedor.y, false));
    }
    
    // Ciudad: 25286000
    if (campos.ciudadTenedor) {
      this.doc.text('25286000', this.pixelToMM(campos.ciudadTenedor.x), this.pixelToMM(campos.ciudadTenedor.y, false));
    }
    
    // === CONDUCTOR ===
    
    // Nombre: JAROL ANDRES DURAN SALDAÑA
    if (campos.conductor) {
      this.doc.text('JAROL ANDRES DURAN SALDAÑA', this.pixelToMM(campos.conductor.x), this.pixelToMM(campos.conductor.y, false));
    }
    
    // Dirección: DIAGONAL 18 #3-105 VILLA MARIA ETAPA 3
    if (campos.direccionConductor) {
      this.doc.text('DIAGONAL 18 #3-105 VILLA MARIA ETAPA 3', this.pixelToMM(campos.direccionConductor.x), this.pixelToMM(campos.direccionConductor.y, false));
    }
    
    // No. Licencia: 1073511288
    if (campos.noLicencia) {
      this.doc.text(this.manifiesto.conductor_id || '1073511288', this.pixelToMM(campos.noLicencia.x), this.pixelToMM(campos.noLicencia.y, false));
    }
    
    // Clase Licencia: C2
    if (campos.claseLicencia) {
      this.doc.text('C2', this.pixelToMM(campos.claseLicencia.x), this.pixelToMM(campos.claseLicencia.y, false));
    }
    
    // Ciudad Conductor: FUNZA
    if (campos.ciudadConductor) {
      this.doc.text('FUNZA', this.pixelToMM(campos.ciudadConductor.x), this.pixelToMM(campos.ciudadConductor.y, false));
    }
    
    // === INFORMACIÓN DE CARGA ===
    
    // Cantidad: 7.000 (del panel "cantidad")
    if (campos.cantidad) {
      this.doc.text('7.000', this.pixelToMM(campos.cantidad.x), this.pixelToMM(campos.cantidad.y, false));
    }
    
    // Cantidad Cargada: 9.00 (del panel "cantidadCargada")
    if (campos.cantidadCargada) {
      this.doc.text('9.00', this.pixelToMM(campos.cantidadCargada.x), this.pixelToMM(campos.cantidadCargada.y, false));
    }
    
    // Número Remesa
    if (campos.numeroRemesa) {
      this.doc.text(this.manifiesto.consecutivo_remesa || this.manifiesto.numero_manifiesto, this.pixelToMM(campos.numeroRemesa.x), this.pixelToMM(campos.numeroRemesa.y, false));
    }
    
    // === INFORMACIÓN REMITENTE ===
    
    // Información Remitente: 8600588314 ALBATEQ-ALBATEQ
    if (campos.informacionRemitente) {
      this.doc.text('8600588314 ALBATEQ-ALBATEQ', this.pixelToMM(campos.informacionRemitente.x), this.pixelToMM(campos.informacionRemitente.y, false));
    }
    
    // Información Remitente2: VIA FUNZA COTA KILOMETRO 2, FUNZA - CUNDINAMARCA (dividido en 2 líneas)
    if (campos.informacionRemitente2) {
      const textoCompleto = 'VIA FUNZA COTA KILOMETRO 2, FUNZA - CUNDINAMARCA';
      const partes = textoCompleto.split(', ');
      
      // Primera línea: "VIA FUNZA COTA KILOMETRO 2"
      this.doc.text(partes[0], this.pixelToMM(campos.informacionRemitente2.x), this.pixelToMM(campos.informacionRemitente2.y, false));
      
      // Segunda línea: "FUNZA - CUNDINAMARCA" (4mm más abajo)
      if (partes[1]) {
        this.doc.text(partes[1], this.pixelToMM(campos.informacionRemitente2.x), this.pixelToMM(campos.informacionRemitente2.y, false) + 4);
      }
    }
    
    // === INFORMACIÓN DESTINATARIO ===
    
    // Información Destinatario: 8600588314 PORVENIR (UVE)2
    if (campos.informacionDestinatario) {
      this.doc.text('8600588314 PORVENIR (UVE)2', this.pixelToMM(campos.informacionDestinatario.x), this.pixelToMM(campos.informacionDestinatario.y, false));
    }
    
    // Información Destinatario2: GRANJAS EN LA ZONA DE GUADUAS, GUADUAS - CUNDINAMARCA (dividido en 2 líneas)
    if (campos.informacionDestinatario2) {
      const textoCompleto = 'GRANJAS EN LA ZONA DE GUADUAS, GUADUAS - CUNDINAMARCA';
      const partes = textoCompleto.split(', ');
      
      // Primera línea: "GRANJAS EN LA ZONA DE GUADUAS"
      this.doc.text(partes[0], this.pixelToMM(campos.informacionDestinatario2.x), this.pixelToMM(campos.informacionDestinatario2.y, false));
      
      // Segunda línea: "GUADUAS - CUNDINAMARCA" (4mm más abajo)
      if (partes[1]) {
        this.doc.text(partes[1], this.pixelToMM(campos.informacionDestinatario2.x), this.pixelToMM(campos.informacionDestinatario2.y, false) + 4);
      }
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
    
    // ID de Ingreso RNDC: 104518661 (EN NEGRITA Y TAMAÑO MAYOR)
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(14);
    const ingresoId = this.manifiesto.ingreso_id ? this.manifiesto.ingreso_id.toString() : '104518661';
    this.doc.text(ingresoId, this.pixelToMM(campos.ingresoId.x), this.pixelToMM(campos.ingresoId.y, false));
    
    // Restaurar fuente normal después del ID de ingreso
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(this.campos.fontSize?.normal || 10);
    
    } catch (error) {
      console.error('Error en addTexts:', error);
      throw error;
    }
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

      // Posición del QR según coordenadas del panel
      const qrSize = 41.4; // 228 píxeles = ~41.4mm
      const qrX = this.pixelToMM(this.campos.codigoQR.x); 
      const qrY = this.pixelToMM(this.campos.codigoQR.y, false);

      this.doc.addImage(qrDataURL, 'PNG', qrX, qrY, qrSize, qrSize);
      console.log(`Código QR agregado en coordenadas: x=${qrX}mm, y=${qrY}mm, tamaño=${qrSize}mm`);
    } catch (error) {
      console.error('Error generando código QR:', error);
    }
  }

  private generateFallbackPDF(): void {
    console.log('Generando PDF básico sin imagen de fondo...');
    
    try {
      // Agregar textos sin imagen de fondo
      this.addTexts();
      this.addQRCode();
    } catch (error) {
      console.error('Error en PDF de respaldo, creando PDF básico:', error);
      
      // Crear un PDF completamente nuevo si hay errores
      this.doc = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      try {
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
        const idRespuesta = this.manifiesto.id ? this.manifiesto.id.toString() : '';
        this.doc.text(idRespuesta, 80, y);
        y += 15;
        
        this.doc.setFont('helvetica', 'normal');
        this.doc.setFontSize(10);
        
        const fecha = format(new Date(this.manifiesto.fecha_expedicion), 'dd/MM/yyyy', { locale: es });
        this.doc.text(`Fecha de Expedición: ${fecha}`, 20, y);
        y += 10;
        
        this.doc.text(`Placa: ${this.manifiesto.placa || ''}`, 20, y);
        y += 10;
        
        this.doc.text(`Origen: ${this.manifiesto.municipio_origen || ''}`, 20, y);
        y += 10;
        
        this.doc.text(`Destino: ${this.manifiesto.municipio_destino || ''}`, 20, y);
        y += 10;
        
        this.doc.text(`Conductor: ${this.manifiesto.conductor_id || ''}`, 20, y);
      } catch (innerError) {
        console.error('Error en PDF básico:', innerError);
        // Si todo falla, crear un PDF mínimo
        this.doc.setFontSize(14);
        this.doc.text('Error generando manifiesto', 20, 50);
      }
    }
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