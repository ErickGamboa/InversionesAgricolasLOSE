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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, Plus, Save } from "lucide-react"

interface SelectOption {
  id: number
  codigo: string
  nombre?: string
  descripcion?: string
}

interface TransactionFormProps {
  tableName: string
  title: string
  showTipoPago?: boolean
  onSuccess: () => void
}

export function TransactionForm({
  tableName,
  title,
  showTipoPago = false,
  onSuccess,
}: TransactionFormProps) {
  const [loading, setLoading] = useState(false)
  const [loadingOptions, setLoadingOptions] = useState(true)
  const [clientes, setClientes] = useState<SelectOption[]>([])
  const [plantas, setPlantas] = useState<SelectOption[]>([])
  const [choferes, setChoferes] = useState<SelectOption[]>([])
  const [placas, setPlacas] = useState<SelectOption[]>([])
  const [tiposPago, setTiposPago] = useState<SelectOption[]>([])

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

  const fetchOptions = useCallback(async () => {
    setLoadingOptions(true)
    const [
      { data: clientesData },
      { data: plantasData },
      { data: choferesData },
      { data: placasData },
      { data: tiposPagoData },
    ] = await Promise.all([
      supabase.from("clientes").select("id, codigo, nombre").eq("activo", true).order("codigo"),
      supabase.from("plantas").select("id, codigo, nombre").eq("activo", true).order("codigo"),
      supabase.from("choferes").select("id, codigo, nombre").eq("activo", true).order("codigo"),
      supabase.from("placas").select("id, codigo, descripcion").eq("activo", true).order("codigo"),
      supabase.from("tipos_pago").select("id, codigo, nombre").eq("activo", true).order("codigo"),
    ])

    setClientes(clientesData ?? [])
    setPlantas(plantasData ?? [])
    setChoferes(choferesData ?? [])
    setPlacas(placasData ?? [])
    setTiposPago(tiposPagoData ?? [])
    setLoadingOptions(false)
  }, [supabase])

  useEffect(() => {
    fetchOptions()
  }, [fetchOptions])

  const kilosNeto = (Number(formData.kilos_bruto) || 0) - (Number(formData.kilos_tara) || 0)
  const monto = kilosNeto * (Number(formData.precio) || 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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

      const { error } = await supabase.from(tableName).insert(dataToInsert)

      if (error) throw error

      toast.success("Registro guardado exitosamente")
      
      // Reset form but keep date and potentially reused fields
      setFormData((prev) => ({
        ...prev,
        boleta: "",
        kilos_bruto: "",
        kilos_tara: "",
        precio: "",
      }))
      
      onSuccess()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido"
      toast.error(`Error: ${message}`)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (num: number) =>
    num.toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  if (loadingOptions) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha</Label>
              <Input
                id="fecha"
                type="date"
                value={formData.fecha}
                onChange={(e) => setFormData((prev) => ({ ...prev, fecha: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente</Label>
              <Select
                value={formData.cliente_id}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, cliente_id: value }))}
                required
              >
                <SelectTrigger id="cliente">
                  <SelectValue placeholder="Seleccione..." />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((c) => (
                    <SelectItem key={c.id} value={c.id.toString()}>
                      {c.codigo} - {c.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="planta">Planta</Label>
              <Select
                value={formData.planta_id}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, planta_id: value }))}
                required
              >
                <SelectTrigger id="planta">
                  <SelectValue placeholder="Seleccione..." />
                </SelectTrigger>
                <SelectContent>
                  {plantas.map((p) => (
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.codigo} - {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="chofer">Chofer</Label>
              <Select
                value={formData.chofer_id}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, chofer_id: value }))}
                required
              >
                <SelectTrigger id="chofer">
                  <SelectValue placeholder="Seleccione..." />
                </SelectTrigger>
                <SelectContent>
                  {choferes.map((ch) => (
                    <SelectItem key={ch.id} value={ch.id.toString()}>
                      {ch.codigo} - {ch.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="placa">Placa</Label>
              <Select
                value={formData.placa_id}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, placa_id: value }))}
                required
              >
                <SelectTrigger id="placa">
                  <SelectValue placeholder="Seleccione..." />
                </SelectTrigger>
                <SelectContent>
                  {placas.map((pl) => (
                    <SelectItem key={pl.id} value={pl.id.toString()}>
                      {pl.codigo} {pl.descripcion ? `- ${pl.descripcion}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="boleta">Boleta</Label>
              <Input
                id="boleta"
                value={formData.boleta}
                onChange={(e) => setFormData((prev) => ({ ...prev, boleta: e.target.value }))}
                placeholder="Numero de boleta"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="kilos_bruto">Kilos Bruto</Label>
              <Input
                id="kilos_bruto"
                type="number"
                step="0.01"
                min="0"
                value={formData.kilos_bruto}
                onChange={(e) => setFormData((prev) => ({ ...prev, kilos_bruto: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="kilos_tara">Kilos Tara</Label>
              <Input
                id="kilos_tara"
                type="number"
                step="0.01"
                min="0"
                value={formData.kilos_tara}
                onChange={(e) => setFormData((prev) => ({ ...prev, kilos_tara: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Kilos Neto</Label>
              <div className="flex h-9 items-center rounded-md border bg-muted px-3 text-sm font-medium">
                {kilosNeto.toLocaleString("es-CR")} kg
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="precio">Precio por Kilo</Label>
              <Input
                id="precio"
                type="number"
                step="0.01"
                min="0"
                value={formData.precio}
                onChange={(e) => setFormData((prev) => ({ ...prev, precio: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {showTipoPago && (
              <div className="space-y-2">
                <Label htmlFor="tipo_pago">Tipo de Pago</Label>
                <Select
                  value={formData.tipo_pago_id}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, tipo_pago_id: value }))}
                >
                  <SelectTrigger id="tipo_pago">
                    <SelectValue placeholder="Seleccione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposPago.map((tp) => (
                      <SelectItem key={tp.id} value={tp.id.toString()}>
                        {tp.codigo} - {tp.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className={`space-y-2 ${showTipoPago ? "" : "lg:col-start-4"}`}>
              <Label>Monto Total</Label>
              <div className="flex h-9 items-center rounded-md border bg-primary/10 px-3 text-sm font-bold text-primary">
                ₡{formatCurrency(monto)}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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
