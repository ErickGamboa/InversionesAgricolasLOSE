"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Planilla, EmpleadoPlanilla } from "@/types/planilla"
import { Plus, Save, X, CheckCircle2, Pencil, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

type PendingLine = {
  id: string
  fecha: string
  numeroSemana: number
  horasExtra: string
  precioHora: string
  rebajo: string
  salario: string
}

const currencyFormatter = new Intl.NumberFormat("es-CR", {
  style: "currency",
  currency: "CRC",
  maximumFractionDigits: 0,
})

const getWeekNumber = (date: Date) => {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDays = Math.floor((date.getTime() - firstDayOfYear.getTime()) / 86400000)
  return Math.ceil((pastDays + firstDayOfYear.getDay() + 1) / 7)
}

const computeTotalsFromLine = (line: PendingLine) => {
  const hours = Number(line.horasExtra) || 0
  const price = Number(line.precioHora) || 0
  const salary = Number(line.salario) || 0
  const rebate = Number(line.rebajo) || 0
  const bruto = salary + hours * price
  const rebateAmount = (bruto * rebate) / 100
  return {
    bruto,
    neto: bruto - rebateAmount,
    rebateAmount,
  }
}

export default function PlanillasPage() {
  const [employees, setEmployees] = useState<EmpleadoPlanilla[]>([])
  const [planillas, setPlanillas] = useState<Planilla[]>([])
  const [loadingEmployees, setLoadingEmployees] = useState(true)
  const [loadingPlanillas, setLoadingPlanillas] = useState(true)
  const [pendingLines, setPendingLines] = useState<Record<number, PendingLine[]>>({})
  const [savingLineId, setSavingLineId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [creatingEmployee, setCreatingEmployee] = useState(false)
  const [newEmployee, setNewEmployee] = useState({ nombre: "", cargo: "" })
  const [editingPlanilla, setEditingPlanilla] = useState<Planilla | null>(null)
  const [editingLineValues, setEditingLineValues] = useState<PendingLine | null>(null)
  const [deletingPlanilla, setDeletingPlanilla] = useState<Planilla | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingEmployee, setDeletingEmployee] = useState<EmpleadoPlanilla | null>(null)
  const [deleteEmployeeDialogOpen, setDeleteEmployeeDialogOpen] = useState(false)
  const [deletingEmployeeId, setDeletingEmployeeId] = useState<number | null>(null)

  const groupedPlanillas = useMemo(() => {
    const map: Record<number, Planilla[]> = {}
    planillas.forEach((planilla) => {
      const target = planilla.empleado_id
      if (!map[target]) map[target] = []
      map[target].push(planilla)
    })
    return map
  }, [planillas])

  const totalsByEmployee = useMemo(() => {
    const map: Record<number, { bruto: number; neto: number; horas: number }> = {}
    Object.entries(groupedPlanillas).forEach(([key, items]) => {
      map[Number(key)] = items.reduce(
        (acc, item) => {
          acc.bruto += item.total_pagar
          acc.neto += item.neto
          acc.horas += item.horas_extra
          return acc
        },
        { bruto: 0, neto: 0, horas: 0 },
      )
    })
    return map
  }, [groupedPlanillas])

  const totalPlanillas = useMemo(
    () => planillas.reduce((acc, item) => acc + item.total_pagar, 0),
    [planillas],
  )

  const fetchEmployees = useCallback(async () => {
    setLoadingEmployees(true)
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("empleados")
        .select("id, nombre_completo, cargo, salario_base")
        .order("nombre_completo", { ascending: true })
      if (error) throw error
      setEmployees(data ?? [])
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido"
      if (message.toLowerCase().includes("public.empleados")) {
        toast.error("La tabla empleados no existe todavía. Ejecuta las migraciones en Supabase.")
      } else {
        toast.error("No se pudo cargar los empleados")
      }
      setEmployees([])
    } finally {
      setLoadingEmployees(false)
    }
  }, [])

  const fetchPlanillas = useCallback(async () => {
    setLoadingPlanillas(true)
    try {
      const response = await fetch("/api/planillas", { cache: "no-store" })
      if (!response.ok) {
        throw new Error("No fue posible cargar las planillas")
      }
      const data = await response.json()
      setPlanillas(data.data ?? [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error desconocido")
      setPlanillas([])
    } finally {
      setLoadingPlanillas(false)
    }
  }, [])

  useEffect(() => {
    fetchEmployees()
  }, [fetchEmployees])

  useEffect(() => {
    fetchPlanillas()
  }, [fetchPlanillas])

  const resetEmployeeForm = () => {
    setNewEmployee({ nombre: "", cargo: "" })
  }

  const handleCreateEmployee = async () => {
    if (!newEmployee.nombre.trim()) {
      toast.error("El nombre es obligatorio")
      return
    }
    setCreatingEmployee(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("empleados").insert({
        nombre_completo: newEmployee.nombre.trim(),
        cargo: newEmployee.cargo.trim() || null,
        salario_base: 0,
      })
      if (error) throw error
      toast.success("Colaborador creado")
      resetEmployeeForm()
      setDialogOpen(false)
      fetchEmployees()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido"
      if (message.toLowerCase().includes("public.empleados")) {
        toast.error("La tabla empleados no existe todavía. Ejecuta las migraciones en Supabase.")
      } else {
        toast.error(message)
      }
    } finally {
      setCreatingEmployee(false)
    }
  }

  const addLine = (employeeId: number) => {
    setPendingLines((prev) => {
      const newLine: PendingLine = {
        id: `${employeeId}-${Date.now()}`,
        fecha: new Date().toISOString().split("T")[0],
        numeroSemana: getWeekNumber(new Date()),
        horasExtra: "",
        precioHora: "",
        rebajo: "0",
        salario: "0",
      }
      return {
        ...prev,
        [employeeId]: [...(prev[employeeId] ?? []), newLine],
      }
    })
  }

  const updateLine = (employeeId: number, lineId: string, field: keyof PendingLine, value: string) => {
    setPendingLines((prev) => {
      const lines = prev[employeeId] ?? []
      return {
        ...prev,
        [employeeId]: lines.map((line) => {
          if (line.id !== lineId) return line
          if (field === "fecha") {
            const parsed = new Date(value)
            if (!Number.isNaN(parsed.getTime())) {
              return { ...line, fecha: value, numeroSemana: getWeekNumber(parsed) }
            }
          }
          return { ...line, [field]: value }
        }),
      }
    })
  }

  const removeLine = (employeeId: number, lineId: string) => {
    setPendingLines((prev) => {
      const lines = prev[employeeId] ?? []
      return { ...prev, [employeeId]: lines.filter((line) => line.id !== lineId) }
    })
  }

  const handleSaveLine = async (employeeId: number, line: PendingLine) => {
    if (!line.horasExtra || !line.precioHora) {
      toast.error("Completa horas extra y precio antes de guardar")
      return
    }
    const payload = {
      empleado_id: employeeId,
      fecha_pago: line.fecha,
      tipo_pago: "semanal" as const,
      estado: "pendiente" as const,
      horas_extra: Number(line.horasExtra),
      precio_hora_extra: Number(line.precioHora),
      salario_linea: Number(line.salario) || 0,
      rebajo_porcentaje: Number(line.rebajo),
      comentarios: `Línea generada en tarjeta semana ${line.numeroSemana}`,
      metadata: {},
    }
    setSavingLineId(line.id)
    try {
      const response = await fetch("/api/planillas", {
        method: "POST",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error ?? "No fue posible guardar la línea")
      }
      toast.success("Línea guardada")
      removeLine(employeeId, line.id)
      fetchPlanillas()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error desconocido")
    } finally {
      setSavingLineId(null)
    }
  }

  const startEditingLine = (planilla: Planilla) => {
    setEditingPlanilla(planilla)
    setEditingLineValues({
      id: `${planilla.id}`,
      fecha: planilla.fecha_pago,
      numeroSemana: planilla.numero_semana,
      horasExtra: String(planilla.horas_extra),
      precioHora: String(planilla.precio_hora_extra),
      rebajo: String(planilla.rebajo_porcentaje),
      salario: String(planilla.salario_linea ?? 0),
    })
  }

  const cancelEditingLine = () => {
    setEditingPlanilla(null)
    setEditingLineValues(null)
  }

  const handleUpdateLine = async () => {
    if (!editingPlanilla || !editingLineValues) return
    if (!editingLineValues.horasExtra || !editingLineValues.precioHora) {
      toast.error("Completa horas y precio antes de guardar")
      return
    }
    const payload = {
      id: editingPlanilla.id,
      empleado_id: editingPlanilla.empleado_id,
      fecha_pago: editingLineValues.fecha,
      tipo_pago: editingPlanilla.tipo_pago,
      estado: editingPlanilla.estado,
      horas_extra: Number(editingLineValues.horasExtra),
      precio_hora_extra: Number(editingLineValues.precioHora),
      rebajo_porcentaje: Number(editingLineValues.rebajo),
      comentarios: editingPlanilla.comentarios,
      metadata: editingPlanilla.metadata,
      salario_linea: Number(editingLineValues.salario) || 0,
    }
    setSavingLineId(editingPlanilla.id?.toString() ?? null)
    try {
      const response = await fetch("/api/planillas", {
        method: "PATCH",
        body: JSON.stringify(payload),
        headers: { "Content-Type": "application/json" },
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error ?? "No fue posible actualizar la línea")
      }
      toast.success("Línea actualizada")
      cancelEditingLine()
      fetchPlanillas()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error desconocido")
    } finally {
      setSavingLineId(null)
    }
  }

  const handleToggleStatus = async (planilla: Planilla) => {
    const nuevoEstado = planilla.estado === "pagado" ? "pendiente" : "pagado"
    try {
      const response = await fetch("/api/planillas", {
        method: "PATCH",
        body: JSON.stringify({
          id: planilla.id,
          empleado_id: planilla.empleado_id,
          fecha_pago: planilla.fecha_pago,
          tipo_pago: planilla.tipo_pago,
          estado: nuevoEstado,
          horas_extra: planilla.horas_extra,
          precio_hora_extra: planilla.precio_hora_extra,
          rebajo_porcentaje: planilla.rebajo_porcentaje,
          salario_linea: planilla.salario_linea ?? 0,
          comentarios: planilla.comentarios,
          metadata: planilla.metadata,
        }),
        headers: { "Content-Type": "application/json" },
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? "Error al actualizar estado")
      toast.success("Estado actualizado")
      fetchPlanillas()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error desconocido")
    }
  }

  const confirmDeletePlanilla = async () => {
    if (!deletingPlanilla) return
    try {
      const response = await fetch(`/api/planillas?id=${deletingPlanilla.id}`, { method: "DELETE" })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error ?? "No se pudo eliminar")
      toast.success("Línea eliminada")
      setDeleteDialogOpen(false)
      setDeletingPlanilla(null)
      fetchPlanillas()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error desconocido")
    }
  }

  const confirmDeleteEmployee = async () => {
    if (!deletingEmployee) return

    setDeletingEmployeeId(deletingEmployee.id)
    try {
      const supabase = createClient()
      const { error } = await supabase.from("empleados").delete().eq("id", deletingEmployee.id)

      if (error) throw error

      toast.success("Colaborador eliminado")
      setDeleteEmployeeDialogOpen(false)
      setDeletingEmployee(null)
      fetchEmployees()
      fetchPlanillas()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido"
      const lower = message.toLowerCase()
      if (
        lower.includes("foreign key") ||
        lower.includes("23503") ||
        lower.includes("planillas")
      ) {
        toast.error("No se puede eliminar el colaborador porque tiene planillas registradas")
      } else {
        toast.error(message)
      }
    } finally {
      setDeletingEmployeeId(null)
    }
  }


  const overallLoading = loadingEmployees || loadingPlanillas

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Planillas</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="space-y-6 p-4 md:p-6">
        <Card className="border border-border bg-white shadow-sm p-4">
          <CardHeader className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Planillas</h1>
              <p className="text-sm text-muted-foreground">Gestiona pagos, horas extras y rebajos por colaborador.</p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="default" className="gap-2 bg-emerald-600 text-white">
                  <Plus className="h-4 w-4" /> Nuevo colaborador
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Agregar colaborador</DialogTitle>
                  <DialogDescription>
                    Define el nombre y cargo para que aparezca en el historial.
                  </DialogDescription>
                </DialogHeader>
                <form
                  className="space-y-4"
                  onSubmit={(event) => {
                    event.preventDefault()
                    handleCreateEmployee()
                  }}
                >
                  <div>
                    <Label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Nombre completo</Label>
                    <Input
                      value={newEmployee.nombre}
                      onChange={(event) => setNewEmployee((prev) => ({ ...prev, nombre: event.target.value }))}
                      placeholder="e.g. María Pérez"
                      required
                    />
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-[0.3em] text-muted-foreground">Cargo</Label>
                    <Input
                      value={newEmployee.cargo}
                      onChange={(event) => setNewEmployee((prev) => ({ ...prev, cargo: event.target.value }))}
                      placeholder="e.g. Operario de patio"
                    />
                  </div>
                  <DialogFooter className="flex justify-end gap-2">
                    <Button variant="ghost" type="button" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={creatingEmployee}>
                      {creatingEmployee ? "Guardando…" : "Guardar colaborador"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
        </Card>

        <Card className="border border-border bg-white shadow-sm">
          <CardHeader className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Historial de planillas</h2>
            <Button variant="outline" className="gap-2 text-sm">
              Exportar
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {overallLoading ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Card key={index} className="h-48 animate-pulse" />
                ))}
              </div>
            ) : employees.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-muted p-6 text-center text-muted-foreground">
                No hay empleados registrados. Usa «Nuevo colaborador» para comenzar.
              </div>
            ) : (
              <div className="space-y-6">
                {employees.map((employee) => {
                  const lines = groupedPlanillas[employee.id] ?? []
                  const totals = totalsByEmployee[employee.id] ?? { bruto: 0, neto: 0, horas: 0 }
                  const pending = pendingLines[employee.id] ?? []
                  return (
                    <div key={employee.id} className="rounded-2xl border border-border bg-slate-50 p-4">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                          <p className="text-xs uppercase tracking-[0.5em] text-muted-foreground">Empleado</p>
                          <h3 className="text-lg font-semibold text-foreground">{employee.nombre_completo}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => addLine(employee.id)}>
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              setDeletingEmployee(employee)
                              setDeleteEmployeeDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="mt-4 space-y-4">
                        {lines.length === 0 && pending.length === 0 && (
                          <div className="rounded-xl border border-dashed border-muted p-4 text-sm text-muted-foreground">
                            Sin pagos registrados. Usa el botón + para agregar una línea.
                          </div>
                        )}
                        {lines.map((item) => (
                          <div key={item.id} className="rounded-xl border border-border p-4 bg-white">
                            <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                              <span>{new Date(item.fecha_pago).toLocaleDateString("es-CR", { day: "2-digit", month: "short", year: "numeric" })}</span>
                              <Badge variant={item.estado === "pagado" ? "secondary" : "outline"}>{item.estado}</Badge>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-xs text-muted-foreground">Semana</p>
                                <p className="font-semibold">{item.numero_semana}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Horas extra</p>
                                <p className="font-semibold">{item.horas_extra}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Precio hora</p>
                                <p className="font-semibold">{currencyFormatter.format(item.precio_hora_extra)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Rebajo %</p>
                                <p className="font-semibold">{item.rebajo_porcentaje}%</p>
                              </div>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-4 text-sm font-semibold text-amber-600">
                              <div>
                                <p className="text-xs text-amber-400">Total bruto</p>
                                <p className="text-lg text-amber-600">{currencyFormatter.format(item.total_pagar)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-amber-400">Total neto</p>
                                <p className="text-lg text-amber-600">{currencyFormatter.format(item.neto)}</p>
                              </div>
                            </div>
                            <div className="mt-4 flex flex-wrap items-center gap-2">
                              <Button size="sm" variant="outline" className="gap-2" onClick={() => startEditingLine(item)}>
                                <Pencil className="h-4 w-4" />
                                Editar
                              </Button>
                              <Button size="sm" variant="outline" className="gap-2" onClick={() => handleToggleStatus(item)}>
                                <CheckCircle2 className="h-4 w-4" />
                                {item.estado === "pagado" ? "Marcar pendiente" : "Marcar pagado"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-2 text-destructive hover:text-destructive"
                                onClick={() => {
                                  setDeletingPlanilla(item)
                                  setDeleteDialogOpen(true)
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                                Eliminar
                              </Button>
                            </div>
                          </div>
                        ))}
                        {pending.map((line) => {
                          const { bruto, neto } = computeTotalsFromLine(line)
                          return (
                            <div key={line.id} className="rounded-2xl border border-primary/30 bg-white/90 p-4">
                              <div className="grid gap-3 sm:grid-cols-2">
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground">Fecha</p>
                                  <Input type="date" value={line.fecha} onChange={(event) => updateLine(employee.id, line.id, "fecha", event.target.value)} />
                                </div>
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground">Semana</p>
                                  <Input value={line.numeroSemana} disabled />
                                </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Horas extra</p>
                          <Input
                            type="number"
                            min="0"
                            value={line.horasExtra}
                            onChange={(event) => updateLine(employee.id, line.id, "horasExtra", event.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Precio hora</p>
                          <Input
                            type="number"
                            min="0"
                            value={line.precioHora}
                            onChange={(event) => updateLine(employee.id, line.id, "precioHora", event.target.value)}
                          />
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Salario ₡</p>
                          <Input
                            type="number"
                            min="0"
                            value={line.salario}
                            onChange={(event) => updateLine(employee.id, line.id, "salario", event.target.value)}
                          />
                        </div>
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground">Rebajo %</p>
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={line.rebajo}
                                    onChange={(event) => updateLine(employee.id, line.id, "rebajo", event.target.value)}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground">Total bruto</p>
                                  <p className="text-lg font-semibold text-foreground">{currencyFormatter.format(bruto)}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-xs text-muted-foreground">Total neto</p>
                                  <p className="text-lg font-semibold text-foreground">{currencyFormatter.format(neto)}</p>
                                </div>
                              </div>
                              <div className="mt-4 grid grid-cols-2 gap-4 text-sm font-semibold text-amber-600">
                                <div>
                                  <p className="text-xs text-amber-400">Total bruto</p>
                                  <p className="text-lg text-amber-600">{currencyFormatter.format(bruto)}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-amber-400">Total neto</p>
                                  <p className="text-lg text-amber-600">{currencyFormatter.format(neto)}</p>
                                </div>
                              </div>
                              <div className="mt-4 flex flex-wrap items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  className="gap-2"
                                  onClick={() => handleSaveLine(employee.id, line)}
                                  disabled={savingLineId === line.id}
                                >
                                  {savingLineId === line.id ? "Guardando…" : "Guardar línea"}
                                  <Save className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeLine(employee.id, line.id)}
                                  disabled={savingLineId === line.id}
                                >
                                  Cancelar
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog
          open={Boolean(editingPlanilla && editingLineValues)}
          onOpenChange={(open) => {
            if (!open) cancelEditingLine()
          }}
        >
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Editar línea de planilla</DialogTitle>
              <DialogDescription>Actualiza los datos de la línea y guarda los cambios.</DialogDescription>
            </DialogHeader>

            {editingLineValues && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Fecha</Label>
                  <Input
                    type="date"
                    value={editingLineValues.fecha}
                    onChange={(event) => {
                      const fecha = event.target.value
                      const parsed = new Date(fecha)
                      setEditingLineValues((prev) => {
                        if (!prev) return prev
                        if (Number.isNaN(parsed.getTime())) return { ...prev, fecha }
                        return { ...prev, fecha, numeroSemana: getWeekNumber(parsed) }
                      })
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Semana</Label>
                  <Input value={editingLineValues.numeroSemana} disabled />
                </div>
                <div className="space-y-1">
                  <Label>Horas extra</Label>
                  <Input
                    type="number"
                    min="0"
                    value={editingLineValues.horasExtra}
                    onChange={(event) =>
                      setEditingLineValues((prev) => (prev ? { ...prev, horasExtra: event.target.value } : prev))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Precio por hora</Label>
                  <Input
                    type="number"
                    min="0"
                    value={editingLineValues.precioHora}
                    onChange={(event) =>
                      setEditingLineValues((prev) => (prev ? { ...prev, precioHora: event.target.value } : prev))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Salario</Label>
                  <Input
                    type="number"
                    min="0"
                    value={editingLineValues.salario}
                    onChange={(event) =>
                      setEditingLineValues((prev) => (prev ? { ...prev, salario: event.target.value } : prev))
                    }
                  />
                </div>
                <div className="space-y-1">
                  <Label>Rebajo (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={editingLineValues.rebajo}
                    onChange={(event) =>
                      setEditingLineValues((prev) => (prev ? { ...prev, rebajo: event.target.value } : prev))
                    }
                  />
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={cancelEditingLine}>
                Cancelar
              </Button>
              <Button onClick={handleUpdateLine} disabled={savingLineId === editingPlanilla?.id?.toString()}>
                {savingLineId === editingPlanilla?.id?.toString() ? "Guardando..." : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={deleteDialogOpen}
          onOpenChange={(open) => {
            setDeleteDialogOpen(open)
            if (!open) setDeletingPlanilla(null)
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar eliminación</AlertDialogTitle>
              <AlertDialogDescription>
                ¿Está seguro de eliminar esta línea de planilla? Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeletePlanilla}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog
          open={deleteEmployeeDialogOpen}
          onOpenChange={(open) => {
            setDeleteEmployeeDialogOpen(open)
            if (!open) setDeletingEmployee(null)
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar colaborador?</AlertDialogTitle>
              <AlertDialogDescription>
                Se eliminará el colaborador seleccionado. Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteEmployee}
                disabled={deletingEmployeeId === deletingEmployee?.id}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deletingEmployeeId === deletingEmployee?.id ? "Eliminando..." : "Eliminar colaborador"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
