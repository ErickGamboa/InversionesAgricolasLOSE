"use client"

import React from "react"

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
import { Loader2, Plus, Save, X } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"

interface SelectOption {
  id: number
  codigo?: string
  nombre?: string
  descripcion?: string
}

interface TransactionFormProps {
  tableName?: string
  title?: string
  showTipoPago?: boolean
  onSuccess?: () => void
  initialData?: Record<string, unknown>
  onSubmit?: (data: Record<string, unknown>) => void
  onCancel?: () => void
  isSubmitting?: boolean
  clientes?: SelectOption[]
  plantas?: SelectOption[]
  choferes?: SelectOption[]
  placas?: SelectOption[]
  tiposPago?: SelectOption[]
}

export function TransactionForm({
  tableName,
  title = "Nueva Transacción",
  showTipoPago = false,
  onSuccess,
  initialData,
  onSubmit,
  onCancel,
  isSubmitting: isSubmittingProp,
  clientes: clientesProp,
  plantas: plantasProp,
  choferes: choferesProp,
  placas: placasProp,
  tiposPago: tiposPagoProp,
}: TransactionFormProps) {
  const isControlled = !!onSubmit
  const [loading, setLoading] = useState(false)
  const [loadingOptions, setLoadingOptions] = useState(!clientesProp)
  const [clientes, setClientes] = useState<SelectOption[]>(clientesProp || [])
  const [plantas, setPlantas] = useState<SelectOption[]>(plantasProp || [])
  const [choferes, setChoferes] = useState<SelectOption[]>(choferesProp || [])
  const [placas, setPlacas] = useState<SelectOption[]>(placasProp || [])
  const [tiposPago, setTiposPago] = useState<SelectOption[]>(tiposPagoProp || [])

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split("T")[0],
    cliente_id: "",
    planta_id: "",
    chofer_id: "",
    placa_id: "",
    boleta: "",
    kilos_bruto: "",
    kilos_tara: "",
    precio: "",
    tipo_pago_id: "",
  })

  const supabase = createClient()

  useEffect(() => {
    if (initialData) {
      setFormData({
        fecha: (initialData.fecha as string) || new Date().toISOString().split("T")[0],
        cliente_id: String(initialData.cliente_id || ""),
        planta_id: String(initialData.planta_id || ""),
        chofer_id: String(initialData.chofer_id || ""),
        placa_id: String(initialData.placa_id || ""),
        boleta: String(initialData.boleta || ""),
        kilos_bruto: String(initialData.kilos_bruto || ""),
        kilos_tara: String(initialData.kilos_tara || ""),
        precio: String(initialData.precio || ""),
        tipo_pago_id: String(initialData.tipo_pago_id || ""),
      })
    } else {
      setFormData({
        fecha: new Date().toISOString().split("T")[0],
        cliente_id: "",
        planta_id: "",
        chofer_id: "",
        placa_id: "",
        boleta: "",
        kilos_bruto: "",
        kilos_tara: "",
        precio: "",
        tipo_pago_id: "",
      })
    }
  }, [initialData])

  const fetchOptions = useCallback(async () => {
    if (clientesProp && plantasProp && choferesProp && placasProp && (!showTipoPago || tiposPagoProp)) {
      return
    }

    setLoadingOptions(true)
    const [
      { data: clientesData },
      { data: plantasData },
      { data: choferesData },
      { data: placasData },
      { data: tiposPagoData },
    ] = await Promise.all([
      clientesProp ? Promise.resolve({ data: clientesProp }) : supabase.from("clientes").select("id, nombre").eq("activo", true).order("nombre"),
      plantasProp ? Promise.resolve({ data: plantasProp }) : supabase.from("plantas").select("id, nombre").eq("activo", true).order("nombre"),
      choferesProp ? Promise.resolve({ data: choferesProp }) : supabase.from("choferes").select("id, nombre").eq("activo", true).order("nombre"),
      placasProp ? Promise.resolve({ data: placasProp }) : supabase.from("placas").select("id, codigo").eq("activo", true).order("codigo"),
      showTipoPago && !tiposPagoProp ? supabase.from("tipos_pago").select("id, nombre").eq("activo", true).order("nombre") : Promise.resolve({ data: tiposPagoProp || [] }),
    ])

    if (!clientesProp) setClientes(clientesData ?? [])
    if (!plantasProp) setPlantas(plantasData ?? [])
    if (!choferesProp) setChoferes(choferesData ?? [])
    if (!placasProp) setPlacas(placasData ?? [])
    if (!tiposPagoProp) setTiposPago(tiposPagoData ?? [])
    setLoadingOptions(false)
  }, [supabase, clientesProp, plantasProp, choferesProp, placasProp, tiposPagoProp, showTipoPago])

  useEffect(() => {
    fetchOptions()
  }, [fetchOptions])

  const kilosNeto = (Number(formData.kilos_bruto) || 0) - (Number(formData.kilos_tara) || 0)
  const monto = kilosNeto * (Number(formData.precio) || 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isControlled && onSubmit) {
      const dataToSubmit: Record<string, unknown> = {
        fecha: formData.fecha,
        cliente_id: Number(formData.cliente_id),
        planta_id: Number(formData.planta_id),
        chofer_id: Number(formData.chofer_id),
        placa_id: Number(formData.placa_id),
        boleta: formData.boleta || null,
        kilos_bruto: Number(formData.kilos_bruto) || 0,
        kilos_tara: Number(formData.kilos_tara) || 0,
        precio: Number(formData.precio) || 0,
      }

      if (showTipoPago && formData.tipo_pago_id) {
        dataToSubmit.tipo_pago_id = Number(formData.tipo_pago_id)
      }

      onSubmit(dataToSubmit)
      return
    }

    setLoading(true)

    try {
      const dataToInsert: Record<string, unknown> = {
        fecha: formData.fecha,
        cliente_id: Number(formData.cliente_id),
        planta_id: Number(formData.planta_id),
        chofer_id: Number(formData.chofer_id),
        placa_id: Number(formData.placa_id),
        boleta: formData.boleta || null,
        kilos_bruto: Number(formData.kilos_bruto) || 0,
        kilos_tara: Number(formData.kilos_tara) || 0,
        precio: Number(formData.precio) || 0,
      }

      if (showTipoPago && formData.tipo_pago_id) {
        dataToInsert.tipo_pago_id = Number(formData.tipo_pago_id)
      }

      const { error } = await supabase.from(tableName || "").insert(dataToInsert)

      if (error) throw error

      toast.success("Registro guardado exitosamente")
      
      setFormData((prev) => ({
        ...prev,
        boleta: "",
        kilos_bruto: "",
        kilos_tara: "",
        precio: "",
      }))
      
      onSuccess?.()
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
          <CardTitle>{title}</CardTitle>
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
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 min-w-0">
            <div className="space-y-2 min-w-0 overflow-hidden">
              <Label htmlFor="fecha">Fecha</Label>
              <Input
                id="fecha"
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData((prev) => ({ ...prev, fecha: e.target.value }))}
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2 min-w-0 overflow-hidden">
              <Label htmlFor="cliente">Cliente</Label>
              <SearchableSelect
                options={clientes.map((c) => ({
                  value: c.id.toString(),
                  label: `${c.codigo ? `${c.codigo} - ` : ""}${c.nombre || ""}`
                }))}
                value={formData.cliente_id}
                onChange={(value) => setFormData((prev) => ({ ...prev, cliente_id: value }))}
                placeholder="Buscar cliente..."
                emptyText="No se encontró el cliente"
              />
            </div>

            <div className="space-y-2 min-w-0 overflow-hidden">
              <Label htmlFor="planta">Planta</Label>
              <SearchableSelect
                options={plantas.map((p) => ({
                  value: p.id.toString(),
                  label: `${p.codigo ? `${p.codigo} - ` : ""}${p.nombre || ""}`
                }))}
                value={formData.planta_id}
                onChange={(value) => setFormData((prev) => ({ ...prev, planta_id: value }))}
                placeholder="Buscar planta..."
                emptyText="No se encontró la planta"
              />
            </div>

            <div className="space-y-2 min-w-0 overflow-hidden">
              <Label htmlFor="chofer">Chofer</Label>
              <SearchableSelect
                options={choferes.map((ch) => ({
                  value: ch.id.toString(),
                  label: `${ch.codigo ? `${ch.codigo} - ` : ""}${ch.nombre || ""}`
                }))}
                value={formData.chofer_id}
                onChange={(value) => setFormData((prev) => ({ ...prev, chofer_id: value }))}
                placeholder="Buscar chofer..."
                emptyText="No se encontró el chofer"
              />
            </div>

            <div className="space-y-2 min-w-0 overflow-hidden">
              <Label htmlFor="placa">Placa</Label>
              <SearchableSelect
                options={placas.map((pl) => ({
                  value: pl.id.toString(),
                  label: `${pl.codigo || ""} ${pl.descripcion ? `- ${pl.descripcion}` : ""}`
                }))}
                value={formData.placa_id}
                onChange={(value) => setFormData((prev) => ({ ...prev, placa_id: value }))}
                placeholder="Buscar placa..."
                emptyText="No se encontró la placa"
              />
            </div>

            <div className="space-y-2 min-w-0 overflow-hidden">
              <Label htmlFor="boleta">Boleta</Label>
              <Input
                id="boleta"
                value={formData.boleta}
                onChange={(e) => setFormData((prev) => ({ ...prev, boleta: e.target.value }))}
                placeholder="Numero de boleta"
                className="w-full"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 min-w-0">
            <div className="space-y-2 min-w-0 overflow-hidden">
              <Label htmlFor="kilos_bruto">Kilos Bruto</Label>
              <Input
                id="kilos_bruto"
                type="number"
                step="0.01"
                min="0"
                value={formData.kilos_bruto}
                onChange={(e) => setFormData((prev) => ({ ...prev, kilos_bruto: e.target.value }))}
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2 min-w-0 overflow-hidden">
              <Label htmlFor="kilos_tara">Kilos Tara</Label>
              <Input
                id="kilos_tara"
                type="number"
                step="0.01"
                min="0"
                value={formData.kilos_tara}
                onChange={(e) => setFormData((prev) => ({ ...prev, kilos_tara: e.target.value }))}
                required
                className="w-full"
              />
            </div>

            <div className="space-y-2 min-w-0 overflow-hidden">
              <Label>Kilos Neto</Label>
              <div className="flex h-9 w-full items-center overflow-hidden rounded-md border bg-muted px-3 text-sm font-medium">
                {kilosNeto.toLocaleString("es-CR")} kg
              </div>
            </div>

            <div className="space-y-2 min-w-0 overflow-hidden">
              <Label htmlFor="precio">Precio por Kilo</Label>
              <Input
                id="precio"
                type="number"
                step="any"
                min="0"
                value={formData.precio}
                onChange={(e) => setFormData((prev) => ({ ...prev, precio: e.target.value }))}
                required
                className="w-full"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 min-w-0">
            {showTipoPago && (
              <div className="space-y-2 min-w-0 overflow-hidden">
                <Label htmlFor="tipo_pago">Tipo de Pago</Label>
                <Select
                  key={`tipo-pago-${tiposPago.length}-${formData.tipo_pago_id}`}
                  value={formData.tipo_pago_id}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, tipo_pago_id: value }))}
                >
                  <SelectTrigger id="tipo_pago" className="w-full">
                    <SelectValue placeholder="Seleccione..." className="truncate" />
                  </SelectTrigger>
                <SelectContent>
                    {tiposPago.map((tp) => (
                      <SelectItem key={tp.id} value={tp.id.toString()} className="truncate max-w-[300px]">
                        <span className="truncate">{tp.codigo ? `${tp.codigo} - ` : ""}{tp.nombre}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className={`space-y-2 ${showTipoPago ? "" : "lg:col-start-4"}`}>
              <Label>Monto Total</Label>
              <div className="flex h-9 w-full items-center overflow-hidden rounded-md border bg-primary/10 px-3 text-sm font-bold text-primary">
                ₡{formatCurrency(monto)}
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
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
