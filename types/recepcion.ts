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
  { value: "bg-red-600", label: "Rojo", hex: "#dc2626" },
  { value: "bg-orange-500", label: "Naranja", hex: "#f97316" },
  { value: "bg-yellow-400", label: "Amarillo", hex: "#facc15" },
  { value: "bg-lime-500", label: "Lima", hex: "#84cc16" },
  { value: "bg-green-600", label: "Verde", hex: "#16a34a" },
  { value: "bg-teal-500", label: "Turquesa", hex: "#14b8a6" },
  { value: "bg-cyan-500", label: "Cian", hex: "#06b6d4" },
  { value: "bg-blue-600", label: "Azul", hex: "#2563eb" },
  { value: "bg-indigo-600", label: "Índigo", hex: "#4f46e5" },
  { value: "bg-purple-600", label: "Morado", hex: "#9333ea" },
  { value: "bg-pink-500", label: "Rosa", hex: "#ec4899" },
  { value: "bg-slate-600", label: "Gris", hex: "#475569" },
]
