-- =====================================================================
-- Turnito SaaS – Migration: Extend services table
-- La tabla services ya existe en la migración base (init_schema).
-- Esta migración es idempotente y añade únicamente las confirmaciones
-- de índices necesarios para el módulo Services.
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- 1. Confirmar índice de servicios activos por negocio
--    (ya existe idx_services_business_active en init_schema, pero
--     se garantiza su existencia de forma idempotente)
-- ─────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_services_business_active
  ON public.services(business_id, is_active);

-- Índice por precio para ordenamiento / filtrado en booking widget
CREATE INDEX IF NOT EXISTS idx_services_price
  ON public.services(business_id, price);

-- Índice por duración para filtrar slots disponibles
CREATE INDEX IF NOT EXISTS idx_services_duration
  ON public.services(business_id, duration_minutes);

-- ─────────────────────────────────────────────────────────────────────
-- 2. Comentarios de columnas para documentación
-- ─────────────────────────────────────────────────────────────────────
COMMENT ON TABLE  public.services                    IS 'Catálogo de servicios ofrecidos por cada negocio (tenant)';
COMMENT ON COLUMN public.services.duration_minutes   IS 'Duración del servicio en minutos (entero positivo)';
COMMENT ON COLUMN public.services.price              IS 'Precio del servicio con hasta 2 decimales (>= 0)';
COMMENT ON COLUMN public.services.is_active          IS 'Soft-delete: false oculta el servicio del booking widget público';
