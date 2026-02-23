export type TipoBoleta = 'CAMPO' | 'PLANTA'

export interface BoletaRecepcion {
  id: number
  numero_boleta: number
  tipo_boleta: TipoBoleta
  fecha: string
  numero_semana: number
  cliente_id: number | null
  chofer_id: number | null
  placa: string | null
  
  // Campos PLANTA
  numero_cajas: number | null
  pinas_por_caja: number | null
  total_pinas: number | null
  
  // Campos CAMPO
  total_kilos: number | null
  cantidad_bines: number | null
  
  // Para completar después
  precio_por_kilo: number | null
  
  // Tipo de fruta (solo CAMPO)
  tipo_fruta: 'JUGO' | 'INDUSTRIA' | null
  
  fecha_creacion: string
  
  // Relaciones
  clientes?: { nombre: string }
  choferes?: { nombre: string }
}

export interface BoletaFormData {
  tipo_boleta: TipoBoleta
  fecha: string
  numero_semana: number
  cliente_id: string
  chofer_id: string
  placa: string
  
  // PLANTA
  numero_cajas: string
  pinas_por_caja: string
  
  // CAMPO
  cantidad_bines: string
  total_kilos: string
  tipo_fruta: string
}
