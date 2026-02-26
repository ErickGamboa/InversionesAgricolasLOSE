"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Loader2,
  Scale,
  Truck,
  User,
  CheckCircle2,
  Trash2,
  AlertTriangle,
  Pencil,
  X,
  Check,
  RotateCcw,
  FileText,
} from "lucide-react"
import { Recepcion, RecepcionBin, COLOR_OPTIONS } from "@/types/recepcion"
import { cn } from "@/lib/utils"

// Función para obtener la fecha local en formato YYYY-MM-DD (corrige bug de timezone)
function getLocalDateString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

interface ReceptionDetailDialogProps {
  recepcionId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: () => void
}

export function ReceptionDetailDialog({
  recepcionId,
  open,
  onOpenChange,
  onUpdate,
}: ReceptionDetailDialogProps) {
  const [recepcion, setRecepcion] = useState<Recepcion | null>(null)
  const [bines, setBines] = useState<RecepcionBin[]>([])
  const [choferes, setChoferes] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [pesoInput, setPesoInput] = useState("")
  const [taraValue, setTaraValue] = useState<number>(100)
  const [addingBin, setAddingBin] = useState(false)
  
  // Selección para despacho
  const [selectedBins, setSelectedBins] = useState<number[]>([])
  const [dispatchDriverId, setDispatchDriverId] = useState<string>("")
  const [dispatching, setDispatching] = useState(false)
  const [showDispatchDialog, setShowDispatchDialog] = useState(false)

  // Estados para alertas
  const [binToDelete, setBinToDelete] = useState<number | null>(null)
  const [showFinalizeAlert, setShowFinalizeAlert] = useState(false)

  // Estados para edición de tarjeta
  const [isEditingCard, setIsEditingCard] = useState(false)
  const [editedCard, setEditedCard] = useState({
    cliente_id: 0,
    chofer_ingreso_id: null as number | null,
    tipo_pina: 'IQF' as 'IQF' | 'Jugo',
    procedencia_tipo: 'campo' as 'campo' | 'planta',
    color_etiqueta: '',
    es_rechazo: false,
    notas: '',
  })
  const [savingCard, setSavingCard] = useState(false)

  // Estados para edición de bines
  const [editingBinId, setEditingBinId] = useState<number | null>(null)
  const [editedBin, setEditedBin] = useState({
    peso_bruto: 0,
    chofer_salida_id: null as number | null,
  })
  const [savingBin, setSavingBin] = useState(false)
  const [revertingBin, setRevertingBin] = useState<number | null>(null)

  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && recepcionId) {
      fetchDetails()
      fetchChoferes()
      fetchClientes()
    } else {
      setRecepcion(null)
      setBines([])
      setPesoInput("")
      setSelectedBins([])
    }
  }, [open, recepcionId])

  // Focus input on open
  useEffect(() => {
    if (open && !showDispatchDialog && !binToDelete && !showFinalizeAlert) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open, showDispatchDialog, binToDelete, showFinalizeAlert])

  const fetchDetails = async () => {
    if (!recepcionId) return
    setLoading(true)
    try {
      const { data: recData, error: recError } = await supabase
        .from("recepciones")
        .select(`
          *,
          clientes (nombre),
          choferes (nombre)
        `)
        .eq("id", recepcionId)
        .single()

      if (recError) throw recError
      setRecepcion(recData)

      const { data: binData, error: binError } = await supabase
        .from("recepcion_bines")
        .select(`
          *,
          choferes:chofer_salida_id (nombre)
        `)
        .eq("recepcion_id", recepcionId)
        .order("numero_par", { ascending: true }) // Mostrar 1, 2, 3...

      if (binError) throw binError
      setBines(binData || [])
    } catch (error) {
      console.error(error)
      toast.error("Error al cargar detalles")
    } finally {
      setLoading(false)
    }
  }

  const fetchChoferes = async () => {
    const { data } = await supabase
      .from("choferes")
      .select("id, nombre")
      .eq("activo", true)
      .eq("tipo", "interno")
      .order("nombre")
    if (data) setChoferes(data)
  }

  const fetchClientes = async () => {
    const { data } = await supabase
      .from("clientes")
      .select("id, nombre")
      .eq("activo", true)
      .order("nombre")
    if (data) setClientes(data)
  }

  const handleAddBin = async () => {
    if (!pesoInput || !recepcionId) return
    const pesoBruto = parseFloat(pesoInput)
    if (isNaN(pesoBruto) || pesoBruto <= 0) {
      toast.error("Peso inválido")
      return
    }

    setAddingBin(true)
    try {
      // Calcular siguiente número de par
      const maxPar = bines.length > 0 ? Math.max(...bines.map(b => b.numero_par)) : 0
      const nextPar = maxPar + 1
      const pesoNeto = pesoBruto - taraValue

      const { data, error } = await supabase
        .from("recepcion_bines")
        .insert({
          recepcion_id: recepcionId,
          numero_par: nextPar,
          peso_bruto: pesoBruto,
          peso_neto: pesoNeto,
          tara_aplicada: taraValue,
          estado: 'en_patio'
        })
        .select()
        .single()

      if (error) throw error

      setBines([...bines, data])
      setPesoInput("")
      toast.success(`Par agregado`)
      onUpdate() // Actualizar tarjeta padre
      
      // Mantener foco
      setTimeout(() => inputRef.current?.focus(), 0)
    } catch (error) {
      console.error(error)
      toast.error("Error al agregar bin")
    } finally {
      setAddingBin(false)
    }
  }

  const confirmDeleteBin = async () => {
    if (!binToDelete) return
    try {
      const { error } = await supabase
        .from("recepcion_bines")
        .delete()
        .eq("id", binToDelete)
        .eq("estado", "en_patio") 

      if (error) throw error

      // Reordenar bins restantes para mantener secuencia 1, 2, 3...
      const binsRestantes = bines.filter(b => b.id !== binToDelete)
      const binsActualizados = binsRestantes.map((bin, index) => ({
        ...bin,
        numero_par: index + 1
      }))

      // Actualizar en Supabase los numero_par
      for (const bin of binsActualizados) {
        await supabase
          .from("recepcion_bines")
          .update({ numero_par: bin.numero_par })
          .eq("id", bin.id)
      }

      setBines(binsActualizados)
      toast.success("Bin eliminado")
      onUpdate()
    } catch (error) {
      toast.error("No se puede eliminar un bin despachado o hubo un error")
    } finally {
      setBinToDelete(null)
    }
  }

  const handleSelectBin = (binId: number, checked: boolean) => {
    if (checked) {
      setSelectedBins([...selectedBins, binId])
    } else {
      setSelectedBins(selectedBins.filter(id => id !== binId))
    }
  }

  const handleDispatch = async () => {
    if (selectedBins.length === 0 || !dispatchDriverId) return

    setDispatching(true)
    try {
      const { error } = await supabase
        .from("recepcion_bines")
        .update({
          estado: 'despachado',
          chofer_salida_id: parseInt(dispatchDriverId),
          fecha_despacho: new Date().toISOString()
        })
        .in("id", selectedBins)

      if (error) throw error

      toast.success(`${selectedBins.length} pesas despachadas`)
      setShowDispatchDialog(false)
      setSelectedBins([])
      setDispatchDriverId("")
      fetchDetails() // Recargar para mostrar choferes asignados
      onUpdate()
    } catch (error) {
      console.error(error)
      toast.error("Error al despachar")
    } finally {
      setDispatching(false)
    }
  }

  const confirmFinalize = async () => {
    if (!recepcionId || !recepcion) return

    try {
      // 1. Finalizar la recepción
      const { error: updateError } = await supabase
        .from("recepciones")
        .update({ estado: 'finalizado' })
        .eq("id", recepcionId)

      if (updateError) throw updateError

      // 2. Calcular kilos totales y por chofer
      const binesDespachados = bines.filter(b => b.estado === 'despachado')
      const totalKilosDespachados = binesDespachados.reduce((sum, b) => sum + (b.peso_neto || 0), 0)
      
      // Agrupar por chofer
      const choferesPorKilos: { [key: string]: { nombre: string; kilos: number } } = {}
      binesDespachados.forEach(bin => {
        const choferNombre = bin.choferes?.nombre || "Sin asignar"
        if (!choferesPorKilos[choferNombre]) {
          choferesPorKilos[choferNombre] = { nombre: choferNombre, kilos: 0 }
        }
        choferesPorKilos[choferNombre].kilos += bin.peso_neto || 0
      })

      // Formatear lista de choferes con saltos de línea
      const choferesFormateados = Object.values(choferesPorKilos)
        .map(c => {
          const porcentaje = totalKilosDespachados > 0 
            ? ((c.kilos / totalKilosDespachados) * 100).toFixed(1)
            : "0.0"
          return `${c.nombre}: ${porcentaje}%`
        })
        .join('\n')

      // 3. Calcular número de semana
      const fecha = new Date(recepcion.fecha_creacion)
      const inicioAno = new Date(fecha.getFullYear(), 0, 1)
      const diasDiferencia = Math.floor((fecha.getTime() - inicioAno.getTime()) / (1000 * 60 * 60 * 24))
      const numeroSemana = Math.ceil((diasDiferencia + inicioAno.getDay() + 1) / 7)

      // 4. Crear registro en compras_regulares
      const { error: compraError } = await supabase
        .from("compras_regulares")
        .insert({
          fecha: getLocalDateString(fecha), // Usa fecha local de Costa Rica, no UTC
          numero_semana: numeroSemana,
          cliente_id: recepcion.cliente_id,
          chofer_id: null, // NULL porque viene de recepción
          choferes_info: choferesFormateados, // Lista completa con porcentajes
          tipo_pina: recepcion.tipo_pina || 'IQF', // Default a IQF si no está definido
          procedencia_tipo: recepcion.procedencia_tipo || 'campo', // Default a campo
          numero_kilos: totalKilosDespachados,
          // Campos financieros vacíos (para que el admin los complete después)
          precio_piña: null,
          total_a_pagar: null,
          numero_boleta: null,
          nb_tickete: null,
          tipo_pago_id: null,
          numero_deposito: null,
          numero_factura: null,
          lugar_procedencia: null,
          pago_dolares: false,
          pagado: false
        })

      if (compraError) throw compraError

      toast.success("Tarjeta finalizada y registrada en Compras Regulares")
      onOpenChange(false)
      onUpdate()
    } catch (error) {
      console.error(error)
      toast.error("Error al finalizar: " + (error instanceof Error ? error.message : "Error desconocido"))
    } finally {
      setShowFinalizeAlert(false)
    }
  }

  // Funciones para editar tarjeta
  const handleEditCard = () => {
    if (!recepcion) return
    setEditedCard({
      cliente_id: recepcion.cliente_id || 0,
      chofer_ingreso_id: recepcion.chofer_ingreso_id,
      tipo_pina: recepcion.tipo_pina || 'IQF',
      procedencia_tipo: recepcion.procedencia_tipo || 'campo',
      color_etiqueta: recepcion.color_etiqueta,
      es_rechazo: recepcion.es_rechazo,
      notas: recepcion.notas || '',
    })
    setIsEditingCard(true)
  }

  const handleSaveCard = async () => {
    if (!recepcionId) return
    
    // Validaciones
    if (!editedCard.cliente_id) {
      toast.error("Debe seleccionar un cliente")
      return
    }
    // Chofer no es obligatorio al editar
    
    setSavingCard(true)
    try {
      const { error } = await supabase
        .from("recepciones")
        .update({
          cliente_id: editedCard.cliente_id,
          chofer_ingreso_id: editedCard.es_rechazo ? null : editedCard.chofer_ingreso_id,
          tipo_pina: editedCard.tipo_pina,
          procedencia_tipo: editedCard.procedencia_tipo,
          color_etiqueta: editedCard.color_etiqueta,
          es_rechazo: editedCard.es_rechazo,
          notas: editedCard.notas || null,
        })
        .eq("id", recepcionId)

      if (error) throw error

      toast.success("Tarjeta actualizada exitosamente")
      fetchDetails()
      onUpdate()
      setIsEditingCard(false)
    } catch (error) {
      console.error(error)
      toast.error("Error al actualizar la tarjeta")
    } finally {
      setSavingCard(false)
    }
  }

  // Funciones para editar bines
  const handleEditBin = (bin: RecepcionBin) => {
    setEditingBinId(bin.id)
    setEditedBin({
      peso_bruto: bin.peso_bruto,
      chofer_salida_id: bin.chofer_salida_id,
    })
  }

  const handleSaveBin = async (binId: number) => {
    // Buscar el bin original para obtener la tara histórica
    const binOriginal = bines.find(b => b.id === binId)
    if (!binOriginal) {
      toast.error("No se encontró el bin")
      return
    }
    
    // Usar la tara histórica para el cálculo
    const pesoNeto = editedBin.peso_bruto - binOriginal.tara_aplicada
    
    if (editedBin.peso_bruto <= 0) {
      toast.error("El peso debe ser mayor a 0")
      return
    }

    setSavingBin(true)
    try {
      const { error } = await supabase
        .from("recepcion_bines")
        .update({
          peso_bruto: editedBin.peso_bruto,
          peso_neto: pesoNeto,
          chofer_salida_id: editedBin.chofer_salida_id,
        })
        .eq("id", binId)

      if (error) throw error

      toast.success("Bin actualizado exitosamente")
      fetchDetails()
      onUpdate()
      setEditingBinId(null)
    } catch (error) {
      console.error(error)
      toast.error("Error al actualizar el bin")
    } finally {
      setSavingBin(false)
    }
  }

  const handleRevertBin = async (binId: number) => {
    setRevertingBin(binId)
    try {
      const { error } = await supabase
        .from("recepcion_bines")
        .update({
          estado: 'en_patio',
          chofer_salida_id: null,
          fecha_despacho: null,
        })
        .eq("id", binId)

      if (error) throw error

      toast.success("Bin revertido a patio")
      fetchDetails()
      onUpdate()
    } catch (error) {
      console.error(error)
      toast.error("Error al revertir el bin")
    } finally {
      setRevertingBin(null)
    }
  }

  // Cálculos
  const totalKilos = bines.reduce((sum, b) => sum + (b.peso_neto || 0), 0)
  const binesPendientes = bines.filter(b => b.estado === 'en_patio')
  const binesDespachados = bines.filter(b => b.estado === 'despachado')
  const allDispatched = bines.length > 0 && binesPendientes.length === 0
  const binesOrdenados = [...bines].sort((a, b) => (b.numero_par || 0) - (a.numero_par || 0))

  if (!recepcion) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[100vw] w-[100vw] h-[100dvh] sm:max-w-[95vw] sm:w-full sm:h-[90vh] flex flex-col p-0 gap-0 overflow-hidden [&>button]:hidden">
          {/* Header */}
          <div className={cn("px-4 sm:px-6 py-3 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center shrink-0 gap-3 sm:gap-0", recepcion.color_etiqueta)}>
            {!isEditingCard ? (
              // Vista normal
              <>
                <div className="text-white min-w-0 flex-1 w-full">
                  <DialogTitle className="text-lg sm:text-2xl font-bold flex items-center gap-2">
                    <span className="truncate flex-1">{COLOR_OPTIONS.find(c => c.value === recepcion.color_etiqueta)?.id} - {recepcion.clientes?.nombre}</span>
                    {recepcion.es_rechazo && <Badge variant="destructive" className="ml-2 border-white shrink-0">Rechazo</Badge>}
                  </DialogTitle>
                  <DialogDescription className="text-white/80 mt-1 text-xs sm:text-sm">
                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="flex items-center gap-1"><User className="h-3 w-3 sm:h-4 sm:w-4" /> {recepcion.choferes?.nombre || "Sin Chofer"}</span>
                      <span className="flex items-center gap-1" suppressHydrationWarning><Scale className="h-3 w-3 sm:h-4 sm:w-4" /> {totalKilos.toLocaleString()} kg</span>
                      <span className="flex items-center gap-1">Tipo: {recepcion.tipo_pina || "IQF"}</span>
                      {binesPendientes.length > 0 && (
                        <span className="flex items-center gap-1 text-white font-bold" suppressHydrationWarning>
                          Faltan: {binesPendientes.reduce((sum, b) => sum + (b.peso_neto || 0), 0).toLocaleString()} kg
                        </span>
                      )}
                    </span>
                    {recepcion.notas && (
                      <span className="flex items-start gap-1 italic mt-2 w-full" title={recepcion.notas}>
                        <FileText className="h-3 w-3 sm:h-4 sm:w-4 mt-0.5 shrink-0" />
                        <span className="truncate w-full">{recepcion.notas}</span>
                      </span>
                    )}
                  </DialogDescription>
                </div>
                <div className="flex items-center justify-between w-full sm:w-auto sm:justify-end gap-2 sm:gap-4 sm:ml-4 border-t sm:border-t-0 border-white/20 pt-2 sm:pt-0">
                  <Badge variant="secondary" className="text-xs sm:text-lg px-2 sm:px-3 py-0.5 sm:py-1">
                    #{recepcion.id}
                  </Badge>
                  <div className="flex items-center gap-2">
                    {recepcion.estado !== 'finalizado' && (
                      <>
                        <Button 
                          variant="secondary"
                          size="sm"
                          onClick={handleEditCard}
                          className="h-7 text-xs sm:h-9 sm:text-sm whitespace-nowrap"
                        >
                          <Pencil className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                          Editar
                        </Button>
                        <Button 
                          variant={allDispatched ? "destructive" : "secondary"}
                          size="sm"
                          onClick={() => setShowFinalizeAlert(true)}
                          disabled={!allDispatched}
                          className={cn("h-7 text-xs sm:h-9 sm:text-sm whitespace-nowrap", allDispatched && "animate-pulse")}
                        >
                          {allDispatched 
                            ? "Finalizar" 
                            : `${binesPendientes.length}/${bines.length}`
                          }
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onOpenChange(false)}
                      className="h-8 w-8 sm:h-10 sm:w-10 text-white hover:bg-white/20 ml-2"
                    >
                      <X className="h-5 w-5 sm:h-6 sm:w-6" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              // Modo edición
              <div className="flex flex-col w-full gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-white font-semibold text-lg">Editar Tarjeta</span>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsEditingCard(false)}
                      className="text-white hover:bg-white/20"
                      disabled={savingCard}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancelar
                    </Button>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={handleSaveCard}
                      disabled={savingCard}
                    >
                      {savingCard ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
                      Guardar
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <Select 
                    value={editedCard.cliente_id.toString()} 
                    onValueChange={(val) => setEditedCard({...editedCard, cliente_id: parseInt(val)})}
                  >
                    <SelectTrigger className="bg-white text-foreground h-8 text-xs">
                      <SelectValue placeholder="Cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((c) => (
                        <SelectItem key={c.id} value={c.id.toString()}>{c.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {!editedCard.es_rechazo && (
                    <Select 
                      value={editedCard.chofer_ingreso_id?.toString() || ''} 
                      onValueChange={(val) => setEditedCard({...editedCard, chofer_ingreso_id: val ? parseInt(val) : null})}
                    >
                      <SelectTrigger className="bg-white text-foreground h-8 text-xs">
                        <SelectValue placeholder="Chofer Ingreso" />
                      </SelectTrigger>
                      <SelectContent>
                        {choferes.map((c) => (
                          <SelectItem key={c.id} value={c.id.toString()}>{c.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  <Select 
                    value={editedCard.tipo_pina} 
                    onValueChange={(val) => setEditedCard({...editedCard, tipo_pina: val as 'IQF' | 'Jugo'})}
                  >
                    <SelectTrigger className="bg-white text-foreground h-8 text-xs">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IQF">IQF</SelectItem>
                      <SelectItem value="Jugo">Jugo</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select 
                    value={editedCard.procedencia_tipo} 
                    onValueChange={(val) => setEditedCard({...editedCard, procedencia_tipo: val as 'campo' | 'planta'})}
                  >
                    <SelectTrigger className="bg-white text-foreground h-8 text-xs">
                      <SelectValue placeholder="Procedencia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="campo">Campo</SelectItem>
                      <SelectItem value="planta">Planta</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex gap-1 flex-wrap">
                    {COLOR_OPTIONS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        className={cn(
                          "h-6 w-6 rounded-full transition-all flex items-center justify-center text-[10px] text-white font-bold",
                          color.value,
                          editedCard.color_etiqueta === color.value && "ring-2 ring-white scale-110"
                        )}
                        onClick={() => setEditedCard({...editedCard, color_etiqueta: color.value})}
                        title={color.label}
                      >
                        {color.id}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Notas Editables */}
                <div className="relative">
                  <Textarea
                    value={editedCard.notas || ''}
                    onChange={(e) => setEditedCard({...editedCard, notas: e.target.value})}
                    placeholder="Notas adicionales..."
                    className="min-h-[60px] resize-none bg-white text-foreground text-xs"
                    maxLength={500}
                  />
                  <div className="absolute bottom-1 right-2 text-[10px] text-muted-foreground">
                    {editedCard.notas?.length || 0}/500
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto md:overflow-hidden flex flex-col md:flex-row">
            {/* Panel Izquierdo: Input y Resumen */}
            <div className="w-full md:w-80 lg:w-96 shrink-0 bg-muted/20 border-r-0 md:border-r border-b md:border-b-0 p-3 sm:p-4 flex flex-col gap-3 sm:gap-4">
              {recepcion.estado !== 'finalizado' && (
                <div className="bg-card p-3 sm:p-4 rounded-lg border shadow-sm space-y-2 sm:space-y-3">
                  <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                    <Scale className="h-4 w-4 text-primary" /> Nuevo Pesaje
                  </h3>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        ref={inputRef}
                        type="number"
                        placeholder="Peso"
                        value={pesoInput}
                        onChange={(e) => setPesoInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddBin()}
                        className="text-base sm:text-lg font-bold h-10 sm:h-12 flex-1"
                        autoComplete="off"
                      />
                      <div className="flex items-center bg-muted rounded-md px-2 h-10 sm:h-12 shrink-0">
                        <span className="text-lg font-bold text-muted-foreground mr-1">-</span>
                        <Input
                          type="number"
                          value={taraValue}
                          onChange={(e) => setTaraValue(Number(e.target.value) || 0)}
                          className="w-16 sm:w-20 text-base sm:text-lg font-bold border-0 bg-transparent p-0 focus-visible:ring-0"
                        />
                      </div>
                      <Button 
                        size="icon" 
                        className="h-10 w-10 sm:h-12 sm:w-12 shrink-0" 
                        onClick={handleAddBin}
                        disabled={addingBin || !pesoInput}
                      >
                        {addingBin ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />}
                      </Button>
                    </div>
                    {pesoInput && !isNaN(parseFloat(pesoInput)) && (
                      <div className="text-xs sm:text-sm text-center text-muted-foreground bg-muted py-1 rounded">
                        Bruto: <span className="font-medium">{parseFloat(pesoInput).toLocaleString()} kg</span>
                        {" → "}
                        Neto: <span className="font-bold text-foreground">{(parseFloat(pesoInput) - taraValue).toLocaleString()} kg</span>
                        <span className="text-xs text-muted-foreground ml-1">(Tara: -{taraValue} kg)</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-green-50 p-2 sm:p-3 rounded-lg border border-green-100 text-center sm:text-left">
                  <span className="text-[10px] sm:text-xs text-green-600 font-medium">En Patio</span>
                  <div className="text-xl sm:text-2xl font-bold text-green-700 leading-tight">{binesPendientes.length}</div>
                  <div className="text-[10px] sm:text-xs text-green-600">pesas</div>
                </div>
                <div className="bg-blue-50 p-2 sm:p-3 rounded-lg border border-blue-100 text-center sm:text-left">
                  <span className="text-[10px] sm:text-xs text-blue-600 font-medium">Despachados</span>
                  <div className="text-xl sm:text-2xl font-bold text-blue-700 leading-tight">{binesDespachados.length}</div>
                  <div className="text-[10px] sm:text-xs text-blue-600">pesas</div>
                </div>
              </div>

              <Button 
                className="w-full" 
                variant="outline"
                size="sm"
                disabled={selectedBins.length === 0}
                onClick={() => setShowDispatchDialog(true)}
              >
                <Truck className="mr-2 h-4 w-4" />
                Despachar ({selectedBins.length})
              </Button>
            </div>

            {/* Panel Derecho: Lista de Bines */}
            <div className="flex-1 flex flex-col overflow-hidden bg-background min-h-0">
              <div className="p-2 border-b bg-muted/10 flex justify-between items-center text-xs sm:text-sm px-3 sm:px-4 shrink-0">
                <span className="font-medium text-muted-foreground">Pesas ({bines.length})</span>
                <span className="text-muted-foreground hidden sm:inline">Mayor # primero</span>
              </div>
              <div className="overflow-x-auto overflow-y-auto min-h-[150px] max-h-[calc(100dvh-300px)] sm:max-h-[calc(90vh-200px)]">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                    <TableRow>
                      <TableHead className="w-[40px] text-center p-1 sm:p-2">
                        <Checkbox 
                          checked={binesPendientes.length > 0 && selectedBins.length === binesPendientes.length}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedBins(binesPendientes.map(b => b.id))
                            } else {
                              setSelectedBins([])
                            }
                          }}
                          disabled={binesPendientes.length === 0}
                        />
                      </TableHead>
                      <TableHead className="text-center p-1 sm:p-2 text-[10px] sm:text-sm min-w-[50px]">#</TableHead>
                      <TableHead className="text-right p-1 sm:p-2 text-[10px] sm:text-sm min-w-[70px]">Neto</TableHead>
                      <TableHead className="text-center p-1 sm:p-2 text-[10px] sm:text-sm min-w-[60px]">Estado</TableHead>
                      <TableHead className="p-1 sm:p-2 text-[10px] sm:text-sm min-w-[100px]">Destino</TableHead>
                      <TableHead className="w-[40px] p-1 sm:p-2"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bines.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground text-xs sm:text-sm">
                          Sin registros.
                        </TableCell>
                      </TableRow>
                    ) : (
                      binesOrdenados.map((bin) => (
                        <TableRow 
                          key={bin.id} 
                          className={cn(
                            "text-[10px] sm:text-sm",
                            bin.estado === 'despachado' && "bg-muted/40 text-muted-foreground hover:bg-muted/50"
                          )}
                        >
                          <TableCell className="text-center p-1 sm:p-2">
                            {bin.estado === 'en_patio' && editingBinId !== bin.id && (
                              <Checkbox 
                                checked={selectedBins.includes(bin.id)}
                                onCheckedChange={(checked) => handleSelectBin(bin.id, !!checked)}
                              />
                            )}
                          </TableCell>
                          <TableCell className="text-center font-medium p-1 sm:p-2">#{bin.numero_par}</TableCell>
                          
                          {/* Peso - Editable */}
                          <TableCell className="text-right font-bold p-1 sm:p-2">
                           {editingBinId === bin.id ? (
                               <div className="flex flex-col items-end gap-1">
                                 <Input
                                   type="number"
                                   value={editedBin.peso_bruto}
                                   onChange={(e) => setEditedBin({...editedBin, peso_bruto: Number(e.target.value) || 0})}
                                   className="w-20 h-6 text-xs text-right"
                                   autoFocus
                                 />
                                 <span className="text-[9px] text-muted-foreground">
                                   Neto: {(editedBin.peso_bruto - bin.tara_aplicada).toLocaleString()} kg (Tara: {bin.tara_aplicada}kg)
                                 </span>
                               </div>
                             ) : (
                               <div className="flex flex-col items-end">
                                 <span>{bin.peso_neto.toLocaleString()}</span>
                                 <span className="text-[9px] text-muted-foreground">({bin.peso_bruto} - {bin.tara_aplicada})</span>
                               </div>
                             )}
                          </TableCell>
                          
                          <TableCell className="text-center p-1 sm:p-2">
                            <div className={cn(
                              "inline-flex items-center rounded-full border px-1 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold",
                              bin.estado === 'en_patio' 
                                ? "border-transparent bg-green-100 text-green-700" 
                                : "text-muted-foreground border-transparent bg-secondary"
                            )}>
                              {bin.estado === 'en_patio' ? 'Patio' : 'Fuera'}
                            </div>
                          </TableCell>
                          
                          {/* Destino - Editable para despachados */}
                          <TableCell className="p-1 sm:p-2">
                            {editingBinId === bin.id && bin.estado === 'despachado' ? (
                              <Select 
                                value={editedBin.chofer_salida_id?.toString() || ''} 
                                onValueChange={(val) => setEditedBin({...editedBin, chofer_salida_id: val ? parseInt(val) : null})}
                              >
                                <SelectTrigger className="h-6 text-[10px] w-full">
                                  <SelectValue placeholder="Chofer" />
                                </SelectTrigger>
                                <SelectContent>
                                  {choferes.map((c) => (
                                    <SelectItem key={c.id} value={c.id.toString()} className="text-xs">{c.nombre}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : bin.estado === 'despachado' ? (
                              <div className="flex items-center gap-1 text-[9px] sm:text-xs truncate max-w-[80px] sm:max-w-[100px]">
                                {bin.choferes?.nombre || "-"}
                              </div>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          
                          {/* Acciones */}
                          <TableCell className="p-1 sm:p-2">
                            {recepcion.estado !== 'finalizado' && (
                              <div className="flex items-center gap-1">
                                {editingBinId === bin.id ? (
                                  <>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 hover:bg-green-100"
                                      onClick={() => handleSaveBin(bin.id)}
                                      disabled={savingBin}
                                    >
                                      {savingBin ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-5 w-5 sm:h-6 sm:w-6 text-muted-foreground hover:bg-muted"
                                      onClick={() => setEditingBinId(null)}
                                      disabled={savingBin}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </>
                                ) : (
                                  <>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 hover:bg-blue-100"
                                      onClick={() => handleEditBin(bin)}
                                      title="Editar"
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    {bin.estado === 'en_patio' && (
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-5 w-5 sm:h-6 sm:w-6 text-destructive hover:bg-destructive/10"
                                        onClick={() => setBinToDelete(bin.id)}
                                        title="Eliminar"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    )}
                                    {bin.estado === 'despachado' && (
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600 hover:bg-amber-100"
                                        onClick={() => handleRevertBin(bin.id)}
                                        disabled={revertingBin === bin.id}
                                        title="Revertir a patio"
                                      >
                                        {revertingBin === bin.id ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                          <RotateCcw className="h-3 w-3" />
                                        )}
                                      </Button>
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dispatch Dialog */}
      <Dialog open={showDispatchDialog} onOpenChange={setShowDispatchDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Despachar {selectedBins.length} Pesas</DialogTitle>
            <DialogDescription>
              Seleccione el chofer que se llevará la carga.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Select onValueChange={setDispatchDriverId} value={dispatchDriverId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione Chofer de Salida" />
              </SelectTrigger>
              <SelectContent>
                {choferes.map((c) => (
                  <SelectItem key={c.id} value={c.id.toString()}>
                    {c.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDispatchDialog(false)}>Cancelar</Button>
            <Button onClick={handleDispatch} disabled={!dispatchDriverId || dispatching}>
              {dispatching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar Despacho
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alerta de Eliminación de Bin */}
      <AlertDialog open={!!binToDelete} onOpenChange={(open) => !open && setBinToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta pesa de bines?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El peso se restará del total de la tarjeta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteBin} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Alerta de Finalizar Tarjeta */}
      <AlertDialog open={showFinalizeAlert} onOpenChange={setShowFinalizeAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              ¿Finalizar Tarjeta?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p className="font-semibold text-destructive">
                  ATENCIÓN: Revise que todos los datos estén correctos antes de despachar la piña.
                </p>
                <p>
                  Una vez finalizada, la tarjeta pasará al histórico y no se podrán agregar más pesos ni editar los datos.
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Total de bines:</strong> {bines.length} | 
                  <strong> Total kilos netos:</strong> {totalKilos.toLocaleString()} kg
                </p>
              </div>
            </AlertDialogDescription>
            {!allDispatched && (
              <div className="flex items-center gap-2 p-3 text-amber-600 bg-amber-50 rounded-md border border-amber-200 mt-3">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-semibold text-sm">Advertencia: Aún hay {binesPendientes.length} bines sin despachar en el patio.</span>
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmFinalize} className={cn(!allDispatched && "bg-amber-600 hover:bg-amber-700")}>
              {allDispatched ? "Finalizar" : "Forzar Cierre"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
