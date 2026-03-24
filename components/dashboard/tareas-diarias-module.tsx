"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Plus, CalendarDays, Trash2, Pencil } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { EstadoTareaDiaria, PrioridadTarea, TareaDiariaConEstado } from "@/types/tareas-diarias"

interface TareasResponse {
  data: TareaDiariaConEstado[]
  totals: Record<EstadoTareaDiaria, number>
}

interface TaskFormState {
  titulo: string
  descripcion: string
  prioridad: PrioridadTarea
  esRecurrenteDiaria: boolean
  fechaObjetivo: string
}

const defaultForm: TaskFormState = {
  titulo: "",
  descripcion: "",
  prioridad: "media",
  esRecurrenteDiaria: true,
  fechaObjetivo: "",
}

function getCostaRicaDateString() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Costa_Rica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

function getEstadoLabel(estado: EstadoTareaDiaria) {
  if (estado === "pendiente") return "Pendiente"
  if (estado === "en_progreso") return "En progreso"
  if (estado === "completada") return "Completada"
  return "Cancelada"
}

function getPrioridadLabel(prioridad: PrioridadTarea) {
  if (prioridad === "alta") return "Alta"
  if (prioridad === "media") return "Media"
  return "Baja"
}

function getEstadoCardClass(estado: EstadoTareaDiaria) {
  if (estado === "pendiente") return "border-amber-200 bg-amber-50"
  if (estado === "en_progreso") return "border-blue-200 bg-blue-50"
  if (estado === "completada") return "border-emerald-200 bg-emerald-50"
  return "border-rose-200 bg-rose-50"
}

