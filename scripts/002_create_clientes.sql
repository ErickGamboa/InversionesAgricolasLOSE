CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  celular TEXT,
  tipo TEXT DEFAULT 'normal' CHECK (tipo IN ('normal', 'especial')),
  estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clientes_select_all" ON public.clientes;
DROP POLICY IF EXISTS "clientes_insert_all" ON public.clientes;
DROP POLICY IF EXISTS "clientes_update_all" ON public.clientes;
DROP POLICY IF EXISTS "clientes_delete_all" ON public.clientes;

CREATE POLICY "clientes_select_all" ON public.clientes FOR SELECT USING (true);
CREATE POLICY "clientes_insert_all" ON public.clientes FOR INSERT WITH CHECK (true);
CREATE POLICY "clientes_update_all" ON public.clientes FOR UPDATE USING (true);
CREATE POLICY "clientes_delete_all" ON public.clientes FOR DELETE USING (true);
