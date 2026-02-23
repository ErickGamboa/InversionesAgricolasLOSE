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
import { Checkbox } from "@/components/ui/checkbox"
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

interface CompraEspecial {
  id: string | number
  fecha: string
  numero_semana: number
  procedencia?: string
  cliente?: { nombre: string }
  lote?: string
  numero_boleta?: string
  chofer?: { nombre: string }
  placa?: string
  numero_cajas: number
  pinas_por_caja: number
  total_pinas: number
  total_kilos: number
  precio_por_kilo: number
  total_a_pagar: number
  pagado: boolean
}

interface ComprasEspecialesTableProps {
  compras: CompraEspecial[]
  onEdit: (compra: CompraEspecial) => void
  onDelete: (id: string | number) => void
  isLoading?: boolean
}

const ALL_COLUMNS = [
  { key: "fecha", label: "Fecha" },
  { key: "numero_semana", label: "Sem" },
  { key: "cliente.nombre", label: "Cliente" },
  { key: "procedencia", label: "Procedencia" },
  { key: "chofer.nombre", label: "Chofer" },
  { key: "placa", label: "Placa" },
  { key: "numero_cajas", label: "Cajas" },
  { key: "total_pinas", label: "Piñas" },
  { key: "total_kilos", label: "Kilos" },
  { key: "total_a_pagar", label: "Total" },
  { key: "pagado", label: "Pagado" },
]

const DEFAULT_COLUMNS = ALL_COLUMNS.map(c => c.key)

const FILTERS_STORAGE_KEY = "compras_especiales_filters"

