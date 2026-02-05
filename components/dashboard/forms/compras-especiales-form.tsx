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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Plus, Save, X } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"

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
  placas?: SelectOption[]
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

export function ComprasEspecialesForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting: isSubmittingProp,
  clientes: clientesProp,
  choferes: choferesProp,
  placas: placasProp,
}: ComprasEspecialesFormProps) {
  const isControlled = !!onSubmit
  const [loading, setLoading] = useState(false)
  const [loadingOptions, setLoadingOptions] = useState(!clientesProp || !choferesProp || !placasProp)
  const [clientes, setClientes] = useState<SelectOption[]>(clientesProp || [])
  const [choferes, setChoferes] = useState<SelectOption[]>(choferesProp || [])
  const [placas, setPlacas] = useState<SelectOption[]>(placasProp || [])

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split("T")[0],
    numero_semana: getISOWeek(new Date()),
    procedencia: "",
    cliente_id: "",
    lote: "",
    numero_boleta: "",
    chofer_id: "",
    placa_id: "",
    numero_cajas: "",
    pinas_por_caja: "",
    total_kilos: "",
    precio_por_kilo: "",
    pagado: false,
  })

  const supabase = createClient()

  useEffect(() => {
    if (initialData) {
      const fecha = (initialData.fecha as string) || new Date().toISOString().split("T")[0]
      const fechaDate = new Date(fecha)
      
      setFormData({
        fecha: fecha,
        numero_semana: (initialData.numero_semana as number) || getISOWeek(fechaDate),
        procedencia: String(initialData.procedencia || ""),
        cliente_id: String(initialData.cliente_id || ""),
        lote: String(initialData.lote || ""),
        numero_boleta: String(initialData.numero_boleta || ""),
        chofer_id: String(initialData.chofer_id || ""),
        placa_id: String(initialData.placa_id || ""),
        numero_cajas: String(initialData.numero_cajas || ""),
        pinas_por_caja: String(initialData.pinas_por_caja || ""),
        total_kilos: String(initialData.total_kilos || ""),
        precio_por_kilo: String(initialData.precio_por_kilo || ""),
        pagado: (initialData.pagado as boolean) || false,
      })
    }
  }, [initialData])

  const fetchOptions = useCallback(async () => {
    if (clientesProp && choferesProp && placasProp) {
      return
    }

    setLoadingOptions(true)
    const [
      { data: clientesData },
      { data: choferesData },
      { data: placasData },
    ] = await Promise.all([
      clientesProp ? Promise.resolve({ data: clientesProp }) : 
        supabase.from("clientes").select("id, nombre").eq("activo", true).order("nombre"),
      choferesProp ? Promise.resolve({ data: choferesProp }) : 
        supabase.from("choferes").select("id, nombre").eq("activo", true).order("nombre"),
      placasProp ? Promise.resolve({ data: placasProp }) : 
        supabase.from("placas").select("id, codigo").eq("activo", true).order("codigo"),
    ])

    if (!clientesProp) setClientes(clientesData ?? [])
    if (!choferesProp) setChoferes(choferesData ?? [])
    if (!placasProp) setPlacas(placasData ?? [])
    setLoadingOptions(false)
  }, [supabase, clientesProp, choferesProp, placasProp])

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
      placa_id: Number(formData.placa_id),
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
        fecha: new Date().toISOString().split("T")[0],
        numero_semana: getISOWeek(new Date()),
        procedencia: "",
        cliente_id: "",
        lote: "",
        numero_boleta: "",
        chofer_id: "",
        placa_id: "",
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

          {/* Fila 2: Procedencia, Cliente, Lote */}
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="procedencia" className="whitespace-nowrap">Procedencia</Label>
              <Input
                id="procedencia"
                value={formData.procedencia}
                onChange={(e) => setFormData(prev => ({ ...prev, procedencia: e.target.value }))}
                placeholder="Ingrese procedencia"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cliente" className="whitespace-nowrap">Cliente</Label>
              <Select
                value={formData.cliente_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, cliente_id: value }))}
                required
              >
                <SelectTrigger id="cliente">
                  <SelectValue placeholder="Seleccione..." />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Select
                value={formData.chofer_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, chofer_id: value }))}
                required
              >
                <SelectTrigger id="chofer">
                  <SelectValue placeholder="Seleccione..." />
                </SelectTrigger>
                <SelectContent>
                  {choferes.map((ch) => (
                    <SelectItem key={ch.id} value={ch.id.toString()}>
                      {ch.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="placa" className="whitespace-nowrap">Placa</Label>
              <Select
                value={formData.placa_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, placa_id: value }))}
                required
              >
                <SelectTrigger id="placa">
                  <SelectValue placeholder="Seleccione..." />
                </SelectTrigger>
                <SelectContent>
                  {placas.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.codigo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                required
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
                required
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
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="precio_por_kilo" className="whitespace-nowrap">Precio por Kilo (₡)</Label>
              <Input
                id="precio_por_kilo"
                type="number"
                step="0.01"
                min="0"
                value={formData.precio_por_kilo}
                onChange={(e) => setFormData(prev => ({ ...prev, precio_por_kilo: e.target.value }))}
                required
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
