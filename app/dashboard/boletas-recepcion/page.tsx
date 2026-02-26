"use client"

import { useState, useCallback, useEffect } from "react"
import useSWR from "swr"
import { createClient } from "@/lib/supabase/client"
import { BoletaRecepcionForm } from "@/components/dashboard/forms/boleta-recepcion-form"
import { BoletasRecepcionTable } from "@/components/dashboard/tables/boletas-recepcion-table"
import { BoletaPreview } from "@/components/dashboard/boleta-preview"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Receipt } from "lucide-react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
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
import { useToast } from "@/hooks/use-toast"
import { BoletaRecepcion, BoletaFormData } from "@/types/boleta"

const supabase = createClient()

const fetcher = async () => {
  const { data, error } = await supabase
    .from("boletas_recepcion")
    .select(`
      *,
      clientes (nombre),
      choferes (nombre)
    `)
    .order("numero_boleta", { ascending: false })

  if (error) throw error
  return data
}

const fetchLookups = async () => {
  const [clientes, choferes] = await Promise.all([
    supabase.from("clientes").select("id, nombre").eq("activo", true).order("nombre"),
    supabase.from("choferes").select("id, nombre").eq("activo", true).order("nombre"),
  ])

  return {
    clientes: clientes.data || [],
    choferes: choferes.data || [],
  }
}

export default function BoletasRecepcionPage() {
  const { toast } = useToast()
  const { data: boletas = [], mutate, isLoading } = useSWR("boletas_recepcion", fetcher)
  const { data: lookups } = useSWR("lookups_boletas", fetchLookups)
  
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [viewingBoleta, setViewingBoleta] = useState<BoletaRecepcion | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const handleSubmit = useCallback(async (formData: BoletaFormData) => {
    setIsSubmitting(true)
    try {
      const isPlanta = formData.tipo_boleta === "PLANTA"
      
      const dataToInsert = {
        tipo_boleta: formData.tipo_boleta,
        fecha: formData.fecha,
        numero_semana: formData.numero_semana,
        cliente_id: parseInt(formData.cliente_id) || null,
        chofer_id: parseInt(formData.chofer_id) || null,
        placa: formData.placa || null,
        
        // PLANTA
        numero_cajas: isPlanta ? (parseInt(formData.numero_cajas) || null) : null,
        pinas_por_caja: isPlanta ? (parseInt(formData.pinas_por_caja) || null) : null,
        total_pinas: isPlanta 
          ? (parseInt(formData.numero_cajas) * parseInt(formData.pinas_por_caja)) 
          : null,
        
        // CAMPO
        cantidad_bines: !isPlanta ? (parseInt(formData.cantidad_bines) || null) : null,
        total_kilos: !isPlanta ? (parseFloat(formData.total_kilos) || null) : null,
        tipo_fruta: !isPlanta ? formData.tipo_fruta : null,
      }

      const { data, error } = await supabase
        .from("boletas_recepcion")
        .insert(dataToInsert)
        .select(`
          *,
          clientes (nombre),
          choferes (nombre)
        `)
        .single()

      if (error) throw error

      toast({ 
        title: "Boleta creada exitosamente",
        description: `Nº ${data.numero_boleta.toString().padStart(6, "0")}`
      })
      
      mutate()
      setIsFormOpen(false)
      
      // Mostrar la boleta generada
      setTimeout(() => {
        setViewingBoleta(data)
      }, 300)
      
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Ocurrió un error al crear la boleta",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [mutate, toast])

  const handleUpdateBoleta = useCallback(async (
    id: number, 
    data: { total_kilos?: number; precio_por_kilo?: number }
  ) => {
    try {
      const { error } = await supabase
        .from("boletas_recepcion")
        .update(data)
        .eq("id", id)

      if (error) throw error

      toast({ title: "Boleta actualizada exitosamente" })
      mutate()
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la boleta",
        variant: "destructive",
      })
    }
  }, [mutate, toast])

  const handleDeleteBoleta = useCallback(async () => {
    if (!deletingId) return
    
    try {
      const { error } = await supabase
        .from("boletas_recepcion")
        .delete()
        .eq("id", deletingId)

      if (error) throw error

      toast({ title: "Boleta eliminada exitosamente" })
      mutate()
    } catch (error) {
      console.error(error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la boleta",
        variant: "destructive",
      })
    } finally {
      setDeletingId(null)
    }
  }, [deletingId, mutate, toast])

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Boletas de Recepción</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="space-y-6 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Receipt className="h-6 w-6" />
              Boletas de Recepción
            </h1>
            <p className="text-muted-foreground">
              Gestión de boletas para recepción de piña
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Boleta
          </Button>
        </div>

        {/* Tabla de boletas */}
        <Card>
          <CardHeader>
            <CardTitle>Historial de Boletas</CardTitle>
          </CardHeader>
          <CardContent>
            <BoletasRecepcionTable
              boletas={boletas as BoletaRecepcion[]}
              onViewBoleta={setViewingBoleta}
              onUpdateBoleta={handleUpdateBoleta}
              onDelete={setDeletingId}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>

        {/* Dialog de formulario */}
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nueva Boleta de Recepción</DialogTitle>
            </DialogHeader>
            <BoletaRecepcionForm
              onSubmit={handleSubmit}
              onCancel={() => setIsFormOpen(false)}
              isSubmitting={isSubmitting}
              clientes={lookups?.clientes || []}
              choferes={lookups?.choferes || []}
            />
          </DialogContent>
        </Dialog>

        {/* Dialog para ver boleta */}
        <Dialog 
          open={!!viewingBoleta} 
          onOpenChange={() => setViewingBoleta(null)}
        >
          {/* Overlay nativo de Radix con opacidad 95% */}
          <DialogOverlay className="bg-white/98" />
          
          <DialogContent 
            className="max-w-xl bg-white border-0 shadow-2xl p-0 overflow-hidden"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 1)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
          >
            {/* Título oculto para accesibilidad */}
            <DialogTitle className="sr-only">
              Boleta Nº {viewingBoleta?.numero_boleta.toString().padStart(6, "0")}
            </DialogTitle>
            
            {/* Botón X para cerrar */}
            <button
              onClick={() => setViewingBoleta(null)}
              className="absolute top-3 right-3 z-50 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              title="Cerrar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18"></path>
                <path d="m6 6 12 12"></path>
              </svg>
            </button>

            {/* Contenido de la boleta */}
            {viewingBoleta && (
              <div className="p-8 bg-white">
                <BoletaPreview boleta={viewingBoleta} />
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* AlertDialog para confirmar eliminación */}
        <AlertDialog open={!!deletingId} onOpenChange={() => setDeletingId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Está seguro de eliminar esta boleta?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción no se puede deshacer. La boleta será eliminada permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteBoleta} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  )
}
