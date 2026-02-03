-- Clientes (Customers)
CREATE TABLE IF NOT EXISTS public.clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT,
  celular TEXT,
  tipo TEXT DEFAULT 'normal' CHECK (tipo IN ('normal', 'especial')),
  estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clientes_select_all" ON public.clientes FOR SELECT USING (true);
CREATE POLICY "clientes_insert_all" ON public.clientes FOR INSERT WITH CHECK (true);
CREATE POLICY "clientes_update_all" ON public.clientes FOR UPDATE USING (true);

-- Choferes (Drivers)
CREATE TABLE IF NOT EXISTS public.choferes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT,
  estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.choferes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "choferes_select_all" ON public.choferes FOR SELECT USING (true);
CREATE POLICY "choferes_insert_all" ON public.choferes FOR INSERT WITH CHECK (true);
CREATE POLICY "choferes_update_all" ON public.choferes FOR UPDATE USING (true);

-- Plantas (Plants/Facilities)
CREATE TABLE IF NOT EXISTS public.plantas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT,
  estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.plantas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plantas_select_all" ON public.plantas FOR SELECT USING (true);
CREATE POLICY "plantas_insert_all" ON public.plantas FOR INSERT WITH CHECK (true);
CREATE POLICY "plantas_update_all" ON public.plantas FOR UPDATE USING (true);

-- Placas (License Plates)
CREATE TABLE IF NOT EXISTS public.placas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placa TEXT,
  estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.placas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "placas_select_all" ON public.placas FOR SELECT USING (true);
CREATE POLICY "placas_insert_all" ON public.placas FOR INSERT WITH CHECK (true);
CREATE POLICY "placas_update_all" ON public.placas FOR UPDATE USING (true);

