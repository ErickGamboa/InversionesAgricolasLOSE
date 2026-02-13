"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { ComprasRegularesForm } from "@/components/dashboard/forms/compras-regulares-form";
import { ComprasRegularesTable } from "@/components/dashboard/tables/compras-regulares-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, ShoppingCart } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
      cliente:clientes(id, nombre),
      chofer:choferes(id, nombre),
      tipo_pago:tipos_pago(id, nombre)
    `)
    .order("fecha", { ascending: false })
    .order("id", { ascending: false });

  if (error) throw error;
  return data;
};

const fetchLookups = async () => {
  const [clientes, choferes, tiposPago] = await Promise.all([
    supabase.from("clientes").select("id, nombre").eq("activo", true).order("nombre"),
    supabase.from("choferes").select("id, nombre").eq("activo", true).eq("tipo", "interno").order("nombre"),
    supabase.from("tipos_pago").select("id, nombre").eq("activo", true).order("nombre"),
  ]);

  return {
    clientes: clientes.data || [],
    choferes: choferes.data || [],
    tiposPago: tiposPago.data || [],
  };
};

export default function ComprasRegularesPage() {
  const { toast } = useToast();
  const { data: compras = [], mutate, isLoading } = useSWR("compras_regulares", fetcher);
  const { data: lookups } = useSWR("lookups_compras_regulares", fetchLookups);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompra, setEditingCompra] = useState<Record<string, unknown> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async (formData: Record<string, unknown>) => {
    setIsSubmitting(true);
    try {
      if (editingCompra) {
        const { error } = await supabase
          .from("compras_regulares")
          .update(formData)
          .eq("id", editingCompra.id);

        if (error) throw error;
        toast({ title: "Compra actualizada exitosamente" });
      } else {
        const { error } = await supabase.from("compras_regulares").insert(formData);
        if (error) throw error;
        toast({ title: "Compra creada exitosamente" });
      }

      mutate();
      setIsDialogOpen(false);
      setEditingCompra(null);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Ocurrió un error",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [editingCompra, mutate, toast]);

  const handleEdit = useCallback((compra: Record<string, unknown>) => {
    setEditingCompra({
      id: compra.id,
      fecha: compra.fecha,
      numero_semana: compra.numero_semana,
      pago_dolares: compra.pago_dolares,
      lugar_procedencia: compra.lugar_procedencia,
      procedencia_tipo: compra.procedencia_tipo,
      cliente_id: (compra.cliente as Record<string, unknown>)?.id,
      numero_boleta: compra.numero_boleta,
      nb_tickete: compra.nb_tickete,
      chofer_id: (compra.chofer as Record<string, unknown>)?.id,
      tipo_pina: compra.tipo_pina,
      numero_kilos: compra.numero_kilos,
      precio_piña: compra.precio_piña,
      pagado: compra.pagado,
      tipo_pago_id: (compra.tipo_pago as Record<string, unknown>)?.id,
      numero_deposito: compra.numero_deposito,
      numero_factura: compra.numero_factura,
    });
    setIsDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async (id: string | number) => {
    try {
      const { error } = await supabase.from("compras_regulares").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Compra eliminada exitosamente" });
      mutate();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Ocurrió un error",
        variant: "destructive",
      });
    }
  }, [mutate, toast]);

  const today = new Date().toLocaleDateString('en-CA', { 
    timeZone: 'America/Costa_Rica',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const todayStats = compras.filter((c: Record<string, unknown>) => c.fecha === today);
  
  const todayCount = todayStats.length;
  const todayKilos = todayStats.reduce((sum: number, c: Record<string, unknown>) => 
    sum + Number(c.numero_kilos || 0), 0);
  const todayMontoCRC = todayStats
    .filter((c: Record<string, unknown>) => !c.pago_dolares)
    .reduce((sum: number, c: Record<string, unknown>) => sum + Number(c.total_a_pagar || 0), 0);
  const todayMontoUSD = todayStats
    .filter((c: Record<string, unknown>) => c.pago_dolares)
    .reduce((sum: number, c: Record<string, unknown>) => sum + Number(c.total_a_pagar || 0), 0);

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Compras Regulares</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="space-y-6 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Compras Regulares</h1>
            <p className="text-muted-foreground">Registro de compras regulares de piña</p>
          </div>
          <Button onClick={() => { setEditingCompra(null); setIsDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Compra
          </Button>
        </div>

        {/* Estadísticas */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compras Hoy</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayCount}</div>
              <p className="text-xs text-muted-foreground">registros</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kilos Hoy</CardTitle>
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
                {new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC" }).format(todayMontoCRC)}
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(todayMontoUSD)}
              </div>
              <p className="text-xs text-muted-foreground">CRC / USD</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de compras */}
        <Card>
          <CardHeader>
            <CardTitle>Historial de Compras</CardTitle>
          </CardHeader>
          <CardContent>
            <ComprasRegularesTable
              compras={compras as never[]}
              onEdit={handleEdit as never}
              onDelete={handleDelete}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>

        {/* Dialog de formulario */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => { 
          setIsDialogOpen(open); 
          if (!open) setEditingCompra(null); 
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCompra ? "Editar Compra Regular" : "Nueva Compra Regular"}
              </DialogTitle>
            </DialogHeader>
            <ComprasRegularesForm
              initialData={editingCompra || undefined}
              onSubmit={handleSubmit}
              onCancel={() => { setIsDialogOpen(false); setEditingCompra(null); }}
              isSubmitting={isSubmitting}
              clientes={lookups?.clientes || []}
              choferes={lookups?.choferes || []}
              tiposPago={lookups?.tiposPago || []}
            />
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
