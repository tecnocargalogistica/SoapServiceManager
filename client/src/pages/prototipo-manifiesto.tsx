import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import ManifiestoCargaTailwind from "@/components/ManifiestoCargaTailwind";
import type { Manifiesto } from "@/../../shared/schema";

const PrototipoManifiesto = () => {
  const { data: manifiestos } = useQuery<Manifiesto[]>({
    queryKey: ['/api/manifiestos'],
  });

  // Usar el primer manifiesto como ejemplo
  const manifiestoEjemplo = manifiestos?.[0];

  if (!manifiestoEjemplo) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Prototipo de Manifiesto con Tailwind CSS</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Cargando datos del manifiesto...</p>
            <Link href="/impresion-manifiestos">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver a Impresión
              </Button>
            </Link>
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

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">🎨 Prototipo de Manifiesto con Tailwind CSS</CardTitle>
          <p className="text-gray-600">
            Esta es la nueva versión del manifiesto usando React + Tailwind CSS. 
            Compara con la versión HTML actual y decide cuál prefieres.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <h4 className="font-semibold text-green-600">✅ Ventajas de Tailwind:</h4>
              <ul className="text-sm space-y-1 mt-2">
                <li>• Más fácil de mantener y modificar</li>
                <li>• Mejor responsive design</li>
                <li>• Código más limpio y organizado</li>
                <li>• Campos dinámicos más simples</li>
                <li>• Impresión optimizada con print: clases</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-blue-600">📊 Datos del ejemplo:</h4>
              <ul className="text-sm space-y-1 mt-2">
                <li>• Manifiesto: {manifiestoEjemplo.numero_manifiesto}</li>
                <li>• Placa: {manifiestoEjemplo.placa}</li>
                <li>• Origen: {manifiestoEjemplo.municipio_origen}</li>
                <li>• Destino: {manifiestoEjemplo.municipio_destino}</li>
                <li>• Remesa: {manifiestoEjemplo.consecutivo_remesa}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Aquí va el componente del manifiesto */}
      <ManifiestoCargaTailwind manifiesto={manifiestoEjemplo} />
    </div>
  );
};

export default PrototipoManifiesto;