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
import { Pencil, Trash2, Search } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"

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

export function TransporteInternoTable({
  transportes,
  onEdit,
  onDelete,
  isLoading = false,
}: TransporteInternoTableProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredTransportes = transportes.filter((transporte) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      transporte.chofer?.nombre?.toLowerCase().includes(searchLower) ||
      transporte.cliente?.nombre?.toLowerCase().includes(searchLower) ||
      transporte.placa?.codigo?.toLowerCase().includes(searchLower)
    )
  })

  const formatCurrency = (num: number) =>
    num?.toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"

  // Calcular totales
  const totals = filteredTransportes.reduce(
    (acc, t) => ({
      diesel: acc.diesel + Number(t.diesel || 0),
      ingreso: acc.ingreso + Number(t.ingreso || 0),
      balance: acc.balance + Number(t.ingreso || 0) - Number(t.diesel || 0),
    }),
    { diesel: 0, ingreso: 0, balance: 0 }
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
          placeholder="Buscar por chofer, cliente, placa..."
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
              <TableHead>Cliente</TableHead>
              <TableHead className="text-right">Diesel (₡)</TableHead>
              <TableHead className="text-right">Ingreso (₡)</TableHead>
              <TableHead className="text-right">Balance (₡)</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransportes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  No se encontraron registros
                </TableCell>
              </TableRow>
            ) : (
              <>
                {filteredTransportes.map((transporte) => {
                  const balance = transporte.ingreso - transporte.diesel
                  return (
                    <TableRow key={transporte.id}>
                      <TableCell>{transporte.fecha}</TableCell>
                      <TableCell>{transporte.numero_semana}</TableCell>
                      <TableCell>{transporte.chofer?.nombre || "-"}</TableCell>
                      <TableCell>{transporte.placa?.codigo || "-"}</TableCell>
                      <TableCell>{transporte.cliente?.nombre || "-"}</TableCell>
                      <TableCell className="text-right text-red-600">
                        ₡{formatCurrency(transporte.diesel)}
                      </TableCell>
                      <TableCell className="text-right text-green-600">
                        ₡{formatCurrency(transporte.ingreso)}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₡{formatCurrency(balance)}
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
                  )
                })}
                {/* Fila de totales */}
                <TableRow className="bg-muted/50 font-medium">
                  <TableCell colSpan={5} className="text-right">
                    Totales:
                  </TableCell>
                  <TableCell className="text-right text-red-600">
                    ₡{formatCurrency(totals.diesel)}
                  </TableCell>
                  <TableCell className="text-right text-green-600">
                    ₡{formatCurrency(totals.ingreso)}
                  </TableCell>
                  <TableCell className={`text-right ${totals.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ₡{formatCurrency(totals.balance)}
                  </TableCell>
                  <TableCell />
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
