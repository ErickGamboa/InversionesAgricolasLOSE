"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, Search, Pencil, Check, X, FilterX, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { BoletaRecepcion, TipoBoleta } from "@/types/boleta"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { ColumnToggle, ExportActions } from "./table-utils"

interface BoletasRecepcionTableProps {
  boletas: BoletaRecepcion[]
  onViewBoleta: (boleta: BoletaRecepcion) => void
  onUpdateBoleta?: (id: number, data: { total_kilos?: number; precio_por_kilo?: number }) => Promise<void>
  isLoading?: boolean
}

const ALL_COLUMNS = [
  { key: "numero_boleta", label: "Nº Boleta" },
  { key: "fecha", label: "Fecha" },
  { key: "numero_semana", label: "Semana" },
  { key: "tipo_boleta", label: "Tipo" },
  { key: "cliente", label: "Cliente" },
  { key: "chofer", label: "Chofer" },
  { key: "numero_cajas", label: "Cajas" },
  { key: "pinas_por_caja", label: "Piñas/Caja" },
  { key: "cantidad_bines", label: "Bines" },
  { key: "total_kilos", label: "Total Kilos" },
  { key: "precio_por_kilo", label: "Precio/kg" },
  { key: "total_precio", label: "Total Precio" },
]

const DEFAULT_COLUMNS = [
  "numero_boleta", "fecha", "cliente", "tipo_boleta", "cantidad_bines", 
  "total_kilos", "precio_por_kilo", "total_precio"
]

