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

interface SelectOption {
  id: number
  nombre?: string
}

interface ComprasRegularesFormProps {
  initialData?: Record<string, unknown>
  onSubmit?: (data: Record<string, unknown>) => void
  onCancel?: () => void
  isSubmitting?: boolean
  clientes?: SelectOption[]
  choferes?: SelectOption[]
  tiposPago?: SelectOption[]
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

// Función para obtener la fecha local en formato YYYY-MM-DD (corrige bug de timezone)
function getLocalDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function ComprasRegularesForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting: isSubmittingProp,
  clientes: clientesProp,
  choferes: choferesProp,
  tiposPago: tiposPagoProp,
}: ComprasRegularesFormProps) {
  const isControlled = !!onSubmit
  const [loading, setLoading] = useState(false)
  const [loadingOptions, setLoadingOptions] = useState(!clientesProp || !choferesProp)
  const [clientes, setClientes] = useState<SelectOption[]>(clientesProp || [])
  const [choferes, setChoferes] = useState<SelectOption[]>(choferesProp || [])
  const [tiposPago, setTiposPago] = useState<SelectOption[]>(tiposPagoProp || [])

  const [formData, setFormData] = useState({
    fecha: getLocalDateString(new Date()),
    numero_semana: getISOWeek(new Date()),
    pago_dolares: false,
    lugar_procedencia: "",
    procedencia_tipo: "",
    cliente_id: "",
    numero_boleta: "",
    nb_tickete: "",
    chofer_id: "",
    tipo_pina: "",
    numero_kilos: "",
    precio_piña: "",
    pagado: false,
    tipo_pago_id: "",
    numero_deposito: "",
    numero_factura: "",
  })

  const supabase = createClient()

  useEffect(() => {
    if (initialData) {
      const fecha = (initialData.fecha as string) || getLocalDateString(new Date())
      const fechaDate = new Date(fecha)
      
      setFormData({
        fecha: fecha,
        numero_semana: (initialData.numero_semana as number) || getISOWeek(fechaDate),
        pago_dolares: (initialData.pago_dolares as boolean) || false,
        lugar_procedencia: String(initialData.lugar_procedencia || ""),
        procedencia_tipo: String(initialData.procedencia_tipo || ""),
        cliente_id: String(initialData.cliente_id || ""),
        numero_boleta: String(initialData.numero_boleta || ""),
        nb_tickete: String(initialData.nb_tickete || ""),
        chofer_id: String(initialData.chofer_id || ""),
        tipo_pina: String(initialData.tipo_pina || ""),
        numero_kilos: String(initialData.numero_kilos || ""),
        precio_piña: String(initialData.precio_piña || ""),
        pagado: (initialData.pagado as boolean) || false,
        tipo_pago_id: String(initialData.tipo_pago_id || ""),
        numero_deposito: String(initialData.numero_deposito || ""),
        numero_factura: String(initialData.numero_factura || ""),
      })
    }
  }, [initialData])

  const fetchOptions = useCallback(async () => {
    if (clientesProp && choferesProp && tiposPagoProp) {
      return
    }

    setLoadingOptions(true)
    const [
      { data: clientesData },
      { data: choferesData },
      { data: tiposPagoData },
    ] = await Promise.all([
      clientesProp ? Promise.resolve({ data: clientesProp }) : 
        supabase.from("clientes").select("id, nombre").eq("activo", true).order("nombre"),
      choferesProp ? Promise.resolve({ data: choferesProp }) : 
        supabase.from("choferes").select("id, nombre").eq("activo", true).order("nombre"),
      tiposPagoProp ? Promise.resolve({ data: tiposPagoProp }) : 
        supabase.from("tipos_pago").select("id, nombre").eq("activo", true).order("nombre"),
    ])

    if (!clientesProp) setClientes(clientesData ?? [])
    if (!choferesProp) setChoferes(choferesData ?? [])
    if (!tiposPagoProp) setTiposPago(tiposPagoData ?? [])
    setLoadingOptions(false)
  }, [supabase, clientesProp, choferesProp, tiposPagoProp])

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
  const numeroKilos = Number(formData.numero_kilos) || 0
  const precioPiña = Number(formData.precio_piña) || 0
  const totalAPagar = numeroKilos * precioPiña

  const formatCurrency = (num: number, dolares: boolean = false) => {
    if (dolares) {
      return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
    return num.toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const dataToSubmit = {
      fecha: formData.fecha,
      numero_semana: formData.numero_semana,
      pago_dolares: formData.pago_dolares,
      lugar_procedencia: formData.lugar_procedencia || null,
      procedencia_tipo: formData.procedencia_tipo || null,
      cliente_id: Number(formData.cliente_id),
      numero_boleta: formData.numero_boleta || null,
      nb_tickete: formData.nb_tickete || null,
      chofer_id: Number(formData.chofer_id),
      tipo_pina: formData.tipo_pina,
      numero_kilos: numeroKilos,
      precio_piña: precioPiña,
      total_a_pagar: totalAPagar,
      pagado: formData.pagado,
      tipo_pago_id: formData.tipo_pago_id ? Number(formData.tipo_pago_id) : null,
      numero_deposito: formData.numero_deposito || null,
      numero_factura: formData.numero_factura || null,
    }

    if (isControlled && onSubmit) {
      onSubmit(dataToSubmit)
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.from("compras_regulares").insert(dataToSubmit)
      if (error) throw error

      toast.success("Compra guardada exitosamente")
      
      // Reset form
      setFormData({
        fecha: getLocalDateString(new Date()),
        numero_semana: getISOWeek(new Date()),
        pago_dolares: false,
        lugar_procedencia: "",
        procedencia_tipo: "",
        cliente_id: "",
        numero_boleta: "",
        nb_tickete: "",
        chofer_id: "",
        tipo_pina: "",
        numero_kilos: "",
        precio_piña: "",
        pagado: false,
        tipo_pago_id: "",
        numero_deposito: "",
        numero_factura: "",
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
          <CardTitle>Nueva Compra Regular</CardTitle>
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
          {initialData ? "Editar Compra Regular" : "Nueva Compra Regular"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Fila 1: Fecha, Semana, Pago en dólares */}
          <div className="grid gap-6 sm:grid-cols-3">
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

            <div className="space-y-2 flex items-end pb-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pago_dolares"
                  checked={formData.pago_dolares}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, pago_dolares: checked as boolean }))
                  }
                />
                <Label htmlFor="pago_dolares" className="whitespace-nowrap cursor-pointer">
                  Pago en dólares
                </Label>
              </div>
            </div>
          </div>

          {/* Fila 2: Lugar procedencia, Tipo procedencia, Cliente */}
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="lugar_procedencia" className="whitespace-nowrap">Lugar de Procedencia</Label>
              <Input
                id="lugar_procedencia"
                value={formData.lugar_procedencia}
                onChange={(e) => setFormData(prev => ({ ...prev, lugar_procedencia: e.target.value }))}
                placeholder="Ingrese lugar"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="procedencia_tipo" className="whitespace-nowrap">Procedencia</Label>
              <Select
                key={`procedencia-${formData.procedencia_tipo}`}
                value={formData.procedencia_tipo}
                onValueChange={(value) => setFormData(prev => ({ ...prev, procedencia_tipo: value }))}
              >
                <SelectTrigger id="procedencia_tipo">
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
          </div>

          {/* Fila 3: Boleta, Tickete, Chofer */}
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
              <Label htmlFor="nb_tickete" className="whitespace-nowrap">NB / Tickete</Label>
              <Input
                id="nb_tickete"
                value={formData.nb_tickete}
                onChange={(e) => setFormData(prev => ({ ...prev, nb_tickete: e.target.value }))}
                placeholder="Ingrese ticket"
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
          </div>

          {/* Fila 4: Tipo de Piña, Kilos, Precio */}
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="tipo_pina" className="whitespace-nowrap">Tipo de Piña</Label>
              <Select
                key={`tipo-pina-${formData.tipo_pina}`}
                value={formData.tipo_pina}
                onValueChange={(value) => setFormData(prev => ({ ...prev, tipo_pina: value }))}
                required
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
              <Label htmlFor="numero_kilos" className="whitespace-nowrap">Número de Kilos</Label>
              <Input
                id="numero_kilos"
                type="number"
                step="0.01"
                min="0"
                value={formData.numero_kilos}
                onChange={(e) => setFormData(prev => ({ ...prev, numero_kilos: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="precio_piña" className="whitespace-nowrap">
                Precio de Piña ({formData.pago_dolares ? "$" : "₡"})
              </Label>
              <Input
                id="precio_piña"
                type="number"
                step="0.01"
                min="0"
                value={formData.precio_piña}
                onChange={(e) => setFormData(prev => ({ ...prev, precio_piña: e.target.value }))}
                required
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
                  <span className="truncate">
                    {formData.pago_dolares ? "$" : "₡"}{formatCurrency(totalAPagar, formData.pago_dolares)}
                  </span>
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

          {/* Fila 5: Tipo de Pago, Depósito, Factura */}
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="tipo_pago" className="whitespace-nowrap">Tipo de Pago</Label>
              <Select
                key={`tipo-pago-${tiposPago.length}-${formData.tipo_pago_id}`}
                value={formData.tipo_pago_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, tipo_pago_id: value }))}
              >
                <SelectTrigger id="tipo_pago">
                  <SelectValue placeholder="Seleccione..." />
                </SelectTrigger>
                <SelectContent>
                  {tiposPago.map((tp) => (
                    <SelectItem key={tp.id} value={tp.id.toString()}>
                      {tp.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            <div className="space-y-2">
              <Label htmlFor="numero_factura" className="whitespace-nowrap">Número de Factura</Label>
              <Input
                id="numero_factura"
                value={formData.numero_factura}
                onChange={(e) => setFormData(prev => ({ ...prev, numero_factura: e.target.value }))}
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
