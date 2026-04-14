"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Plus, Search, Filter, History, Truck, CalendarDays, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { SearchableSelect } from "@/components/ui/searchable-select"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { ReceptionCard } from "@/components/dashboard/recepcion/reception-card"
import { CreateReceptionDialog } from "@/components/dashboard/recepcion/create-reception-dialog"
import { ReceptionDetailDialog } from "@/components/dashboard/recepcion/reception-detail-dialog"
import { Recepcion } from "@/types/recepcion"
import { toast } from "sonner"

const PAGE_SIZE = 20

function buildPageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | "ellipsis")[] = [1]
  if (current > 3) pages.push("ellipsis")
  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let i = start; i <= end; i++) pages.push(i)
  if (current < total - 2) pages.push("ellipsis")
  pages.push(total)
  return pages
}

export default function RecepcionPage() {
  const [recepciones, setRecepciones] = useState<Recepcion[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("patio")
  const [searchTerm, setSearchTerm] = useState("")

  // Historico: pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  // Historico: date range filter
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")

  // Historico: chofer interno filter
  const [choferFiltro, setChoferFiltro] = useState("")
  const [choferes, setChoferes] = useState<{ id: number; nombre: string }[]>([])

  // Dialog states
  const [showCreate, setShowCreate] = useState(false)
  const [selectedReceptionId, setSelectedReceptionId] = useState<number | null>(null)
  const [showDetail, setShowDetail] = useState(false)

  const supabase = createClient()

  // Load internal drivers once on mount
  useEffect(() => {
    supabase
      .from("choferes")
      .select("id, nombre")
      .eq("tipo", "interno")
      .eq("activo", true)
      .order("nombre")
      .then(({ data }) => {
        if (data) setChoferes(data as any)
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Reset all historico state when switching tabs
  useEffect(() => {
    setCurrentPage(1)
    setFechaDesde("")
    setFechaHasta("")
    setChoferFiltro("")
    setSearchTerm("")
  }, [activeTab])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [fechaDesde, fechaHasta, choferFiltro])

  const fetchRecepciones = useCallback(async () => {
    setLoading(true)
    try {
      if (activeTab === "patio") {
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
          .eq("estado", "pendiente")
          .order("fecha_creacion", { ascending: false })
          .limit(1000)

        if (error) throw error
        setRecepciones(data as any)
        return
      }

      // Historico: paginated + date-filtered + optional chofer filter

      // If filtering by chofer, first resolve which recepcion IDs qualify
      let matchingIds: number[] | null = null
      if (choferFiltro) {
        const { data: binesData, error: binesError } = await supabase
          .from("recepcion_bines")
          .select("recepcion_id")
          .eq("chofer_salida_id", choferFiltro)

        if (binesError) throw binesError

        const ids = [...new Set((binesData as any[]).map((b) => b.recepcion_id))] as number[]

        if (ids.length === 0) {
          setTotalCount(0)
          setRecepciones([])
          setLoading(false)
          return
        }
        matchingIds = ids
      }

      const from = (currentPage - 1) * PAGE_SIZE
      const to = from + PAGE_SIZE - 1

      const applyFilters = (query: any) => {
        let q = query.eq("estado", "finalizado")
        if (fechaDesde) q = q.gte("fecha_creacion", `${fechaDesde}T00:00:00-06:00`)
        if (fechaHasta) q = q.lte("fecha_creacion", `${fechaHasta}T23:59:59-06:00`)
        if (matchingIds !== null) q = q.in("id", matchingIds)
        return q
      }

      const [{ count, error: countError }, { data, error: dataError }] = await Promise.all([
        applyFilters(
          supabase.from("recepciones").select("*", { count: "exact", head: true })
        ),
        applyFilters(
          supabase.from("recepciones").select(`
            *,
            clientes (nombre),
            choferes (nombre),
            recepcion_bines (
              id,
              peso_neto,
              estado
            )
          `)
        )
          .order("fecha_creacion", { ascending: false })
          .range(from, to),
      ])

      if (countError) throw countError
      if (dataError) throw dataError

      setTotalCount(count ?? 0)
      setRecepciones(data as any)
    } catch (error) {
      console.error(error)
      toast.error("Error al cargar recepciones")
    } finally {
      setLoading(false)
    }
  }, [activeTab, currentPage, fechaDesde, fechaHasta, choferFiltro, supabase])

  useEffect(() => {
    fetchRecepciones()
  }, [fetchRecepciones])

  const handleCardClick = (id: number) => {
    setSelectedReceptionId(id)
    setShowDetail(true)
  }

  const handleCreateSuccess = (id: number) => {
    fetchRecepciones()
    setSelectedReceptionId(id)
    setShowDetail(true)
  }

  const handleDeleteRecepcion = async (id: number) => {
    try {
      const { error } = await supabase
        .from("recepciones")
        .delete()
        .eq("id", id)

      if (error) throw error

      toast.success("Recepción eliminada")
      fetchRecepciones()
    } catch (error) {
      console.error(error)
      toast.error("Error al eliminar recepción")
    }
  }

  const filteredRecepciones = recepciones.filter((rec) =>
    rec.clientes?.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rec.choferes?.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rec.id.toString().includes(searchTerm)
  )

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)
  const hasActiveFilters = fechaDesde || fechaHasta || choferFiltro

  return (
    <div className="flex flex-col h-full gap-6">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
        <SidebarTrigger className="-ml-1" />
      </header>

      <div className="flex justify-between items-center px-6 pt-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recepción de Fruta</h1>
          <p className="text-muted-foreground">Gestión de entrada y despacho de bines.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="h-4 w-4" /> Nueva Recepción
        </Button>
      </div>

      <div className="flex flex-col gap-4 px-6">
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

        {/* Filters row — only in Histórico */}
        {activeTab === "historico" && (
          <div className="flex items-center gap-3 flex-wrap">
            {/* Date desde */}
            <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={fechaDesde}
                max={fechaHasta || undefined}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="h-8 w-[150px] border-0 p-0 shadow-none focus-visible:ring-0"
              />
            </div>

            <span className="text-muted-foreground text-sm">—</span>

            {/* Date hasta */}
            <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={fechaHasta}
                min={fechaDesde || undefined}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="h-8 w-[150px] border-0 p-0 shadow-none focus-visible:ring-0"
              />
            </div>

            {/* Chofer interno filter */}
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground shrink-0" />
              <SearchableSelect
                value={choferFiltro}
                onChange={(val) => setChoferFiltro(val)}
                placeholder="Chofer interno..."
                emptyText="No se encontró el chofer."
                className="w-[200px]"
                options={[
                  { value: "", label: "Todos los choferes" },
                  ...choferes.map((c) => ({ value: String(c.id), label: c.nombre })),
                ]}
              />
            </div>

            {/* Clear all filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFechaDesde("")
                  setFechaHasta("")
                  setChoferFiltro("")
                }}
              >
                Limpiar filtros
              </Button>
            )}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-6 animate-pulse">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 px-6 pb-10">
            {filteredRecepciones.map((rec: any) => {
              const bines = rec.recepcion_bines || []
              const totalKilos = bines.reduce((acc: number, b: any) => acc + (b.peso_neto || 0), 0)
              const binesPendientes = bines.filter((b: any) => b.estado === "en_patio")
              const kilosPendientes = binesPendientes.reduce((acc: number, b: any) => acc + (b.peso_neto || 0), 0)
              const binesDespachados = bines.filter((b: any) => b.estado === "despachado").length

              return (
                <ReceptionCard
                  key={rec.id}
                  recepcion={rec}
                  totalKilos={totalKilos}
                  kilosPendientes={kilosPendientes}
                  binesTotal={bines.length}
                  binesDespachados={binesDespachados}
                  onClick={() => handleCardClick(rec.id)}
                  onDelete={activeTab === "patio" ? handleDeleteRecepcion : undefined}
                />
              )
            })}
          </div>
        )}

        {/* Pagination — only in Histórico when there are multiple pages */}
        {activeTab === "historico" && totalCount > PAGE_SIZE && (
          <div className="flex items-center justify-between px-6 pb-6">
            <p className="text-sm text-muted-foreground">
              Mostrando {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, totalCount)} de {totalCount} recepciones
            </p>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      if (currentPage > 1) setCurrentPage((p) => p - 1)
                    }}
                    aria-disabled={currentPage === 1}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>

                {buildPageNumbers(currentPage, totalPages).map((item, idx) =>
                  item === "ellipsis" ? (
                    <PaginationItem key={`ellipsis-${idx}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={item}>
                      <PaginationLink
                        href="#"
                        isActive={item === currentPage}
                        onClick={(e) => {
                          e.preventDefault()
                          setCurrentPage(item as number)
                        }}
                      >
                        {item}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault()
                      if (currentPage < totalPages) setCurrentPage((p) => p + 1)
                    }}
                    aria-disabled={currentPage === totalPages}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
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
