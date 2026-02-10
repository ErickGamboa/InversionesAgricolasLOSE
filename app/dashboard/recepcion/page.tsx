"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Plus, Search, Filter, History, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ReceptionCard } from "@/components/dashboard/recepcion/reception-card"
import { CreateReceptionDialog } from "@/components/dashboard/recepcion/create-reception-dialog"
import { ReceptionDetailDialog } from "@/components/dashboard/recepcion/reception-detail-dialog"
import { Recepcion } from "@/types/recepcion"
import { toast } from "sonner"

export default function RecepcionPage() {
  const [recepciones, setRecepciones] = useState<Recepcion[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("patio")
  const [searchTerm, setSearchTerm] = useState("")
  
  // Dialog states
  const [showCreate, setShowCreate] = useState(false)
  const [selectedReceptionId, setSelectedReceptionId] = useState<number | null>(null)
  const [showDetail, setShowDetail] = useState(false)

  const supabase = createClient()

  const fetchRecepciones = useCallback(async () => {
    setLoading(true)
    try {
      const estado = activeTab === "patio" ? "pendiente" : "finalizado"
      
      const { data, error } = await supabase
        .from("recepciones")
        .select(`
          *,
          clientes (nombre),
          choferes (nombre),
          recepcion_bines (
            id,
            peso_neto,
            estado
          )
        `)
        .eq("estado", estado)
        .order("fecha_creacion", { ascending: false })
        .limit(activeTab === "historico" ? 50 : 1000)

      if (error) throw error
      setRecepciones(data as any)
    } catch (error) {
      console.error(error)
      toast.error("Error al cargar recepciones")
    } finally {
      setLoading(false)
    }
  }, [activeTab, supabase])

  useEffect(() => {
    fetchRecepciones()
  }, [fetchRecepciones])

  const handleCardClick = (id: number) => {
    setSelectedReceptionId(id)
    setShowDetail(true)
  }

  const handleCreateSuccess = (id: number) => {
    fetchRecepciones()
    // Opcional: Abrir detalle inmediatamente
    setSelectedReceptionId(id)
    setShowDetail(true)
  }

  const filteredRecepciones = recepciones.filter((rec) => 
    rec.clientes?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rec.choferes?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rec.id.toString().includes(searchTerm)
  )

  return (
    <div className="flex flex-col h-full gap-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recepción de Fruta</h1>
          <p className="text-muted-foreground">Gestión de entrada y despacho de bines.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Nueva Recepción
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center gap-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[400px]">
            <TabsList>
              <TabsTrigger value="patio" className="gap-2">
                <Truck className="h-4 w-4" /> En Patio
              </TabsTrigger>
              <TabsTrigger value="historico" className="gap-2">
                <History className="h-4 w-4" /> Histórico
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative w-72">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por cliente, chofer o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-48 bg-muted rounded-lg" />
            ))}
          </div>
        ) : filteredRecepciones.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed rounded-lg">
            <Filter className="h-10 w-10 mb-2 opacity-20" />
            <p>No hay recepciones en esta vista</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-10">
            {filteredRecepciones.map((rec: any) => {
              // Calcular totales desde los bines incluidos en la query
              const bines = rec.recepcion_bines || []
              const totalKilos = bines.reduce((acc: number, b: any) => acc + (b.peso_neto || 0), 0)
              const binesDespachados = bines.filter((b: any) => b.estado === 'despachado').length

              return (
                <ReceptionCard
                  key={rec.id}
                  recepcion={rec}
                  totalKilos={totalKilos}
                  binesTotal={bines.length}
                  binesDespachados={binesDespachados}
                  onClick={() => handleCardClick(rec.id)}
                />
              )
            })}
          </div>
        )}
      </div>

      <CreateReceptionDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onSuccess={handleCreateSuccess}
      />

      <ReceptionDetailDialog
        recepcionId={selectedReceptionId}
        open={showDetail}
        onOpenChange={setShowDetail}
        onUpdate={fetchRecepciones}
      />
    </div>
  )
}
