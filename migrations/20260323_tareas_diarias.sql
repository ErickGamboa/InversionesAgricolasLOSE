-- Migration: modulo de tareas diarias
-- Fecha: 2026-03-23

BEGIN;

CREATE TABLE IF NOT EXISTS public.tareas_diarias (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    titulo text NOT NULL,
    descripcion text,
    prioridad text NOT NULL CHECK (prioridad IN ('baja', 'media', 'alta')) DEFAULT 'media',
    activa boolean NOT NULL DEFAULT true,
    es_recurrente_diaria boolean NOT NULL DEFAULT false,
    fecha_objetivo date,
    creado_por uuid DEFAULT auth.uid(),
    creado_en timestamptz NOT NULL DEFAULT now(),
    actualizado_en timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tareas_diarias_estado (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    tarea_id bigint NOT NULL REFERENCES public.tareas_diarias(id) ON DELETE CASCADE,
    fecha date NOT NULL,
    estado text NOT NULL CHECK (estado IN ('pendiente', 'en_progreso', 'completada', 'cancelada')) DEFAULT 'pendiente',
    nota text,
    actualizado_por uuid DEFAULT auth.uid(),
    actualizado_en timestamptz NOT NULL DEFAULT now(),
    UNIQUE (tarea_id, fecha)
);

CREATE INDEX IF NOT EXISTS idx_tareas_diarias_activa ON public.tareas_diarias(activa);
CREATE INDEX IF NOT EXISTS idx_tareas_diarias_fecha_objetivo ON public.tareas_diarias(fecha_objetivo);
CREATE INDEX IF NOT EXISTS idx_tareas_diarias_recurrente ON public.tareas_diarias(es_recurrente_diaria);
CREATE INDEX IF NOT EXISTS idx_tareas_diarias_estado_fecha ON public.tareas_diarias_estado(fecha);
CREATE INDEX IF NOT EXISTS idx_tareas_diarias_estado_tarea_fecha ON public.tareas_diarias_estado(tarea_id, fecha);

ALTER TABLE public.tareas_diarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tareas_diarias_estado ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated tareas_diarias" ON public.tareas_diarias
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated tareas_diarias_estado" ON public.tareas_diarias_estado
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

COMMIT;
