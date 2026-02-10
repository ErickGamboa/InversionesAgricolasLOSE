"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Package, Truck, User, Clock } from "lucide-react"
import { Recepcion } from "@/types/recepcion"
import { cn } from "@/lib/utils"

interface ReceptionCardProps {
  recepcion: Recepcion
  totalKilos: number
  binesTotal: number
  binesDespachados: number
  onClick: () => void
}

export function ReceptionCard({
  recepcion,
  totalKilos,
  binesTotal,
  binesDespachados,
  onClick,
}: ReceptionCardProps) {
  const progreso = binesTotal > 0 ? (binesDespachados / binesTotal) * 100 : 0
  
  // Extraer el color base para usarlo en estilos dinámicos
  // Asumimos que color_etiqueta es una clase como "bg-red-500"
  const colorClass = recepcion.color_etiqueta || "bg-gray-500"

  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:shadow-md border-t-4 overflow-hidden",
        "hover:scale-[1.02] active:scale-[0.98]"
      )}
      style={{ borderTopColor: "var(--card-border-color)" }}
      onClick={onClick}
    >
      {/* Indicador de color visual */}
      <div className={cn("h-2 w-full", colorClass)} />
      
      <CardHeader className="pb-2 pt-4">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg font-bold line-clamp-2 min-h-[3.5rem] leading-tight flex items-center" title={recepcion.clientes?.nombre || "Sin Cliente"}>
            {recepcion.clientes?.nombre || "Sin Cliente"}
          </CardTitle>
          {recepcion.es_rechazo && (
            <Badge variant="destructive" className="text-xs shrink-0">Rechazo</Badge>
          )}
        </div>
        <div className="flex items-center text-xs text-muted-foreground gap-1 mt-1">
          <Clock className="h-3 w-3" />
          {format(new Date(recepcion.fecha_creacion), "dd MMM, HH:mm", { locale: es })}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-xs flex items-center gap-1">
              <User className="h-3 w-3" /> Chofer
            </span>
            <span className="font-medium truncate" title={recepcion.choferes?.nombre || "-"}>
              {recepcion.choferes?.nombre || "-"}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-muted-foreground text-xs flex items-center gap-1">
              <Package className="h-3 w-3" /> Total Kilos
            </span>
            <span className="font-bold text-lg">
              {totalKilos.toLocaleString('es-CR')} kg
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Despacho</span>
            <span className="font-medium">
              {binesDespachados}/{binesTotal} bines
            </span>
          </div>
          <Progress value={progreso} className="h-2" />
        </div>
      </CardContent>
    </Card>
  )
}
