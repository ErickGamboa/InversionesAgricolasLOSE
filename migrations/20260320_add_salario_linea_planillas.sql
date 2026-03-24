-- Migration: agregar columna salario_linea a planillas
BEGIN;

ALTER TABLE public.planillas
ADD COLUMN IF NOT EXISTS salario_linea numeric NOT NULL DEFAULT 0;

COMMIT;
