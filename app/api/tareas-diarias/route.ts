import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { EstadoTareaDiaria } from "@/types/tareas-diarias"

const prioridadSchema = z.enum(["baja", "media", "alta"])

const createTaskSchema = z
  .object({
    titulo: z.string().trim().min(1, "El título es obligatorio").max(140, "El título es demasiado largo"),
    descripcion: z.string().trim().max(1200, "La descripción es demasiado larga").nullable().optional(),
    prioridad: prioridadSchema.default("media"),
    es_recurrente_diaria: z.boolean().default(false),
    fecha_objetivo: z.string().nullable().optional(),
    activa: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.es_recurrente_diaria && !data.fecha_objetivo) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fecha_objetivo"],
        message: "Selecciona una fecha objetivo para tareas puntuales",
      })
    }
  })

const updateTaskSchema = z
  .object({
    id: z.number().positive(),
    titulo: z.string().trim().min(1, "El título es obligatorio").max(140, "El título es demasiado largo").optional(),
    descripcion: z.string().trim().max(1200, "La descripción es demasiado larga").nullable().optional(),
    prioridad: prioridadSchema.optional(),
    es_recurrente_diaria: z.boolean().optional(),
    fecha_objetivo: z.string().nullable().optional(),
    activa: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.es_recurrente_diaria === false && data.fecha_objetivo === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["fecha_objetivo"],
        message: "Selecciona una fecha objetivo para tareas puntuales",
      })
    }
  })

function extractErrorMessage(error: unknown): string {
  if (error instanceof z.ZodError) {
    return error.issues[0]?.message ?? "Datos inválidos"
  }

  if (error instanceof Error) return error.message
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === "string" && message.trim().length > 0) return message
  }
  return "Error desconocido"
}

function getCostaRicaDate() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Costa_Rica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
}

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { authorized: false as const, status: 401, supabase }
  }

  const { data, error } = await supabase
    .from("perfiles")
    .select("rol")
    .eq("id", user.id)
    .single()

  if (error || data?.rol !== "admin") {
    return { authorized: false as const, status: 403, supabase }
  }

  return { authorized: true as const, supabase, userId: user.id }
}

async function getTasksForDate(fecha: string) {
  const auth = await requireAdmin()
  if (!auth.authorized) {
    return { error: NextResponse.json({ error: "No autorizado" }, { status: auth.status }) }
  }

  const { supabase } = auth

  const { data: tasks, error: tasksError } = await supabase
    .from("tareas_diarias")
    .select("id, titulo, descripcion, prioridad, activa, es_recurrente_diaria, fecha_objetivo, creado_en, actualizado_en")
    .eq("activa", true)
    .or(`es_recurrente_diaria.eq.true,fecha_objetivo.eq.${fecha}`)
    .order("creado_en", { ascending: true })

  if (tasksError) throw tasksError

  const taskIds = (tasks ?? []).map((task) => task.id)
  const defaultEstado: EstadoTareaDiaria = "pendiente"

  if (taskIds.length === 0) {
    return {
      data: [],
      totals: { pendiente: 0, en_progreso: 0, completada: 0, cancelada: 0 },
    }
  }

  const { data: states, error: statesError } = await supabase
    .from("tareas_diarias_estado")
    .select("tarea_id, estado, nota")
    .eq("fecha", fecha)
    .in("tarea_id", taskIds)

  if (statesError) throw statesError

  const statesByTask = new Map<number, { estado: EstadoTareaDiaria; nota: string | null }>()
  ;(states ?? []).forEach((state) => {
    statesByTask.set(state.tarea_id, {
      estado: state.estado as EstadoTareaDiaria,
      nota: state.nota,
    })
  })

  const enrichedTasks = (tasks ?? []).map((task) => {
    const state = statesByTask.get(task.id)
    return {
      ...task,
      fecha,
      estado_dia: state?.estado ?? defaultEstado,
      nota_dia: state?.nota ?? null,
    }
  })

  const totals = enrichedTasks.reduce(
    (acc, task) => {
      acc[task.estado_dia] += 1
      return acc
    },
    { pendiente: 0, en_progreso: 0, completada: 0, cancelada: 0 } as Record<EstadoTareaDiaria, number>,
  )

  return { data: enrichedTasks, totals }
}

export async function GET(req: NextRequest) {
  try {
    const fecha = req.nextUrl.searchParams.get("fecha") ?? getCostaRicaDate()
    const result = await getTasksForDate(fecha)

    if ("error" in result) return result.error

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: extractErrorMessage(error) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth.authorized) {
      return NextResponse.json({ error: "No autorizado" }, { status: auth.status })
    }

    const payload = createTaskSchema.parse(await req.json())
    const { supabase, userId } = auth

    const { data, error } = await supabase
      .from("tareas_diarias")
      .insert({
        titulo: payload.titulo,
        descripcion: payload.descripcion ?? null,
        prioridad: payload.prioridad,
        activa: payload.activa ?? true,
        es_recurrente_diaria: payload.es_recurrente_diaria,
        fecha_objetivo: payload.es_recurrente_diaria ? null : payload.fecha_objetivo,
        creado_por: userId,
      })
      .select("id, titulo, descripcion, prioridad, activa, es_recurrente_diaria, fecha_objetivo, creado_en, actualizado_en")
      .single()

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: extractErrorMessage(error) }, { status: 400 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth.authorized) {
      return NextResponse.json({ error: "No autorizado" }, { status: auth.status })
    }

    const payload = updateTaskSchema.parse(await req.json())
    const { supabase } = auth

    const changes: Record<string, unknown> = { actualizado_en: new Date().toISOString() }
    if (payload.titulo !== undefined) changes.titulo = payload.titulo
    if (payload.descripcion !== undefined) changes.descripcion = payload.descripcion
    if (payload.prioridad !== undefined) changes.prioridad = payload.prioridad
    if (payload.activa !== undefined) changes.activa = payload.activa
    if (payload.es_recurrente_diaria !== undefined) {
      changes.es_recurrente_diaria = payload.es_recurrente_diaria
      if (payload.es_recurrente_diaria) {
        changes.fecha_objetivo = null
      }
    }
    if (payload.fecha_objetivo !== undefined && payload.es_recurrente_diaria !== true) {
      changes.fecha_objetivo = payload.fecha_objetivo
    }

    const { data, error } = await supabase
      .from("tareas_diarias")
      .update(changes)
      .eq("id", payload.id)
      .select("id, titulo, descripcion, prioridad, activa, es_recurrente_diaria, fecha_objetivo, creado_en, actualizado_en")
      .single()

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: extractErrorMessage(error) }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth.authorized) {
      return NextResponse.json({ error: "No autorizado" }, { status: auth.status })
    }

    const id = Number(req.nextUrl.searchParams.get("id"))
    if (!id || Number.isNaN(id)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const { error } = await auth.supabase.from("tareas_diarias").delete().eq("id", id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: extractErrorMessage(error) }, { status: 400 })
  }
}
