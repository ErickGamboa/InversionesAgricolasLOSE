-- Create recepciones table
CREATE TABLE IF NOT EXISTS public.recepciones (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    cliente_id bigint REFERENCES public.clientes(id),
    chofer_ingreso_id bigint REFERENCES public.choferes(id),
    es_rechazo boolean DEFAULT false,
    color_etiqueta text NOT NULL,
    estado text CHECK (estado IN ('pendiente', 'finalizado')) DEFAULT 'pendiente',
    fecha_creacion timestamptz DEFAULT now(),
    usuario_creacion uuid DEFAULT auth.uid()
);

-- Create recepcion_bines table
CREATE TABLE IF NOT EXISTS public.recepcion_bines (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    recepcion_id bigint REFERENCES public.recepciones(id) ON DELETE CASCADE,
    numero_par integer NOT NULL,
    peso_bruto numeric NOT NULL,
    peso_neto numeric NOT NULL,
    estado text CHECK (estado IN ('en_patio', 'despachado')) DEFAULT 'en_patio',
    chofer_salida_id bigint REFERENCES public.choferes(id),
    fecha_despacho timestamptz
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_recepciones_cliente_id ON public.recepciones(cliente_id);
CREATE INDEX IF NOT EXISTS idx_recepciones_estado ON public.recepciones(estado);
CREATE INDEX IF NOT EXISTS idx_recepcion_bines_recepcion_id ON public.recepcion_bines(recepcion_id);

-- Enable RLS
ALTER TABLE public.recepciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recepcion_bines ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Enable all access for authenticated users" ON public.recepciones
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all access for authenticated users" ON public.recepcion_bines
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
