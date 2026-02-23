export type RecepcionEstado = 'pendiente' | 'finalizado'

export interface Recepcion {
  id: number
  cliente_id: number | null
  chofer_ingreso_id: number | null
  es_rechazo: boolean
  color_etiqueta: string
  estado: RecepcionEstado
  fecha_creacion: string
  usuario_creacion: string | null
  tipo_pina?: 'IQF' | 'Jugo'
  procedencia_tipo?: 'campo' | 'planta'
  notas?: string

  // Relaciones (para cuando hacemos join)
  clientes?: { nombre: string }
  choferes?: { nombre: string }
  recepcion_bines?: RecepcionBin[]
}

export type BinesEstado = 'en_patio' | 'despachado'

export interface RecepcionBin {
  id: number
  recepcion_id: number
  numero_par: number
  peso_bruto: number
  peso_neto: number
  estado: BinesEstado
  chofer_salida_id: number | null
  fecha_despacho: string | null
  tara_aplicada: number

  // Relaciones
  choferes?: { nombre: string }
}

// 12 Colores Distintivos (Sin variaciones tonales)
export const COLOR_OPTIONS = [
  { id: 1, value: "bg-red-600", label: "Rojo", hex: "#dc2626" },
  { id: 2, value: "bg-orange-500", label: "Naranja", hex: "#f97316" },
  { id: 3, value: "bg-yellow-400", label: "Amarillo", hex: "#facc15" },
  { id: 4, value: "bg-lime-500", label: "Lima", hex: "#84cc16" },
  { id: 5, value: "bg-green-600", label: "Verde", hex: "#16a34a" },
  { id: 6, value: "bg-black", label: "Negro", hex: "#000000" },
  { id: 7, value: "bg-cyan-500", label: "Cian", hex: "#06b6d4" },
  { id: 8, value: "bg-blue-600", label: "Azul", hex: "#2563eb" },
  { id: 9, value: "bg-indigo-600", label: "Índigo", hex: "#4f46e5" },
  { id: 10, value: "bg-purple-600", label: "Morado", hex: "#9333ea" },
  { id: 11, value: "bg-pink-500", label: "Rosa", hex: "#ec4899" },
  { id: 12, value: "bg-slate-600", label: "Gris", hex: "#475569" },
]
