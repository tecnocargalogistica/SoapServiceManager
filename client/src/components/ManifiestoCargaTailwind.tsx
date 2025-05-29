import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Manifiesto } from "@/../../shared/schema";
import logoRndc from "@assets/logo_rndc.jpg";

interface ManifiestoCargaProps {
  manifiesto: Manifiesto;
}

const ManifiestoCargaTailwind = ({ manifiesto }: ManifiestoCargaProps) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white">
      {/* Botones de acción - solo visibles en pantalla */}
      <div className="print:hidden mb-4 flex gap-2">
        <button
          onClick={handlePrint}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Imprimir / Descargar PDF
        </button>
      </div>

      {/* Documento principal */}
      <div className="p-6 bg-white border border-gray-300 text-xs font-sans max-w-7xl mx-auto print:max-w-none print:border-0 print:p-4">
        {/* Encabezado */}
        <div className="flex justify-between items-start border-b pb-4">
          {/* Logos izquierda */}
          <div className="flex flex-col space-y-2">
            <div className="bg-yellow-400 text-black text-center p-2 text-[8px] font-bold border border-black">
              🇨🇴<br />
              La movilidad<br />
              es de todos
            </div>
            <div className="bg-blue-600 text-white text-center p-1 text-[8px] font-bold border border-black">
              Mintransporte
            </div>
            <div className="bg-green-600 text-white text-center p-1 text-[7px] font-bold border border-black">
              SuperTransporte
            </div>
          </div>

          {/* Centro - Información principal */}
          <div className="text-center flex-1 mx-4">
            <h1 className="font-bold text-lg mb-2">MANIFIESTO ELECTRÓNICO DE CARGA</h1>
            <p className="font-semibold text-sm">TRANSPETROMIRA S.A.S</p>
            <p className="text-xs"><strong>Nit: 9013690938</strong></p>
            <p className="text-xs"><strong>CARRERA 3 No 5 72 barrio el Comercio</strong></p>
            <p className="text-xs"><strong>Tel: 3183118181 - 3184000500 RICAURTE NARIÑO</strong></p>
          </div>

          {/* Derecha - Disclaimer y número de manifiesto */}
          <div className="w-64 text-[6px]">
            <p className="mb-2">
              "La impresión en soporte cartular (papel) de este acto administrativo producido por medios electrónicos en cumplimiento de la ley 527 de 1999 (Artículos 6 al 13) y de la ley 962 de 2005 (Artículo 6), es una reproducción del documento original que se encuentra en formato electrónico en la Base de Datos del RNDC en el Ministerio de Transporte, cuya representación digital goza de autenticidad, integridad y no repudio"
            </p>
            <div className="text-[8px] font-bold">
              <p><strong>Manifiesto:</strong> {manifiesto.numero_manifiesto}</p>
              <p><strong>Autorización:</strong></p>
            </div>
          </div>
        </div>

        {/* Datos de fechas y tipo */}
        <div className="mt-4">
          <table className="w-full border-collapse border border-black text-[8px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-1 font-bold">FECHA DE EXPEDICIÓN</th>
                <th className="border border-black p-1 font-bold">FECHA y HORA RADICACIÓN</th>
                <th className="border border-black p-1 font-bold">TIPO DE MANIFIESTO</th>
                <th className="border border-black p-1 font-bold">ORIGEN DEL VIAJE</th>
                <th className="border border-black p-1 font-bold">DESTINO DEL VIAJE</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-1">{format(new Date(manifiesto.fecha_expedicion), "yyyy/MM/dd", { locale: es })}</td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1">{manifiesto.municipio_origen}</td>
                <td className="border border-black p-1">{manifiesto.municipio_destino}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Información del vehículo y conductores */}
        <div className="mt-4">
          <h3 className="font-bold text-[8px] bg-gray-100 p-1 border border-black">INFORMACIÓN DEL VEHÍCULO Y CONDUCTORES</h3>
          
          {/* Titular del manifiesto */}
          <table className="w-full border-collapse border border-black text-[7px] mt-1">
            <tbody>
              <tr>
                <td className="border border-black p-1 bg-gray-50 font-bold w-20">TITULAR MANIFIESTO</td>
                <td className="border border-black p-1" colSpan={2}></td>
                <td className="border border-black p-1 bg-gray-50 font-bold">DOCUMENTO<br />IDENTIFICACIÓN</td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1 bg-gray-50 font-bold">DIRECCIÓN</td>
                <td className="border border-black p-1" colSpan={2}></td>
                <td className="border border-black p-1 bg-gray-50 font-bold">TELÉFONOS</td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1 bg-gray-50 font-bold">CIUDAD</td>
                <td className="border border-black p-1"></td>
              </tr>
            </tbody>
          </table>

          {/* Información del vehículo */}
          <table className="w-full border-collapse border border-black text-[7px]">
            <tbody>
              <tr>
                <td className="border border-black p-1 bg-gray-50 font-bold">PLACA</td>
                <td className="border border-black p-1 font-bold">{manifiesto.placa}</td>
                <td className="border border-black p-1 bg-gray-50 font-bold">MARCA</td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1 bg-gray-50 font-bold">PLACA SEMIREMOLQUE</td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1 bg-gray-50 font-bold">PLACA SEMIREMOL 2</td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1 bg-gray-50 font-bold">CONFIGURACIÓN</td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1 bg-gray-50 font-bold">PesoVacío</td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1 bg-gray-50 font-bold">PesoVacíoRemolque</td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1 bg-gray-50 font-bold">COMPAÑÍA SEGUROS SOAT</td>
                <td className="border border-black p-1" colSpan={2}></td>
                <td className="border border-black p-1 bg-gray-50 font-bold">No PÓLIZA</td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1 bg-gray-50 font-bold">F.Vencimiento SOAT</td>
                <td className="border border-black p-1"></td>
              </tr>
            </tbody>
          </table>

          {/* Conductor principal */}
          <table className="w-full border-collapse border border-black text-[7px]">
            <tbody>
              <tr>
                <td className="border border-black p-1 bg-gray-50 font-bold">CONDUCTOR</td>
                <td className="border border-black p-1" colSpan={3}></td>
                <td className="border border-black p-1 bg-gray-50 font-bold">DOCUMENTO IDENTIFICACIÓN</td>
                <td className="border border-black p-1">{manifiesto.conductor_id}</td>
                <td className="border border-black p-1 bg-gray-50 font-bold">DIRECCIÓN</td>
                <td className="border border-black p-1" colSpan={2}></td>
                <td className="border border-black p-1 bg-gray-50 font-bold">TELÉFONOS</td>
                <td className="border border-black p-1">0.0</td>
                <td className="border border-black p-1 bg-gray-50 font-bold">No de LICENCIA</td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1 bg-gray-50 font-bold">CIUDAD CONDUCTOR</td>
                <td className="border border-black p-1"></td>
              </tr>
            </tbody>
          </table>

          {/* Conductor 2 y Poseedor */}
          <table className="w-full border-collapse border border-black text-[7px]">
            <tbody>
              <tr>
                <td className="border border-black p-1 bg-gray-50 font-bold">CONDUCTOR Nro. 2</td>
                <td className="border border-black p-1" colSpan={3}></td>
                <td className="border border-black p-1 bg-gray-50 font-bold">DOCUMENTO IDENTIFICACIÓN</td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1 bg-gray-50 font-bold">DIRECCIÓN CONDUCTOR 2</td>
                <td className="border border-black p-1" colSpan={2}></td>
                <td className="border border-black p-1 bg-gray-50 font-bold">TELÉFONOS</td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1 bg-gray-50 font-bold">No de LICENCIA</td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1 bg-gray-50 font-bold">CIUDAD CONDUCTOR 2</td>
                <td className="border border-black p-1"></td>
              </tr>
              <tr>
                <td className="border border-black p-1 bg-gray-50 font-bold">POSEEDOR O TENEDOR VEHÍCULO</td>
                <td className="border border-black p-1" colSpan={3}></td>
                <td className="border border-black p-1 bg-gray-50 font-bold">DOCUMENTO IDENTIFICACIÓN</td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1 bg-gray-50 font-bold">DIRECCIÓN</td>
                <td className="border border-black p-1" colSpan={2}></td>
                <td className="border border-black p-1 bg-gray-50 font-bold">TELÉFONOS</td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1 bg-gray-50 font-bold"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1 bg-gray-50 font-bold">CIUDAD</td>
                <td className="border border-black p-1"></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Información de la mercancía */}
        <div className="mt-4">
          <h3 className="font-bold text-[8px] bg-gray-100 p-1 border border-black">INFORMACIÓN DE LA MERCANCÍA TRANSPORTADA</h3>
          <table className="w-full border-collapse border border-black text-[7px]">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-1 font-bold">Nro. Remesa</th>
                <th className="border border-black p-1 font-bold">Unidad Medida</th>
                <th className="border border-black p-1 font-bold">Cantidad</th>
                <th className="border border-black p-1 font-bold">Naturaleza</th>
                <th className="border border-black p-1 font-bold">Empaque</th>
                <th className="border border-black p-1 font-bold">Producto Transportado</th>
                <th className="border border-black p-1 font-bold">Información Remitente / Lugar Cargue</th>
                <th className="border border-black p-1 font-bold">Información Destinatario / Lugar Descargue</th>
                <th className="border border-black p-1 font-bold">Dueño Póliza</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-black p-1">{manifiesto.consecutivo_remesa}</td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1">C<br />Paquetes.<br />Permiso INVIAS:<br />ALIMENTOPARAAVESDECORRAL</td>
                <td className="border border-black p-1">002309</td>
                <td className="border border-black p-1">ALIMENTOPARAAVESDECORRAL</td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1"></td>
                <td className="border border-black p-1">No existe póliza</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Valores y observaciones */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          {/* Valores */}
          <div>
            <h4 className="font-bold text-center text-[8px] bg-gray-100 p-1 border border-black">VALORES</h4>
            <table className="w-full border-collapse border border-black text-[7px]">
              <tbody>
                <tr>
                  <td className="border border-black p-1 bg-gray-50 font-bold">VALOR TOTAL DEL VIAJE</td>
                  <td className="border border-black p-1"></td>
                </tr>
                <tr>
                  <td className="border border-black p-1 bg-gray-50 font-bold">RETENCIÓN EN LA FUENTE</td>
                  <td className="border border-black p-1"></td>
                </tr>
                <tr>
                  <td className="border border-black p-1 bg-gray-50 font-bold">RETENCIÓN ICA</td>
                  <td className="border border-black p-1"></td>
                </tr>
                <tr>
                  <td className="border border-black p-1 bg-gray-50 font-bold">VALOR NETO A PAGAR</td>
                  <td className="border border-black p-1"></td>
                </tr>
                <tr>
                  <td className="border border-black p-1 bg-gray-50 font-bold">VALOR ANTICIPO</td>
                  <td className="border border-black p-1">0.00</td>
                </tr>
                <tr>
                  <td className="border border-black p-1 bg-gray-50 font-bold">SALDO A PAGAR</td>
                  <td className="border border-black p-1"></td>
                </tr>
              </tbody>
            </table>
            <div className="text-[6px] mt-2 p-2 border border-black">
              <strong>VALOR TOTAL DEL VIAJE EN LETRAS:</strong> SETECIENTOS SESENTA Y CINCO MIL SEISCIENTOS OCHENTA Y CUATRO PESOS
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <h4 className="font-bold text-center text-[8px] bg-gray-100 p-1 border border-black">OBSERVACIONES</h4>
            <table className="w-full border-collapse border border-black text-[7px] mb-2">
              <tbody>
                <tr>
                  <td className="border border-black p-1 bg-gray-50 font-bold">LUGAR<br />DE PAGO</td>
                  <td className="border border-black p-1">BOGOTA BOGOTA<br />D. C.</td>
                  <td className="border border-black p-1 bg-gray-50 font-bold">FECHA</td>
                  <td className="border border-black p-1"></td>
                </tr>
              </tbody>
            </table>
            <div className="border border-black mb-2 p-2">
              <div className="font-bold text-center text-[6px] mb-2">CARGUE PAGADO POR</div>
              <div className="text-center font-bold">DESTINATARIO</div>
            </div>
            <div className="border border-black p-2">
              <div className="font-bold text-center text-[6px] mb-2">DESCARGUE PAGADO POR</div>
              <div className="text-center font-bold">DESTINATARIO</div>
            </div>
          </div>
        </div>

        {/* Pie de página */}
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="text-[6px]">
            <strong>Si es víctima de algún fraude o conoce de alguna irregularidad en el Registro Nacional de Despachos de Carga RNDC denúncielo a la Superintendencia de Puertos y Transporte, en la línea gratuita nacional 018000 915615 y a través del correo electrónico: atencionciudadano@supertransporte.gov.co</strong>
          </div>
          <div className="text-center">
            <div className="text-[6px] font-bold mb-4">
              Firma y Huella TITULAR MANIFIESTO o ACEPTACIÓN DIGITAL
            </div>
            <div className="border-b border-black h-6 mb-4"></div>
            <div className="text-[6px] font-bold mb-4">
              Firma y Huella del CONDUCTOR o ACEPTACIÓN DIGITAL
            </div>
            <div className="border-b border-black h-6"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManifiestoCargaTailwind;