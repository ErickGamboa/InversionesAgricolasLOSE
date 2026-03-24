export type TipoPago = "semanal" | "quincenal" | "mensual"
export type EstadoPlanilla = "pendiente" | "pagado"

export interface EmpleadoPlanilla {
  id: number
  nombre_completo: string
  cargo?: string | null
  salario_base: number
}

export interface Planilla {
  id: number
  empleado_id: number
  fecha_pago: string
  mes_año: string
  tipo_pago: TipoPago
  estado: EstadoPlanilla
  numero_semana: number
  salario_bruto: number
  horas_extra: number
  precio_hora_extra: number
  extras: number
  rebajos: number
  rebajo_porcentaje: number
  total_pagar: number
  neto: number
  salario_linea: number
  comentarios?: string | null
  metadata: Record<string, unknown>
  creado_en: string
  empleados?: EmpleadoPlanilla
}

export interface PlanillaTotals {
  totalBruto: number
  totalExtras: number
  totalHorasExtra: number
  totalRebajos: number
  totalNeto: number
}
