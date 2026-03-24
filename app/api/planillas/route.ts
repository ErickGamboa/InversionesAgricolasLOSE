import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const tipoPagoSchema = z.enum(["semanal", "quincenal", "mensual"])
const tipoEstadoSchema = z.enum(["pendiente", "pagado"])

const planillaBodySchema = z.object({
  id: z.number().optional(),
  empleado_id: z.number().positive("El colaborador es obligatorio"),
  fecha_pago: z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Fecha inválida",
  }),
  tipo_pago: tipoPagoSchema,
  estado: tipoEstadoSchema.optional(),
  horas_extra: z.number({ invalid_type_error: "Las horas extra deben ser un número" }).min(0, "Las horas extra no pueden ser negativas"),
  precio_hora_extra: z.number({ invalid_type_error: "El precio por hora debe ser un número" }).min(0, "El precio por hora no puede ser negativo"),
  rebajo_porcentaje: z
    .number({ invalid_type_error: "El porcentaje de rebajo debe ser un número" })
    .min(0, "El rebajo no puede ser menor a 0%")
    .max(100, "El rebajo no puede ser mayor a 100%"),
  salario_linea: z.number({ invalid_type_error: "El salario debe ser un número" }).min(0, "El salario no puede ser negativo").optional(),
  comentarios: z.string().max(500).nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
})

function isMissingPlanillasTable(error: any) {
  if (!error) return false
  if (error.code === "42P01") return true
  if (typeof error.message === "string") {
    const message = error.message.toLowerCase()
    return message.includes("planillas") && message.includes("relation")
  }
  return false
}

function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1)
  const pastDays = Math.floor((date.getTime() - firstDayOfYear.getTime()) / 86400000)
  return Math.ceil((pastDays + firstDayOfYear.getDay() + 1) / 7)
}

function formatMesAno(fecha: string) {
  return new Intl.DateTimeFormat("es-CR", { month: "long", year: "numeric" }).format(new Date(fecha))
}

function buildPlanillaTotals(data: any[]): { totalBruto: number; totalNeto: number; totalHorasExtra: number } {
  return data.reduce(
    (acc, item) => {
      acc.totalBruto += Number(item.total_pagar ?? 0)
      acc.totalNeto += Number(item.neto ?? 0)
      acc.totalHorasExtra += Number(item.horas_extra ?? 0)
      return acc
    },
    { totalBruto: 0, totalNeto: 0, totalHorasExtra: 0 },
  )
}

function buildComputedFields(payload: z.infer<typeof planillaBodySchema>) {
  const salario = Number(payload.salario_linea ?? 0)
  const brutoHoras = Number(payload.horas_extra) * Number(payload.precio_hora_extra)
  const bruto = salario + brutoHoras
  const rebajoMonto = (bruto * Number(payload.rebajo_porcentaje)) / 100
  const neto = bruto - rebajoMonto
  const semana = getWeekNumber(new Date(payload.fecha_pago))
  return { bruto, rebajoMonto, neto, semana }
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof z.ZodError) {
    const firstIssue = error.issues[0]
    return firstIssue?.message ?? "Datos inválidos en la planilla"
  }

  if (error instanceof Error) return error.message
  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === "string" && message.trim().length > 0) {
      return message
    }
  }
  return "Error desconocido"
}

async function loadPlanillas(params: URLSearchParams) {
  const supabase = await createClient()
  let query = supabase
    .from("planillas")
    .select("*, empleados (id, nombre_completo, cargo, salario_base)")
    .order("fecha_pago", { ascending: false })

  if (params.get("empleadoId")) {
    query = query.eq("empleado_id", Number(params.get("empleadoId")))
  }

  if (params.get("mes")) {
    query = query.eq("mes_año", params.get("mes"))
  }

  if (params.get("estado")) {
    query = query.eq("estado", params.get("estado"))
  }

  if (params.get("search")) {
    query = query.ilike("comentarios", `%${params.get("search")}%`)
  }

  const { data, error } = await query

  if (error) {
    if (isMissingPlanillasTable(error)) {
      return { data: [], totals: { totalBruto: 0, totalNeto: 0, totalHorasExtra: 0 } }
    }
    throw error
  }

  const parsed = data ?? []
  return { data: parsed, totals: buildPlanillaTotals(parsed) }
}

export async function GET(req: NextRequest) {
  try {
    const { data, totals } = await loadPlanillas(req.nextUrl.searchParams)
    return NextResponse.json({ data, totals })
  } catch (error) {
    const message = extractErrorMessage(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = planillaBodySchema.parse(await req.json())
    const mes_año = formatMesAno(payload.fecha_pago)
    const { bruto, rebajoMonto, neto, semana } = buildComputedFields(payload)
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("planillas")
        .insert({
          ...payload,
          estado: payload.estado ?? "pendiente",
          mes_año,
          salario_bruto: bruto,
          total_pagar: bruto,
          neto,
          rebajos: rebajoMonto,
          numero_semana: semana,
          extras: 0,
          salario_linea: Number(payload.salario_linea ?? 0),
        })
      .select("*, empleados (id, nombre_completo, cargo, salario_base)")

    if (error) throw error

    return NextResponse.json({ data: data?.[0] })
  } catch (error) {
    if (isMissingPlanillasTable(error)) {
      return NextResponse.json(
        { error: "La tabla planillas aún no existe en Supabase. Ejecuta la migración." },
        { status: 501 },
      )
    }
    const message = extractErrorMessage(error)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const payload = planillaBodySchema.parse(await req.json())
    if (!payload.id) {
      return NextResponse.json({ error: "ID es requerido" }, { status: 400 })
    }

    const mes_año = formatMesAno(payload.fecha_pago)
    const { bruto, rebajoMonto, neto, semana } = buildComputedFields(payload)
    const { id, ...restPayload } = payload
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("planillas")
      .update({
        ...restPayload,
        mes_año,
        salario_bruto: bruto,
        total_pagar: bruto,
        neto,
        rebajos: rebajoMonto,
        numero_semana: semana,
        extras: 0,
        salario_linea: Number(payload.salario_linea ?? 0),
        actualizado_en: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*, empleados (id, nombre_completo, cargo, salario_base)")

    if (error) throw error

    return NextResponse.json({ data: data?.[0] })
  } catch (error) {
    if (isMissingPlanillasTable(error)) {
      return NextResponse.json(
        { error: "La tabla planillas aún no existe en Supabase. Ejecuta la migración." },
        { status: 501 },
      )
    }
    const message = extractErrorMessage(error)
    return NextResponse.json({ error: message }, { status: 400 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const idParam = req.nextUrl.searchParams.get("id")
    if (!idParam) {
      return NextResponse.json({ error: "ID es requerido" }, { status: 400 })
    }

    const supabase = await createClient()
    const { error } = await supabase.from("planillas").delete().eq("id", Number(idParam))

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    if (isMissingPlanillasTable(error)) {
      return NextResponse.json(
        { error: "La tabla planillas aún no existe en Supabase. Ejecuta la migración." },
        { status: 501 },
      )
    }
    const message = extractErrorMessage(error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
