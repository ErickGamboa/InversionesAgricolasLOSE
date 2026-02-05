"use client"

import { useState } from "react"
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
import { Pencil, Trash2, Search } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"

interface CompraEspecial {
  id: string | number
  fecha: string
  numero_semana: number
  procedencia?: string
  cliente?: { nombre: string }
  lote?: string
  numero_boleta?: string
  chofer?: { nombre: string }
  placa?: { codigo: string }
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

export function ComprasEspecialesTable({
  compras,
  onEdit,
  onDelete,
  isLoading = false,
}: ComprasEspecialesTableProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredCompras = compras.filter((compra) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      compra.cliente?.nombre?.toLowerCase().includes(searchLower) ||
      compra.chofer?.nombre?.toLowerCase().includes(searchLower) ||
      compra.procedencia?.toLowerCase().includes(searchLower) ||
      compra.lote?.toLowerCase().includes(searchLower) ||
      compra.numero_boleta?.toLowerCase().includes(searchLower)
    )
  })

  const formatCurrency = (num: number) =>
    num?.toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"

  const formatNumber = (num: number) =>
    num?.toLocaleString("es-CR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || "0"

  const formatNumberDecimal = (num: number) =>
    num?.toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"

  // Calcular totales
  const totals = filteredCompras.reduce(
    (acc, c) => ({
      cajas: acc.cajas + Number(c.numero_cajas || 0),
      pinas: acc.pinas + Number(c.total_pinas || 0),
      kilos: acc.kilos + Number(c.total_kilos || 0),
      total: acc.total + Number(c.total_a_pagar || 0),
    }),
    { cajas: 0, pinas: 0, kilos: 0, total: 0 }
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="lg" text="Cargando compras..." />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente, chofer, procedencia..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Sem</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Procedencia</TableHead>
              <TableHead>Chofer</TableHead>
              <TableHead className="text-right">Cajas</TableHead>
              <TableHead className="text-right">Piñas</TableHead>
              <TableHead className="text-right">Kilos</TableHead>
              <TableHead className="text-right">Precio/kg</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-center">Pagado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCompras.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                  No se encontraron registros
                </TableCell>
              </TableRow>
            ) : (
              <>
                {filteredCompras.map((compra) => (
                  <TableRow key={compra.id}>
                    <TableCell>{compra.fecha}</TableCell>
                    <TableCell>{compra.numero_semana}</TableCell>
                    <TableCell>{compra.cliente?.nombre || "-"}</TableCell>
                    <TableCell>{compra.procedencia || "-"}</TableCell>
                    <TableCell>{compra.chofer?.nombre || "-"}</TableCell>
                    <TableCell className="text-right">{formatNumber(compra.numero_cajas)}</TableCell>
                    <TableCell className="text-right">{formatNumber(compra.total_pinas)}</TableCell>
                    <TableCell className="text-right">{formatNumberDecimal(compra.total_kilos)}</TableCell>
                    <TableCell className="text-right">₡{formatCurrency(compra.precio_por_kilo)}</TableCell>
                    <TableCell className="text-right font-medium">
                      ₡{formatCurrency(compra.total_a_pagar)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox checked={compra.pagado} disabled />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(compra)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(compra.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {/* Fila de totales */}
                <TableRow className="bg-muted/50 font-medium">
                  <TableCell colSpan={5} className="text-right">
                    Totales:
                  </TableCell>
                  <TableCell className="text-right">{formatNumber(totals.cajas)}</TableCell>
                  <TableCell className="text-right">{formatNumber(totals.pinas)}</TableCell>
                  <TableCell className="text-right">{formatNumberDecimal(totals.kilos)}</TableCell>
                  <TableCell />
                  <TableCell className="text-right text-primary">
                    ₡{formatCurrency(totals.total)}
                  </TableCell>
                  <TableCell colSpan={2} />
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </div>

      {filteredCompras.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Mostrando {filteredCompras.length} de {compras.length} registros
        </div>
      )}
    </div>
  )
}
