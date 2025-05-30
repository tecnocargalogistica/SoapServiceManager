import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save, Eye, Upload } from "lucide-react";
import { Link } from "wouter";
import { ManifiestoPDFHorizontalGenerator } from "@/components/ManifiestoPDFHorizontal";
import type { Manifiesto } from "@/../../shared/schema";

interface DraggableField {
  id: string;
  name: string;
  label: string;
  x: number;
  y: number;
  isDragging: boolean;
}

const EditorPlantillaVisual = () => {
  const [imagenFondo, setImagenFondo] = useState<string>("");
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [draggedField, setDraggedField] = useState<string | null>(null);
  const [scale, setScale] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Datos del manifiesto de ejemplo para preview
  const { data: manifiestoEjemplo } = useQuery({
    queryKey: ['/api/manifiestos/completos'],
    select: (data: any[]) => data?.[0] || null
  });

  const [campos, setCampos] = useState<DraggableField[]>([
    { id: 'campo1', name: 'campo1', label: 'Nombre', x: 20, y: 60, isDragging: false },
    { id: 'campo2', name: 'campo2', label: 'Documento', x: 20, y: 90, isDragging: false },
    { id: 'campo3', name: 'campo3', label: 'Fecha', x: 20, y: 120, isDragging: false },
    { id: 'campo4', name: 'campo4', label: 'Ciudad', x: 20, y: 150, isDragging: false },
    { id: 'campo5', name: 'campo5', label: 'Email', x: 20, y: 180, isDragging: false }
  ]);

  const subirImagenFondo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSubiendoImagen(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/plantillas-pdf/upload-image', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setImagenFondo(result.filename);
        console.log('Imagen subida:', result.filename);
      } else {
        console.error('Error al subir imagen');
      }
    } catch (error) {
      console.error('Error al subir archivo:', error);
    } finally {
      setSubiendoImagen(false);
    }
  };

  const handleMouseDown = (fieldId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setDraggedField(fieldId);
    setCampos(prev => prev.map(campo => 
      campo.id === fieldId ? { ...campo, isDragging: true } : campo
    ));
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedField || !canvasRef.current || !imageRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const imageRect = imageRef.current.getBoundingClientRect();
    
    // Calcular posición relativa a la imagen
    const x = (e.clientX - imageRect.left) / scale;
    const y = (e.clientY - imageRect.top) / scale;

    setCampos(prev => prev.map(campo => 
      campo.id === draggedField ? { ...campo, x: Math.max(0, x), y: Math.max(0, y) } : campo
    ));
  };

  const handleMouseUp = () => {
    if (draggedField) {
      setCampos(prev => prev.map(campo => 
        campo.id === draggedField ? { ...campo, isDragging: false } : campo
      ));
      setDraggedField(null);
    }
  };

  const generarPDFPreview = async () => {
    const { jsPDF } = await import('jspdf');
    
    // Crear PDF vertical formato carta (216 x 279 mm)
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter'
    });

    // Título
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('FORMULARIO BÁSICO', 20, 30);

    // Agregar los 5 campos usando las coordenadas del editor
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');

    const valoresEjemplo = [
      'Juan Pérez García',
      '12345678-9', 
      '30/05/2025',
      'Bogotá, Colombia',
      'juan.perez@ejemplo.com'
    ];

    campos.forEach((campo, index) => {
      // Convertir coordenadas de píxeles a mm (aprox)
      const xMm = campo.x * 0.264583; // conversión píxel a mm
      const yMm = campo.y * 0.264583;
      
      // Etiqueta del campo
      doc.setFont('helvetica', 'bold');
      doc.text(`${campo.label}:`, xMm, yMm);
      
      // Valor del campo
      doc.setFont('helvetica', 'normal');
      doc.text(valoresEjemplo[index] || 'Valor de ejemplo', xMm + 30, yMm);
    });

    // Línea de firma
    doc.line(20, 200, 120, 200);
    doc.text('Firma:', 20, 215);

    // Fecha de generación
    const fechaActual = new Date().toLocaleDateString('es-CO');
    doc.setFontSize(10);
    doc.text(`Generado el: ${fechaActual}`, 20, 250);

    // Guardar PDF
    doc.save('formulario-basico.pdf');
  };

  const guardarPlantilla = async () => {
    try {
      const coordinadasParaGuardar = campos.reduce((acc, campo) => {
        acc[campo.name] = { x: campo.x, y: campo.y };
        return acc;
      }, {} as any);

      const plantillaData = {
        nombre: "Plantilla Visual RNDC",
        descripcion: "Plantilla creada con editor visual drag-and-drop",
        coordenadas: coordinadasParaGuardar,
        imagen_path: imagenFondo || "Manifiesto_PNG_Página_1.jpg",
        formato: "horizontal",
        activa: true
      };

      const response = await fetch('/api/plantillas-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plantillaData)
      });

      if (response.ok) {
        alert('Plantilla guardada exitosamente');
      } else {
        alert('Error al guardar plantilla');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al guardar plantilla');
    }
  };

  const imagenSrc = imagenFondo 
    ? `/@fs/home/runner/workspace/attached_assets/${imagenFondo}`
    : '/@fs/home/runner/workspace/attached_assets/Manifiesto_PNG_Página_1.jpg';

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Link href="/test-pdf-plantilla">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Plantillas
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Panel de Herramientas */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Herramientas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">


              {/* Control de zoom */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Zoom: {Math.round(scale * 100)}%</Label>
                <Input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={scale}
                  onChange={(e) => setScale(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Acciones */}
              <div className="space-y-2">
                <Button onClick={generarPDFPreview} className="w-full" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Vista Previa PDF
                </Button>
                <Button onClick={guardarPlantilla} variant="outline" className="w-full" size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Plantilla
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de campos */}
          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-sm">Campos Disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {campos.map((campo) => (
                  <div
                    key={campo.id}
                    className="text-xs p-2 bg-gray-50 rounded cursor-help hover:bg-gray-100"
                    title={`${campo.label}: (${Math.round(campo.x)}, ${Math.round(campo.y)})`}
                  >
                    <div className="font-medium">{campo.label}</div>
                    <div className="text-gray-500">
                      X: {Math.round(campo.x)}, Y: {Math.round(campo.y)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Canvas de edición */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Editor Visual de Plantilla</CardTitle>
              <p className="text-sm text-gray-600">
                Arrastra los campos sobre la imagen para posicionarlos. Los campos aparecen como rectángulos de colores.
              </p>
            </CardHeader>
            <CardContent>
              <div
                ref={canvasRef}
                className="relative border-2 border-dashed border-gray-300 overflow-auto max-h-[600px] bg-white"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ 
                  cursor: draggedField ? 'grabbing' : 'default',
                  width: `${216 * scale}px`, // Ancho carta (216mm)
                  height: `${279 * scale}px` // Alto carta (279mm)
                }}
              >
                {/* Área de trabajo carta vertical */}
                <div 
                  ref={imageRef}
                  className="absolute inset-0 bg-white border border-gray-400"
                  style={{
                    width: '216px', // Formato carta
                    height: '279px',
                    transform: `scale(${scale})`,
                    transformOrigin: 'top left'
                  }}
                >
                  {/* Líneas guía opcionales */}
                  <div className="absolute top-8 left-4 text-xs text-gray-400">FORMULARIO BÁSICO</div>
                </div>
                
                {/* Campos arrastrables superpuestos */}
                {campos.map((campo) => (
                  <div
                    key={campo.id}
                    className={`absolute border-2 px-2 py-1 text-xs font-medium cursor-grab select-none
                      ${campo.isDragging 
                        ? 'border-blue-500 bg-blue-200 cursor-grabbing z-10' 
                        : 'border-red-500 bg-red-200 hover:bg-red-300'
                      }`}
                    style={{
                      left: campo.x * scale,
                      top: campo.y * scale,
                      transform: `scale(${scale})`,
                      transformOrigin: 'top left'
                    }}
                    onMouseDown={(e) => handleMouseDown(campo.id, e)}
                    title={campo.label}
                  >
                    {campo.label}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EditorPlantillaVisual;