export function TareasDiariasModule() {
  const [selectedDate, setSelectedDate] = useState(getCostaRicaDateString())
  const [tasks, setTasks] = useState<TareaDiariaConEstado[]>([])
  const [totals, setTotals] = useState<Record<EstadoTareaDiaria, number>>({
    pendiente: 0,
    en_progreso: 0,
    completada: 0,
    cancelada: 0,
  })
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<TaskFormState>(defaultForm)
  const [editingTask, setEditingTask] = useState<TareaDiariaConEstado | null>(null)
  const [saving, setSaving] = useState(false)
  const [statusSavingTaskId, setStatusSavingTaskId] = useState<number | null>(null)
  const [deletingTask, setDeletingTask] = useState<TareaDiariaConEstado | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [search, setSearch] = useState("")
  const [estadoFilter, setEstadoFilter] = useState<"all" | EstadoTareaDiaria>("all")
  const [prioridadFilter, setPrioridadFilter] = useState<"all" | PrioridadTarea>("all")

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/tareas-diarias?fecha=${selectedDate}`, { cache: "no-store" })
      const result = (await response.json()) as TareasResponse & { error?: string }

      if (!response.ok) {
        throw new Error(result.error ?? "No se pudo cargar las tareas")
      }

      setTasks(result.data ?? [])
      setTotals(
        result.totals ?? {
          pendiente: 0,
          en_progreso: 0,
          completada: 0,
          cancelada: 0,
        },
      )
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido"
      toast.error(message)
      setTasks([])
      setTotals({ pendiente: 0, en_progreso: 0, completada: 0, cancelada: 0 })
    } finally {
      setLoading(false)
    }
  }, [selectedDate])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        search.trim().length === 0 ||
        task.titulo.toLowerCase().includes(search.toLowerCase()) ||
        task.descripcion?.toLowerCase().includes(search.toLowerCase())

      const matchesEstado = estadoFilter === "all" || task.estado_dia === estadoFilter
      const matchesPrioridad = prioridadFilter === "all" || task.prioridad === prioridadFilter

      return matchesSearch && matchesEstado && matchesPrioridad
    })
  }, [tasks, search, estadoFilter, prioridadFilter])

  const resetForm = () => {
    setForm(defaultForm)
    setEditingTask(null)
  }

  const openNewTaskDialog = () => {
    resetForm()
    setDialogOpen(true)
  }

  const openEditTaskDialog = (task: TareaDiariaConEstado) => {
    setEditingTask(task)
    setForm({
      titulo: task.titulo,
      descripcion: task.descripcion ?? "",
      prioridad: task.prioridad,
      esRecurrenteDiaria: task.es_recurrente_diaria,
      fechaObjetivo: task.fecha_objetivo ?? selectedDate,
    })
    setDialogOpen(true)
  }

  const submitTask = async () => {
    if (!form.titulo.trim()) {
      toast.error("El título es obligatorio")
      return
    }

    if (!form.esRecurrenteDiaria && !form.fechaObjetivo) {
      toast.error("Selecciona una fecha objetivo")
      return
    }

    setSaving(true)
    try {
      const payload = {
        titulo: form.titulo.trim(),
        descripcion: form.descripcion.trim() || null,
        prioridad: form.prioridad,
        es_recurrente_diaria: form.esRecurrenteDiaria,
        fecha_objetivo: form.esRecurrenteDiaria ? null : form.fechaObjetivo,
      }

      const response = await fetch("/api/tareas-diarias", {
        method: editingTask ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingTask ? { id: editingTask.id, ...payload } : payload),
      })
      const result = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(result.error ?? "No se pudo guardar la tarea")
      }

      toast.success(editingTask ? "Tarea actualizada" : "Tarea creada")
      setDialogOpen(false)
      resetForm()
      fetchTasks()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido"
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const updateTaskStatus = async (task: TareaDiariaConEstado, estado: EstadoTareaDiaria) => {
    setStatusSavingTaskId(task.id)
    try {
      const response = await fetch("/api/tareas-diarias/estado", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tarea_id: task.id, fecha: selectedDate, estado }),
      })
      const result = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(result.error ?? "No se pudo actualizar el estado")
      }

      fetchTasks()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido"
      toast.error(message)
    } finally {
      setStatusSavingTaskId(null)
    }
  }

  const confirmDeleteTask = async () => {
    if (!deletingTask) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/tareas-diarias?id=${deletingTask.id}`, {
        method: "DELETE",
      })
      const result = (await response.json()) as { error?: string }

      if (!response.ok) {
        throw new Error(result.error ?? "No se pudo eliminar la tarea")
      }

      toast.success("Tarea eliminada")
      setDeletingTask(null)
      fetchTasks()
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido"
      toast.error(message)
    } finally {
      setDeleting(false)
    }
  }

  const selectedDateLabel = new Date(`${selectedDate}T00:00:00`).toLocaleDateString("es-CR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  })

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
              <BreadcrumbPage>Tareas diarias</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div className="space-y-6 p-4 md:p-6">
        <Card className="border border-border bg-white shadow-sm p-4">
          <CardHeader className="flex flex-col gap-3 p-0 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Tareas Diarias</h1>
              <p className="text-sm capitalize text-muted-foreground">{selectedDateLabel}</p>
            </div>

            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 rounded-md border border-border bg-white px-3 py-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  className="h-8 w-[170px] border-0 p-0 shadow-none focus-visible:ring-0"
                />
              </div>

              <Button className="gap-2 bg-[#5f9500] text-white hover:bg-[#4f7d00]" onClick={openNewTaskDialog}>
                <Plus className="h-4 w-4" />
                Nueva tarea
              </Button>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <p className="text-xs text-amber-700">Pendientes</p>
              <p className="text-2xl font-bold text-amber-900">{totals.pendiente}</p>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <p className="text-xs text-blue-700">En progreso</p>
              <p className="text-2xl font-bold text-blue-900">{totals.en_progreso}</p>
            </CardContent>
          </Card>
          <Card className="border-emerald-200 bg-emerald-50">
            <CardContent className="p-4">
              <p className="text-xs text-emerald-700">Completadas</p>
              <p className="text-2xl font-bold text-emerald-900">{totals.completada}</p>
            </CardContent>
          </Card>
          <Card className="border-rose-200 bg-rose-50">
            <CardContent className="p-4">
              <p className="text-xs text-rose-700">Canceladas</p>
              <p className="text-2xl font-bold text-rose-900">{totals.cancelada}</p>
            </CardContent>
          </Card>
        </div>

        <Card className="border border-border bg-white shadow-sm">
          <CardHeader className="space-y-3">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <h2 className="text-lg font-semibold text-foreground">Listado del día</h2>
              <Badge variant="outline">{filteredTasks.length} tareas visibles</Badge>
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <Input placeholder="Buscar tarea..." value={search} onChange={(event) => setSearch(event.target.value)} />

              <Select value={estadoFilter} onValueChange={(value) => setEstadoFilter(value as "all" | EstadoTareaDiaria)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="en_progreso">En progreso</SelectItem>
                  <SelectItem value="completada">Completada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>

              <Select value={prioridadFilter} onValueChange={(value) => setPrioridadFilter(value as "all" | PrioridadTarea)}>
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las prioridades</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="baja">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {loading ? (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <Card key={index} className="h-40 animate-pulse" />
                ))}
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-muted p-6 text-center text-muted-foreground">
                No hay tareas para los filtros seleccionados.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                {filteredTasks.map((task) => (
                  <div key={task.id} className={`rounded-xl border p-4 ${getEstadoCardClass(task.estado_dia)}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <h3 className="text-base font-semibold text-foreground">{task.titulo}</h3>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{task.es_recurrente_diaria ? "Diaria" : "Puntual"}</Badge>
                          <Badge variant="secondary">{getEstadoLabel(task.estado_dia)}</Badge>
                          <Badge
                            variant="outline"
                            className={
                              task.prioridad === "alta"
                                ? "border-rose-300 text-rose-700"
                                : task.prioridad === "media"
                                  ? "border-amber-300 text-amber-700"
                                  : "border-emerald-300 text-emerald-700"
                            }
                          >
                            Prioridad {getPrioridadLabel(task.prioridad)}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditTaskDialog(task)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeletingTask(task)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <p className="mt-3 text-sm text-muted-foreground">
                      {task.descripcion?.trim().length ? task.descripcion : "Sin descripción"}
                    </p>

                    {!task.es_recurrente_diaria && task.fecha_objetivo && (
                      <p className="mt-2 text-xs text-muted-foreground">
                        Fecha objetivo: {new Date(`${task.fecha_objetivo}T00:00:00`).toLocaleDateString("es-CR")}
                      </p>
                    )}

                    <div className="mt-4">
                      <Label className="text-xs text-muted-foreground">Estado del día</Label>
                      <Select
                        value={task.estado_dia}
                        onValueChange={(value) => updateTaskStatus(task, value as EstadoTareaDiaria)}
                        disabled={statusSavingTaskId === task.id}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Cambiar estado" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendiente">Pendiente</SelectItem>
                          <SelectItem value="en_progreso">En progreso</SelectItem>
                          <SelectItem value="completada">Completada</SelectItem>
                          <SelectItem value="cancelada">Cancelada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) resetForm()
          }}
        >
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{editingTask ? "Editar tarea" : "Nueva tarea"}</DialogTitle>
              <DialogDescription>
                Configura tareas puntuales o recurrentes para que aparezcan automáticamente cada día.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Título</Label>
                <Input
                  value={form.titulo}
                  onChange={(event) => setForm((prev) => ({ ...prev, titulo: event.target.value }))}
                  placeholder="Ejemplo: Revisar cierres de caja"
                />
              </div>

              <div className="space-y-1">
                <Label>Descripción</Label>
                <Textarea
                  value={form.descripcion}
                  onChange={(event) => setForm((prev) => ({ ...prev, descripcion: event.target.value }))}
                  placeholder="Detalles opcionales"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label>Prioridad</Label>
                  <Select
                    value={form.prioridad}
                    onValueChange={(value) => setForm((prev) => ({ ...prev, prioridad: value as PrioridadTarea }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una prioridad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="media">Media</SelectItem>
                      <SelectItem value="baja">Baja</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label>Fecha objetivo</Label>
                  <Input
                    type="date"
                    value={form.esRecurrenteDiaria ? "" : form.fechaObjetivo}
                    onChange={(event) => setForm((prev) => ({ ...prev, fechaObjetivo: event.target.value }))}
                    disabled={form.esRecurrenteDiaria}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-md border border-border bg-muted/30 p-3">
                <div>
                  <p className="text-sm font-medium">Repetir todos los días</p>
                  <p className="text-xs text-muted-foreground">Incluye sábados y domingos.</p>
                </div>
                <Switch
                  checked={form.esRecurrenteDiaria}
                  onCheckedChange={(checked) =>
                    setForm((prev) => ({
                      ...prev,
                      esRecurrenteDiaria: checked,
                      fechaObjetivo: checked ? "" : prev.fechaObjetivo,
                    }))
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={submitTask} disabled={saving}>
                {saving ? "Guardando..." : editingTask ? "Guardar cambios" : "Crear tarea"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog
          open={Boolean(deletingTask)}
          onOpenChange={(open) => {
            if (!open) setDeletingTask(null)
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Eliminar tarea?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará la tarea y su historial diario. No se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteTask}
                disabled={deleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleting ? "Eliminando..." : "Eliminar tarea"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