export function ComprasEspecialesTable({
  compras,
  onEdit,
  onDelete,
  isLoading = false,
}: ComprasEspecialesTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_COLUMNS)

  useEffect(() => {
    const saved = localStorage.getItem("compras_especiales_columns")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        const validKeys = ALL_COLUMNS.map(c => c.key)
        const validCols = parsed.filter((c: string) => validKeys.includes(c))
        if (validCols.length > 0) setVisibleColumns(validCols)
      } catch { }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem("compras_especiales_columns", JSON.stringify(visibleColumns))
  }, [visibleColumns])

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

  const filteredCompras = useMemo(() => {
    return compras.filter((c) => {
      if (filters.fecha_desde && c.fecha < filters.fecha_desde) return false
      if (filters.fecha_hasta && c.fecha > filters.fecha_hasta) return false

      for (const [key, value] of Object.entries(filters)) {
        if (key === "fecha_desde" || key === "fecha_hasta") continue
        const searchLower = value.toLowerCase()
        
        if (key === "cliente") {
          if (!c.cliente?.nombre?.toLowerCase().includes(searchLower)) return false
        } else if (key === "chofer") {
          if (!c.chofer?.nombre?.toLowerCase().includes(searchLower)) return false
        } else if (key === "procedencia") {
          if (!c.procedencia?.toLowerCase().includes(searchLower)) return false
        } else if (key === "placa") {
          if (!c.placa?.toLowerCase().includes(searchLower)) return false
        } else if (key === "pagado") {
          if (c.pagado.toString() !== value) return false
        } else if (key === "numero_semana") {
          if (c.numero_semana.toString() !== value) return false
        }
      }
      return true
    })
  }, [compras, filters])

  const formatCurrency = (num: number) =>
    num?.toLocaleString("es-CR", { minimumFractionDigits: 3, maximumFractionDigits: 3 }) || "0.000"

  const formatNumber = (num: number) =>
    num?.toLocaleString("es-CR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || "0"

  const totals = filteredCompras.reduce(
    (acc, c) => ({
      cajas: acc.cajas + Number(c.numero_cajas || 0),
      pinas: acc.pinas + Number(c.total_pinas || 0),
      kilos: acc.kilos + Number(c.total_kilos || 0),
      total: acc.total + Number(c.total_a_pagar || 0),
    }),
    { cajas: 0, pinas: 0, kilos: 0, total: 0 }
  )

  const footerData = useMemo(() => {
    return {
      numero_cajas: totals.cajas,
      total_pinas: totals.pinas,
      total_kilos: totals.kilos,
      total_a_pagar: totals.total
    }
  }, [totals])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="lg" text="Cargando compras..." />
      </div>
    )
  }


  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-muted/20 p-2 rounded-lg border">
        <div className="flex items-center gap-2">
          <ExportActions 
            data={filteredCompras} 
            columns={ALL_COLUMNS.filter(c => visibleColumns.includes(c.key))} 
            title="Reporte de fruta" 
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
                {visibleColumns.includes("fecha") && <TableHead className="min-w-[150px]">Fecha</TableHead>}
                {visibleColumns.includes("numero_semana") && <TableHead>Sem</TableHead>}
                {visibleColumns.includes("cliente.nombre") && <TableHead>Cliente</TableHead>}
                {visibleColumns.includes("procedencia") && <TableHead>Procedencia</TableHead>}
                {visibleColumns.includes("chofer.nombre") && <TableHead>Chofer</TableHead>}
                {visibleColumns.includes("placa") && <TableHead>Placa</TableHead>}
                {visibleColumns.includes("numero_cajas") && <TableHead className="text-right">Cajas</TableHead>}
                {visibleColumns.includes("total_pinas") && <TableHead className="text-right">Piñas</TableHead>}
                {visibleColumns.includes("total_kilos") && <TableHead className="text-right">Kilos</TableHead>}
                {visibleColumns.includes("total_a_pagar") && <TableHead className="text-right">Total</TableHead>}
                {visibleColumns.includes("pagado") && <TableHead className="text-center">Pagado</TableHead>}
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
                {visibleColumns.includes("cliente.nombre") && (
                  <TableHead className="p-2">
                    <DebouncedInput placeholder="Cliente..." className="h-8 text-xs" value={filters.cliente || ""} onChange={(val) => setFilter("cliente", val.toString())} />
                  </TableHead>
                )}
                {visibleColumns.includes("procedencia") && (
                  <TableHead className="p-2">
                    <DebouncedInput placeholder="Procedencia..." className="h-8 text-xs" value={filters.procedencia || ""} onChange={(val) => setFilter("procedencia", val.toString())} />
                  </TableHead>
                )}
                {visibleColumns.includes("chofer.nombre") && (
                  <TableHead className="p-2">
                    <DebouncedInput placeholder="Chofer..." className="h-8 text-xs" value={filters.chofer || ""} onChange={(val) => setFilter("chofer", val.toString())} />
                  </TableHead>
                )}
                {visibleColumns.includes("placa") && (
                  <TableHead className="p-2">
                    <DebouncedInput placeholder="Placa..." className="h-8 text-xs" value={filters.placa || ""} onChange={(val) => setFilter("placa", val.toString())} />
                  </TableHead>
                )}
                {visibleColumns.includes("numero_cajas") && <TableHead className="p-2" />}
                {visibleColumns.includes("total_pinas") && <TableHead className="p-2" />}
                {visibleColumns.includes("total_kilos") && <TableHead className="p-2" />}
                {visibleColumns.includes("total_a_pagar") && <TableHead className="p-2" />}
                {visibleColumns.includes("pagado") && (
                  <TableHead className="p-2 text-center">
                    <Select value={filters.pagado || "ALL"} onValueChange={(val) => setFilter("pagado", val === "ALL" ? "" : val)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="-" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Todos</SelectItem>
                        <SelectItem value="true">Sí</SelectItem>
                        <SelectItem value="false">No</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableHead>
                )}
                <TableHead className="p-2" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompras.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length + 1} className="text-center py-8 text-muted-foreground">
                    No se encontraron registros
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {filteredCompras.map((compra) => (
                    <TableRow key={compra.id} className="hover:bg-muted/30 transition-colors">
                      {visibleColumns.includes("fecha") && <TableCell className="whitespace-nowrap">{compra.fecha}</TableCell>}
                      {visibleColumns.includes("numero_semana") && <TableCell>{compra.numero_semana}</TableCell>}
                      {visibleColumns.includes("cliente.nombre") && <TableCell>{compra.cliente?.nombre || "-"}</TableCell>}
                      {visibleColumns.includes("procedencia") && <TableCell>{compra.procedencia || "-"}</TableCell>}
                      {visibleColumns.includes("chofer.nombre") && <TableCell>{compra.chofer?.nombre || "-"}</TableCell>}
                      {visibleColumns.includes("placa") && <TableCell>{compra.placa || "-"}</TableCell>}
                      {visibleColumns.includes("numero_cajas") && <TableCell className="text-right">{formatNumber(compra.numero_cajas)}</TableCell>}
                      {visibleColumns.includes("total_pinas") && <TableCell className="text-right">{formatNumber(compra.total_pinas)}</TableCell>}
                      {visibleColumns.includes("total_kilos") && <TableCell className="text-right">{compra.total_kilos?.toLocaleString("es-CR", { minimumFractionDigits: 2 })}</TableCell>}
                      {visibleColumns.includes("total_a_pagar") && <TableCell className="text-right font-medium">₡{formatCurrency(compra.total_a_pagar)}</TableCell>}
                      {visibleColumns.includes("pagado") && (
                        <TableCell className="text-center">
                          <Checkbox checked={compra.pagado} disabled />
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(compra)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(compra.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell colSpan={visibleColumns.filter(c => ["fecha", "numero_semana", "cliente.nombre", "procedencia", "chofer.nombre", "placa"].includes(c)).length} className="text-right">
                      Totales:
                    </TableCell>
                    {visibleColumns.includes("numero_cajas") && <TableCell className="text-right">{formatNumber(totals.cajas)}</TableCell>}
                    {visibleColumns.includes("total_pinas") && <TableCell className="text-right">{formatNumber(totals.pinas)}</TableCell>}
                    {visibleColumns.includes("total_kilos") && <TableCell className="text-right">{totals.kilos?.toLocaleString("es-CR", { minimumFractionDigits: 2 })}</TableCell>}
                    {visibleColumns.includes("total_a_pagar") && <TableCell className="text-right text-primary">₡{formatCurrency(totals.total)}</TableCell>}
                    <TableCell colSpan={2} />
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
