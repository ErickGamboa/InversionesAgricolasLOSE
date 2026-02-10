"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Plus, Save, X } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"

interface SelectOption {
  id: number
  nombre?: string
}

interface VentasPlantasFormProps {
  initialData?: Record<string, unknown>
  onSubmit?: (data: Record<string, unknown>) => void
  onCancel?: () => void
  isSubmitting?: boolean
  plantas?: SelectOption[]
  choferes?: SelectOption[]
}

function getWeekNumber(date: Date): number {
  const year = date.getFullYear()
  const startOfYear = new Date(year, 0, 1)
  const dayOfWeek = startOfYear.getDay() // 0=domingo, 1=lunes, ..., 6=sábado
  
  // Encontrar el domingo de inicio de la semana 1
  // Si 1 enero es domingo (0), empieza el 1 de enero
  // Si 1 enero es lunes (1), empieza el 31 de diciembre (1 día antes)
  // Si 1 enero es martes (2), empieza el 30 de diciembre (2 días antes)
  const daysToSubtract = dayOfWeek === 0 ? 0 : dayOfWeek
  const week1Start = new Date(year, 0, 1 - daysToSubtract)
  
  // Si la fecha es anterior al inicio de la semana 1, calcular del año anterior
  if (date < week1Start) {
    return getWeekNumber(new Date(year - 1, 11, 31))
  }
  
  // Días transcurridos desde el inicio de la semana 1
  const diffTime = date.getTime() - week1Start.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  // Calcular número de semana (1-indexed)
  return Math.floor(diffDays / 7) + 1
}

