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

export function TransporteContratadoTable({
  transportes,
  onEdit,
  onDelete,
  isLoading = false,
}: TransporteContratadoTableProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredTransportes = transportes.filter((transporte) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      transporte.chofer?.nombre?.toLowerCase().includes(searchLower) ||
      transporte.planta?.nombre?.toLowerCase().includes(searchLower) ||
      transporte.placa?.codigo?.toLowerCase().includes(searchLower) ||
      transporte.numero_boleta?.toLowerCase().includes(searchLower)
    )
  })

  const formatCurrency = (num: number) =>
    num?.toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"

  const formatNumber = (num: number) =>
    num?.toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"

  // Calcular totales
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
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por chofer, planta, placa..."
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
              <TableHead>Chofer</TableHead>
              <TableHead>Placa</TableHead>
              <TableHead>Planta</TableHead>
              <TableHead className="text-right">Kilos</TableHead>
              <TableHead className="text-right">Precio/kg</TableHead>
              <TableHead className="text-right">Adelanto</TableHead>
              <TableHead className="text-right">Total a Pagar</TableHead>
              <TableHead className="text-center">Pagado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransportes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                  No se encontraron registros
                </TableCell>
              </TableRow>
            ) : (
              <>
                {filteredTransportes.map((transporte) => (
                  <TableRow key={transporte.id}>
                    <TableCell>{transporte.fecha}</TableCell>
                    <TableCell>{transporte.numero_semana}</TableCell>
                    <TableCell>{transporte.chofer?.nombre || "-"}</TableCell>
                    <TableCell>{transporte.placa?.codigo || "-"}</TableCell>
                    <TableCell>{transporte.planta?.nombre || "-"}</TableCell>
                    <TableCell className="text-right">{formatNumber(transporte.total_kilos)}</TableCell>
                    <TableCell className="text-right">₡{formatCurrency(transporte.precio_por_kilo)}</TableCell>
                    <TableCell className="text-right">₡{formatCurrency(transporte.adelanto)}</TableCell>
                    <TableCell className="text-right font-medium">
                      ₡{formatCurrency(transporte.total_a_pagar)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox checked={transporte.pagado} disabled />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(transporte)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(transporte.id)}
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
                  <TableCell className="text-right">{formatNumber(totals.kilos)}</TableCell>
                  <TableCell />
                  <TableCell className="text-right">₡{formatCurrency(totals.adelanto)}</TableCell>
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

      {filteredTransportes.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Mostrando {filteredTransportes.length} de {transportes.length} registros
        </div>
      )}
    </div>
  )
}
