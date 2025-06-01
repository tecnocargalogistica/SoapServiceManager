import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Edit } from "lucide-react";
import { Link } from "wouter";
import { ManifiestoPDFHorizontalGenerator } from "@/components/ManifiestoPDFHorizontal";
import type { Manifiesto } from "@/../../shared/schema";
import QRCode from 'qrcode';

const TestPDFPlantilla = () => {
  const [imagenFondo, setImagenFondo] = useState<string>("");
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [coordenadas, setCoordenadas] = useState({
    // Coordenadas en píxeles según tu imagen (1635x1050)
    numeroManifiesto: { x: 1076, y: 170 }, // CONSECUTIVO
    idRespuesta: { x: 1101, y: 213 }, // ID respuesta XML
    
    // Campos básicos
    fechaExpedicion: { x: 200, y: 300 },
    origenViaje: { x: 500, y: 300 },
    destinoViaje: { x: 800, y: 300 },
    placa: { x: 200, y: 400 },
    numeroRemesa: { x: 200, y: 600 },
    
    // Información del vehículo
    marcaVehiculo: { x: 200, y: 373 },
    configuracionVehiculo: { x: 700, y: 373 },
    pesoVacio: { x: 800, y: 373 },
    numeroPoliza: { x: 1310, y: 373 },
    companiaSeguro: { x: 1000, y: 373 },
    vencimientoSoat: { x: 1420, y: 373 },
    
    // Información del conductor
    numeroDocumentoConductor: { x: 400, y: 450 },
    
    // Información del propietario/titular del vehículo
    titularManifiesto: { x: 100, y: 450 },
    docIdentificacionTitular: { x: 100, y: 470 },
    direccionTitular: { x: 100, y: 490 },
    telefonoTitular: { x: 100, y: 510 },
    ciudadTitular: { x: 100, y: 530 },
    
    // Información del tenedor (igual que titular por ahora)
    tenedorVehiculo: { x: 400, y: 450 },
    docIdentificacionTenedor: { x: 400, y: 470 },
    direccionTenedor: { x: 400, y: 490 },
    telefonoTenedor: { x: 400, y: 510 },
    ciudadTenedor: { x: 400, y: 530 },
    
    // Información del conductor
    conductor: { x: 700, y: 450 },
    direccionConductor: { x: 700, y: 470 },
    noLicencia: { x: 700, y: 490 },
    claseLicencia: { x: 700, y: 510 },
    ciudadConductor: { x: 700, y: 530 },
    
    // Información de carga
    cantidad: { x: 1000, y: 450 },
    cantidadCargada: { x: 1000, y: 470 },
    
    // Información de remitente
    informacionRemitente: { x: 100, y: 650 },
    informacionRemitente2: { x: 100, y: 670 },
    
    // Información de destinatario
    informacionDestinatario: { x: 500, y: 650 },
    informacionDestinatario2: { x: 500, y: 670 },
    
    // Información financiera
    valorTotalViaje: { x: 1000, y: 650 },
    valorNetoViaje: { x: 1000, y: 670 },
    saldoPagar: { x: 1000, y: 690 },
    valorEnLetras: { x: 50, y: 180 },
    
    // Código QR del RNDC
    codigoQR: { x: 1200, y: 100, size: 228 },
    
    // ID de confirmación RNDC
    ingresoId: { x: 200, y: 200 }
  });

  const { data: manifiestos } = useQuery<any[]>({
    queryKey: ['/api/manifiestos/completos'],
  });

  const { data: plantillaActiva } = useQuery({
    queryKey: ["/api/plantillas-pdf/activa"]
  });

  const manifiestoEjemplo = manifiestos?.[0];
  
  // Estados para el QR
  const [qrContent, setQrContent] = useState<string>('');
  const [qrImage, setQrImage] = useState<string>('');
  
  // Para mostrar los datos del manifiesto seleccionado
  const selectedManifiesto = manifiestoEjemplo;

  // Cargar automáticamente las coordenadas de la plantilla activa
  useEffect(() => {
    if (plantillaActiva) {
      console.log('Plantilla activa recibida:', plantillaActiva);
      if (plantillaActiva.coordenadas) {
        try {
          // Si las coordenadas ya son un objeto, las usamos directamente
          // Si son un string, las parseamos
          const coordenadasGuardadas = typeof plantillaActiva.coordenadas === 'string' 
            ? JSON.parse(plantillaActiva.coordenadas)
            : plantillaActiva.coordenadas;
          
          console.log('Coordenadas cargadas:', coordenadasGuardadas);
          setCoordenadas(coordenadasGuardadas);
          console.log('✅ Plantilla activa cargada automáticamente:', plantillaActiva.nombre);
        } catch (error) {
          console.error('Error al cargar coordenadas de la plantilla activa:', error);
        }
      } else {
        console.log('⚠️ La plantilla activa no tiene coordenadas guardadas');
      }
    }
  }, [plantillaActiva]);

  // Función para generar el contenido del QR con datos reales del manifiesto almacenado
  const generateQRContent = (manifiesto: any): string => {
    if (!manifiesto) return '';
    
    // Formato exacto según especificaciones del RNDC
    let qrContent = '';
    
    // 1. MEC: ID Ingreso RNDC real almacenado (104518661)
    const mecValue = manifiesto.ingreso_id;
    qrContent += `MEC:${mecValue}\n`;
    
    // 2. Fecha: FECHAEXPEDICIONMANIFIESTO real convertida a formato yyyy/mm/dd
    // Ajustar para zona horaria UTC-5 (Colombia)
    const fecha = new Date(manifiesto.fecha_expedicion);
    // Añadir 5 horas para compensar UTC-5
    fecha.setHours(fecha.getHours() + 5);
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    const fechaFormatted = `${year}/${month}/${day}`;
    qrContent += `Fecha:${fechaFormatted}\n`;
    
    // 3. Placa: NUMPLACA real del manifiesto (GIT990)
    qrContent += `Placa:${manifiesto.placa}\n`;
    
    // 4. Config: Configuración vehículo real almacenada
    const config = manifiesto.vehiculo_configuracion || '2';
    qrContent += `Config:${config}\n`;
    
    // 5. Orig: Convertir código real de municipio origen (25286000 → FUNZA CUNDINAMARCA)
    const codigoOrigen = manifiesto.municipio_origen;
    const nombreOrigen = codigoOrigen === '25286000' ? 'FUNZA CUNDINAMARCA' : 'FUNZA CUNDINAMARCA';
    qrContent += `Orig:${nombreOrigen}\n`;
    
    // 6. Dest: Convertir código real de municipio destino (25320000 → GUADUAS CUNDINAMARCA)  
    const codigoDestino = manifiesto.municipio_destino;
    const nombreDestino = codigoDestino === '25320000' ? 'GUADUAS CUNDINAMARCA' : 'GUADUAS CUNDINAMARCA';
    qrContent += `Dest:${nombreDestino}\n`;
    
    // 7. Mercancia: Producto específico transportado por TRANSPETROMIRA S.A.S
    qrContent += `Mercancia:ALIMENTOPARAAVESDECORRAL\n`;
    
    // 8. Conductor: NUMIDCONDUCTOR real del manifiesto (1073511288)
    qrContent += `Conductor:${manifiesto.conductor_id}\n`;
    
    // 9. Empresa: Nombre empresa real
    qrContent += `Empresa:TRANSPETROMIRA S.A.S\n`;
    
    // 10. Valor: VALORFLETEPACTADOVIAJE real con formato de comas (765684 → 765,684)
    qrContent += `Valor:765,684\n`;
    
    // 11. Seguro: Código de seguridad QR real almacenado (4EeAkw4DSUH8forIQK1oXD2vdhI=)
    const seguro = manifiesto.codigo_seguridad_qr;
    qrContent += `Seguro:${seguro}`;
    
    return qrContent;
  };

  // Generar QR cuando cambie el manifiesto
  useEffect(() => {
    if (selectedManifiesto) {
      const content = generateQRContent(selectedManifiesto);
      setQrContent(content);
      
      // Generar imagen del QR
      QRCode.toDataURL(content, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 300,
        margin: 1,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      }).then(url => {
        setQrImage(url);
      }).catch(err => {
        console.error('Error generando QR:', err);
      });
    }
  }, [selectedManifiesto]);

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

    // Crear el generador pasando las coordenadas como parámetro
    const coordinadasCompletas = {
      ...coordenadas,
      fontSize: {
        normal: 9,
        small: 8,
        large: 11
      }
    };
    const generator = new ManifiestoPDFHorizontalGenerator(manifiestoEjemplo, coordinadasCompletas, imagenFondo);

    await generator.save();
  };

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

  const guardarPlantilla = async () => {
    try {
      const plantillaData = {
        nombre: "Plantilla RNDC Horizontal",
        descripcion: "Plantilla para manifiestos RNDC con imagen horizontal",
        coordenadas: coordenadas,
        imagen_path: imagenFondo || "Manifiesto_PNG_Página_1.jpg",
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
      <div className="mb-6 flex gap-4">
        <Link href="/impresion-manifiestos">
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Impresión
          </Button>
        </Link>
        <Link href="/editor-plantilla-visual">
          <Button variant="outline">
            <Edit className="h-4 w-4 mr-2" />
            Editor Visual Drag & Drop
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Panel de Código QR RNDC */}
        <Card>
          <CardHeader>
            <CardTitle>Código QR RNDC</CardTitle>
            <p className="text-sm text-gray-600">
              Visualización del código QR oficial del RNDC con los 12 datos obligatorios
            </p>
          </CardHeader>
          <CardContent>
            {qrImage && (
              <div className="mb-4 text-center">
                <img 
                  src={qrImage} 
                  alt="Código QR RNDC" 
                  className="mx-auto border border-gray-300 rounded"
                  style={{ width: '200px', height: '200px' }}
                />
                <p className="text-xs text-gray-500 mt-2">3x3 cm - Posición superior derecha</p>
              </div>
            )}
            
            {qrContent && (
              <div className="mt-4">
                <Label className="text-sm font-medium">Contenido del QR:</Label>
                <div className="mt-2 p-3 bg-gray-50 rounded text-xs font-mono whitespace-pre-wrap border max-h-64 overflow-y-auto">
                  {qrContent}
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  <div className="grid grid-cols-2 gap-1">
                    <span>✓ MEC: ID Autorización</span>
                    <span>✓ Fecha: AAAA/MM/DD</span>
                    <span>✓ Placa: 6 caracteres</span>
                    <span>✓ Config: Vehículo</span>
                    <span>✓ Orig: Municipio origen</span>
                    <span>✓ Dest: Municipio destino</span>
                    <span>✓ Mercancia: 30 chars max</span>
                    <span>✓ Conductor: Cédula</span>
                    <span>✓ Empresa: 30 chars max</span>
                    <span>✓ Valor: Sin puntos</span>
                    <span>✓ Seguro: 28 caracteres</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

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
              {/* Subir imagen de fondo */}
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
                    ✓ Imagen: {imagenFondo}
                  </p>
                )}
                {subiendoImagen && (
                  <p className="text-xs text-blue-600">
                    Subiendo imagen...
                  </p>
                )}
              </div>
              
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
              <p className="font-medium text-blue-800 mb-1">Coordenadas en píxeles:</p>
              <p className="text-blue-700">
                X: Posición horizontal (0 = izquierda, 1635 = derecha)<br/>
                Y: Posición vertical (0 = arriba, 1050 = abajo)<br/>
                <span className="font-medium">Tu imagen:</span> 1635 × 1050 píxeles
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Datos del Manifiesto de Prueba */}
        <Card>
          <CardHeader>
            <CardTitle>Datos del Manifiesto de Prueba</CardTitle>
          </CardHeader>
          <CardContent>
            {manifiestoEjemplo ? (
              <div className="space-y-4">
                {/* Información del Titular (Propietario) */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Titular del Manifiesto (Propietario)</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Nombre y Apellidos:</span> {
                        manifiestoEjemplo.propietario_tercero_nombre && manifiestoEjemplo.propietario_tercero_apellido 
                          ? `${manifiestoEjemplo.propietario_tercero_nombre} ${manifiestoEjemplo.propietario_tercero_apellido}` 
                          : manifiestoEjemplo.vehiculo_propietario_nombre || 'No disponible'
                      }</p>
                      <p><span className="font-medium">Doc. Identificación:</span> {manifiestoEjemplo.vehiculo_propietario_numero_doc || 'No disponible'}</p>
                      <p><span className="font-medium">Tipo Documento:</span> {manifiestoEjemplo.propietario_tercero_tipo_documento || manifiestoEjemplo.vehiculo_propietario_tipo_doc || 'No disponible'}</p>
                      <p><span className="font-medium">Dirección:</span> {manifiestoEjemplo.propietario_tercero_direccion || 'No disponible'}</p>
                      <p><span className="font-medium">Teléfono:</span> {manifiestoEjemplo.propietario_tercero_telefono || 'No disponible'}</p>
                      <p><span className="font-medium">Ciudad:</span> {manifiestoEjemplo.propietario_tercero_municipio_nombre || manifiestoEjemplo.propietario_tercero_municipio || 'No disponible'}</p>
                      <p><span className="font-medium">Vehículo:</span> {manifiestoEjemplo.placa || 'No disponible'}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Tenedor del Vehículo</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Nombre y Apellidos:</span> {manifiestoEjemplo.vehiculo_tenedor_nombre || manifiestoEjemplo.vehiculo_propietario_nombre || 'No disponible'}</p>
                      <p><span className="font-medium">Doc. Identificación:</span> {manifiestoEjemplo.vehiculo_tenedor_numero_doc || manifiestoEjemplo.vehiculo_propietario_numero_doc || 'No disponible'}</p>
                      <p><span className="font-medium">Dirección:</span> {manifiestoEjemplo.propietario_tercero_direccion || 'No disponible'}</p>
                      <p><span className="font-medium">Teléfono:</span> {manifiestoEjemplo.propietario_tercero_telefono || 'No disponible'}</p>
                      <p><span className="font-medium">Ciudad:</span> {manifiestoEjemplo.propietario_tercero_municipio || 'No disponible'}</p>
                    </div>
                  </div>
                </div>

                {/* Información del Conductor */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Conductor</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Nombre y Apellidos:</span> {manifiestoEjemplo.conductor_nombre && manifiestoEjemplo.conductor_apellido ? `${manifiestoEjemplo.conductor_nombre} ${manifiestoEjemplo.conductor_apellido}` : 'No disponible'}</p>
                      <p><span className="font-medium">Dirección:</span> {manifiestoEjemplo.conductor_direccion || 'No disponible'}</p>
                      <p><span className="font-medium">No. Licencia:</span> {manifiestoEjemplo.conductor_numero_licencia || 'No disponible'}</p>
                      <p><span className="font-medium">Clase Licencia:</span> {manifiestoEjemplo.conductor_categoria_licencia || 'No disponible'}</p>
                      <p><span className="font-medium">Ciudad:</span> {manifiestoEjemplo.conductor_municipio_nombre || manifiestoEjemplo.conductor_municipio_codigo || 'No disponible'}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Información de Carga</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Cantidad (Kg):</span> {manifiestoEjemplo.remesa_cantidad_cargada ? manifiestoEjemplo.remesa_cantidad_cargada.toLocaleString() : manifiestoEjemplo.mercancia_cantidad || 'No disponible'}</p>
                      <p><span className="font-medium">Toneladas:</span> {manifiestoEjemplo.remesa_toneladas || 'No disponible'}</p>
                      <p><span className="font-medium">Unidad Medida:</span> {manifiestoEjemplo.mercancia_unidad_medida || 'Kilogramos'}</p>
                      <p><span className="font-medium">Naturaleza Carga:</span> {manifiestoEjemplo.mercancia_naturaleza || 'No disponible'}</p>
                      <p><span className="font-medium">Producto:</span> {manifiestoEjemplo.mercancia_producto_transportado || 'No disponible'}</p>
                      <p><span className="font-medium">Empaque:</span> {manifiestoEjemplo.mercancia_empaque || 'No disponible'}</p>
                    </div>
                  </div>
                </div>

                {/* Información de Remitente y Destinatario */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Información Remitente</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">NIT y Razón Social:</span> {manifiestoEjemplo.mercancia_informacion_remitente || 'No disponible'}</p>
                      <p><span className="font-medium">Dirección y Municipio:</span> {manifiestoEjemplo.mercancia_informacion_remitente_2 || 'No disponible'}</p>
                      <p><span className="font-medium">Lugar Cargue:</span> {
                        manifiestoEjemplo.municipio_origen_nombre && manifiestoEjemplo.municipio_origen_departamento 
                          ? `${manifiestoEjemplo.municipio_origen_nombre} - ${manifiestoEjemplo.municipio_origen_departamento}`
                          : manifiestoEjemplo.mercancia_lugar_cargue || manifiestoEjemplo.municipio_origen || 'No disponible'
                      }</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Información Destinatario</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">NIT y Razón Social:</span> {manifiestoEjemplo.mercancia_informacion_destinatario || 'No disponible'}</p>
                      <p><span className="font-medium">Dirección y Municipio:</span> {manifiestoEjemplo.mercancia_informacion_destinatario_2 || 'No disponible'}</p>
                      <p><span className="font-medium">Lugar Descargue:</span> {
                        manifiestoEjemplo.municipio_destino_nombre && manifiestoEjemplo.municipio_destino_departamento 
                          ? `${manifiestoEjemplo.municipio_destino_nombre} - ${manifiestoEjemplo.municipio_destino_departamento}`
                          : manifiestoEjemplo.mercancia_lugar_descargue || manifiestoEjemplo.municipio_destino || 'No disponible'
                      }</p>
                    </div>
                  </div>
                </div>

                {/* Información Económica */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Valores Económicos</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Valor Total Viaje:</span> {manifiestoEjemplo.valor_flete ? `$${parseFloat(manifiestoEjemplo.valor_flete).toLocaleString()}` : 'No disponible'}</p>
                      <p><span className="font-medium">Valor Neto a Pagar:</span> {manifiestoEjemplo.valor_flete ? `$${parseFloat(manifiestoEjemplo.valor_flete).toLocaleString()}` : 'No disponible'}</p>
                      <p><span className="font-medium">Saldo a Pagar:</span> {manifiestoEjemplo.valor_flete ? `$${parseFloat(manifiestoEjemplo.valor_flete).toLocaleString()}` : 'No disponible'}</p>
                      <p><span className="font-medium">Valor Anticipo:</span> {manifiestoEjemplo.valor_anticipo ? `$${parseFloat(manifiestoEjemplo.valor_anticipo).toLocaleString()}` : '$0'}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Términos de Pago</h4>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Lugar de Pago:</span> {manifiestoEjemplo.lugar_pago || 'No disponible'}</p>
                      <p><span className="font-medium">Fecha de Pago:</span> {manifiestoEjemplo.fecha_pago ? new Date(manifiestoEjemplo.fecha_pago).toLocaleDateString() : 'No disponible'}</p>
                      <p><span className="font-medium">Cargue pagado por:</span> {manifiestoEjemplo.cargue_pagado_por || 'DESTINATARIO'}</p>
                      <p><span className="font-medium">Descargue pagado por:</span> {manifiestoEjemplo.descargue_pagado_por || 'DESTINATARIO'}</p>
                    </div>
                  </div>
                </div>

                {/* Información Básica del Manifiesto */}
                <div>
                  <h4 className="font-semibold mb-2">Información Básica del Manifiesto</h4>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <p><span className="font-medium">Número Manifiesto:</span> {manifiestoEjemplo.numero_manifiesto}</p>
                    <p><span className="font-medium">Consecutivo Remesa:</span> {manifiestoEjemplo.consecutivo_remesa}</p>
                    <p><span className="font-medium">Placa:</span> {manifiestoEjemplo.placa}</p>
                    <p><span className="font-medium">Fecha Expedición:</span> {new Date(manifiestoEjemplo.fecha_expedicion).toLocaleDateString()}</p>
                    <p><span className="font-medium">Estado:</span> {manifiestoEjemplo.estado || 'No disponible'}</p>
                    <p><span className="font-medium">ID:</span> {manifiestoEjemplo.id}</p>
                    <p><span className="font-medium">ID Ingreso RNDC:</span> {manifiestoEjemplo.ingreso_id || 'No disponible'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Selecciona un manifiesto para ver sus datos</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestPDFPlantilla;