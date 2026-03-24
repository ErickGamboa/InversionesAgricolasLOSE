import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const estadoSchema = z.enum(["pendiente", "en_progreso", "completada", "cancelada"])

const updateEstadoSchema = z.object({
  tarea_id: z.number().positive(),
  fecha: z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Fecha inválida",
  }),
  estado: estadoSchema,
  nota: z.string().trim().max(500, "La nota es demasiado larga").nullable().optional(),
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

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth.authorized) {
      return NextResponse.json({ error: "No autorizado" }, { status: auth.status })
    }

    const payload = updateEstadoSchema.parse(await req.json())

    const { data, error } = await auth.supabase
      .from("tareas_diarias_estado")
      .upsert(
        {
          tarea_id: payload.tarea_id,
          fecha: payload.fecha,
          estado: payload.estado,
          nota: payload.nota ?? null,
          actualizado_por: auth.userId,
          actualizado_en: new Date().toISOString(),
        },
        {
          onConflict: "tarea_id,fecha",
        },
      )
      .select("id, tarea_id, fecha, estado, nota, actualizado_en")
      .single()

    if (error) throw error

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: extractErrorMessage(error) }, { status: 400 })
  }
}
