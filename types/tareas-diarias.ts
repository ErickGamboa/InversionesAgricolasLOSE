export type PrioridadTarea = "baja" | "media" | "alta"

export type EstadoTareaDiaria = "pendiente" | "en_progreso" | "completada" | "cancelada"

export interface TareaDiaria {
  id: number
  titulo: string
  descripcion: string | null
  prioridad: PrioridadTarea
  activa: boolean
  es_recurrente_diaria: boolean
  fecha_objetivo: string | null
  creado_en: string
  actualizado_en: string
}

export interface TareaDiariaConEstado extends TareaDiaria {
  fecha: string
  estado_dia: EstadoTareaDiaria
  nota_dia: string | null
}