// Función para obtener la fecha local en formato YYYY-MM-DD (corrige bug de timezone)
function getLocalDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function VentasPlantasForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting: isSubmittingProp,
  plantas: plantasProp,
  choferes: choferesProp,
}: VentasPlantasFormProps) {
  const isControlled = !!onSubmit
  const [loading, setLoading] = useState(false)
  const [loadingOptions, setLoadingOptions] = useState(!plantasProp || !choferesProp)
  const [plantas, setPlantas] = useState<SelectOption[]>(plantasProp || [])
  const [choferes, setChoferes] = useState<SelectOption[]>(choferesProp || [])

  const [formData, setFormData] = useState({
    fecha: getLocalDateString(new Date()),
    numero_semana: getWeekNumber(new Date()),
    planta_id: "",
    chofer_id: "",
    numero_boleta: "",
    nb_tickete: "",
    tipo_pina: "",
    kilos_reportados: "",
    porcentaje_castigo: "0",
    precio_iqf: "",
    precio_jugo: "",
    pago_dolares: true,
  })

  const supabase = createClient()

  // Efecto para inicializar datos de edición
  useEffect(() => {
    if (initialData) {
      const fecha = (initialData.fecha as string) || getLocalDateString(new Date())
      const fechaDate = new Date(fecha)
      
      setFormData({
        fecha: fecha,
        numero_semana: initialData.numero_semana as number || getWeekNumber(fechaDate),
        planta_id: String(initialData.planta_id || ""),
        chofer_id: String(initialData.chofer_id || ""),
        numero_boleta: String(initialData.numero_boleta || ""),
        nb_tickete: String(initialData.nb_tickete || ""),
        tipo_pina: String(initialData.tipo_pina || ""),
        kilos_reportados: String(initialData.kilos_reportados || ""),
        porcentaje_castigo: String(initialData.porcentaje_castigo || "0"),
        precio_iqf: String(initialData.precio_iqf || ""),
        precio_jugo: String(initialData.precio_jugo || ""),
        pago_dolares: (initialData.pago_dolares as boolean) ?? true,
      })
    }
  }, [initialData])

  // Cargar opciones de mantenimientos
  const fetchOptions = useCallback(async () => {
    if (plantasProp && choferesProp) {
      return
    }

    setLoadingOptions(true)
    const [
      { data: plantasData },
      { data: choferesData },
    ] = await Promise.all([
      plantasProp ? Promise.resolve({ data: plantasProp }) : 
        supabase.from("plantas").select("id, nombre").eq("activo", true).order("nombre"),
      choferesProp ? Promise.resolve({ data: choferesProp }) : 
        supabase.from("choferes").select("id, nombre").eq("activo", true).order("nombre"),
    ])

    if (!plantasProp) setPlantas(plantasData ?? [])
    if (!choferesProp) setChoferes(choferesData ?? [])
    setLoadingOptions(false)
  }, [supabase, plantasProp, choferesProp])

  useEffect(() => {
    fetchOptions()
  }, [fetchOptions])

  // Actualizar número de semana cuando cambia la fecha
  const handleFechaChange = (fecha: string) => {
    // Crear fecha ajustando para timezone local
    const [year, month, day] = fecha.split('-').map(Number)
    const date = new Date(year, month - 1, day) // Mes es 0-indexed
    const weekNumber = getWeekNumber(date)
    setFormData(prev => ({
      ...prev,
      fecha,
      numero_semana: weekNumber,
    }))
  }

  // Cálculos
  const kilosReportados = Number(formData.kilos_reportados) || 0
  const porcentajeCastigo = Number(formData.porcentaje_castigo) || 0
  const castigoKilos = (porcentajeCastigo / 100) * kilosReportados
  const totalKilos = kilosReportados - castigoKilos
  
  const precioIQF = Number(formData.precio_iqf) || 0
  const precioJugo = Number(formData.precio_jugo) || 0
  
  // Total a pagar castigo usa el precio de jugo si es IQF y hay castigo
  const totalPagarCastigo = castigoKilos > 0
    ? (formData.tipo_pina === "IQF" || formData.tipo_pina === "Jugo")
      ? castigoKilos * precioJugo
      : 0
    : 0
  
  const totalPagarPina = formData.tipo_pina === "Jugo"
    ? totalKilos * precioJugo
    : formData.tipo_pina === "IQF"
    ? totalKilos * precioIQF
    : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const dataToSubmit = {
      fecha: formData.fecha,
      numero_semana: formData.numero_semana,
      planta_id: Number(formData.planta_id),
      chofer_id: Number(formData.chofer_id),
      numero_boleta: formData.numero_boleta || null,
      nb_tickete: formData.nb_tickete || null,
      tipo_pina: formData.tipo_pina,
      kilos_reportados: kilosReportados,
      porcentaje_castigo: porcentajeCastigo,
      castigo_kilos: castigoKilos,
      total_kilos: totalKilos,
      precio_iqf: formData.tipo_pina === "IQF" ? precioIQF : null,
      precio_jugo: (formData.tipo_pina === "Jugo" || formData.tipo_pina === "IQF") ? precioJugo : null,
      total_pagar_castigo: totalPagarCastigo,
      total_pagar_pina: totalPagarPina,
      pago_dolares: true,
    }

    if (isControlled && onSubmit) {
      onSubmit(dataToSubmit)
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from("ventas_plantas").insert(dataToSubmit)
      if (error) throw error

      toast.success("Venta guardada exitosamente")
      
      // Reset form
      setFormData({
        fecha: getLocalDateString(new Date()),
        numero_semana: getWeekNumber(new Date()),
        planta_id: "",
        chofer_id: "",
        numero_boleta: "",
        nb_tickete: "",
        tipo_pina: "",
        kilos_reportados: "",
        porcentaje_castigo: "0",
        precio_iqf: "",
        precio_jugo: "",
        pago_dolares: true,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido"
      toast.error(`Error: ${message}`)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (num: number) =>
    num.toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const isSubmittingState = isSubmittingProp || loading

  if (loadingOptions) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nueva Venta a Planta</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Spinner size="lg" text="Cargando formulario..." />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          {initialData ? "Editar Venta" : "Nueva Venta a Planta"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Fila 1: Fecha, Semana, Planta */}
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="fecha" className="whitespace-nowrap">Fecha</Label>
              <Input
                id="fecha"
                type="date"
                value={formData.fecha}
                onChange={(e) => handleFechaChange(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numero_semana" className="whitespace-nowrap">Número de Semana</Label>
              <Input
                id="numero_semana"
                type="number"
                value={formData.numero_semana}
                disabled
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="planta" className="whitespace-nowrap">Planta</Label>
              <SearchableSelect
                options={plantas.map((p) => ({ value: p.id.toString(), label: p.nombre || "" }))}
                value={formData.planta_id}
                onChange={(value) => setFormData(prev => ({ ...prev, planta_id: value }))}
                placeholder="Seleccione planta..."
                emptyText="No se encontró la planta"
              />
            </div>
          </div>

           {/* Indicador de Moneda */}
          <div className="flex items-center space-x-2 bg-blue-50 p-3 rounded-md border border-blue-100">
            <input 
              type="checkbox" 
              checked={true} 
              disabled 
              className="h-4 w-4 text-blue-600"
            />
            <Label className="text-sm font-medium text-blue-800">
              Todas las ventas a plantas se realizan en Dólares ($)
            </Label>
          </div>

           {/* Fila 2: Chofer, Boleta, Ticket */}
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="chofer" className="whitespace-nowrap">Chofer</Label>
              <SearchableSelect
                options={choferes.map((c) => ({ value: c.id.toString(), label: c.nombre || "" }))}
                value={formData.chofer_id}
                onChange={(value) => setFormData(prev => ({ ...prev, chofer_id: value }))}
                placeholder="Seleccione chofer..."
                emptyText="No se encontró el chofer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numero_boleta" className="whitespace-nowrap">Número de Boleta</Label>
              <Input
                id="numero_boleta"
                value={formData.numero_boleta}
                onChange={(e) => setFormData(prev => ({ ...prev, numero_boleta: e.target.value }))}
                placeholder="Ingrese número"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nb_tickete" className="whitespace-nowrap">NB / Tickete</Label>
              <Input
                id="nb_tickete"
                value={formData.nb_tickete}
                onChange={(e) => setFormData(prev => ({ ...prev, nb_tickete: e.target.value }))}
                placeholder="Ingrese ticket"
              />
            </div>
          </div>

          {/* Fila 3: Tipo de Piña, Kilos Reportados, % Castigo */}
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="tipo_pina" className="whitespace-nowrap">Tipo de Piña</Label>
              <Select
                key={`tipo-pina-${formData.tipo_pina}`}
                value={formData.tipo_pina}
                onValueChange={(value) => setFormData(prev => ({ ...prev, tipo_pina: value }))}
              >
                <SelectTrigger id="tipo_pina">
                  <SelectValue placeholder="Seleccione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IQF">IQF</SelectItem>
                  <SelectItem value="Jugo">Jugo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="kilos_reportados" className="whitespace-nowrap">Kilos Reportados</Label>
              <Input
                id="kilos_reportados"
                type="number"
                step="0.01"
                min="0"
                value={formData.kilos_reportados}
                onChange={(e) => setFormData(prev => ({ ...prev, kilos_reportados: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="porcentaje_castigo" className="whitespace-nowrap">% de Castigo</Label>
              <Input
                id="porcentaje_castigo"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.porcentaje_castigo}
                onChange={(e) => setFormData(prev => ({ ...prev, porcentaje_castigo: e.target.value }))}
              />
            </div>
          </div>

          {/* Fila 4: Precios condicionales */}
          <div className="grid gap-6 sm:grid-cols-2">
            {formData.tipo_pina === "IQF" && (
              <div className="space-y-2">
                <Label htmlFor="precio_iqf" className="whitespace-nowrap">Precio IQF ($)</Label>
                <Input
                id="precio_iqf"
                type="number"
                step="0.01"
                min="0"
                value={formData.precio_iqf}
                onChange={(e) => setFormData(prev => ({ ...prev, precio_iqf: e.target.value }))}
              />
              </div>
            )}

            {(formData.tipo_pina === "Jugo" || formData.tipo_pina === "IQF") && (
              <div className="space-y-2">
                <Label htmlFor="precio_jugo" className="whitespace-nowrap">Precio Jugo ($)</Label>
                <Input
                id="precio_jugo"
                type="number"
                step="0.01"
                min="0"
                value={formData.precio_jugo}
                onChange={(e) => setFormData(prev => ({ ...prev, precio_jugo: e.target.value }))}
              />
              </div>
            )}
          </div>

          {/* Sección de Cálculos */}
          <div className="border rounded-lg p-4 bg-muted/50 space-y-4">
            <h3 className="font-semibold text-sm">Resumen de Cálculos</h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">Castigo (kg)</Label>
                <div className="flex h-9 items-center rounded-md border bg-background px-3 text-sm font-medium overflow-hidden">
                  <span className="truncate">{castigoKilos.toLocaleString("es-CR", { minimumFractionDigits: 2 })} kg</span>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">Total Kilos</Label>
                <div className="flex h-9 items-center rounded-md border bg-background px-3 text-sm font-medium overflow-hidden">
                  <span className="truncate">{totalKilos.toLocaleString("es-CR", { minimumFractionDigits: 2 })} kg</span>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">Total a Pagar Castigo</Label>
                <div className="flex h-9 items-center rounded-md border bg-background px-3 text-sm font-medium overflow-hidden">
                  <span className="truncate">${formatCurrency(totalPagarCastigo)}</span>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">Total a Pagar Piña</Label>
                <div className="flex h-9 items-center rounded-md border bg-primary/10 px-3 text-sm font-bold text-primary overflow-hidden">
                  <span className="truncate">${formatCurrency(totalPagarPina)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
            )}
            <Button type="submit" disabled={isSubmittingState}>
              {isSubmittingState ? (
                <Spinner size="sm" showText={false} />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Guardar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
