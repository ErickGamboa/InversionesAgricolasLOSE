"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { SearchableSelect } from "@/components/ui/searchable-select"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"
import { TipoBoleta, BoletaFormData } from "@/types/boleta"
import { format, getISOWeek } from "date-fns"
import { es } from "date-fns/locale"

interface BoletaRecepcionFormProps {
  initialData?: Partial<BoletaFormData>
  onSubmit: (data: BoletaFormData) => void
  onCancel: () => void
  isSubmitting?: boolean
  clientes: { id: number; nombre: string }[]
  choferes: { id: number; nombre: string }[]
}

export function BoletaRecepcionForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  clientes,
  choferes,
}: BoletaRecepcionFormProps) {
  const today = new Date()
  const currentWeek = getISOWeek(today)

  const [formData, setFormData] = useState<BoletaFormData>({
    tipo_boleta: (initialData?.tipo_boleta as TipoBoleta) || "PLANTA",
    fecha: initialData?.fecha || format(today, "yyyy-MM-dd"),
    numero_semana: initialData?.numero_semana || currentWeek,
    cliente_id: initialData?.cliente_id || "",
    chofer_id: initialData?.chofer_id || "",
    placa: initialData?.placa || "",
    numero_cajas: initialData?.numero_cajas || "",
    pinas_por_caja: initialData?.pinas_por_caja || "",
    cantidad_bines: initialData?.cantidad_bines || "",
    total_kilos: initialData?.total_kilos || "",
    tipo_fruta: initialData?.tipo_fruta || "JUGO",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Calcular total de piñas cuando cambian cajas o piñas por caja
  const totalPinas =
    formData.tipo_boleta === "PLANTA" && formData.numero_cajas && formData.pinas_por_caja
      ? parseInt(formData.numero_cajas) * parseInt(formData.pinas_por_caja)
      : null

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.cliente_id) {
      newErrors.cliente_id = "Seleccione un cliente"
    }
    if (!formData.chofer_id) {
      newErrors.chofer_id = "Seleccione un chofer"
    }
    if (!formData.placa || formData.placa.trim() === "") {
      newErrors.placa = "Ingrese la placa"
    }

    if (formData.tipo_boleta === "PLANTA") {
      if (!formData.numero_cajas || parseInt(formData.numero_cajas) <= 0) {
        newErrors.numero_cajas = "Ingrese número de cajas"
      }
      if (!formData.pinas_por_caja || parseInt(formData.pinas_por_caja) <= 0) {
        newErrors.pinas_por_caja = "Ingrese piñas por caja"
      }
    }

    if (formData.tipo_boleta === "CAMPO") {
      if (!formData.total_kilos || parseFloat(formData.total_kilos) <= 0) {
        newErrors.total_kilos = "Ingrese total de kilos"
      }
      if (!formData.cantidad_bines || parseInt(formData.cantidad_bines) <= 0) {
        newErrors.cantidad_bines = "Ingrese cantidad de bines"
      }
      if (!formData.tipo_fruta) {
        newErrors.tipo_fruta = "Seleccione tipo de fruta"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
      onSubmit(formData)
    } else {
      toast.error("Complete todos los campos obligatorios")
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl">Nueva Boleta de Recepción</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tipo de Boleta */}
        <div className="space-y-3">
          <Label className="text-base font-semibold">Tipo de Boleta</Label>
          <RadioGroup
            value={formData.tipo_boleta}
            onValueChange={(value: TipoBoleta) =>
              setFormData({ ...formData, tipo_boleta: value })
            }
            className="flex gap-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="PLANTA" id="planta" />
              <Label htmlFor="planta" className="cursor-pointer">
                Planta (Cajas/Piñas)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="CAMPO" id="campo" />
              <Label htmlFor="campo" className="cursor-pointer">
                Campo (Kilos/Bines)
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Fecha y Semana */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fecha">Fecha</Label>
            <Input
              id="fecha"
              type="date"
              value={formData.fecha}
              onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="semana">Número de Semana</Label>
            <Input
              id="semana"
              type="number"
              value={formData.numero_semana}
              onChange={(e) =>
                setFormData({ ...formData, numero_semana: parseInt(e.target.value) || 0 })
              }
            />
          </div>
        </div>

        {/* Cliente y Chofer */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cliente">Cliente *</Label>
            <SearchableSelect
              options={clientes.map((c) => ({ value: c.id.toString(), label: c.nombre }))}
              value={formData.cliente_id}
              onChange={(value: string) =>
                setFormData({ ...formData, cliente_id: value })
              }
              placeholder="Seleccione un cliente"
              emptyText="No se encontró el cliente"
            />
            {errors.cliente_id && (
              <p className="text-sm text-destructive">{errors.cliente_id}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="chofer">Chofer *</Label>
            <SearchableSelect
              options={choferes.map((c) => ({ value: c.id.toString(), label: c.nombre }))}
              value={formData.chofer_id}
              onChange={(value: string) =>
                setFormData({ ...formData, chofer_id: value })
              }
              placeholder="Seleccione un chofer"
              emptyText="No se encontró el chofer"
            />
            {errors.chofer_id && (
              <p className="text-sm text-destructive">{errors.chofer_id}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="placa">Placa *</Label>
            <Input
              id="placa"
              value={formData.placa}
              onChange={(e) => setFormData({ ...formData, placa: e.target.value })}
              placeholder="Ej: 151726"
            />
            {errors.placa && (
              <p className="text-sm text-destructive">{errors.placa}</p>
            )}
          </div>
        </div>

        {/* Campos específicos por tipo */}
        {formData.tipo_boleta === "PLANTA" && (
          <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
            <h3 className="font-semibold text-lg">Datos de Planta</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numero_cajas">Número de Cajas *</Label>
                <Input
                  id="numero_cajas"
                  type="number"
                  min="0"
                  value={formData.numero_cajas}
                  onChange={(e) =>
                    setFormData({ ...formData, numero_cajas: e.target.value })
                  }
                  placeholder="Ej: 7"
                />
                {errors.numero_cajas && (
                  <p className="text-sm text-destructive">{errors.numero_cajas}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="pinas_por_caja">Piñas por Caja *</Label>
                <Input
                  id="pinas_por_caja"
                  type="number"
                  min="0"
                  value={formData.pinas_por_caja}
                  onChange={(e) =>
                    setFormData({ ...formData, pinas_por_caja: e.target.value })
                  }
                  placeholder="Ej: 10"
                />
                {errors.pinas_por_caja && (
                  <p className="text-sm text-destructive">{errors.pinas_por_caja}</p>
                )}
              </div>
            </div>
            {totalPinas !== null && (
              <div className="text-center p-3 bg-primary/10 rounded-lg">
                <span className="text-sm text-muted-foreground">Total de Piñas:</span>
                <span className="text-2xl font-bold ml-2">{totalPinas}</span>
              </div>
            )}
          </div>
        )}

        {formData.tipo_boleta === "CAMPO" && (
          <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
            <h3 className="font-semibold text-lg">Datos de Campo</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cantidad_bines">Cantidad de Bines *</Label>
                <Input
                  id="cantidad_bines"
                  type="number"
                  min="0"
                  value={formData.cantidad_bines}
                  onChange={(e) =>
                    setFormData({ ...formData, cantidad_bines: e.target.value })
                  }
                  placeholder="Ej: 24"
                />
                {errors.cantidad_bines && (
                  <p className="text-sm text-destructive">{errors.cantidad_bines}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="total_kilos">Total de Kilos *</Label>
                <Input
                  id="total_kilos"
                  type="number"
                  step="0.001"
                  min="0"
                  value={formData.total_kilos}
                  onChange={(e) =>
                    setFormData({ ...formData, total_kilos: e.target.value })
                  }
                  placeholder="Ej: 1214.000"
                />
                {errors.total_kilos && (
                  <p className="text-sm text-destructive">{errors.total_kilos}</p>
                )}
              </div>
            </div>
            
            {/* Tipo de Fruta */}
            <div className="space-y-3 border-t border-gray-200 pt-4 mt-4">
              <Label className="text-base font-semibold">Tipo de Fruta *</Label>
              <RadioGroup
                value={formData.tipo_fruta}
                onValueChange={(value: 'JUGO' | 'INDUSTRIA') =>
                  setFormData({ ...formData, tipo_fruta: value })
                }
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="JUGO" id="jugo" />
                  <Label htmlFor="jugo" className="cursor-pointer text-lg">
                    JUGO
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="INDUSTRIA" id="industria" />
                  <Label htmlFor="industria" className="cursor-pointer text-lg">
                    INDUSTRIA
                  </Label>
                </div>
              </RadioGroup>
              {errors.tipo_fruta && (
                <p className="text-sm text-destructive">{errors.tipo_fruta}</p>
              )}
            </div>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Guardando...
              </>
            ) : (
              "Guardar y Generar Boleta"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
