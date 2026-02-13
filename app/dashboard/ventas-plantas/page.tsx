"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { VentasPlantasForm } from "@/components/dashboard/forms/ventas-plantas-form";
import { VentasPlantasTable } from "@/components/dashboard/tables/ventas-plantas-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, TrendingUp } from "lucide-react";
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
    .from("ventas_plantas")
    .select(`
      *,
      planta:plantas(id, nombre),
      chofer:choferes(id, nombre)
    `)
    .order("fecha", { ascending: false })
    .order("id", { ascending: false });

  if (error) throw error;
  return data;
};

const fetchLookups = async () => {
  const [plantas, choferes] = await Promise.all([
    supabase.from("plantas").select("id, nombre").eq("activo", true).order("nombre"),
    supabase.from("choferes").select("id, nombre").eq("activo", true).eq("tipo", "interno").order("nombre"),
  ]);

  return {
    plantas: plantas.data || [],
    choferes: choferes.data || [],
  };
};

export default function VentasPlantasPage() {
  const { toast } = useToast();
  const { data: ventas = [], mutate, isLoading } = useSWR("ventas_plantas", fetcher);
  const { data: lookups } = useSWR("lookups_ventas_plantas", fetchLookups);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVenta, setEditingVenta] = useState<Record<string, unknown> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async (formData: Record<string, unknown>) => {
    setIsSubmitting(true);
    try {
      if (editingVenta) {
        const { error } = await supabase
          .from("ventas_plantas")
          .update(formData)
          .eq("id", editingVenta.id);

        if (error) throw error;
        toast({ title: "Venta actualizada exitosamente" });
      } else {
        const { error } = await supabase.from("ventas_plantas").insert(formData);
        if (error) throw error;
        toast({ title: "Venta creada exitosamente" });
      }

      mutate();
      setIsDialogOpen(false);
      setEditingVenta(null);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Ocurrió un error",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [editingVenta, mutate, toast]);

  const handleEdit = useCallback((venta: Record<string, unknown>) => {
    setEditingVenta({
      id: venta.id,
      fecha: venta.fecha,
      numero_semana: venta.numero_semana,
      planta_id: (venta.planta as Record<string, unknown>)?.id,
      chofer_id: (venta.chofer as Record<string, unknown>)?.id,
      numero_boleta: venta.numero_boleta,
      nb_tickete: venta.nb_tickete,
      tipo_pina: venta.tipo_pina,
      kilos_reportados: venta.kilos_reportados,
      porcentaje_castigo: venta.porcentaje_castigo,
      precio_iqf: venta.precio_iqf,
      precio_jugo: venta.precio_jugo,
    });
    setIsDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async (id: string | number) => {
    try {
      const { error } = await supabase.from("ventas_plantas").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Venta eliminada exitosamente" });
      mutate();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Ocurrió un error",
        variant: "destructive",
      });
    }
  }, [mutate, toast]);

  // Estadísticas de hoy
  const today = new Date().toLocaleDateString('en-CA', { 
    timeZone: 'America/Costa_Rica',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const todayStats = ventas.filter((v: Record<string, unknown>) => v.fecha === today);
  
  const todayCount = todayStats.length;
  const todayKilos = todayStats.reduce((sum: number, v: Record<string, unknown>) => 
    sum + Number(v.total_kilos || 0), 0);
  const todayMontoUSD = todayStats.reduce((sum: number, v: Record<string, unknown>) => 
    sum + Number(v.total_pagar_pina || 0), 0);

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
              <BreadcrumbPage>Ventas a Plantas</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="space-y-6 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Ventas a Plantas</h1>
            <p className="text-muted-foreground">Registro de ventas de piña a plantas procesadoras</p>
          </div>
          <Button onClick={() => { setEditingVenta(null); setIsDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Venta
          </Button>
        </div>

        {/* Estadísticas */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ventas Hoy</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayCount}</div>
              <p className="text-xs text-muted-foreground">registros</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kilos Neto Hoy</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
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
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(todayMontoUSD)}
              </div>
              <p className="text-xs text-muted-foreground">dólares</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de ventas */}
        <Card>
          <CardHeader>
            <CardTitle>Historial de Ventas</CardTitle>
          </CardHeader>
          <CardContent>
            <VentasPlantasTable
              ventas={ventas as never[]}
              onEdit={handleEdit as never}
              onDelete={handleDelete}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>

        {/* Dialog de formulario */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => { 
          setIsDialogOpen(open); 
          if (!open) setEditingVenta(null); 
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingVenta ? "Editar Venta" : "Nueva Venta a Planta"}
              </DialogTitle>
            </DialogHeader>
            <VentasPlantasForm
              initialData={editingVenta || undefined}
              onSubmit={handleSubmit}
              onCancel={() => { setIsDialogOpen(false); setEditingVenta(null); }}
              isSubmitting={isSubmitting}
              plantas={lookups?.plantas || []}
              choferes={lookups?.choferes || []}
            />
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