export function BoletasRecepcionTable({
  boletas,
  onViewBoleta,
  onUpdateBoleta,
  isLoading = false,
}: BoletasRecepcionTableProps) {
  const [filterSemana, setFilterSemana] = useState<string>("")
  const [filterCliente, setFilterCliente] = useState<string>("")
  const [filterFechaDesde, setFilterFechaDesde] = useState<string>("")
  const [filterFechaHasta, setFilterFechaHasta] = useState<string>("")
  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_COLUMNS)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("boletas_recepcion_columns")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        const validKeys = ALL_COLUMNS.map(c => c.key)
        const validCols = parsed.filter((c: string) => validKeys.includes(c))
        if (validCols.length > 0) setVisibleColumns(validCols)
      } catch { }
    }
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted) {
      localStorage.setItem("boletas_recepcion_columns", JSON.stringify(visibleColumns))
    }
  }, [visibleColumns, mounted])

  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>({
    key: "fecha",
    direction: "desc"
  })

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return prev.direction === "asc" ? { key, direction: "desc" } : { key, direction: "asc" }
      }
      return { key, direction: "asc" }
    })
  }

  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig?.key !== columnKey) return <ArrowUpDown className="ml-1 h-3 w-3 inline" />
    return sortConfig.direction === "asc" ? <ArrowUp className="ml-1 h-3 w-3 inline" /> : <ArrowDown className="ml-1 h-3 w-3 inline" />
  }
   
  // Estados para edición inline
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editData, setEditData] = useState<{ total_kilos: string; precio_por_kilo: string }>({
    total_kilos: "",
    precio_por_kilo: "",
  })

  const toggleColumn = (key: string) => {
    setVisibleColumns(prev => 
      prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]
    )
  }

  const clearFilters = () => {
    setFilterSemana("")
    setFilterCliente("")
    setFilterFechaDesde("")
    setFilterFechaHasta("")
  }

  const hasActiveFilters = filterSemana || filterCliente || filterFechaDesde || filterFechaHasta

  const filteredBoletas = useMemo(() => {
    let result = boletas.filter((boleta) => {
      const matchSemana = filterSemana
        ? boleta.numero_semana.toString() === filterSemana
        : true
      const matchCliente = filterCliente
        ? boleta.clientes?.nombre?.toLowerCase().includes(filterCliente.toLowerCase())
        : true
      const matchFechaDesde = filterFechaDesde
        ? new Date(boleta.fecha) >= new Date(filterFechaDesde)
        : true
      const matchFechaHasta = filterFechaHasta
        ? new Date(boleta.fecha) <= new Date(filterFechaHasta)
        : true
      return matchSemana && matchCliente && matchFechaDesde && matchFechaHasta
    })

    if (sortConfig) {
      result = [...result].sort((a, b) => {
        let aValue: any, bValue: any

        if (sortConfig.key === "fecha") {
          aValue = new Date(a.fecha).getTime()
          bValue = new Date(b.fecha).getTime()
        } else if (sortConfig.key === "numero_boleta") {
          aValue = a.numero_boleta
          bValue = b.numero_boleta
        } else if (sortConfig.key === "cliente") {
          aValue = a.clientes?.nombre || ""
          bValue = b.clientes?.nombre || ""
        } else {
          return 0
        }

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
        return 0
      })
    }

    return result
  }, [boletas, filterSemana, filterCliente, filterFechaDesde, filterFechaHasta, sortConfig])

  const getTipoBadge = (tipo: TipoBoleta) => {
    return tipo === "PLANTA" ? (
      <Badge variant="default" className="bg-blue-500">Planta</Badge>
    ) : (
      <Badge variant="default" className="bg-green-500">Campo</Badge>
    )
  }

  const getTotalPrecio = (kilos: number | null, precio: number | null) => {
    if (kilos && precio) {
      return kilos * precio
    }
    return null
  }

  const handleStartEdit = (boleta: BoletaRecepcion) => {
    setEditingId(boleta.id)
    setEditData({
      total_kilos: boleta.total_kilos?.toString() || "",
      precio_por_kilo: boleta.precio_por_kilo?.toString() || "",
    })
  }

  const handleSaveEdit = async (id: number) => {
    if (onUpdateBoleta) {
      await onUpdateBoleta(id, {
        total_kilos: editData.total_kilos ? parseFloat(editData.total_kilos) : undefined,
        precio_por_kilo: editData.precio_por_kilo ? parseFloat(editData.precio_por_kilo) : undefined,
      })
    }
    setEditingId(null)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditData({ total_kilos: "", precio_por_kilo: "" })
  }

  // Calcular totales
  const totalKilos = filteredBoletas.reduce((sum, b) => sum + (b.total_kilos || 0), 0)
  const totalPrecio = filteredBoletas.reduce((sum, b) => {
    const precio = getTotalPrecio(b.total_kilos, b.precio_por_kilo)
    return sum + (precio || 0)
  }, 0)

  // Preparar datos para exportación
  const exportData = filteredBoletas.map(boleta => ({
    numero_boleta: boleta.numero_boleta.toString().padStart(6, "0"),
    fecha: format(new Date(boleta.fecha), "dd/MM/yyyy", { locale: es }),
    numero_semana: boleta.numero_semana,
    tipo_boleta: boleta.tipo_boleta,
    cliente: boleta.clientes?.nombre || "-",
    chofer: boleta.choferes?.nombre || "-",
    numero_cajas: boleta.numero_cajas || 0,
    pinas_por_caja: boleta.pinas_por_caja || 0,
    cantidad_bines: boleta.cantidad_bines || 0,
    total_kilos: boleta.total_kilos || 0,
    precio_por_kilo: boleta.precio_por_kilo || 0,
    total_precio: getTotalPrecio(boleta.total_kilos, boleta.precio_por_kilo) || 0,
  }))

  const footerData = {
    total_kilos: totalKilos,
    total_precio: totalPrecio,
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col gap-4 p-4 bg-muted/20 rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="filtro-fecha-desde" className="text-sm font-medium">
              Fecha Desde
            </Label>
            <Input
              id="filtro-fecha-desde"
              type="date"
              value={filterFechaDesde}
              onChange={(e) => setFilterFechaDesde(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="filtro-fecha-hasta" className="text-sm font-medium">
              Fecha Hasta
            </Label>
            <Input
              id="filtro-fecha-hasta"
              type="date"
              value={filterFechaHasta}
              onChange={(e) => setFilterFechaHasta(e.target.value)}
              className="h-9"
            />
          </div>
                    <div className="space-y-2">
            <Label htmlFor="filtro-semana" className="text-sm font-medium flex items-center gap-2">
              <Search className="h-4 w-4" />
              Semana
            </Label>
            <Input
              id="filtro-semana"
              type="number"
              placeholder="Ej: 15"
              value={filterSemana}
              onChange={(e) => setFilterSemana(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="filtro-cliente" className="text-sm font-medium flex items-center gap-2">
              <Search className="h-4 w-4" />
              Cliente
            </Label>
            <Input
              id="filtro-cliente"
              placeholder="Nombre del cliente..."
              value={filterCliente}
              onChange={(e) => setFilterCliente(e.target.value)}
              className="h-9"
            />
          </div>
        </div>
        
        {/* Exportar y Columnas */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ExportActions
              data={exportData}
              columns={ALL_COLUMNS.filter(c => visibleColumns.includes(c.key))}
              title="Reporte de boletas"
              footerData={footerData}
            />
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-destructive h-8">
                <FilterX className="mr-2 h-4 w-4" />
                Limpiar Filtros
              </Button>
            )}
          </div>
          <ColumnToggle columns={ALL_COLUMNS} visibleColumns={visibleColumns} onToggle={toggleColumn} />
        </div>
      </div>

      {/* Tabla */}
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                {visibleColumns.includes("numero_boleta") && (
                  <TableHead className="w-[100px]">
                    <button onClick={() => handleSort("numero_boleta")} className="flex items-center font-semibold hover:text-primary">
                      Nº Boleta<SortIcon columnKey="numero_boleta" />
                    </button>
                  </TableHead>
                )}
                {visibleColumns.includes("fecha") && (
                  <TableHead>
                    <button onClick={() => handleSort("fecha")} className="flex items-center font-semibold hover:text-primary">
                      Fecha<SortIcon columnKey="fecha" />
                    </button>
                  </TableHead>
                )}
                {visibleColumns.includes("numero_semana") && <TableHead>Semana</TableHead>}
                {visibleColumns.includes("tipo_boleta") && <TableHead>Tipo</TableHead>}
                {visibleColumns.includes("cliente") && (
                  <TableHead>
                    <button onClick={() => handleSort("cliente")} className="flex items-center font-semibold hover:text-primary">
                      Cliente<SortIcon columnKey="cliente" />
                    </button>
                  </TableHead>
                )}
                {visibleColumns.includes("chofer") && <TableHead>Chofer</TableHead>}
                {visibleColumns.includes("numero_cajas") && <TableHead className="text-right">Cajas</TableHead>}
                {visibleColumns.includes("pinas_por_caja") && <TableHead className="text-right">Piñas/Caja</TableHead>}
                {visibleColumns.includes("cantidad_bines") && <TableHead className="text-right">Bines</TableHead>}
                {visibleColumns.includes("total_kilos") && <TableHead className="text-right">Total Kilos</TableHead>}
                {visibleColumns.includes("precio_por_kilo") && <TableHead className="text-right">Precio/kg</TableHead>}
                {visibleColumns.includes("total_precio") && <TableHead className="text-right">Total Precio</TableHead>}
                <TableHead className="text-right w-[100px]">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length + 1} className="h-24 text-center">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : filteredBoletas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length + 1} className="h-24 text-center text-muted-foreground">
                    No se encontraron boletas
                  </TableCell>
                </TableRow>
              ) : (
                filteredBoletas.map((boleta) => (
                  <TableRow key={boleta.id}>
                    {visibleColumns.includes("numero_boleta") && (
                      <TableCell className="font-bold">
                        <span className="text-red-600">
                          {boleta.numero_boleta.toString().padStart(6, "0")}
                        </span>
                      </TableCell>
                    )}
                    {visibleColumns.includes("fecha") && (
                      <TableCell suppressHydrationWarning>
                        {format(new Date(boleta.fecha), "dd/MM/yyyy", { locale: es })}
                      </TableCell>
                    )}
                    {visibleColumns.includes("numero_semana") && (
                      <TableCell>{boleta.numero_semana}</TableCell>
                    )}
                    {visibleColumns.includes("tipo_boleta") && (
                      <TableCell>{getTipoBadge(boleta.tipo_boleta)}</TableCell>
                    )}
                    {visibleColumns.includes("cliente") && (
                      <TableCell className="max-w-[150px] truncate">
                        {boleta.clientes?.nombre || "-"}
                      </TableCell>
                    )}
                    {visibleColumns.includes("chofer") && (
                      <TableCell className="max-w-[150px] truncate">
                        {boleta.choferes?.nombre || "-"}
                      </TableCell>
                    )}
                    {visibleColumns.includes("numero_cajas") && (
                      <TableCell className="text-right">{boleta.numero_cajas || "-"}</TableCell>
                    )}
                    {visibleColumns.includes("pinas_por_caja") && (
                      <TableCell className="text-right">{boleta.pinas_por_caja || "-"}</TableCell>
                    )}
                    {visibleColumns.includes("cantidad_bines") && (
                      <TableCell className="text-right">{boleta.cantidad_bines || "-"}</TableCell>
                    )}
                    {visibleColumns.includes("total_kilos") && (
                      <TableCell className="text-right">
                        {editingId === boleta.id ? (
                          <Input
                            type="number"
                            step="0.001"
                            value={editData.total_kilos}
                            onChange={(e) => setEditData({ ...editData, total_kilos: e.target.value })}
                            className="w-24 h-8 text-right ml-auto"
                          />
                        ) : (
                          boleta.total_kilos?.toLocaleString("es-CR", { minimumFractionDigits: 3 }) || "-"
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.includes("precio_por_kilo") && (
                      <TableCell className="text-right">
                        {editingId === boleta.id ? (
                          <Input
                            type="number"
                            step="0.001"
                            value={editData.precio_por_kilo}
                            onChange={(e) => setEditData({ ...editData, precio_por_kilo: e.target.value })}
                            className="w-24 h-8 text-right ml-auto"
                          />
                        ) : (
                          boleta.precio_por_kilo?.toLocaleString("es-CR", { minimumFractionDigits: 3 }) || "-"
                        )}
                      </TableCell>
                    )}
                    {visibleColumns.includes("total_precio") && (
                      <TableCell className="text-right font-semibold">
                        {getTotalPrecio(boleta.total_kilos, boleta.precio_por_kilo)?.toLocaleString("es-CR", { 
                          minimumFractionDigits: 3 
                        }) || "-"}
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {editingId === boleta.id ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSaveEdit(boleta.id)}
                              className="h-8 w-8 text-green-600"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={handleCancelEdit}
                              className="h-8 w-8 text-red-600"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => onViewBoleta(boleta)}
                              className="h-8 w-8"
                              title="Ver boleta"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleStartEdit(boleta)}
                              className="h-8 w-8"
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            <TableFooter>
              <TableRow className="bg-muted/30 hover:bg-muted/30 border-0">
                {visibleColumns.includes("numero_boleta") && <TableCell></TableCell>}
                {visibleColumns.includes("fecha") && <TableCell></TableCell>}
                {visibleColumns.includes("numero_semana") && <TableCell></TableCell>}
                {visibleColumns.includes("tipo_boleta") && <TableCell></TableCell>}
                {visibleColumns.includes("cliente") && <TableCell></TableCell>}
                {visibleColumns.includes("chofer") && <TableCell></TableCell>}
                {visibleColumns.includes("numero_cajas") && <TableCell></TableCell>}
                {visibleColumns.includes("pinas_por_caja") && <TableCell></TableCell>}
                {visibleColumns.includes("cantidad_bines") && <TableCell></TableCell>}
                {visibleColumns.includes("total_kilos") && (
                  <TableCell className="text-right font-bold text-primary">
                    {totalKilos.toLocaleString("es-CR", { minimumFractionDigits: 3 })}
                  </TableCell>
                )}
                {visibleColumns.includes("precio_por_kilo") && <TableCell></TableCell>}
                {visibleColumns.includes("total_precio") && (
                  <TableCell className="text-right font-bold text-primary">
                    CRC {totalPrecio.toLocaleString("es-CR", { minimumFractionDigits: 3 })}
                  </TableCell>
                )}
                <TableCell></TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </div>
        <div className="px-4 py-2 text-sm text-muted-foreground border-t bg-muted/20">
          Mostrando <span className="font-medium text-foreground">{filteredBoletas.length}</span> registros
        </div>
      </div>
    </div>
  )
}
