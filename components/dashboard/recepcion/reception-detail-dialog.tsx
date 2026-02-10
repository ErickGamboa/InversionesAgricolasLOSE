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
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Loader2,
  Scale,
  Truck,
  User,
  CheckCircle2,
  Trash2,
  AlertTriangle,
} from "lucide-react"
import { Recepcion, RecepcionBin } from "@/types/recepcion"
import { cn } from "@/lib/utils"

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
  const [loading, setLoading] = useState(false)
  const [pesoInput, setPesoInput] = useState("")
  const [addingBin, setAddingBin] = useState(false)
  
  // Selección para despacho
  const [selectedBins, setSelectedBins] = useState<number[]>([])
  const [dispatchDriverId, setDispatchDriverId] = useState<string>("")
  const [dispatching, setDispatching] = useState(false)
  const [showDispatchDialog, setShowDispatchDialog] = useState(false)

  // Estados para alertas
  const [binToDelete, setBinToDelete] = useState<number | null>(null)
  const [showFinalizeAlert, setShowFinalizeAlert] = useState(false)

  const supabase = createClient()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open && recepcionId) {
      fetchDetails()
      fetchChoferes()
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
        .order("numero_par", { ascending: false }) // Mostrar últimos arriba

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
      .order("nombre")
    if (data) setChoferes(data)
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
      const pesoNeto = pesoBruto - 100

      const { data, error } = await supabase
        .from("recepcion_bines")
        .insert({
          recepcion_id: recepcionId,
          numero_par: nextPar,
          peso_bruto: pesoBruto,
          peso_neto: pesoNeto,
          estado: 'en_patio'
        })
        .select()
        .single()

      if (error) throw error

      setBines([data, ...bines])
      setPesoInput("")
      toast.success(`Par #${nextPar} agregado`)
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

      setBines(bines.filter(b => b.id !== binToDelete))
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

      toast.success(`${selectedBins.length} pares despachados`)
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
    if (!recepcionId) return

    try {
      const { error } = await supabase
        .from("recepciones")
        .update({ estado: 'finalizado' })
        .eq("id", recepcionId)

      if (error) throw error

      toast.success("Tarjeta finalizada")
      onOpenChange(false)
      onUpdate()
    } catch (error) {
      console.error(error)
      toast.error("Error al finalizar")
    } finally {
      setShowFinalizeAlert(false)
    }
  }

  // Cálculos
  const totalKilos = bines.reduce((sum, b) => sum + (b.peso_neto || 0), 0)
  const binesPendientes = bines.filter(b => b.estado === 'en_patio')
  const binesDespachados = bines.filter(b => b.estado === 'despachado')
  const allDispatched = bines.length > 0 && binesPendientes.length === 0

  if (!recepcion) return null

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] w-full max-h-[90vh] h-full flex flex-col p-0 gap-0 overflow-hidden sm:max-w-[95vw]">
          {/* Header */}
          <div className={cn("px-6 py-4 border-b flex justify-between items-center shrink-0", recepcion.color_etiqueta)}>
            <div className="text-white">
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                {recepcion.clientes?.nombre}
                {recepcion.es_rechazo && <Badge variant="destructive" className="ml-2 border-white">Rechazo</Badge>}
              </DialogTitle>
              <DialogDescription className="text-white/80 mt-1 flex gap-4">
                <span className="flex items-center gap-1"><User className="h-4 w-4" /> {recepcion.choferes?.nombre || "Sin Chofer"}</span>
                <span className="flex items-center gap-1"><Scale className="h-4 w-4" /> {totalKilos.toLocaleString()} kg Total</span>
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-lg px-3 py-1">
                #{recepcion.id}
              </Badge>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => setShowFinalizeAlert(true)}
                disabled={bines.length === 0}
                className={cn(allDispatched ? "animate-pulse" : "opacity-80")}
              >
                {allDispatched ? "Finalizar Tarjeta" : "Cerrar (Pendientes)"}
              </Button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
            {/* Panel Izquierdo: Input y Resumen */}
            <div className="w-full md:w-96 shrink-0 bg-muted/20 border-r-0 md:border-r border-b md:border-b-0 p-4 flex flex-col gap-4 overflow-y-auto max-h-[40vh] md:max-h-full">
              {recepcion.estado !== 'finalizado' && (
                <div className="bg-card p-4 rounded-lg border shadow-sm space-y-3">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Scale className="h-4 w-4 text-primary" /> Nuevo Pesaje
                  </h3>
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        ref={inputRef}
                        type="number"
                        placeholder="Peso Bruto"
                        value={pesoInput}
                        onChange={(e) => setPesoInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddBin()}
                        className="text-lg font-bold h-12"
                        autoComplete="off"
                      />
                      <Button 
                        size="icon" 
                        className="h-12 w-12 shrink-0" 
                        onClick={handleAddBin}
                        disabled={addingBin || !pesoInput}
                      >
                        {addingBin ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-6 w-6" />}
                      </Button>
                    </div>
                    {pesoInput && !isNaN(parseFloat(pesoInput)) && (
                      <div className="text-sm text-center text-muted-foreground bg-muted py-1 rounded">
                        Neto estimado: <span className="font-bold text-foreground">{(parseFloat(pesoInput) - 100).toLocaleString()} kg</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                    <span className="text-xs text-green-600 font-medium">En Patio</span>
                    <div className="text-2xl font-bold text-green-700">{binesPendientes.length}</div>
                    <div className="text-xs text-green-600">pares</div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <span className="text-xs text-blue-600 font-medium">Despachados</span>
                    <div className="text-2xl font-bold text-blue-700">{binesDespachados.length}</div>
                    <div className="text-xs text-blue-600">pares</div>
                  </div>
                </div>

                <div className="bg-card p-4 rounded-lg border shadow-sm">
                  <h3 className="font-semibold mb-2">Acciones</h3>
                  <Button 
                    className="w-full" 
                    variant="outline"
                    disabled={selectedBins.length === 0}
                    onClick={() => setShowDispatchDialog(true)}
                  >
                    <Truck className="mr-2 h-4 w-4" />
                    Despachar ({selectedBins.length})
                  </Button>
                </div>
              </div>
            </div>

            {/* Panel Derecho: Lista de Bines */}
            <div className="flex-1 flex flex-col overflow-hidden bg-background">
              <div className="p-2 border-b bg-muted/10 flex justify-between items-center text-sm px-4">
                <span className="font-medium text-muted-foreground">Listado de Bines ({bines.length})</span>
                <span className="text-xs text-muted-foreground">Ordenados por llegada (Reciente arriba)</span>
              </div>
              <ScrollArea className="flex-1">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                    <TableRow>
                      <TableHead className="w-[50px] text-center">
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
                      <TableHead className="text-center"># Par</TableHead>
                      <TableHead className="text-right">Peso Bruto</TableHead>
                      <TableHead className="text-right">Peso Neto</TableHead>
                      <TableHead className="text-center">Estado</TableHead>
                      <TableHead>Destino / Chofer</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bines.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                          No hay bines registrados. Comience a pesar.
                        </TableCell>
                      </TableRow>
                    ) : (
                      bines.map((bin) => (
                        <TableRow 
                          key={bin.id} 
                          className={cn(
                            bin.estado === 'despachado' && "bg-muted/40 text-muted-foreground hover:bg-muted/50"
                          )}
                        >
                          <TableCell className="text-center">
                            {bin.estado === 'en_patio' && (
                              <Checkbox 
                                checked={selectedBins.includes(bin.id)}
                                onCheckedChange={(checked) => handleSelectBin(bin.id, !!checked)}
                              />
                            )}
                          </TableCell>
                          <TableCell className="text-center font-medium">#{bin.numero_par}</TableCell>
                          <TableCell className="text-right">{bin.peso_bruto.toLocaleString()} kg</TableCell>
                          <TableCell className="text-right font-bold">{bin.peso_neto.toLocaleString()} kg</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={bin.estado === 'en_patio' ? "secondary" : "outline"} className={cn(
                              bin.estado === 'en_patio' ? "bg-green-100 text-green-700 hover:bg-green-200" : "text-muted-foreground"
                            )}>
                              {bin.estado === 'en_patio' ? 'En Patio' : 'Despachado'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {bin.estado === 'despachado' ? (
                              <div className="flex items-center gap-1 text-xs">
                                <Truck className="h-3 w-3" />
                                {bin.choferes?.nombre || "Sin datos"}
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {bin.estado === 'en_patio' && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 text-destructive hover:bg-destructive/10"
                                onClick={() => setBinToDelete(bin.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dispatch Dialog */}
      <Dialog open={showDispatchDialog} onOpenChange={setShowDispatchDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Despachar {selectedBins.length} Pares</DialogTitle>
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
            <AlertDialogTitle>¿Eliminar este par de bines?</AlertDialogTitle>
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
            <AlertDialogTitle>¿Finalizar Tarjeta?</AlertDialogTitle>
            <AlertDialogDescription>
              La tarjeta pasará al histórico y no se podrán agregar más pesos.
            </AlertDialogDescription>
            {!allDispatched && (
              <div className="flex items-center gap-2 p-3 text-amber-600 bg-amber-50 rounded-md border border-amber-200">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-semibold text-sm">Advertencia: Aún hay bines sin despachar en el patio.</span>
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
