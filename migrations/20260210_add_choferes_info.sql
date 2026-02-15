-- Migration: Add choferes_info column to compras_regulares
-- Description: Stores the complete list of choferes with percentages when record comes from recepcion module
-- Created: 2026-02-10

-- Add column to store chofer distribution list
ALTER TABLE public.compras_regulares 
ADD COLUMN IF NOT EXISTS choferes_info TEXT;

-- Create index for faster text searches
CREATE INDEX IF NOT EXISTS idx_compras_regulares_choferes_info 
ON public.compras_regulares(choferes_info);

-- Add comment for documentation
COMMENT ON COLUMN public.compras_regulares.choferes_info IS 
'Text field containing the complete list of choferes with percentages when the record comes from recepcion module. 
Format: "Nombre: XX.X% (X,XXXkg)" per line, separated by newline characters. 
NULL when created manually from Nueva Compra. 
Example:
Juan Pérez: 40.0% (1,200kg)
Carlos López: 35.0% (1,050kg)
Pedro Ramírez: 25.0% (750kg)';
