"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Package, Truck, User, Clock, Trash2 } from "lucide-react"
import { Recepcion, COLOR_OPTIONS } from "@/types/recepcion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useState } from "react"

interface ReceptionCardProps {
  recepcion: Recepcion
  totalKilos: number
  kilosPendientes?: number
  binesTotal: number
  binesDespachados: number
  onClick: () => void
  onDelete?: (id: number) => void
}

export function ReceptionCard({
  recepcion,
  totalKilos,
  kilosPendientes = 0,
  binesTotal,
  binesDespachados,
  onClick,
  onDelete,
}: ReceptionCardProps) {
  const [showDeleteAlert, setShowDeleteAlert] = useState(false)
  const progreso = binesTotal > 0 ? (binesDespachados / binesTotal) * 100 : 0
  
  // Extraer el color base para usarlo en estilos dinámicos
  // Asumimos que color_etiqueta es una clase como "bg-red-500"
  const colorClass = recepcion.color_etiqueta || "bg-gray-500"
  const colorId = COLOR_OPTIONS.find(c => c.value === recepcion.color_etiqueta)?.id || 0

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowDeleteAlert(true)
  }

  const confirmDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onDelete) {
      onDelete(recepcion.id)
    }
    setShowDeleteAlert(false)
  }

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
      <div className={cn("h-4 w-full flex items-center px-2", colorClass)}>
        <span className="flex items-center justify-center bg-white text-[10px] font-bold h-3 w-3 rounded-full text-black leading-none">
          {colorId}
        </span>
      </div>
      
      <CardHeader className="pb-2 pt-2">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg font-bold min-h-[3.5rem] leading-tight flex items-center line-clamp-3 sm:line-clamp-2" title={recepcion.clientes?.nombre || "Sin Cliente"}>
            {recepcion.clientes?.nombre || "Sin Cliente"}
          </CardTitle>
          {recepcion.es_rechazo && (
            <Badge variant="destructive" className="text-xs shrink-0">Rechazo</Badge>
          )}
        </div>
        <div className="flex items-center text-xs text-muted-foreground gap-1 mt-1">
          <Clock className="h-3 w-3" />
          <span suppressHydrationWarning>
            {format(new Date(recepcion.fecha_creacion), "dd MMM, HH:mm", { locale: es })}
          </span>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <div className="flex flex-col">
            <span className="text-muted-foreground text-xs flex items-center gap-1">
              <User className="h-3 w-3" /> Chofer
            </span>
            <span className="font-medium truncate" title={recepcion.choferes?.nombre || "-"}>
              {recepcion.choferes?.nombre || "-"}
            </span>
          </div>
          <div className="flex flex-row sm:flex-col justify-between sm:items-end sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 mt-2 sm:mt-0">
            <span className="text-muted-foreground text-xs flex items-center gap-1 sm:hidden">
              <Package className="h-3 w-3" /> Total
            </span>
            <div className="flex flex-col items-end">
              <span className="text-muted-foreground text-xs hidden sm:flex items-center gap-1">
                <Package className="h-3 w-3" /> Total Kilos
              </span>
              <span className="font-bold text-base sm:text-lg" suppressHydrationWarning>
                {totalKilos.toLocaleString('es-CR')} kg
              </span>
              <span className="font-bold text-sm sm:text-lg whitespace-nowrap" suppressHydrationWarning>
                {kilosPendientes > 0 ? (
                  <span className="text-destructive">Faltan: {kilosPendientes.toLocaleString('es-CR')} kg</span>
                ) : (
                  <span className="invisible">Faltan: 0 kg</span>
                )}
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs border-t pt-2">
          <span className="text-muted-foreground">Tipo:</span>
          <span className="font-medium">{recepcion.tipo_pina || "IQF"}</span>
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
        
        {onDelete && recepcion.estado !== 'finalizado' && (
          <div className="border-t pt-2 mt-2">
            <Button
              variant="destructive"
              size="sm"
              className="w-full h-8 text-xs"
              onClick={handleDelete}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Eliminar
            </Button>
          </div>
        )}
      </CardContent>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta recepción?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
