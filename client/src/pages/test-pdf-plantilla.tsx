import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { ManifiestoPDFHorizontalGenerator } from "@/components/ManifiestoPDFHorizontal";
import type { Manifiesto } from "@/../../shared/schema";

const TestPDFPlantilla = () => {
  const [coordenadas, setCoordenadas] = useState({
    // Coordenadas de prueba convertidas de píxeles a mm
    numeroManifiesto: { x: 380, y: 60 }, // CONSECUTIVO: X 1076, Y 170 píxeles
    idRespuesta: { x: 389, y: 75 }, // ID respuesta XML: X 1101, Y 213 píxeles
    fechaExpedicion: { x: 50, y: 85 },
    origenViaje: { x: 130, y: 85 },
    destinoViaje: { x: 200, y: 85 },
    placa: { x: 50, y: 125 },
    documentoConductor: { x: 160, y: 140 },
    numeroRemesa: { x: 50, y: 195 }
  });

  const { data: manifiestos } = useQuery<Manifiesto[]>({
    queryKey: ['/api/manifiestos'],
  });

  const manifiestoEjemplo = manifiestos?.[0];

  const handleCoordenadasChange = (campo: string, eje: 'x' | 'y', valor: number) => {
    setCoordenadas(prev => ({
      ...prev,
      [campo]: {
        ...prev[campo as keyof typeof prev],
        [eje]: valor
      }
    }));
  };

  const generarPDFConCoordenadas = async () => {
    if (!manifiestoEjemplo) return;

    // Crear una versión temporal del generador con las coordenadas ajustadas
    const generator = new ManifiestoPDFHorizontalGenerator(manifiestoEjemplo);
    
    // Actualizar las coordenadas dinámicamente
    generator.campos = {
      ...coordenadas,
      fontSize: {
        normal: 9,
        small: 8,
        large: 11
      }
    };

    await generator.save();
  };

  const guardarPlantilla = async () => {
    try {
      const plantillaData = {
        nombre: "Plantilla RNDC Horizontal",
        descripcion: "Plantilla para manifiestos RNDC con imagen horizontal",
        coordenadas: coordenadas,
        imagen_path: "Manifiesto.jpg",
        formato: "horizontal",
        activa: true
      };

      const response = await fetch('/api/plantillas-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(plantillaData),
      });

      if (response.ok) {
        alert('Plantilla guardada exitosamente');
      } else {
        alert('Error guardando plantilla');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error guardando plantilla');
    }
  };

  if (!manifiestoEjemplo) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p>Cargando datos del manifiesto...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Link href="/impresion-manifiestos">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Impresión
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel de Control de Coordenadas */}
        <Card>
          <CardHeader>
            <CardTitle>Ajustar Coordenadas de Campos</CardTitle>
            <p className="text-sm text-gray-600">
              Ajusta las coordenadas X,Y para cada campo. Genera el PDF para ver los cambios.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {Object.entries(coordenadas).map(([campo, coords]) => (
              <div key={campo} className="grid grid-cols-3 gap-3 items-center">
                <Label className="text-sm font-medium">
                  {campo.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </Label>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">X:</Label>
                  <Input
                    type="number"
                    value={coords.x}
                    onChange={(e) => handleCoordenadasChange(campo, 'x', Number(e.target.value))}
                    className="w-20 h-8 text-xs"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Y:</Label>
                  <Input
                    type="number"
                    value={coords.y}
                    onChange={(e) => handleCoordenadasChange(campo, 'y', Number(e.target.value))}
                    className="w-20 h-8 text-xs"
                  />
                </div>
              </div>
            ))}
            
            <div className="pt-4 border-t space-y-3">
              <Button 
                onClick={generarPDFConCoordenadas}
                className="w-full"
              >
                Generar PDF de Prueba
              </Button>
              <Button 
                onClick={guardarPlantilla}
                variant="outline"
                className="w-full"
              >
                Guardar Coordenadas como Plantilla
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Panel de Información del Manifiesto */}
        <Card>
          <CardHeader>
            <CardTitle>Datos del Manifiesto de Prueba</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label className="font-medium text-gray-600">Número de Manifiesto</Label>
                <p className="font-mono bg-yellow-100 px-2 py-1 rounded">
                  {manifiestoEjemplo.numero_manifiesto}
                </p>
              </div>
              <div>
                <Label className="font-medium text-gray-600">Fecha de Expedición</Label>
                <p className="font-mono bg-yellow-100 px-2 py-1 rounded">
                  {new Date(manifiestoEjemplo.fecha_expedicion).toLocaleDateString('es-CO')}
                </p>
              </div>
              <div>
                <Label className="font-medium text-gray-600">Placa</Label>
                <p className="font-mono bg-yellow-100 px-2 py-1 rounded">
                  {manifiestoEjemplo.placa}
                </p>
              </div>
              <div>
                <Label className="font-medium text-gray-600">Conductor ID</Label>
                <p className="font-mono bg-yellow-100 px-2 py-1 rounded">
                  {manifiestoEjemplo.conductor_id}
                </p>
              </div>
              <div>
                <Label className="font-medium text-gray-600">Origen</Label>
                <p className="font-mono bg-yellow-100 px-2 py-1 rounded">
                  {manifiestoEjemplo.municipio_origen}
                </p>
              </div>
              <div>
                <Label className="font-medium text-gray-600">Destino</Label>
                <p className="font-mono bg-yellow-100 px-2 py-1 rounded">
                  {manifiestoEjemplo.municipio_destino}
                </p>
              </div>
              <div className="col-span-2">
                <Label className="font-medium text-gray-600">Número de Remesa</Label>
                <p className="font-mono bg-yellow-100 px-2 py-1 rounded">
                  {manifiestoEjemplo.consecutivo_remesa}
                </p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="font-medium text-gray-700 mb-3">Instrucciones:</h4>
              <ol className="text-sm space-y-2 text-gray-600">
                <li>1. Ajusta las coordenadas X,Y para cada campo</li>
                <li>2. Haz clic en "Generar PDF de Prueba"</li>
                <li>3. Revisa cómo se ven los datos en la plantilla</li>
                <li>4. Repite hasta que todos los campos estén perfectamente alineados</li>
              </ol>
            </div>

            <div className="bg-blue-50 p-3 rounded text-sm">
              <p className="font-medium text-blue-800 mb-1">Coordenadas de referencia:</p>
              <p className="text-blue-700">
                X: Posición horizontal (0 = izquierda, 210 = derecha)<br/>
                Y: Posición vertical (0 = arriba, 297 = abajo)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestPDFPlantilla;