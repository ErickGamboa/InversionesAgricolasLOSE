"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
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
import Decimal from "decimal.js"

interface SelectOption {
  id: number
  nombre?: string
  codigo?: string
}

interface TransporteContratadoFormProps {
  initialData?: Record<string, unknown>
  onSubmit?: (data: Record<string, unknown>) => void
  onCancel?: () => void
  isSubmitting?: boolean
  choferes?: SelectOption[]
  placas?: SelectOption[]
  plantas?: SelectOption[]
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

// Función para formatear a 3 decimales exactos sin redondeo
const formatTo3Decimals = (value: unknown): string => {
  if (!value && value !== 0) return ""
  const num = new Decimal(value.toString())
  return num.toFixed(3, Decimal.ROUND_DOWN) // Trunca a 3 decimales, no redondea
}

export function TransporteContratadoForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting: isSubmittingProp,
  choferes: choferesProp,
  placas: placasProp,
  plantas: plantasProp,
}: TransporteContratadoFormProps) {
  const isControlled = !!onSubmit
  const [loading, setLoading] = useState(false)
  const [loadingOptions, setLoadingOptions] = useState(!choferesProp || !placasProp || !plantasProp)
  const [choferes, setChoferes] = useState<SelectOption[]>(choferesProp || [])
  const [placas, setPlacas] = useState<SelectOption[]>(placasProp || [])
  const [plantas, setPlantas] = useState<SelectOption[]>(plantasProp || [])

  const [formData, setFormData] = useState({
    fecha: getLocalDateString(new Date()),
    numero_semana: getWeekNumber(new Date()),
    chofer_id: "",
    placa_id: "",
    planta_id: "",
    numero_boleta: "",
    nb_tickete: "",
    total_kilos: "",
    precio_por_kilo: "",
    numero_factura: "",
    numero_deposito: "",
    pagado: false,
  })

  const supabase = createClient()

  useEffect(() => {
    if (initialData) {
      const fecha = (initialData.fecha as string) || getLocalDateString(new Date())
      const fechaDate = new Date(fecha)
      
      setFormData({
        fecha: fecha,
        numero_semana: (initialData.numero_semana as number) || getWeekNumber(fechaDate),
        chofer_id: String(initialData.chofer_id || ""),
        placa_id: String(initialData.placa_id || ""),
        planta_id: String(initialData.planta_id || ""),
        numero_boleta: String(initialData.numero_boleta || ""),
        nb_tickete: String(initialData.nb_tickete || ""),
        total_kilos: formatTo3Decimals(initialData.total_kilos),
        precio_por_kilo: formatTo3Decimals(initialData.precio_por_kilo),
        numero_factura: String(initialData.numero_factura || ""),
        numero_deposito: String(initialData.numero_deposito || ""),
        pagado: (initialData.pagado as boolean) || false,
      })
    }
  }, [initialData])

  const fetchOptions = useCallback(async () => {
    if (choferesProp && placasProp && plantasProp) {
      return
    }

    setLoadingOptions(true)
    const [
      { data: choferesData },
      { data: placasData },
      { data: plantasData },
    ] = await Promise.all([
      choferesProp ? Promise.resolve({ data: choferesProp }) : 
        supabase.from("choferes").select("id, nombre").eq("activo", true).order("nombre"),
      placasProp ? Promise.resolve({ data: placasProp }) : 
        supabase.from("placas").select("id, codigo").eq("activo", true).order("codigo"),
      plantasProp ? Promise.resolve({ data: plantasProp }) : 
        supabase.from("plantas").select("id, nombre").eq("activo", true).order("nombre"),
    ])

    if (!choferesProp) setChoferes(choferesData ?? [])
    if (!placasProp) setPlacas(placasData ?? [])
    if (!plantasProp) setPlantas(plantasData ?? [])
    setLoadingOptions(false)
  }, [supabase, choferesProp, placasProp, plantasProp])

  useEffect(() => {
    fetchOptions()
  }, [fetchOptions])

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
  const totalKilos = Number(formData.total_kilos) || 0
  const precioPorKilo = Number(formData.precio_por_kilo) || 0
  const totalAPagar = totalKilos * precioPorKilo

  const formatCurrency = (num: number) =>
    num.toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const dataToSubmit = {
      fecha: formData.fecha,
      numero_semana: formData.numero_semana,
      chofer_id: Number(formData.chofer_id),
      placa_id: Number(formData.placa_id),
      planta_id: Number(formData.planta_id),
      numero_boleta: formData.numero_boleta || null,
      nb_tickete: formData.nb_tickete || null,
      total_kilos: totalKilos,
      precio_por_kilo: precioPorKilo,
      total_a_pagar: totalAPagar,
      numero_factura: formData.numero_factura || null,
      numero_deposito: formData.numero_deposito || null,
      pagado: formData.pagado,
    }

    if (isControlled && onSubmit) {
      onSubmit(dataToSubmit)
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from("transporte_contratado").insert(dataToSubmit)
      if (error) throw error

      toast.success("Transporte contratado guardado exitosamente")
      
      // Reset form
      setFormData({
        fecha: getLocalDateString(new Date()),
        numero_semana: getWeekNumber(new Date()),
        chofer_id: "",
        placa_id: "",
        planta_id: "",
        numero_boleta: "",
        nb_tickete: "",
        total_kilos: "",
        precio_por_kilo: "",
        numero_factura: "",
        numero_deposito: "",
        pagado: false,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido"
      toast.error(`Error: ${message}`)
    } finally {
      setLoading(false)
    }
  }

  const isSubmittingState = isSubmittingProp || loading

  if (loadingOptions) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nuevo Transporte Contratado</CardTitle>
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
          {initialData ? "Editar Transporte Contratado" : "Nuevo Transporte Contratado"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Fila 1: Fecha, Semana */}
          <div className="grid gap-6 sm:grid-cols-2">
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
          </div>

          {/* Fila 2: Chofer, Placa, Planta */}
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="chofer" className="whitespace-nowrap">Chofer</Label>
              <SearchableSelect
                options={choferes.map((ch) => ({ value: ch.id.toString(), label: ch.nombre || "" }))}
                value={formData.chofer_id}
                onChange={(value) => setFormData(prev => ({ ...prev, chofer_id: value }))}
                placeholder="Seleccione chofer..."
                emptyText="No se encontró el chofer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="placa" className="whitespace-nowrap">Placa</Label>
              <SearchableSelect
                options={placas.map((p) => ({ value: p.id.toString(), label: p.codigo || "" }))}
                value={formData.placa_id}
                onChange={(value) => setFormData(prev => ({ ...prev, placa_id: value }))}
                placeholder="Seleccione placa..."
                emptyText="No se encontró la placa"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="planta" className="whitespace-nowrap">Planta</Label>
              <SearchableSelect
                options={plantas.map((pl) => ({ value: pl.id.toString(), label: pl.nombre || "" }))}
                value={formData.planta_id}
                onChange={(value) => setFormData(prev => ({ ...prev, planta_id: value }))}
                placeholder="Seleccione planta..."
                emptyText="No se encontró la planta"
              />
            </div>
          </div>

          {/* Fila 3: Boleta, Tickete */}
          <div className="grid gap-6 sm:grid-cols-2">
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

          {/* Fila 4: Kilos, Precio, Adelanto */}
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="total_kilos" className="whitespace-nowrap">Total de Kilos</Label>
              <Input
                id="total_kilos"
                type="number"
                step="0.01"
                min="0"
                value={formData.total_kilos}
                onChange={(e) => setFormData(prev => ({ ...prev, total_kilos: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="precio_por_kilo" className="whitespace-nowrap">Precio por Kilo (₡)</Label>
              <Input
                id="precio_por_kilo"
                type="number"
                step="any"
                min="0"
                value={formData.precio_por_kilo}
                onChange={(e) => setFormData(prev => ({ ...prev, precio_por_kilo: e.target.value }))}
              />
            </div>

          </div>

          {/* Sección de Totales */}
          <div className="border rounded-lg p-4 bg-muted/50 space-y-4">
            <h3 className="font-semibold text-sm">Resumen</h3>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground whitespace-nowrap">Total a Pagar</Label>
                <div className="flex h-9 items-center rounded-md border bg-primary/10 px-3 text-sm font-bold text-primary overflow-hidden">
                  <span className="truncate">₡{formatCurrency(totalAPagar)}</span>
                </div>
              </div>

              <div className="space-y-1 flex items-end pb-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="pagado"
                    checked={formData.pagado}
                    onCheckedChange={(checked) => 
                      setFormData(prev => ({ ...prev, pagado: checked as boolean }))
                    }
                  />
                  <Label htmlFor="pagado" className="whitespace-nowrap cursor-pointer">
                    Pagado
                  </Label>
                </div>
              </div>
            </div>
          </div>

          {/* Fila 5: Factura, Depósito */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="numero_factura" className="whitespace-nowrap">Número de Factura</Label>
              <Input
                id="numero_factura"
                value={formData.numero_factura}
                onChange={(e) => setFormData(prev => ({ ...prev, numero_factura: e.target.value }))}
                placeholder="Ingrese número"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numero_deposito" className="whitespace-nowrap">Número de Depósito</Label>
              <Input
                id="numero_deposito"
                value={formData.numero_deposito}
                onChange={(e) => setFormData(prev => ({ ...prev, numero_deposito: e.target.value }))}
                placeholder="Ingrese número"
              />
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
