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

export function VentasPlantasTable({
  ventas,
  onEdit,
  onDelete,
  isLoading = false,
}: VentasPlantasTableProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredVentas = ventas.filter((venta) => {
    const searchLower = searchTerm.toLowerCase()
    return (
      venta.planta?.nombre?.toLowerCase().includes(searchLower) ||
      venta.chofer?.nombre?.toLowerCase().includes(searchLower) ||
      venta.numero_boleta?.toLowerCase().includes(searchLower) ||
      venta.nb_tickete?.toLowerCase().includes(searchLower) ||
      venta.tipo_pina?.toLowerCase().includes(searchLower)
    )
  })

  const formatCurrency = (num: number) =>
    num?.toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"

  const formatNumber = (num: number) =>
    num?.toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="lg" text="Cargando ventas..." />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por planta, chofer, boleta..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Sem</TableHead>
              <TableHead>Planta</TableHead>
              <TableHead>Chofer</TableHead>
              <TableHead>Boleta</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Kilos Rep.</TableHead>
              <TableHead className="text-right">% Cast.</TableHead>
              <TableHead className="text-right">Cast. (kg)</TableHead>
              <TableHead className="text-right">Total (kg)</TableHead>
              <TableHead className="text-right">Precio</TableHead>
              <TableHead className="text-right">Total Cast.</TableHead>
              <TableHead className="text-right">Total Piña</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredVentas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={14} className="text-center py-8 text-muted-foreground">
                  No se encontraron registros
                </TableCell>
              </TableRow>
            ) : (
              filteredVentas.map((venta) => (
                <TableRow key={venta.id}>
                  <TableCell>{venta.fecha}</TableCell>
                  <TableCell>{venta.numero_semana}</TableCell>
                  <TableCell>{venta.planta?.nombre || "-"}</TableCell>
                  <TableCell>{venta.chofer?.nombre || "-"}</TableCell>
                  <TableCell>{venta.numero_boleta || "-"}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      venta.tipo_pina === "IQF" 
                        ? "bg-blue-100 text-blue-800" 
                        : "bg-orange-100 text-orange-800"
                    }`}>
                      {venta.tipo_pina}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{formatNumber(venta.kilos_reportados)}</TableCell>
                  <TableCell className="text-right">{venta.porcentaje_castigo}%</TableCell>
                  <TableCell className="text-right">{formatNumber(venta.castigo_kilos)}</TableCell>
                  <TableCell className="text-right font-medium">{formatNumber(venta.total_kilos)}</TableCell>
                  <TableCell className="text-right">
                    {venta.tipo_pina === "IQF" 
                      ? `₡${formatCurrency(venta.precio_iqf || 0)}`
                      : `₡${formatCurrency(venta.precio_jugo || 0)}`
                    }
                  </TableCell>
                  <TableCell className="text-right">₡{formatCurrency(venta.total_pagar_castigo)}</TableCell>
                  <TableCell className="text-right font-bold text-primary">
                    ₡{formatCurrency(venta.total_pagar_pina)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEdit(venta)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
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

      {filteredVentas.length > 0 && (
        <div className="text-sm text-muted-foreground">
          Mostrando {filteredVentas.length} de {ventas.length} registros
        </div>
      )}
    </div>
  )
}
