"use client"

import { useState, useMemo, useEffect } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Pencil, Trash2, FilterX } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { ColumnToggle, ExportActions, DebouncedInput } from "./table-utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface VentaPlanta {
  id: string | number
  fecha: string
  numero_semana: number
  planta?: { nombre: string }
  chofer?: { nombre: string }
  numero_boleta?: string
  nb_tickete?: string
  tipo_pina: string
  kilos_reportados: number
  porcentaje_castigo: number
  castigo_kilos: number
  total_kilos: number
  precio_iqf?: number
  precio_jugo?: number
  total_pagar_castigo: number
  total_pagar_pina: number
}

interface VentasPlantasTableProps {
  ventas: VentaPlanta[]
  onEdit: (venta: VentaPlanta) => void
  onDelete: (id: string | number) => void
  isLoading?: boolean
}

const ALL_COLUMNS = [
  { key: "fecha", label: "Fecha" },
  { key: "numero_semana", label: "Sem" },
  { key: "planta.nombre", label: "Planta" },
  { key: "chofer.nombre", label: "Chofer" },
  { key: "numero_boleta", label: "Boleta" },
  { key: "nb_tickete", label: "Tickete" },
  { key: "tipo_pina", label: "Tipo" },
  { key: "kilos_reportados", label: "Kilos Rep." },
  { key: "porcentaje_castigo", label: "% Cast." },
  { key: "castigo_kilos", label: "Cast. (kg)" },
  { key: "total_kilos", label: "Total (kg)" },
  { key: "total_pagar_castigo", label: "Total Cast." },
  { key: "total_pagar_pina", label: "Total Piña" },
]

const DEFAULT_COLUMNS = ALL_COLUMNS.map(c => c.key)

const FILTERS_STORAGE_KEY = "ventas_plantas_filters"

