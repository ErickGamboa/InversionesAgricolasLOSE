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
import { Pencil, Trash2, FilterX, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { ColumnToggle, ExportActions, DebouncedInput } from "./table-utils"

interface TransporteInterno {
  id: string | number
  fecha: string
  numero_semana: number
  chofer?: { nombre: string }
  placa?: { codigo: string }
  cliente?: { nombre: string }
  diesel: number
  ingreso: number
}

interface TransporteInternoTableProps {
  transportes: TransporteInterno[]
  onEdit: (transporte: TransporteInterno) => void
  onDelete: (id: string | number) => void
  isLoading?: boolean
}

const ALL_COLUMNS = [
  { key: "fecha", label: "Fecha" },
  { key: "numero_semana", label: "Sem" },
  { key: "chofer.nombre", label: "Chofer" },
  { key: "placa.codigo", label: "Placa" },
  { key: "cliente.nombre", label: "Cliente" },
  { key: "diesel", label: "Diesel (CRC)" },
  { key: "ingreso", label: "Ingreso (CRC)" },
  { key: "balance", label: "Balance (CRC)" },
]

const DEFAULT_COLUMNS = ALL_COLUMNS.map(c => c.key)

const FILTERS_STORAGE_KEY = "transporte_interno_filters"

export function TransporteInternoTable({
  transportes,
  onEdit,
  onDelete,
  isLoading = false,
}: TransporteInternoTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_COLUMNS)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem("transporte_interno_columns")
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
      localStorage.setItem("transporte_interno_columns", JSON.stringify(visibleColumns))
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

  const filters = useMemo(() => {
    return Object.fromEntries(searchParams.entries())
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
    if (value) params.set(key, value)
    else params.delete(key)
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

  const filteredTransportes = useMemo(() => {
    let result = transportes.filter((t) => {
      if (filters.fecha_desde && t.fecha < filters.fecha_desde) return false
      if (filters.fecha_hasta && t.fecha > filters.fecha_hasta) return false

      for (const [key, value] of Object.entries(filters)) {
        if (key === "fecha_desde" || key === "fecha_hasta") continue
        const searchLower = value.toLowerCase()
        
        if (key === "chofer") {
          if (!t.chofer?.nombre?.toLowerCase().includes(searchLower)) return false
        } else if (key === "placa") {
          if (!t.placa?.codigo?.toLowerCase().includes(searchLower)) return false
        } else if (key === "cliente") {
          if (!t.cliente?.nombre?.toLowerCase().includes(searchLower)) return false
        } else if (key === "numero_semana") {
          if (t.numero_semana.toString() !== value) return false
        }
      }
      return true
    })

    if (sortConfig) {
      result = [...result].sort((a, b) => {
        let aValue: any, bValue: any

        if (sortConfig.key === "fecha") {
          aValue = new Date(a.fecha).getTime()
          bValue = new Date(b.fecha).getTime()
        } else if (sortConfig.key === "chofer") {
          aValue = a.chofer?.nombre || ""
          bValue = b.chofer?.nombre || ""
        } else if (sortConfig.key === "placa") {
          aValue = a.placa?.codigo || ""
          bValue = b.placa?.codigo || ""
        } else if (sortConfig.key === "cliente") {
          aValue = a.cliente?.nombre || ""
          bValue = b.cliente?.nombre || ""
        } else {
          return 0
        }

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1
        return 0
      })
    }

    return result
  }, [transportes, filters, sortConfig])

  const formatCurrency = (num: number) =>
    num?.toLocaleString("es-CR", { minimumFractionDigits: 3, maximumFractionDigits: 3 }) || "0.000"

  const totals = filteredTransportes.reduce(
    (acc, t) => ({
      diesel: acc.diesel + Number(t.diesel || 0),
      ingreso: acc.ingreso + Number(t.ingreso || 0),
      balance: acc.balance + (Number(t.ingreso || 0) - Number(t.diesel || 0)),
    }),
    { diesel: 0, ingreso: 0, balance: 0 }
  )

  const exportData = useMemo(() => filteredTransportes.map(t => ({
    ...t,
    balance: t.ingreso - t.diesel
  })), [filteredTransportes])

  const footerData = useMemo(() => {
    return {
      diesel: totals.diesel,
      ingreso: totals.ingreso,
      balance: totals.balance
    }
  }, [totals])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="lg" text="Cargando transportes..." />
      </div>
    )
  }


  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-muted/20 p-2 rounded-lg border">
        <div className="flex items-center gap-2">
          <ExportActions 
            data={exportData} 
            columns={ALL_COLUMNS.filter(c => visibleColumns.includes(c.key))} 
            title="Transporte de fruta" 
            footerData={footerData}
            currency="CRC"
          />
          {Object.keys(filters).length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-destructive h-8">
              <FilterX className="mr-2 h-4 w-4" />
              Limpiar Filtros
            </Button>
          )}
        </div>
        <ColumnToggle columns={ALL_COLUMNS} visibleColumns={visibleColumns} onToggle={toggleColumn} />
      </div>

      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                {visibleColumns.includes("fecha") && (
                  <TableHead className="min-w-[150px]">
                    <button onClick={() => handleSort("fecha")} className="flex items-center font-semibold hover:text-primary">
                      Fecha<SortIcon columnKey="fecha" />
                    </button>
                  </TableHead>
                )}
                {visibleColumns.includes("numero_semana") && <TableHead>Sem</TableHead>}
                {visibleColumns.includes("chofer.nombre") && (
                  <TableHead>
                    <button onClick={() => handleSort("chofer")} className="flex items-center font-semibold hover:text-primary">
                      Chofer<SortIcon columnKey="chofer" />
                    </button>
                  </TableHead>
                )}
                {visibleColumns.includes("placa.codigo") && (
                  <TableHead>
                    <button onClick={() => handleSort("placa")} className="flex items-center font-semibold hover:text-primary">
                      Placa<SortIcon columnKey="placa" />
                    </button>
                  </TableHead>
                )}
                {visibleColumns.includes("cliente.nombre") && (
                  <TableHead>
                    <button onClick={() => handleSort("cliente")} className="flex items-center font-semibold hover:text-primary">
                      Cliente<SortIcon columnKey="cliente" />
                    </button>
                  </TableHead>
                )}
                {visibleColumns.includes("diesel") && <TableHead className="text-right">Diesel (₡)</TableHead>}
                {visibleColumns.includes("ingreso") && <TableHead className="text-right">Ingreso (₡)</TableHead>}
                {visibleColumns.includes("balance") && <TableHead className="text-right">Balance (₡)</TableHead>}
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>

              <TableRow className="bg-muted/20 hover:bg-muted/20 border-b">
                {visibleColumns.includes("fecha") && (
                  <TableHead className="p-2">
                    <div className="flex flex-col gap-1">
                      <Input type="date" className="h-7 text-[10px] px-1" value={filters.fecha_desde || ""} onChange={(e) => setFilter("fecha_desde", e.target.value)} />
                      <Input type="date" className="h-7 text-[10px] px-1" value={filters.fecha_hasta || ""} onChange={(e) => setFilter("fecha_hasta", e.target.value)} />
                    </div>
                  </TableHead>
                )}
                {visibleColumns.includes("numero_semana") && (
                  <TableHead className="p-2">
                    <DebouncedInput 
                      placeholder="#" 
                      className="h-8 text-xs w-12 mx-auto" 
                      value={filters.numero_semana || ""} 
                      onChange={(val) => setFilter("numero_semana", val.toString())} 
                    />
                  </TableHead>
                )}
                {visibleColumns.includes("chofer.nombre") && (
                  <TableHead className="p-2">
                    <DebouncedInput placeholder="Chofer..." className="h-8 text-xs" value={filters.chofer || ""} onChange={(val) => setFilter("chofer", val.toString())} />
                  </TableHead>
                )}
                {visibleColumns.includes("placa.codigo") && (
                  <TableHead className="p-2">
                    <DebouncedInput placeholder="Placa..." className="h-8 text-xs" value={filters.placa || ""} onChange={(val) => setFilter("placa", val.toString())} />
                  </TableHead>
                )}
                {visibleColumns.includes("cliente.nombre") && (
                  <TableHead className="p-2">
                    <DebouncedInput placeholder="Cliente..." className="h-8 text-xs" value={filters.cliente || ""} onChange={(val) => setFilter("cliente", val.toString())} />
                  </TableHead>
                )}
                {visibleColumns.includes("diesel") && <TableHead className="p-2" />}
                {visibleColumns.includes("ingreso") && <TableHead className="p-2" />}
                {visibleColumns.includes("balance") && <TableHead className="p-2" />}
                <TableHead className="p-2" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransportes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length + 1} className="text-center py-8 text-muted-foreground">
                    No se encontraron registros
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {filteredTransportes.map((t) => {
                    const balance = t.ingreso - t.diesel
                    return (
                      <TableRow key={t.id} className="hover:bg-muted/30 transition-colors">
                        {visibleColumns.includes("fecha") && <TableCell className="whitespace-nowrap">{t.fecha}</TableCell>}
                        {visibleColumns.includes("numero_semana") && <TableCell>{t.numero_semana}</TableCell>}
                        {visibleColumns.includes("chofer.nombre") && <TableCell>{t.chofer?.nombre || "-"}</TableCell>}
                        {visibleColumns.includes("placa.codigo") && <TableCell>{t.placa?.codigo || "-"}</TableCell>}
                        {visibleColumns.includes("cliente.nombre") && <TableCell>{t.cliente?.nombre || "-"}</TableCell>}
                        {visibleColumns.includes("diesel") && <TableCell className="text-right text-red-600">₡{formatCurrency(t.diesel)}</TableCell>}
                        {visibleColumns.includes("ingreso") && <TableCell className="text-right text-green-600">₡{formatCurrency(t.ingreso)}</TableCell>}
                        {visibleColumns.includes("balance") && (
                          <TableCell className={`text-right font-medium ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ₡{formatCurrency(balance)}
                          </TableCell>
                        )}
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(t)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell colSpan={visibleColumns.filter(c => ["fecha", "numero_semana", "chofer.nombre", "placa.codigo", "cliente.nombre"].includes(c)).length} className="text-right">
                      Totales:
                    </TableCell>
                    {visibleColumns.includes("diesel") && <TableCell className="text-right text-red-600">₡{formatCurrency(totals.diesel)}</TableCell>}
                    {visibleColumns.includes("ingreso") && <TableCell className="text-right text-green-600">₡{formatCurrency(totals.ingreso)}</TableCell>}
                    {visibleColumns.includes("balance") && (
                      <TableCell className={`text-right ${totals.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₡{formatCurrency(totals.balance)}
                      </TableCell>
                    )}
                    <TableCell />
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
