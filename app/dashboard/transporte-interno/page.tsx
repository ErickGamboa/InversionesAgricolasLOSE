"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { createClient } from "@/lib/supabase/client";
import { TransporteInternoForm } from "@/components/dashboard/forms/transporte-interno-form";
import { TransporteInternoTable } from "@/components/dashboard/tables/transporte-interno-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Package } from "lucide-react";
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
    .from("transporte_interno")
    .select(`
      *,
      chofer:choferes(id, nombre),
      placa:placas(id, codigo),
      cliente:clientes(id, nombre)
    `)
    .order("fecha", { ascending: false })
    .order("id", { ascending: false });

  if (error) throw error;
  return data;
};

const fetchLookups = async () => {
  const [choferes, placas, clientes] = await Promise.all([
    supabase.from("choferes").select("id, nombre").eq("activo", true).eq("tipo", "interno").order("nombre"),
    supabase.from("placas").select("id, codigo").eq("activo", true).order("codigo"),
    supabase.from("clientes").select("id, nombre").eq("activo", true).order("nombre"),
  ]);

  return {
    choferes: choferes.data || [],
    placas: placas.data || [],
    clientes: clientes.data || [],
  };
};

export default function TransporteInternoPage() {
  const { toast } = useToast();
  const { data: transportes = [], mutate, isLoading } = useSWR("transporte_interno", fetcher);
  const { data: lookups } = useSWR("lookups_transporte_interno", fetchLookups);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTransporte, setEditingTransporte] = useState<Record<string, unknown> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async (formData: Record<string, unknown>) => {
    setIsSubmitting(true);
    try {
      if (editingTransporte) {
        const { error } = await supabase
          .from("transporte_interno")
          .update(formData)
          .eq("id", editingTransporte.id);

        if (error) throw error;
        toast({ title: "Transporte actualizado exitosamente" });
      } else {
        const { error } = await supabase.from("transporte_interno").insert(formData);
        if (error) throw error;
        toast({ title: "Transporte creado exitosamente" });
      }

      mutate();
      setIsDialogOpen(false);
      setEditingTransporte(null);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Ocurrió un error",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [editingTransporte, mutate, toast]);

  const handleEdit = useCallback((transporte: Record<string, unknown>) => {
    setEditingTransporte({
      id: transporte.id,
      fecha: transporte.fecha,
      numero_semana: transporte.numero_semana,
      chofer_id: (transporte.chofer as Record<string, unknown>)?.id,
      placa_id: (transporte.placa as Record<string, unknown>)?.id,
      cliente_id: (transporte.cliente as Record<string, unknown>)?.id,
      diesel: transporte.diesel,
      ingreso: transporte.ingreso,
    });
    setIsDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async (id: string | number) => {
    try {
      const { error } = await supabase.from("transporte_interno").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Transporte eliminado exitosamente" });
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
  const todayStats = transportes.filter((t: Record<string, unknown>) => t.fecha === today);
  
  const todayCount = todayStats.length;
  const todayDiesel = todayStats.reduce((sum: number, t: Record<string, unknown>) => 
    sum + Number(t.diesel || 0), 0);
  const todayIngreso = todayStats.reduce((sum: number, t: Record<string, unknown>) => 
    sum + Number(t.ingreso || 0), 0);

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
              <BreadcrumbPage>Transporte Interno</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="space-y-6 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Transporte Interno</h1>
            <p className="text-muted-foreground">Registro de transporte interno</p>
          </div>
          <Button onClick={() => { setEditingTransporte(null); setIsDialogOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Transporte
          </Button>
        </div>

        {/* Estadísticas */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Transportes Hoy</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayCount}</div>
              <p className="text-xs text-muted-foreground">registros</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Diesel Hoy</CardTitle>
              <Package className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC" }).format(todayDiesel)}
              </div>
              <p className="text-xs text-muted-foreground">gasto</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ingreso Hoy</CardTitle>
              <Package className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {new Intl.NumberFormat("es-CR", { style: "currency", currency: "CRC" }).format(todayIngreso)}
              </div>
              <p className="text-xs text-muted-foreground">ingreso</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabla de transportes */}
        <Card>
          <CardHeader>
            <CardTitle>Historial de Transportes Internos</CardTitle>
          </CardHeader>
          <CardContent>
            <TransporteInternoTable
              transportes={transportes as never[]}
              onEdit={handleEdit as never}
              onDelete={handleDelete}
              isLoading={isLoading}
            />
          </CardContent>
        </Card>

        {/* Dialog de formulario */}
        <Dialog open={isDialogOpen} onOpenChange={(open) => { 
          setIsDialogOpen(open); 
          if (!open) setEditingTransporte(null); 
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTransporte ? "Editar Transporte Interno" : "Nuevo Transporte Interno"}
              </DialogTitle>
            </DialogHeader>
            <TransporteInternoForm
              initialData={editingTransporte || undefined}
              onSubmit={handleSubmit}
              onCancel={() => { setIsDialogOpen(false); setEditingTransporte(null); }}
              isSubmitting={isSubmitting}
              choferes={lookups?.choferes || []}
              placas={lookups?.placas || []}
              clientes={lookups?.clientes || []}
            />
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
