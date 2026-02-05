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

interface TransporteContratado {
  id: string | number
  fecha: string
  numero_semana: number
  chofer?: { nombre: string }
  placa?: { codigo: string }
  planta?: { nombre: string }
  numero_boleta?: string
  nb_tickete?: string
  total_kilos: number
  precio_por_kilo: number
  total_a_pagar: number
  numero_factura?: string
  numero_deposito?: string
  pagado: boolean
  adelanto: number
}

interface TransporteContratadoTableProps {
  transportes: TransporteContratado[]
  onEdit: (transporte: TransporteContratado) => void
  onDelete: (id: string | number) => void
  isLoading?: boolean
}

const ALL_COLUMNS = [
  { key: "fecha", label: "Fecha" },
  { key: "numero_semana", label: "Sem" },
  { key: "chofer.nombre", label: "Chofer" },
  { key: "placa.codigo", label: "Placa" },
  { key: "planta.nombre", label: "Planta" },
  { key: "total_kilos", label: "Kilos" },
  { key: "precio_por_kilo", label: "Precio/kg" },
  { key: "adelanto", label: "Adelanto" },
  { key: "total_a_pagar", label: "Total a Pagar" },
  { key: "pagado", label: "Pagado" },
]

export function TransporteContratadoTable({
  transportes,
  onEdit,
  onDelete,
  isLoading = false,
}: TransporteContratadoTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("transporte_contratado_columns")
      return saved ? JSON.parse(saved) : ALL_COLUMNS.map(c => c.key)
    }
    return ALL_COLUMNS.map(c => c.key)
  })

  useEffect(() => {
    localStorage.setItem("transporte_contratado_columns", JSON.stringify(visibleColumns))
  }, [visibleColumns])

  const filters = useMemo(() => {
    return Object.fromEntries(searchParams.entries())
  }, [searchParams])

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) params.set(key, value)
    else params.delete(key)
    router.replace(`${pathname}?${params.toString()}`)
  }

  const clearFilters = () => router.replace(pathname)

  const toggleColumn = (key: string) => {
    setVisibleColumns(prev => 
      prev.includes(key) ? prev.filter(c => c !== key) : [...prev, key]
    )
  }

  const filteredTransportes = useMemo(() => {
    return transportes.filter((t) => {
      if (filters.fecha_desde && t.fecha < filters.fecha_desde) return false
      if (filters.fecha_hasta && t.fecha > filters.fecha_hasta) return false

      for (const [key, value] of Object.entries(filters)) {
        if (key === "fecha_desde" || key === "fecha_hasta") continue
        const searchLower = value.toLowerCase()
        
        if (key === "chofer") {
          if (!t.chofer?.nombre?.toLowerCase().includes(searchLower)) return false
        } else if (key === "placa") {
          if (!t.placa?.codigo?.toLowerCase().includes(searchLower)) return false
        } else if (key === "planta") {
          if (!t.planta?.nombre?.toLowerCase().includes(searchLower)) return false
        } else if (key === "pagado") {
          if (t.pagado.toString() !== value) return false
        } else if (key === "numero_semana") {
          if (t.numero_semana.toString() !== value) return false
        }
      }
      return true
    })
  }, [transportes, filters])

  const formatCurrency = (num: number) =>
    num?.toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"

  const formatNumber = (num: number) =>
    num?.toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"

  const totals = filteredTransportes.reduce(
    (acc, t) => ({
      kilos: acc.kilos + Number(t.total_kilos || 0),
      adelanto: acc.adelanto + Number(t.adelanto || 0),
      total: acc.total + Number(t.total_a_pagar || 0),
    }),
    { kilos: 0, adelanto: 0, total: 0 }
  )

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
            data={filteredTransportes} 
            columns={ALL_COLUMNS.filter(c => visibleColumns.includes(c.key))} 
            title="Transporte Contratado" 
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
                {visibleColumns.includes("chofer.nombre") && <TableHead>Chofer</TableHead>}
                {visibleColumns.includes("placa.codigo") && <TableHead>Placa</TableHead>}
                {visibleColumns.includes("planta.nombre") && <TableHead>Planta</TableHead>}
                {visibleColumns.includes("total_kilos") && <TableHead className="text-right">Kilos</TableHead>}
                {visibleColumns.includes("precio_por_kilo") && <TableHead className="text-right">Precio/kg</TableHead>}
                {visibleColumns.includes("adelanto") && <TableHead className="text-right">Adelanto</TableHead>}
                {visibleColumns.includes("total_a_pagar") && <TableHead className="text-right">Total a Pagar</TableHead>}
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
                {visibleColumns.includes("planta.nombre") && (
                  <TableHead className="p-2">
                    <DebouncedInput placeholder="Planta..." className="h-8 text-xs" value={filters.planta || ""} onChange={(val) => setFilter("planta", val.toString())} />
                  </TableHead>
                )}
                {visibleColumns.includes("total_kilos") && <TableHead className="p-2" />}
                {visibleColumns.includes("precio_por_kilo") && <TableHead className="p-2" />}
                {visibleColumns.includes("adelanto") && <TableHead className="p-2" />}
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
              {filteredTransportes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleColumns.length + 1} className="text-center py-8 text-muted-foreground">
                    No se encontraron registros
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {filteredTransportes.map((t) => (
                    <TableRow key={t.id} className="hover:bg-muted/30 transition-colors">
                      {visibleColumns.includes("fecha") && <TableCell className="whitespace-nowrap">{t.fecha}</TableCell>}
                      {visibleColumns.includes("numero_semana") && <TableCell>{t.numero_semana}</TableCell>}
                      {visibleColumns.includes("chofer.nombre") && <TableCell>{t.chofer?.nombre || "-"}</TableCell>}
                      {visibleColumns.includes("placa.codigo") && <TableCell>{t.placa?.codigo || "-"}</TableCell>}
                      {visibleColumns.includes("planta.nombre") && <TableCell>{t.planta?.nombre || "-"}</TableCell>}
                      {visibleColumns.includes("total_kilos") && <TableCell className="text-right">{formatNumber(t.total_kilos)}</TableCell>}
                      {visibleColumns.includes("precio_por_kilo") && <TableCell className="text-right">₡{formatCurrency(t.precio_por_kilo)}</TableCell>}
                      {visibleColumns.includes("adelanto") && <TableCell className="text-right">₡{formatCurrency(t.adelanto)}</TableCell>}
                      {visibleColumns.includes("total_a_pagar") && <TableCell className="text-right font-medium">₡{formatCurrency(t.total_a_pagar)}</TableCell>}
                      {visibleColumns.includes("pagado") && (
                        <TableCell className="text-center">
                          <Checkbox checked={t.pagado} disabled />
                        </TableCell>
                      )}
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(t)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell colSpan={visibleColumns.filter(c => ["fecha", "numero_semana", "chofer.nombre", "placa.codigo", "planta.nombre"].includes(c)).length} className="text-right">
                      Totales:
                    </TableCell>
                    {visibleColumns.includes("total_kilos") && <TableCell className="text-right">{formatNumber(totals.kilos)}</TableCell>}
                    {visibleColumns.includes("precio_por_kilo") && <TableCell />}
                    {visibleColumns.includes("adelanto") && <TableCell className="text-right">₡{formatCurrency(totals.adelanto)}</TableCell>}
                    {visibleColumns.includes("total_a_pagar") && <TableCell className="text-right text-primary">₡{formatCurrency(totals.total)}</TableCell>}
                    <TableCell colSpan={2} />
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      <div className="text-sm text-muted-foreground bg-muted/10 p-2 rounded-md border border-dashed text-center">
        Mostrando <span className="font-medium text-foreground">{filteredTransportes.length}</span> registros filtrados
      </div>
    </div>
  )
}
