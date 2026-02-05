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
import { Badge } from "@/components/ui/badge"
import { ColumnToggle, ExportActions, DebouncedInput } from "./table-utils"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface CompraRegular {
  id: string | number
  fecha: string
  numero_semana: number
  pago_dolares: boolean
  lugar_procedencia?: string
  procedencia_tipo?: string
  cliente?: { nombre: string }
  numero_boleta?: string
  nb_tickete?: string
  chofer?: { nombre: string }
  tipo_pina: string
  numero_kilos: number
  precio_piña: number
  total_a_pagar: number
  pagado: boolean
  tipo_pago?: { nombre: string }
  numero_deposito?: string
  numero_factura?: string
}

interface ComprasRegularesTableProps {
  compras: CompraRegular[]
  onEdit: (compra: CompraRegular) => void
  onDelete: (id: string | number) => void
  isLoading?: boolean
}

const ALL_COLUMNS = [
  { key: "fecha", label: "Fecha" },
  { key: "numero_semana", label: "Sem" },
  { key: "cliente.nombre", label: "Cliente" },
  { key: "lugar_procedencia", label: "Procedencia" },
  { key: "chofer.nombre", label: "Chofer" },
  { key: "tipo_pina", label: "Tipo" },
  { key: "numero_kilos", label: "Kilos" },
  { key: "precio_piña", label: "Precio" },
  { key: "total_a_pagar", label: "Total" },
  { key: "pagado", label: "Pagado" },
]

export function ComprasRegularesTable({
  compras,
  onEdit,
  onDelete,
  isLoading = false,
}: ComprasRegularesTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("compras_regulares_columns")
      return saved ? JSON.parse(saved) : ALL_COLUMNS.map(c => c.key)
    }
    return ALL_COLUMNS.map(c => c.key)
  })

  useEffect(() => {
    localStorage.setItem("compras_regulares_columns", JSON.stringify(visibleColumns))
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

  const filteredCompras = useMemo(() => {
    return compras.filter((compra) => {
      if (filters.fecha_desde && compra.fecha < filters.fecha_desde) return false
      if (filters.fecha_hasta && compra.fecha > filters.fecha_hasta) return false

      for (const [key, value] of Object.entries(filters)) {
        if (key === "fecha_desde" || key === "fecha_hasta") continue
        const searchLower = value.toLowerCase()
        
        if (key === "cliente") {
          if (!compra.cliente?.nombre?.toLowerCase().includes(searchLower)) return false
        } else if (key === "chofer") {
          if (!compra.chofer?.nombre?.toLowerCase().includes(searchLower)) return false
        } else if (key === "tipo_pina") {
          if (compra.tipo_pina !== value) return false
        } else if (key === "procedencia") {
          if (!compra.lugar_procedencia?.toLowerCase().includes(searchLower)) return false
        } else if (key === "pagado") {
          if (compra.pagado.toString() !== value) return false
        } else if (key === "numero_semana") {
          if (compra.numero_semana.toString() !== value) return false
        }
      }
      return true
    })
  }, [compras, filters])

  const formatCurrency = (num: number, dolares: boolean = false) => {
    if (dolares) {
      return num?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"
    }
    return num?.toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"
  }

  const formatNumber = (num: number) =>
    num?.toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"

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
            title="Compras Regulares" 
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
                {visibleColumns.includes("lugar_procedencia") && <TableHead>Procedencia</TableHead>}
                {visibleColumns.includes("chofer.nombre") && <TableHead>Chofer</TableHead>}
                {visibleColumns.includes("tipo_pina") && <TableHead>Tipo</TableHead>}
                {visibleColumns.includes("numero_kilos") && <TableHead className="text-right">Kilos</TableHead>}
                {visibleColumns.includes("precio_piña") && <TableHead className="text-right">Precio</TableHead>}
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
                {visibleColumns.includes("lugar_procedencia") && (
                  <TableHead className="p-2">
                    <DebouncedInput placeholder="Lugar..." className="h-8 text-xs" value={filters.procedencia || ""} onChange={(val) => setFilter("procedencia", val.toString())} />
                  </TableHead>
                )}
                {visibleColumns.includes("chofer.nombre") && (
                  <TableHead className="p-2">
                    <DebouncedInput placeholder="Chofer..." className="h-8 text-xs" value={filters.chofer || ""} onChange={(val) => setFilter("chofer", val.toString())} />
                  </TableHead>
                )}
                {visibleColumns.includes("tipo_pina") && (
                  <TableHead className="p-2">
                    <Select value={filters.tipo_pina || "ALL"} onValueChange={(val) => setFilter("tipo_pina", val === "ALL" ? "" : val)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Todos" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ALL">Todos</SelectItem>
                        <SelectItem value="IQF">IQF</SelectItem>
                        <SelectItem value="Jugo">Jugo</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableHead>
                )}
                {visibleColumns.includes("numero_kilos") && <TableHead className="p-2" />}
                {visibleColumns.includes("precio_piña") && <TableHead className="p-2" />}
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
                filteredCompras.map((compra) => (
                  <TableRow key={compra.id} className="hover:bg-muted/30 transition-colors">
                    {visibleColumns.includes("fecha") && <TableCell className="whitespace-nowrap">{compra.fecha}</TableCell>}
                    {visibleColumns.includes("numero_semana") && <TableCell>{compra.numero_semana}</TableCell>}
                    {visibleColumns.includes("cliente.nombre") && <TableCell>{compra.cliente?.nombre || "-"}</TableCell>}
                    {visibleColumns.includes("lugar_procedencia") && (
                      <TableCell>
                        {compra.lugar_procedencia || "-"}
                        {compra.procedencia_tipo && <Badge variant="outline" className="ml-1 text-[10px]">{compra.procedencia_tipo}</Badge>}
                      </TableCell>
                    )}
                    {visibleColumns.includes("chofer.nombre") && <TableCell>{compra.chofer?.nombre || "-"}</TableCell>}
                    {visibleColumns.includes("tipo_pina") && (
                      <TableCell>
                        <Badge className={compra.tipo_pina === "IQF" ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-800"}>
                          {compra.tipo_pina}
                        </Badge>
                      </TableCell>
                    )}
                    {visibleColumns.includes("numero_kilos") && <TableCell className="text-right">{formatNumber(compra.numero_kilos)}</TableCell>}
                    {visibleColumns.includes("precio_piña") && (
                      <TableCell className="text-right">
                        {compra.pago_dolares ? "$" : "₡"}{formatCurrency(compra.precio_piña, compra.pago_dolares)}
                      </TableCell>
                    )}
                    {visibleColumns.includes("total_a_pagar") && (
                      <TableCell className="text-right font-medium">
                        {compra.pago_dolares ? "$" : "₡"}{formatCurrency(compra.total_a_pagar, compra.pago_dolares)}
                      </TableCell>
                    )}
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
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      <div className="flex items-center justify-between px-2 text-sm text-muted-foreground bg-muted/10 p-2 rounded-md border border-dashed">
        <div>Mostrando <span className="font-medium text-foreground">{filteredCompras.length}</span> registros</div>
        <div className="flex items-center gap-4 font-bold text-primary">
          Total: ₡{formatCurrency(filteredCompras.filter(c => !c.pago_dolares).reduce((acc, c) => acc + c.total_a_pagar, 0))} / ${formatCurrency(filteredCompras.filter(c => c.pago_dolares).reduce((acc, c) => acc + c.total_a_pagar, 0), true)}
        </div>
      </div>
    </div>
  )
}
