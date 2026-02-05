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
  codigo?: string
}

interface TransporteInternoFormProps {
  initialData?: Record<string, unknown>
  onSubmit?: (data: Record<string, unknown>) => void
  onCancel?: () => void
  isSubmitting?: boolean
  choferes?: SelectOption[]
  placas?: SelectOption[]
  clientes?: SelectOption[]
}

function getISOWeek(date: Date): number {
  const tmpDate = new Date(date.valueOf())
  const dayNumber = (tmpDate.getDay() + 6) % 7
  tmpDate.setDate(tmpDate.getDate() - dayNumber + 3)
  const firstThursday = tmpDate.valueOf()
  tmpDate.setMonth(0, 1)
  if (tmpDate.getDay() !== 4) {
    tmpDate.setMonth(0, 1 + ((4 - tmpDate.getDay()) + 7) % 7)
  }
  return 1 + Math.ceil((firstThursday - tmpDate.valueOf()) / 604800000)
}

export function TransporteInternoForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting: isSubmittingProp,
  choferes: choferesProp,
  placas: placasProp,
  clientes: clientesProp,
}: TransporteInternoFormProps) {
  const isControlled = !!onSubmit
  const [loading, setLoading] = useState(false)
  const [loadingOptions, setLoadingOptions] = useState(!choferesProp || !placasProp || !clientesProp)
  const [choferes, setChoferes] = useState<SelectOption[]>(choferesProp || [])
  const [placas, setPlacas] = useState<SelectOption[]>(placasProp || [])
  const [clientes, setClientes] = useState<SelectOption[]>(clientesProp || [])

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split("T")[0],
    numero_semana: getISOWeek(new Date()),
    chofer_id: "",
    placa_id: "",
    cliente_id: "",
    diesel: "",
    ingreso: "",
  })

  const supabase = createClient()

  useEffect(() => {
    if (initialData) {
      const fecha = (initialData.fecha as string) || new Date().toISOString().split("T")[0]
      const fechaDate = new Date(fecha)
      
      setFormData({
        fecha: fecha,
        numero_semana: (initialData.numero_semana as number) || getISOWeek(fechaDate),
        chofer_id: String(initialData.chofer_id || ""),
        placa_id: String(initialData.placa_id || ""),
        cliente_id: String(initialData.cliente_id || ""),
        diesel: String(initialData.diesel || ""),
        ingreso: String(initialData.ingreso || ""),
      })
    }
  }, [initialData])

  const fetchOptions = useCallback(async () => {
    if (choferesProp && placasProp && clientesProp) {
      return
    }

    setLoadingOptions(true)
    const [
      { data: choferesData },
      { data: placasData },
      { data: clientesData },
    ] = await Promise.all([
      choferesProp ? Promise.resolve({ data: choferesProp }) : 
        supabase.from("choferes").select("id, nombre").eq("activo", true).order("nombre"),
      placasProp ? Promise.resolve({ data: placasProp }) : 
        supabase.from("placas").select("id, codigo").eq("activo", true).order("codigo"),
      clientesProp ? Promise.resolve({ data: clientesProp }) : 
        supabase.from("clientes").select("id, nombre").eq("activo", true).order("nombre"),
    ])

    if (!choferesProp) setChoferes(choferesData ?? [])
    if (!placasProp) setPlacas(placasData ?? [])
    if (!clientesProp) setClientes(clientesData ?? [])
    setLoadingOptions(false)
  }, [supabase, choferesProp, placasProp, clientesProp])

  useEffect(() => {
    fetchOptions()
  }, [fetchOptions])

  const handleFechaChange = (fecha: string) => {
    const date = new Date(fecha)
    const weekNumber = getISOWeek(date)
    setFormData(prev => ({
      ...prev,
      fecha,
      numero_semana: weekNumber,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const dataToSubmit = {
      fecha: formData.fecha,
      numero_semana: formData.numero_semana,
      chofer_id: Number(formData.chofer_id),
      placa_id: Number(formData.placa_id),
      cliente_id: Number(formData.cliente_id),
      diesel: Number(formData.diesel) || 0,
      ingreso: Number(formData.ingreso) || 0,
    }

    if (isControlled && onSubmit) {
      onSubmit(dataToSubmit)
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from("transporte_interno").insert(dataToSubmit)
      if (error) throw error

      toast.success("Transporte interno guardado exitosamente")
      
      // Reset form
      setFormData({
        fecha: new Date().toISOString().split("T")[0],
        numero_semana: getISOWeek(new Date()),
        chofer_id: "",
        placa_id: "",
        cliente_id: "",
        diesel: "",
        ingreso: "",
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
          <CardTitle>Nuevo Transporte Interno</CardTitle>
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
          {initialData ? "Editar Transporte Interno" : "Nuevo Transporte Interno"}
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
                required
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

          {/* Fila 2: Chofer, Placa, Cliente */}
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
              <Label htmlFor="cliente" className="whitespace-nowrap">Cliente</Label>
              <SearchableSelect
                options={clientes.map((c) => ({ value: c.id.toString(), label: c.nombre || "" }))}
                value={formData.cliente_id}
                onChange={(value) => setFormData(prev => ({ ...prev, cliente_id: value }))}
                placeholder="Seleccione cliente..."
                emptyText="No se encontró el cliente"
              />
            </div>
          </div>

          {/* Fila 3: Diesel, Ingreso */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="diesel" className="whitespace-nowrap">Diesel (₡)</Label>
              <Input
                id="diesel"
                type="number"
                step="0.01"
                min="0"
                value={formData.diesel}
                onChange={(e) => setFormData(prev => ({ ...prev, diesel: e.target.value }))}
                placeholder="Gasto en diesel"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ingreso" className="whitespace-nowrap">Ingreso (₡)</Label>
              <Input
                id="ingreso"
                type="number"
                step="0.01"
                min="0"
                value={formData.ingreso}
                onChange={(e) => setFormData(prev => ({ ...prev, ingreso: e.target.value }))}
                placeholder="Ingreso recibido"
                required
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
