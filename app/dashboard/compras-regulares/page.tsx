"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { TransactionForm } from "@/components/dashboard/transaction-form";
import { TransactionTable } from "@/components/dashboard/transaction-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ShoppingCart } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const supabase = createClient();

const fetcher = async () => {
  const { data, error } = await supabase
    .from("compras_regulares")
    .select(`
      *,
      cliente:clientes(id, codigo, nombre),
      planta:plantas(id, codigo, nombre),
      chofer:choferes(id, codigo, nombre),
      placa:placas(id, codigo),
      tipo_pago:tipos_pago(id, codigo, nombre)
    `)
    .order("fecha", { ascending: false })
    .order("id", { ascending: false });

  if (error) throw error;
  return data;
};

const fetchLookups = async () => {
  const [clientes, plantas, choferes, placas, tiposPago] = await Promise.all([
    supabase.from("clientes").select("id, codigo, nombre").eq("activo", true).order("codigo"),
    supabase.from("plantas").select("id, codigo, nombre").eq("activo", true).order("codigo"),
    supabase.from("choferes").select("id, codigo, nombre").eq("activo", true).order("codigo"),
    supabase.from("placas").select("id, codigo").eq("activo", true).order("codigo"),
    supabase.from("tipos_pago").select("id, codigo, nombre").eq("activo", true).order("codigo"),
  ]);

  return {
    clientes: clientes.data || [],
    plantas: plantas.data || [],
    choferes: choferes.data || [],
    placas: placas.data || [],
    tiposPago: tiposPago.data || [],
  };
};

export default function ComprasRegularesPage() {
  const { toast } = useToast();
  const { data: transactions = [], mutate, isLoading } = useSWR("compras_regulares", fetcher);
  const { data: lookups } = useSWR("lookups_compras", fetchLookups);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Record<string, unknown> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async (formData: Record<string, unknown>) => {
    setIsSubmitting(true);
    try {
      const payload = {
        fecha: formData.fecha,
        cliente_id: formData.cliente_id,
        planta_id: formData.planta_id,
        chofer_id: formData.chofer_id,
        placa_id: formData.placa_id,
        boleta: formData.boleta || null,
        kilos_bruto: formData.kilos_bruto,
        kilos_tara: formData.kilos_tara,
        precio: formData.precio,
        tipo_pago_id: formData.tipo_pago_id || null,
      };

      if (editingTransaction) {
        const { error } = await supabase
          .from("compras_regulares")
          .update(payload)
          .eq("id", editingTransaction.id);

        if (error) throw error;
        toast({ title: "Registro actualizado exitosamente" });
      } else {
        const { error } = await supabase.from("compras_regulares").insert(payload);
        if (error) throw error;
        toast({ title: "Registro creado exitosamente" });
      }

      mutate();
      setIsDialogOpen(false);
      setEditingTransaction(null);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Ocurrio un error",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [editingTransaction, mutate, toast]);

  const handleEdit = useCallback((transaction: Record<string, unknown>) => {
    setEditingTransaction({
      id: transaction.id,
      fecha: transaction.fecha,
      cliente_id: (transaction.cliente as Record<string, unknown>)?.id,
      planta_id: (transaction.planta as Record<string, unknown>)?.id,
      chofer_id: (transaction.chofer as Record<string, unknown>)?.id,
      placa_id: (transaction.placa as Record<string, unknown>)?.id,
      boleta: transaction.boleta,
      kilos_bruto: transaction.kilos_bruto,
      kilos_tara: transaction.kilos_tara,
      precio: transaction.precio,
      tipo_pago_id: (transaction.tipo_pago as Record<string, unknown>)?.id,
    });
    setIsDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    try {
      const { error } = await supabase.from("compras_regulares").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Registro eliminado exitosamente" });
      mutate();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Ocurrio un error",
        variant: "destructive",
      });
    }
  }, [mutate, toast]);

  const todayStats = transactions.filter((t: Record<string, unknown>) => {
    const today = new Date().toISOString().split("T")[0];
    return t.fecha === today;
  });

  const todayKilos = todayStats.reduce((sum: number, t: Record<string, unknown>) => sum + Number(t.kilos_neto || 0), 0);
  const todayMonto = todayStats.reduce((sum: number, t: Record<string, unknown>) => sum + Number(t.monto || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Compras Regulares</h1>
          <p className="text-muted-foreground">Registro de compras regulares de pina</p>
        </div>
        <Button onClick={() => { setEditingTransaction(null); setIsDialogOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Compra
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compras Hoy</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayStats.length}</div>
            <p className="text-xs text-muted-foreground">registros</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kilos Neto Hoy</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("es-CR").format(todayKilos)}
            </div>
            <p className="text-xs text-muted-foreground">kg</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monto Hoy</CardTitle>
            <ShoppingCart className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC" }).format(todayMonto)}
            </div>
            <p className="text-xs text-muted-foreground">colones</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Compras</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionTable
            transactions={transactions as never[]}
            onEdit={handleEdit as never}
            onDelete={handleDelete}
            showTipoPago
            isLoading={isLoading}
          />
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) setEditingTransaction(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingTransaction ? "Editar Compra" : "Nueva Compra Regular"}
            </DialogTitle>
          </DialogHeader>
          <TransactionForm
            initialData={editingTransaction || undefined}
            onSubmit={handleSubmit}
            onCancel={() => { setIsDialogOpen(false); setEditingTransaction(null); }}
            isSubmitting={isSubmitting}
            clientes={lookups?.clientes || []}
            plantas={lookups?.plantas || []}
            choferes={lookups?.choferes || []}
            placas={lookups?.placas || []}
            tiposPago={lookups?.tiposPago || []}
            showTipoPago
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
