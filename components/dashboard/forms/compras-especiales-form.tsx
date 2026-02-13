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

interface ComprasEspecialesFormProps {
  initialData?: Record<string, unknown>
  onSubmit?: (data: Record<string, unknown>) => void
  onCancel?: () => void
  isSubmitting?: boolean
  clientes?: SelectOption[]
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

// Función para formatear a 3 decimales exactos sin redondeo
const formatTo3Decimals = (value: unknown): string => {
  if (!value && value !== 0) return ""
  const num = new Decimal(value.toString())
  return num.toFixed(3, Decimal.ROUND_DOWN) // Trunca a 3 decimales, no redondea
}

export function ComprasEspecialesForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting: isSubmittingProp,
  clientes: clientesProp,
  choferes: choferesProp,
}: ComprasEspecialesFormProps) {
  const isControlled = !!onSubmit
  const [loading, setLoading] = useState(false)
  const [loadingOptions, setLoadingOptions] = useState(!clientesProp || !choferesProp)
  const [clientes, setClientes] = useState<SelectOption[]>(clientesProp || [])
  const [choferes, setChoferes] = useState<SelectOption[]>(choferesProp || [])

  const [formData, setFormData] = useState({
    fecha: getLocalDateString(new Date()),
    numero_semana: getWeekNumber(new Date()),
    procedencia: "",
    cliente_id: "",
    lote: "",
    numero_boleta: "",
    chofer_id: "",
    placa: "",
    numero_cajas: "",
    pinas_por_caja: "",
    total_kilos: "",
    precio_por_kilo: "",
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
        procedencia: String(initialData.procedencia || ""),
        cliente_id: String(initialData.cliente_id || ""),
        lote: String(initialData.lote || ""),
        numero_boleta: String(initialData.numero_boleta || ""),
        chofer_id: String(initialData.chofer_id || ""),
        placa: String(initialData.placa || ""),
        numero_cajas: String(initialData.numero_cajas || ""),
        pinas_por_caja: String(initialData.pinas_por_caja || ""),
        total_kilos: formatTo3Decimals(initialData.total_kilos),
        precio_por_kilo: formatTo3Decimals(initialData.precio_por_kilo),
        pagado: (initialData.pagado as boolean) || false,
      })
    }
  }, [initialData])

  const fetchOptions = useCallback(async () => {
    if (clientesProp && choferesProp) {
      return
    }

    setLoadingOptions(true)
    const [
      { data: clientesData },
      { data: choferesData },
    ] = await Promise.all([
      clientesProp ? Promise.resolve({ data: clientesProp }) : 
        supabase.from("clientes").select("id, nombre").eq("activo", true).order("nombre"),
      choferesProp ? Promise.resolve({ data: choferesProp }) : 
        supabase.from("choferes").select("id, nombre").eq("activo", true).eq("tipo", "externo").order("nombre"),
    ])

    if (!clientesProp) setClientes(clientesData ?? [])
    if (!choferesProp) setChoferes(choferesData ?? [])
    setLoadingOptions(false)
  }, [supabase, clientesProp, choferesProp])

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
  const numeroCajas = Number(formData.numero_cajas) || 0
  const pinasPorCaja = Number(formData.pinas_por_caja) || 0
  const totalPinas = numeroCajas * pinasPorCaja
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
      procedencia: formData.procedencia || null,
      cliente_id: Number(formData.cliente_id),
      lote: formData.lote || null,
      numero_boleta: formData.numero_boleta || null,
      chofer_id: Number(formData.chofer_id),
      placa: formData.placa || null,
      numero_cajas: numeroCajas,
      pinas_por_caja: pinasPorCaja,
      total_pinas: totalPinas,
      total_kilos: totalKilos,
      precio_por_kilo: precioPorKilo,
      total_a_pagar: totalAPagar,
      pagado: formData.pagado,
    }

    if (isControlled && onSubmit) {
      onSubmit(dataToSubmit)
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from("compras_especiales").insert(dataToSubmit)
      if (error) throw error

      toast.success("Compra especial guardada exitosamente")
      
      // Reset form
      setFormData({
        fecha: getLocalDateString(new Date()),
        numero_semana: getWeekNumber(new Date()),
        procedencia: "",
        cliente_id: "",
        lote: "",
        numero_boleta: "",
        chofer_id: "",
        placa: "",
        numero_cajas: "",
        pinas_por_caja: "",
        total_kilos: "",
        precio_por_kilo: "",
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
          <CardTitle>Nueva Compra Especial</CardTitle>
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
          {initialData ? "Editar Compra Especial" : "Nueva Compra Especial"}
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

          {/* Fila 2: Procedencia, Cliente, Lote */}
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="procedencia" className="whitespace-nowrap">Procedencia</Label>
              <Select
                value={formData.procedencia}
                onValueChange={(value) => setFormData(prev => ({ ...prev, procedencia: value }))}
              >
                <SelectTrigger id="procedencia">
                  <SelectValue placeholder="Seleccione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="campo">Campo</SelectItem>
                  <SelectItem value="planta">Planta</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cliente" className="whitespace-nowrap">Cliente</Label>
              <SearchableSelect
                options={clientes.map((c) => ({ value: c.id.toString(), label: c.nombre || "" }))}
                value={formData.cliente_id}
                onChange={(value) => setFormData(prev => ({ ...prev, cliente_id: value }))}
                placeholder="Seleccione cliente..."
                emptyText="No se encontró el cliente"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lote" className="whitespace-nowrap">Lote</Label>
              <Input
                id="lote"
                value={formData.lote}
                onChange={(e) => setFormData(prev => ({ ...prev, lote: e.target.value }))}
                placeholder="Ingrese lote"
              />
            </div>
          </div>

          {/* Fila 3: Boleta, Chofer, Placa */}
          <div className="grid gap-6 sm:grid-cols-3">
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
              <Input
                id="placa"
                value={formData.placa}
                onChange={(e) => setFormData(prev => ({ ...prev, placa: e.target.value }))}
                placeholder="Ingrese placa"
              />
            </div>
          </div>

          {/* Fila 4: Cajas, Piñas por caja, Total piñas (calculado) */}
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="numero_cajas" className="whitespace-nowrap">Número de Cajas</Label>
              <Input
                id="numero_cajas"
                type="number"
                min="0"
                value={formData.numero_cajas}
                onChange={(e) => setFormData(prev => ({ ...prev, numero_cajas: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pinas_por_caja" className="whitespace-nowrap">Piñas por Caja</Label>
              <Input
                id="pinas_por_caja"
                type="number"
                min="0"
                value={formData.pinas_por_caja}
                onChange={(e) => setFormData(prev => ({ ...prev, pinas_por_caja: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label className="whitespace-nowrap">Total de Piñas</Label>
              <div className="flex h-9 items-center rounded-md border bg-muted px-3 text-sm font-medium overflow-hidden">
                <span className="truncate">{totalPinas.toLocaleString("es-CR")}</span>
              </div>
            </div>
          </div>

          {/* Fila 5: Kilos, Precio, Total */}
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

            <div className="space-y-2">
              <Label className="whitespace-nowrap">Total a Pagar</Label>
              <div className="flex h-9 items-center rounded-md border bg-primary/10 px-3 text-sm font-bold text-primary overflow-hidden">
                <span className="truncate">₡{formatCurrency(totalAPagar)}</span>
              </div>
            </div>
          </div>

          {/* Check pagado */}
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