-- Tipos de Pago (Payment Types)
CREATE TABLE IF NOT EXISTS public.tipos_pago (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT,
  estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.tipos_pago ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tipos_pago_select_all" ON public.tipos_pago FOR SELECT USING (true);
CREATE POLICY "tipos_pago_insert_all" ON public.tipos_pago FOR INSERT WITH CHECK (true);
CREATE POLICY "tipos_pago_update_all" ON public.tipos_pago FOR UPDATE USING (true);

-- Venta de piña en plantas (Pineapple sales to plants)
CREATE TABLE IF NOT EXISTS public.ventas_plantas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE,
  numero_semana INTEGER,
  planta_id UUID REFERENCES public.plantas(id),
  chofer_id UUID REFERENCES public.choferes(id),
  numero_boleta TEXT,
  nb_tickete TEXT,
  tipo_pina TEXT CHECK (tipo_pina IN ('IQF', 'Jugo')),
  kilos_reportados DECIMAL(12,2) DEFAULT 0,
  porcentaje_castigo DECIMAL(5,2) DEFAULT 0,
  castigo_kilos DECIMAL(12,2) DEFAULT 0,
  total_kilos DECIMAL(12,2) DEFAULT 0,
  precio_iqf DECIMAL(12,2) DEFAULT 0,
  precio_jugo DECIMAL(12,2) DEFAULT 0,
  total_pagar_castigo DECIMAL(12,2) DEFAULT 0,
  total_pagar_pina DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ventas_plantas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ventas_plantas_select_all" ON public.ventas_plantas FOR SELECT USING (true);
CREATE POLICY "ventas_plantas_insert_all" ON public.ventas_plantas FOR INSERT WITH CHECK (true);
CREATE POLICY "ventas_plantas_update_all" ON public.ventas_plantas FOR UPDATE USING (true);
CREATE POLICY "ventas_plantas_delete_all" ON public.ventas_plantas FOR DELETE USING (true);

-- Compra de piña a clientes regulares (Regular customer purchases)
CREATE TABLE IF NOT EXISTS public.compras_regulares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE,
  numero_semana INTEGER,
  pago_dolares BOOLEAN DEFAULT false,
  lugar_procedencia TEXT,
  procedencia TEXT CHECK (procedencia IN ('campo', 'planta')),
  cliente_id UUID REFERENCES public.clientes(id),
  numero_boleta TEXT,
  nb_tickete TEXT,
  chofer_id UUID REFERENCES public.choferes(id),
  tipo_pina TEXT,
  numero_kilos DECIMAL(12,2) DEFAULT 0,
  precio_pina DECIMAL(12,2) DEFAULT 0,
  total_pagar DECIMAL(12,2) DEFAULT 0,
  pagado BOOLEAN DEFAULT false,
  tipo_pago_id UUID REFERENCES public.tipos_pago(id),
  numero_deposito TEXT,
  numero_factura TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.compras_regulares ENABLE ROW LEVEL SECURITY;
CREATE POLICY "compras_regulares_select_all" ON public.compras_regulares FOR SELECT USING (true);
CREATE POLICY "compras_regulares_insert_all" ON public.compras_regulares FOR INSERT WITH CHECK (true);
CREATE POLICY "compras_regulares_update_all" ON public.compras_regulares FOR UPDATE USING (true);
CREATE POLICY "compras_regulares_delete_all" ON public.compras_regulares FOR DELETE USING (true);

-- Transporte contratado (Contracted transport)
CREATE TABLE IF NOT EXISTS public.transporte_contratado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE,
  numero_semana INTEGER,
  chofer_id UUID REFERENCES public.choferes(id),
  placa_id UUID REFERENCES public.placas(id),
  planta_id UUID REFERENCES public.plantas(id),
  numero_boleta TEXT,
  nb_tickete TEXT,
  total_kilos DECIMAL(12,2) DEFAULT 0,
  precio_kilo DECIMAL(12,2) DEFAULT 0,
  total_pagar DECIMAL(12,2) DEFAULT 0,
  numero_factura TEXT,
  numero_deposito TEXT,
  pagado BOOLEAN DEFAULT false,
  adelanto DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.transporte_contratado ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transporte_contratado_select_all" ON public.transporte_contratado FOR SELECT USING (true);
CREATE POLICY "transporte_contratado_insert_all" ON public.transporte_contratado FOR INSERT WITH CHECK (true);
CREATE POLICY "transporte_contratado_update_all" ON public.transporte_contratado FOR UPDATE USING (true);
CREATE POLICY "transporte_contratado_delete_all" ON public.transporte_contratado FOR DELETE USING (true);

-- Compra de piña a clientes especiales (Special customer purchases)
CREATE TABLE IF NOT EXISTS public.compras_especiales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE,
  numero_semana INTEGER,
  procedencia TEXT,
  cliente_id UUID REFERENCES public.clientes(id),
  lote TEXT,
  numero_boleta TEXT,
  chofer_id UUID REFERENCES public.choferes(id),
  placa_id UUID REFERENCES public.placas(id),
  numero_cajas INTEGER DEFAULT 0,
  pinas_por_caja INTEGER DEFAULT 0,
  total_pinas INTEGER DEFAULT 0,
  total_kilos DECIMAL(12,2) DEFAULT 0,
  precio_kilo DECIMAL(12,2) DEFAULT 0,
  total_pagar DECIMAL(12,2) DEFAULT 0,
  pagado BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.compras_especiales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "compras_especiales_select_all" ON public.compras_especiales FOR SELECT USING (true);
CREATE POLICY "compras_especiales_insert_all" ON public.compras_especiales FOR INSERT WITH CHECK (true);
CREATE POLICY "compras_especiales_update_all" ON public.compras_especiales FOR UPDATE USING (true);
CREATE POLICY "compras_especiales_delete_all" ON public.compras_especiales FOR DELETE USING (true);

-- Transporte interno (Internal transport)
CREATE TABLE IF NOT EXISTS public.transporte_interno (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE,
  numero_semana INTEGER,
  chofer_id UUID REFERENCES public.choferes(id),
  placa_id UUID REFERENCES public.placas(id),
  cliente_id UUID REFERENCES public.clientes(id),
  diesel DECIMAL(12,2) DEFAULT 0,
  ingreso DECIMAL(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.transporte_interno ENABLE ROW LEVEL SECURITY;
CREATE POLICY "transporte_interno_select_all" ON public.transporte_interno FOR SELECT USING (true);
CREATE POLICY "transporte_interno_insert_all" ON public.transporte_interno FOR INSERT WITH CHECK (true);
CREATE POLICY "transporte_interno_update_all" ON public.transporte_interno FOR UPDATE USING (true);
CREATE POLICY "transporte_interno_delete_all" ON public.transporte_interno FOR DELETE USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_ventas_plantas_fecha ON public.ventas_plantas(fecha);
CREATE INDEX IF NOT EXISTS idx_ventas_plantas_semana ON public.ventas_plantas(numero_semana);
CREATE INDEX IF NOT EXISTS idx_compras_regulares_fecha ON public.compras_regulares(fecha);
CREATE INDEX IF NOT EXISTS idx_compras_regulares_semana ON public.compras_regulares(numero_semana);
CREATE INDEX IF NOT EXISTS idx_transporte_contratado_fecha ON public.transporte_contratado(fecha);
CREATE INDEX IF NOT EXISTS idx_transporte_contratado_semana ON public.transporte_contratado(numero_semana);
CREATE INDEX IF NOT EXISTS idx_compras_especiales_fecha ON public.compras_especiales(fecha);
CREATE INDEX IF NOT EXISTS idx_compras_especiales_semana ON public.compras_especiales(numero_semana);
CREATE INDEX IF NOT EXISTS idx_transporte_interno_fecha ON public.transporte_interno(fecha);
CREATE INDEX IF NOT EXISTS idx_transporte_interno_semana ON public.transporte_interno(numero_semana);
