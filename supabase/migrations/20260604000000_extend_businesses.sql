-- =====================================================================
-- Turnito SaaS – Migration: Extend businesses table
-- Agrega los campos description, phone y address que el módulo Businesses
-- requiere pero que no estaban en el schema inicial.
-- =====================================================================

-- Añadir columnas nuevas a la tabla businesses (si no existen)
ALTER TABLE public.businesses
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS phone       TEXT,
  ADD COLUMN IF NOT EXISTS address     TEXT;

-- Comentarios de columnas para documentación
COMMENT ON COLUMN public.businesses.description IS 'Descripción breve del negocio (max 500 caracteres)';
COMMENT ON COLUMN public.businesses.phone       IS 'Teléfono de contacto del negocio';
COMMENT ON COLUMN public.businesses.address     IS 'Dirección física del negocio';

-- Índice para búsqueda por propietario (útil para listar negocios de un usuario)
CREATE INDEX IF NOT EXISTS idx_businesses_owner_id ON public.businesses(owner_id);
