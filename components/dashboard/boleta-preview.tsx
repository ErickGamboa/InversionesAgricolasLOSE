"use client"

import { BoletaRecepcion } from "@/types/boleta"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

interface BoletaPreviewProps {
  boleta: BoletaRecepcion
}

export function BoletaPreview({ boleta }: BoletaPreviewProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      dia: date.getDate().toString().padStart(2, '0'),
      mes: (date.getMonth() + 1).toString().padStart(2, '0'),
      anio: date.getFullYear().toString()
    }
  }

  const fecha = formatDate(boleta.fecha)
  
  return (
    <Card className="w-full max-w-md mx-auto bg-white border-2 border-gray-300 shadow-lg">
      <CardContent className="p-6 space-y-4">
        {/* Encabezado con Logo y Nombre */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 flex-shrink-0">
            <img 
              src="/logo-empresa.jpeg" 
              alt="Logo" 
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex-1 text-center pt-2">
            <h1 className="text-lg font-bold text-gray-900 leading-tight">
              Inversiones agricolas LOSE de Pital
            </h1>
          </div>
        </div>

        {/* Número de Boleta - ROJO */}
        <div className="text-center py-2">
          <span className="text-3xl font-bold text-red-600">
            Nº {boleta.numero_boleta.toString().padStart(6, '0')}
          </span>
        </div>

        {/* Fecha */}
        <div className="grid grid-cols-3 gap-2 text-center border-t border-b border-gray-300 py-2">
          <div>
            <div className="text-xs text-gray-500 uppercase">Día</div>
            <div className="text-lg font-semibold">{fecha.dia}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase">Mes</div>
            <div className="text-lg font-semibold">{fecha.mes}</div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase">Año</div>
            <div className="text-lg font-semibold">{fecha.anio}</div>
          </div>
        </div>

        {/* Datos Generales */}
        <div className="space-y-2 text-sm">
          <div>
            <span className="text-xs text-gray-500 uppercase block">Proveedor:</span>
            <span className="font-semibold text-base">{boleta.clientes?.nombre || "-"}</span>
          </div>
          <div>
            <span className="text-xs text-gray-500 uppercase block">Nombre Chofer:</span>
            <span className="font-semibold text-base">{boleta.choferes?.nombre || "-"}</span>
          </div>
          <div>
            <span className="text-xs text-gray-500 uppercase block">Placa:</span>
            <span className="font-semibold">{boleta.placa || "-"}</span>
          </div>
        </div>

        <Separator className="my-4" />

        {/* Sección PLANTA */}
        {boleta.tipo_boleta === 'PLANTA' && (
          <div className="space-y-3">
            <h3 className="text-center font-bold text-gray-700 uppercase text-sm border-b pb-1">
              Datos de Planta
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-gray-500 uppercase block">Número de Cajas:</span>
                <span className="font-bold text-lg">{boleta.numero_cajas || "-"}</span>
              </div>
              <div>
                <span className="text-xs text-gray-500 uppercase block">Piñas por Caja:</span>
                <span className="font-bold text-lg">{boleta.pinas_por_caja || "-"}</span>
              </div>
            </div>
            <div className="border-t border-gray-300 pt-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 uppercase">Total de Piñas:</span>
                <span className="font-bold text-xl text-gray-900">{boleta.total_pinas || "-"}</span>
              </div>
            </div>
          </div>
        )}

        {/* Sección CAMPO */}
        {boleta.tipo_boleta === 'CAMPO' && (
          <div className="space-y-3">
            <h3 className="text-center font-bold text-gray-700 uppercase text-sm border-b pb-1">
              Datos de Campo
            </h3>
             <div className="space-y-3 text-sm">
               <div className="flex justify-between items-center">
                 <span className="text-xs text-gray-500 uppercase">Cantidad de Bines:</span>
                 <span className="font-bold text-xl">{boleta.cantidad_bines || "-"}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-xs text-gray-500 uppercase">Total de Kilos:</span>
                 <span className="font-bold text-xl">{boleta.total_kilos?.toLocaleString('es-CR', {minimumFractionDigits: 3}) || "-"}</span>
               </div>
              {boleta.tipo_fruta && (
                <div className="flex justify-between items-center border-t border-gray-200 pt-2 mt-2">
                  <span className="text-xs text-gray-500 uppercase">Tipo de Fruta:</span>
                  <span className="font-bold text-2xl text-blue-600">{boleta.tipo_fruta}</span>
                </div>
              )}
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  )
}
