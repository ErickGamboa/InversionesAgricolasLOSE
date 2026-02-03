"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Pencil, Trash2, Search } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Transaction {
  id: number;
  fecha: string;
  cliente: { codigo: string; nombre: string };
  planta: { codigo: string; nombre: string };
  chofer: { codigo: string; nombre: string };
  placa: { codigo: string };
  boleta?: string;
  kilos_bruto: number;
  kilos_tara: number;
  kilos_neto: number;
  precio: number;
  monto: number;
  tipo_pago?: { codigo: string; nombre: string };
}

interface TransactionTableProps {
  transactions: Transaction[];
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: number) => void;
  showTipoPago?: boolean;
  isLoading?: boolean;
}

export function TransactionTable({
  transactions,
  onEdit,
  onDelete,
  showTipoPago = false,
  isLoading = false,
}: TransactionTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const filteredTransactions = transactions.filter((t) => {
    const search = searchTerm.toLowerCase();
    return (
      t.cliente?.nombre?.toLowerCase().includes(search) ||
      t.cliente?.codigo?.toLowerCase().includes(search) ||
      t.planta?.nombre?.toLowerCase().includes(search) ||
      t.chofer?.nombre?.toLowerCase().includes(search) ||
      t.placa?.codigo?.toLowerCase().includes(search) ||
      t.boleta?.toLowerCase().includes(search)
    );
  });

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat("es-CR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat("es-CR", {
      style: "currency",
      currency: "CRC",
      minimumFractionDigits: 2,
    }).format(num);
  };

  const totals = filteredTransactions.reduce(
    (acc, t) => ({
      kilos_bruto: acc.kilos_bruto + Number(t.kilos_bruto || 0),
      kilos_tara: acc.kilos_tara + Number(t.kilos_tara || 0),
      kilos_neto: acc.kilos_neto + Number(t.kilos_neto || 0),
      monto: acc.monto + Number(t.monto || 0),
    }),
    { kilos_bruto: 0, kilos_tara: 0, kilos_neto: 0, monto: 0 }
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cliente, planta, chofer, placa o boleta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {filteredTransactions.length} registros
        </span>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-24">Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Planta</TableHead>
              <TableHead>Chofer</TableHead>
              <TableHead className="w-20">Placa</TableHead>
              <TableHead className="w-20">Boleta</TableHead>
              <TableHead className="text-right w-24">K. Bruto</TableHead>
              <TableHead className="text-right w-24">K. Tara</TableHead>
              <TableHead className="text-right w-24">K. Neto</TableHead>
              <TableHead className="text-right w-20">Precio</TableHead>
              <TableHead className="text-right w-28">Monto</TableHead>
              {showTipoPago && <TableHead className="w-24">T. Pago</TableHead>}
              <TableHead className="w-20 text-center">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={showTipoPago ? 13 : 12} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Cargando...
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={showTipoPago ? 13 : 12} className="text-center py-8 text-muted-foreground">
                  No hay registros para mostrar
                </TableCell>
              </TableRow>
            ) : (
              <>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id} className="hover:bg-muted/30">
                    <TableCell className="font-mono text-sm">
                      {format(new Date(transaction.fecha), "dd/MM/yy", { locale: es })}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{transaction.cliente?.codigo}</span>
                        <span className="text-xs text-muted-foreground truncate max-w-32">
                          {transaction.cliente?.nombre}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{transaction.planta?.codigo}</span>
                        <span className="text-xs text-muted-foreground truncate max-w-24">
                          {transaction.planta?.nombre}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{transaction.chofer?.codigo}</span>
                        <span className="text-xs text-muted-foreground truncate max-w-24">
                          {transaction.chofer?.nombre}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{transaction.placa?.codigo}</TableCell>
                    <TableCell className="font-mono">{transaction.boleta || "-"}</TableCell>
                    <TableCell className="text-right font-mono">
                      {formatNumber(transaction.kilos_bruto)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatNumber(transaction.kilos_tara)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium">
                      {formatNumber(transaction.kilos_neto)}
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatNumber(transaction.precio)}
                    </TableCell>
                    <TableCell className="text-right font-mono font-medium text-primary">
                      {formatCurrency(transaction.monto)}
                    </TableCell>
                    {showTipoPago && (
                      <TableCell>{transaction.tipo_pago?.codigo || "-"}</TableCell>
                    )}
                    <TableCell>
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onEdit(transaction)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => setDeleteId(transaction.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/50 font-medium">
                  <TableCell colSpan={6} className="text-right">
                    Totales:
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatNumber(totals.kilos_bruto)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatNumber(totals.kilos_tara)}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {formatNumber(totals.kilos_neto)}
                  </TableCell>
                  <TableCell />
                  <TableCell className="text-right font-mono text-primary">
                    {formatCurrency(totals.monto)}
                  </TableCell>
                  {showTipoPago && <TableCell />}
                  <TableCell />
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar eliminacion</AlertDialogTitle>
            <AlertDialogDescription>
              Esta accion no se puede deshacer. Se eliminara permanentemente este registro.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (deleteId) {
                  onDelete(deleteId);
                  setDeleteId(null);
                }
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
