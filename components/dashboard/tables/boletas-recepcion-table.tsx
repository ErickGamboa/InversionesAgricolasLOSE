"use client"

import { useState, useMemo } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, Search } from "lucide-react"
import { BoletaRecepcion, TipoBoleta } from "@/types/boleta"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface BoletasRecepcionTableProps {
  boletas: BoletaRecepcion[]
  onViewBoleta: (boleta: BoletaRecepcion) => void
  isLoading?: boolean
}

export function BoletasRecepcionTable({
  boletas,
  onViewBoleta,
  isLoading = false,
}: BoletasRecepcionTableProps) {
  const [filterSemana, setFilterSemana] = useState<string>("")
  const [filterCliente, setFilterCliente] = useState<string>("")

  const filteredBoletas = useMemo(() => {
    return boletas.filter((boleta) => {
      const matchSemana = filterSemana
        ? boleta.numero_semana.toString() === filterSemana
        : true
      const matchCliente = filterCliente
        ? boleta.clientes?.nombre?.toLowerCase().includes(filterCliente.toLowerCase())
        : true
      return matchSemana && matchCliente
    })
  }, [boletas, filterSemana, filterCliente])

  const getTipoBadge = (tipo: TipoBoleta) => {
    return tipo === "PLANTA" ? (
      <Badge variant="default" className="bg-blue-500">Planta</Badge>
    ) : (
      <Badge variant="default" className="bg-green-500">Campo</Badge>
    )
  }

  const getResumenDatos = (boleta: BoletaRecepcion) => {
    if (boleta.tipo_boleta === "PLANTA") {
      return `${boleta.numero_cajas || 0} cajas / ${boleta.total_pinas || 0} piñas`
    }
    return `${boleta.total_kilos?.toLocaleString("es-CR", { minimumFractionDigits: 3 })} kg / ${boleta.cantidad_bines || 0} bines`
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/20 rounded-lg">
        <div className="flex-1 space-y-2">
          <Label htmlFor="filtro-semana" className="text-sm font-medium flex items-center gap-2">
            <Search className="h-4 w-4" />
            Filtrar por Semana
          </Label>
          <Input
            id="filtro-semana"
            type="number"
            placeholder="Ej: 15"
            value={filterSemana}
            onChange={(e) => setFilterSemana(e.target.value)}
            className="h-9"
          />
        </div>
        <div className="flex-[2] space-y-2">
          <Label htmlFor="filtro-cliente" className="text-sm font-medium flex items-center gap-2">
            <Search className="h-4 w-4" />
            Filtrar por Cliente
          </Label>
          <Input
            id="filtro-cliente"
            placeholder="Nombre del cliente..."
            value={filterCliente}
            onChange={(e) => setFilterCliente(e.target.value)}
            className="h-9"
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[100px]">Nº Boleta</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Semana</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Chofer</TableHead>
              <TableHead>Resumen</TableHead>
              <TableHead className="w-[100px]">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  Cargando...
                </TableCell>
              </TableRow>
            ) : filteredBoletas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  No se encontraron boletas
                </TableCell>
              </TableRow>
            ) : (
              filteredBoletas.map((boleta) => (
                <TableRow key={boleta.id}>
                  <TableCell className="font-bold">
                    <span className="text-red-600">
                      {boleta.numero_boleta.toString().padStart(6, "0")}
                    </span>
                  </TableCell>
                  <TableCell>
                    {format(new Date(boleta.fecha), "dd/MM/yyyy", { locale: es })}
                  </TableCell>
                  <TableCell>{boleta.numero_semana}</TableCell>
                  <TableCell>{getTipoBadge(boleta.tipo_boleta)}</TableCell>
                  <TableCell className="max-w-[150px] truncate">
                    {boleta.clientes?.nombre || "-"}
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate">
                    {boleta.choferes?.nombre || "-"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {getResumenDatos(boleta)}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onViewBoleta(boleta)}
                      className="h-8 w-8"
                      title="Ver boleta"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