export function VentasPlantasTable({
  ventas,
  onEdit,
  onDelete,
  isLoading = false,
}: VentasPlantasTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_COLUMNS)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("ventas_plantas_columns")
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
      localStorage.setItem("ventas_plantas_columns", JSON.stringify(visibleColumns))
    }
  }, [visibleColumns, mounted])

  // Lógica de filtros desde URL
  const filters = useMemo(() => {
    const params = Object.fromEntries(searchParams.entries())
    return params
  }, [searchParams])

  // Restaurar filtros guardados al montar el componente
  useEffect(() => {
    if (typeof window === "undefined") return
    
    // Solo restaurar si la URL no tiene filtros
    if (searchParams.toString() === "") {
      const savedFilters = localStorage.getItem(FILTERS_STORAGE_KEY)
      if (savedFilters) {
        try {
          const parsedFilters = JSON.parse(savedFilters)
          const params = new URLSearchParams()
          Object.entries(parsedFilters).forEach(([key, value]) => {
            if (value) params.set(key, value as string)
          })
          if (params.toString()) {
            router.replace(`${pathname}?${params.toString()}`, { scroll: false })
          }
        } catch {
          // Ignorar errores de parsing
        }
      }
    }
  }, []) // Solo ejecutar al montar

  // Guardar filtros cuando cambien
  useEffect(() => {
    if (typeof window === "undefined") return
    
    const filtersObject = Object.fromEntries(searchParams.entries())
    if (Object.keys(filtersObject).length > 0) {
      localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filtersObject))
    } else {
      localStorage.removeItem(FILTERS_STORAGE_KEY)
    }
  }, [searchParams])

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  const clearFilters = () => {
    router.replace(pathname, { scroll: false })
    if (typeof window !== "undefined") {
      localStorage.removeItem(FILTERS_STORAGE_KEY)
    }
  }

  const toggleColumn = (key: string) => {
    setVisibleColumns(prev => 
      prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]
    )
  }

  const filteredVentas = useMemo(() => {
    return ventas.filter((venta) => {
      // Filtro por rango de fecha
      if (filters.fecha_desde && venta.fecha < filters.fecha_desde) return false
      if (filters.fecha_hasta && venta.fecha > filters.fecha_hasta) return false

      // Filtros por texto/exacto
      for (const [key, value] of Object.entries(filters)) {
        if (key === "fecha_desde" || key === "fecha_hasta") continue
        
        const searchLower = value.toLowerCase()
        
        if (key === "planta") {
          if (!venta.planta?.nombre?.toLowerCase().includes(searchLower)) return false
        } else if (key === "chofer") {
          if (!venta.chofer?.nombre?.toLowerCase().includes(searchLower)) return false
        } else if (key === "tipo_pina") {
          if (venta.tipo_pina !== value) return false
        } else if (key === "numero_semana") {
          if (venta.numero_semana.toString() !== value) return false
        } else if (key === "boleta") {
          if (!venta.numero_boleta?.toLowerCase().includes(searchLower)) return false
        } else if (key === "tickete") {
          if (!venta.nb_tickete?.toLowerCase().includes(searchLower)) return false
        }
        // Puedes añadir más filtros específicos aquí
      }
      return true
    })
  }, [ventas, filters])

  const formatCurrency = (num: number) =>
    num?.toLocaleString("es-CR", { minimumFractionDigits: 3, maximumFractionDigits: 3 }) || "0.000"

  const formatNumber = (num: number) =>
    num?.toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"

  const footerData = useMemo(() => {
    return {
      total_pagar_pina: filteredVentas.reduce((acc, v) => acc + v.total_pagar_pina, 0)
    }
  }, [filteredVentas])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="lg" text="Cargando ventas..." />
      </div>
    )
  }


  return (
    <div className="space-y-4">
      {/* Barra de Herramientas Superior */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-muted/20 p-2 rounded-lg border">
        <div className="flex items-center gap-2">
          <ExportActions 
            data={filteredVentas} 
            columns={ALL_COLUMNS.filter(c => visibleColumns.includes(c.key))} 
            title="Venta de fruta" 
            footerData={footerData}
            currency="USD"
          />
          {Object.keys(filters).length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-destructive h-8">
              <FilterX className="mr-2 h-4 w-4" />
              Limpiar Filtros
            </Button>
          )}
        </div>
        <ColumnToggle 
          columns={ALL_COLUMNS} 
          visibleColumns={visibleColumns} 
          onToggle={toggleColumn} 
        />
      </div>

      {/* Tabla con Filtros Integrados */}
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                {visibleColumns.includes("fecha") && <TableHead className="min-w-[150px]">Fecha</TableHead>}
                {visibleColumns.includes("numero_semana") && <TableHead>Sem</TableHead>}
                {visibleColumns.includes("planta.nombre") && <TableHead>Planta</TableHead>}
                {visibleColumns.includes("chofer.nombre") && <TableHead>Chofer</TableHead>}
                {visibleColumns.includes("numero_boleta") && <TableHead>Boleta</TableHead>}
                {visibleColumns.includes("nb_tickete") && <TableHead>Tickete</TableHead>}
                {visibleColumns.includes("tipo_pina") && <TableHead>Tipo</TableHead>}
                {visibleColumns.includes("kilos_reportados") && <TableHead className="text-right">Kilos Rep.</TableHead>}
                {visibleColumns.includes("porcentaje_castigo") && <TableHead className="text-right">% Cast.</TableHead>}
                {visibleColumns.includes("castigo_kilos") && <TableHead className="text-right">Cast. (kg)</TableHead>}
                {visibleColumns.includes("total_kilos") && <TableHead className="text-right">Total (kg)</TableHead>}
                {visibleColumns.includes("total_pagar_castigo") && <TableHead className="text-right">Total Cast.</TableHead>}
                {visibleColumns.includes("total_pagar_pina") && <TableHead className="text-right">Total Piña</TableHead>}
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
              
              {/* FILA DE FILTROS */}
              <TableRow className="bg-muted/20 hover:bg-muted/20 border-b">
                {visibleColumns.includes("fecha") && (
                  <TableHead className="p-2">
                    <div className="flex flex-col gap-1">
                      <Input 
                        type="date" 
                        size={1}
                        className="h-7 text-[10px] px-1" 
                        value={filters.fecha_desde || ""} 
                        onChange={(e) => setFilter("fecha_desde", e.target.value)}
                      />
                      <Input 
                        type="date" 
                        className="h-7 text-[10px] px-1" 
                        value={filters.fecha_hasta || ""} 
                        onChange={(e) => setFilter("fecha_hasta", e.target.value)}
                      />
                    </div>
                  </TableHead>
                )}
                {visibleColumns.includes("numero_semana") && (
                  <TableHead className="p-2">
                    <DebouncedInput 
                      placeholder="#" 
                      className="h-8 text-xs" 
                      value={filters.numero_semana || ""} 
                      onChange={(val) => setFilter("numero_semana", val.toString())}
                    />
                  </TableHead>
                )}
                {visibleColumns.includes("planta.nombre") && (
                  <TableHead className="p-2">
                    <DebouncedInput 
                      placeholder="Planta..." 
                      className="h-8 text-xs" 
                      value={filters.planta || ""} 
                      onChange={(val) => setFilter("planta", val.toString())}
                    />
                  </TableHead>
                )}
                {visibleColumns.includes("chofer.nombre") && (
                  <TableHead className="p-2">
                    <DebouncedInput 
                      placeholder="Chofer..." 
                      className="h-8 text-xs" 
                      value={filters.chofer || ""} 
                      onChange={(val) => setFilter("chofer", val.toString())}
                    />
                  </TableHead>
                )}
                {visibleColumns.includes("numero_boleta") && (
                  <TableHead className="p-2">
                    <DebouncedInput 
                      placeholder="Boleta..." 
                      className="h-8 text-xs" 
                      value={filters.boleta || ""} 
                      onChange={(val) => setFilter("boleta", val.toString())}
                    />
                  </TableHead>
                )}
                {visibleColumns.includes("nb_tickete") && (
                  <TableHead className="p-2">
                    <DebouncedInput 
                      placeholder="Tickete..." 
                      className="h-8 text-xs" 
                      value={filters.tickete || ""} 
                      onChange={(val) => setFilter("tickete", val.toString())}
                    />
                  </TableHead>
                )}
                {visibleColumns.includes("tipo_pina") && (
                  <TableHead className="p-2">
                    <Select 
                      value={filters.tipo_pina || "ALL"} 
                      onValueChange={(val) => setFilter("tipo_pina", val === "ALL" ? "" : val)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Todos</SelectItem>
                        <SelectItem value="IQF">IQF</SelectItem>
                        <SelectItem value="Jugo">Jugo</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableHead>
                )}
                {/* Columnas numéricas sin filtro por ahora para no saturar, pero se pueden añadir */}
                {visibleColumns.includes("kilos_reportados") && <TableHead className="p-2" />}
                {visibleColumns.includes("porcentaje_castigo") && <TableHead className="p-2" />}
                {visibleColumns.includes("castigo_kilos") && <TableHead className="p-2" />}
                {visibleColumns.includes("total_kilos") && <TableHead className="p-2" />}
                {visibleColumns.includes("total_pagar_castigo") && <TableHead className="p-2" />}
                {visibleColumns.includes("total_pagar_pina") && <TableHead className="p-2" />}
                <TableHead className="p-2" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVentas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length + 1} className="text-center py-8 text-muted-foreground">
                    No se encontraron registros con los filtros aplicados
                  </TableCell>
                </TableRow>
              ) : (
                filteredVentas.map((venta) => (
                  <TableRow key={venta.id} className="hover:bg-muted/30 transition-colors">
                    {visibleColumns.includes("fecha") && <TableCell className="whitespace-nowrap">{venta.fecha}</TableCell>}
                    {visibleColumns.includes("numero_semana") && <TableCell>{venta.numero_semana}</TableCell>}
                    {visibleColumns.includes("planta.nombre") && <TableCell>{venta.planta?.nombre || "-"}</TableCell>}
                    {visibleColumns.includes("chofer.nombre") && <TableCell>{venta.chofer?.nombre || "-"}</TableCell>}
                    {visibleColumns.includes("numero_boleta") && <TableCell>{venta.numero_boleta || "-"}</TableCell>}
                    {visibleColumns.includes("nb_tickete") && <TableCell>{venta.nb_tickete || "-"}</TableCell>}
                    {visibleColumns.includes("tipo_pina") && (
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          venta.tipo_pina === "IQF" 
                            ? "bg-blue-100 text-blue-800 border border-blue-200" 
                            : "bg-orange-100 text-orange-800 border border-orange-200"
                        }`}>
                          {venta.tipo_pina}
                        </span>
                      </TableCell>
                    )}
                    {visibleColumns.includes("kilos_reportados") && <TableCell className="text-right">{formatNumber(venta.kilos_reportados)}</TableCell>}
                    {visibleColumns.includes("porcentaje_castigo") && <TableCell className="text-right">{venta.porcentaje_castigo}%</TableCell>}
                    {visibleColumns.includes("castigo_kilos") && <TableCell className="text-right">{formatNumber(venta.castigo_kilos)}</TableCell>}
                    {visibleColumns.includes("total_kilos") && <TableCell className="text-right font-medium">{formatNumber(venta.total_kilos)}</TableCell>}
                    {visibleColumns.includes("total_pagar_castigo") && <TableCell className="text-right font-medium text-destructive">${formatCurrency(venta.total_pagar_castigo)}</TableCell>}
                    {visibleColumns.includes("total_pagar_pina") && (
                      <TableCell className="text-right font-bold text-primary">
                         ${formatCurrency(venta.total_pagar_pina)}
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onEdit(venta)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onDelete(venta.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex items-center justify-between px-2 text-sm text-muted-foreground bg-muted/10 p-2 rounded-md border border-dashed">
        <div>
          Mostrando <span className="font-medium text-foreground">{filteredVentas.length}</span> de <span className="font-medium text-foreground">{ventas.length}</span> registros
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <span className="font-medium text-foreground">Total Piña:</span>
            <span className="text-primary font-bold">
               ${formatCurrency(filteredVentas.reduce((acc, v) => acc + v.total_pagar_pina, 0))}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
