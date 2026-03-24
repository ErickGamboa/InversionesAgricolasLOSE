-- Migration: planillas y empleados de operaciones administrativas
-- Crea catálogo de empleados y planillas de nómina en el esquema public
-- Fecha: 2026-03-19

BEGIN;

CREATE TABLE IF NOT EXISTS public.empleados (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre_completo text NOT NULL,
    cargo text,
    salario_base numeric NOT NULL DEFAULT 0,
    estado text NOT NULL CHECK (estado IN ('activo', 'inactivo')) DEFAULT 'activo',
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    creado_en timestamptz NOT NULL DEFAULT now(),
    actualizado_en timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.planillas (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    empleado_id bigint NOT NULL REFERENCES public.empleados(id) ON DELETE RESTRICT,
    fecha_pago date NOT NULL,
    mes_año text NOT NULL,
    tipo_pago text NOT NULL CHECK (tipo_pago IN ('semanal', 'quincenal', 'mensual')),
    estado text NOT NULL CHECK (estado IN ('pendiente', 'pagado')) DEFAULT 'pendiente',
    numero_semana integer NOT NULL DEFAULT 0,
    salario_bruto numeric NOT NULL DEFAULT 0,
    horas_extra numeric NOT NULL DEFAULT 0,
    precio_hora_extra numeric NOT NULL DEFAULT 0,
    extras numeric NOT NULL DEFAULT 0,
    rebajos numeric NOT NULL DEFAULT 0,
    rebajo_porcentaje numeric NOT NULL DEFAULT 0,
    salario_linea numeric NOT NULL DEFAULT 0,
    total_pagar numeric NOT NULL DEFAULT 0,
    neto numeric NOT NULL DEFAULT 0,
    comentarios text,
    metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
    creado_por uuid DEFAULT auth.uid(),
    creado_en timestamptz NOT NULL DEFAULT now(),
    actualizado_en timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.planillas_historial (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    planilla_id bigint REFERENCES public.planillas(id) ON DELETE CASCADE,
    accion text NOT NULL,
    payload jsonb,
    creado_por uuid DEFAULT auth.uid(),
    creado_en timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_planillas_empleado_fecha ON public.planillas(empleado_id, fecha_pago);
CREATE INDEX IF NOT EXISTS idx_planillas_mes ON public.planillas(mes_año);

ALTER TABLE public.empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planillas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planillas_historial ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated employees" ON public.empleados
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated planillas" ON public.planillas
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow authenticated historial" ON public.planillas_historial
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

COMMIT;
