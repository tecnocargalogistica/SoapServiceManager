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
    { id: 'numeroManifiesto', name: 'numeroManifiesto', label: 'Número Manifiesto', x: 1076, y: 170, isDragging: false },
    { id: 'idRespuesta', name: 'idRespuesta', label: 'ID Respuesta', x: 1101, y: 213, isDragging: false },
    { id: 'fechaExpedicion', name: 'fechaExpedicion', label: 'Fecha Expedición', x: 200, y: 300, isDragging: false },
    { id: 'origenViaje', name: 'origenViaje', label: 'Origen Viaje', x: 500, y: 300, isDragging: false },
    { id: 'destinoViaje', name: 'destinoViaje', label: 'Destino Viaje', x: 800, y: 300, isDragging: false },
    { id: 'placa', name: 'placa', label: 'Placa', x: 200, y: 400, isDragging: false },
    { id: 'numeroRemesa', name: 'numeroRemesa', label: 'Número Remesa', x: 200, y: 600, isDragging: false },
    { id: 'titularManifiesto', name: 'titularManifiesto', label: 'Titular Manifiesto', x: 100, y: 450, isDragging: false },
    { id: 'docIdentificacionTitular', name: 'docIdentificacionTitular', label: 'Doc. Titular', x: 100, y: 470, isDragging: false },
    { id: 'direccionTitular', name: 'direccionTitular', label: 'Dirección Titular', x: 100, y: 490, isDragging: false },
    { id: 'telefonoTitular', name: 'telefonoTitular', label: 'Teléfono Titular', x: 100, y: 510, isDragging: false },
    { id: 'ciudadTitular', name: 'ciudadTitular', label: 'Ciudad Titular', x: 100, y: 530, isDragging: false },
    { id: 'tenedorManifiesto', name: 'tenedorManifiesto', label: 'Tenedor Manifiesto', x: 300, y: 450, isDragging: false },
    { id: 'docIdentificacionTenedor', name: 'docIdentificacionTenedor', label: 'Doc. Tenedor', x: 300, y: 470, isDragging: false },
    { id: 'direccionTenedor', name: 'direccionTenedor', label: 'Dirección Tenedor', x: 300, y: 490, isDragging: false },
    { id: 'telefonoTenedor', name: 'telefonoTenedor', label: 'Teléfono Tenedor', x: 300, y: 510, isDragging: false },
    { id: 'ciudadTenedor', name: 'ciudadTenedor', label: 'Ciudad Tenedor', x: 300, y: 530, isDragging: false },
    { id: 'conductor', name: 'conductor', label: 'Conductor', x: 500, y: 450, isDragging: false },
    { id: 'docIdentificacionConductor', name: 'docIdentificacionConductor', label: 'Doc. Conductor', x: 500, y: 470, isDragging: false },
    { id: 'direccionConductor', name: 'direccionConductor', label: 'Dirección Conductor', x: 500, y: 490, isDragging: false },
    { id: 'telefonoConductor', name: 'telefonoConductor', label: 'Teléfono Conductor', x: 500, y: 510, isDragging: false },
    { id: 'ciudadConductor', name: 'ciudadConductor', label: 'Ciudad Conductor', x: 500, y: 530, isDragging: false },
    { id: 'valorViaje', name: 'valorViaje', label: 'Valor Viaje', x: 700, y: 450, isDragging: false },
    { id: 'valorEnLetras', name: 'valorEnLetras', label: 'Valor en Letras', x: 700, y: 470, isDragging: false },
    { id: 'codigoQR', name: 'codigoQR', label: 'Código QR', x: 1200, y: 100, isDragging: false }
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
    if (!manifiestoEjemplo) return;

    const coordinadasCompletas = campos.reduce((acc, campo) => {
      acc[campo.name] = { x: campo.x, y: campo.y };
      return acc;
    }, {} as any);

    coordinadasCompletas.fontSize = {
      normal: 9,
      small: 8,
      large: 11
    };

    const generator = new ManifiestoPDFHorizontalGenerator(
      manifiestoEjemplo, 
      coordinadasCompletas, 
      imagenFondo
    );

    await generator.save();
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
              {/* Subir imagen */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Imagen de Fondo</Label>
                <Input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={subirImagenFondo}
                  disabled={subiendoImagen}
                  className="text-xs"
                />
                {imagenFondo && (
                  <p className="text-xs text-green-600">
                    ✓ {imagenFondo}
                  </p>
                )}
              </div>

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
                className="relative border-2 border-dashed border-gray-300 overflow-auto bg-gray-100"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ 
                  cursor: draggedField ? 'grabbing' : 'default',
                  width: '100%',
                  height: '600px'
                }}
              >
                {/* Área de trabajo horizontal con imagen de fondo */}
                <div 
                  ref={imageRef}
                  className="relative bg-white border border-gray-400 mx-auto my-4 shadow-lg"
                  style={{
                    width: `${837 * scale}px`, // Formato horizontal (279mm * 3)
                    height: `${648 * scale}px`, // (216mm * 3)
                    transformOrigin: 'top center',
                    backgroundImage: imagenFondo ? `url(/api/plantillas-pdf/imagen/${imagenFondo})` : 'none',
                    backgroundSize: 'cover',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center'
                  }}
                >
                </div>
                
                {/* Campos arrastrables superpuestos */}
                {campos.map((campo) => (
                  <div
                    key={campo.id}
                    className={`absolute border-2 px-2 py-1 text-xs font-medium cursor-grab select-none z-20
                      ${campo.isDragging 
                        ? 'border-blue-500 bg-blue-200 cursor-grabbing z-30' 
                        : 'border-red-500 bg-red-200 hover:bg-red-300'
                      }`}
                    style={{
                      left: `${(campo.x * scale) + ((837 * scale - 837) / 2) + 20}px`,
                      top: `${(campo.y * scale) + 20}px`,
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