import jsPDF from 'jspdf';

interface CampoSimple {
  nombre: string;
  valor: string;
  x: number;
  y: number;
}

export class PDFSimpleVerticalGenerator {
  private doc: jsPDF;
  private campos: CampoSimple[];

  constructor() {
    // Crear PDF en formato carta vertical (216 x 279 mm)
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });

    // 5 campos básicos con datos de ejemplo
    this.campos = [
      { nombre: 'Nombre:', valor: 'Juan Pérez García', x: 20, y: 50 },
      { nombre: 'Documento:', valor: '12345678-9', x: 20, y: 70 },
      { nombre: 'Fecha:', valor: '30/05/2025', x: 20, y: 90 },
      { nombre: 'Ciudad:', valor: 'Bogotá, Colombia', x: 20, y: 110 },
      { nombre: 'Email:', valor: 'juan.perez@ejemplo.com', x: 20, y: 130 }
    ];

    console.log('PDF vertical creado - Formato carta:', this.doc.internal.pageSize.getWidth(), 'x', this.doc.internal.pageSize.getHeight());
  }

  async generar(): Promise<void> {
    try {
      // Título del documento
      this.doc.setFontSize(16);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('FORMULARIO BÁSICO', 20, 30);

      // Agregar los 5 campos
      this.doc.setFontSize(12);
      this.doc.setFont('helvetica', 'normal');

      this.campos.forEach((campo, index) => {
        // Etiqueta del campo en negrita
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(campo.nombre, campo.x, campo.y);
        
        // Valor del campo en texto normal
        this.doc.setFont('helvetica', 'normal');
        this.doc.text(campo.valor, campo.x + 30, campo.y);

        console.log(`Campo ${index + 1}: ${campo.nombre} ${campo.valor} en (${campo.x}, ${campo.y})`);
      });

      // Línea de firma
      this.doc.setFont('helvetica', 'normal');
      this.doc.line(20, 200, 120, 200); // Línea horizontal para firma
      this.doc.text('Firma:', 20, 215);

      // Fecha de generación
      const fechaActual = new Date().toLocaleDateString('es-CO');
      this.doc.setFontSize(10);
      this.doc.text(`Generado el: ${fechaActual}`, 20, 250);

      console.log('PDF generado exitosamente - 5 campos agregados');
    } catch (error) {
      console.error('Error generando PDF:', error);
      throw error;
    }
  }

  async save(nombreArchivo: string = 'formulario-basico.pdf'): Promise<void> {
    await this.generar();
    this.doc.save(nombreArchivo);
    console.log(`PDF guardado como: ${nombreArchivo}`);
  }

  // Método para obtener el PDF como blob
  async getBlob(): Promise<Blob> {
    await this.generar();
    return this.doc.output('blob');
  }

  // Método para actualizar un campo específico
  actualizarCampo(indice: number, nuevoValor: string): void {
    if (indice >= 0 && indice < this.campos.length) {
      this.campos[indice].valor = nuevoValor;
      console.log(`Campo ${indice + 1} actualizado: ${this.campos[indice].nombre} = ${nuevoValor}`);
    }
  }

  // Método para actualizar posición de un campo
  actualizarPosicion(indice: number, x: number, y: number): void {
    if (indice >= 0 && indice < this.campos.length) {
      this.campos[indice].x = x;
      this.campos[indice].y = y;
      console.log(`Posición del campo ${indice + 1} actualizada: (${x}, ${y})`);
    }
  }

  // Método para obtener información de los campos
  obtenerCampos(): CampoSimple[] {
    return [...this.campos];
  }
}

export default PDFSimpleVerticalGenerator;