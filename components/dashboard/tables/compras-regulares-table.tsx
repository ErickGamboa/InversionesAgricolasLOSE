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
import { Badge } from "@/components/ui/badge"

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

export function ComprasRegularesTable({
  compras,
  onEdit,
  onDelete,
  isLoading = false,
}: ComprasRegularesTableProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredCompras = compras.filter((compra) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      compra.cliente?.nombre?.toLowerCase().includes(searchLower) ||
      compra.chofer?.nombre?.toLowerCase().includes(searchLower) ||
      compra.numero_boleta?.toLowerCase().includes(searchLower) ||
      compra.nb_tickete?.toLowerCase().includes(searchLower) ||
      compra.tipo_pina?.toLowerCase().includes(searchLower) ||
      compra.lugar_procedencia?.toLowerCase().includes(searchLower)
    )
  })

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
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por cliente, chofer, boleta..."
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
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Kilos</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-center">Moneda</TableHead>
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
              filteredCompras.map((compra) => (
                <TableRow key={compra.id}>
                  <TableCell>{compra.fecha}</TableCell>
                  <TableCell>{compra.numero_semana}</TableCell>
                  <TableCell>{compra.cliente?.nombre || "-"}</TableCell>
                  <TableCell>
                    {compra.lugar_procedencia || "-"}
                    {compra.procedencia_tipo && (
                      <Badge variant="outline" className="ml-1 text-xs">
                        {compra.procedencia_tipo}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{compra.chofer?.nombre || "-"}</TableCell>
                  <TableCell>
                    <Badge className={compra.tipo_pina === "IQF" ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-800"}>
                      {compra.tipo_pina}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatNumber(compra.numero_kilos)}</TableCell>
                  <TableCell className="text-right">
                    {compra.pago_dolares ? "$" : "₡"}{formatCurrency(compra.precio_piña, compra.pago_dolares)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {compra.pago_dolares ? "$" : "₡"}{formatCurrency(compra.total_a_pagar, compra.pago_dolares)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={compra.pago_dolares ? "secondary" : "default"}>
                      {compra.pago_dolares ? "USD" : "CRC"}
                    </Badge>
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
              ))
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
