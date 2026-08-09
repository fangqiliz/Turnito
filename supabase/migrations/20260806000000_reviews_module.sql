-- =====================================================================
-- Turnito SaaS – Migration: Reviews Module
-- Fecha: 2026-08-06
--
-- Objetivo:
--   1. Crear tabla reviews para reseñas de clientes sobre citas completadas.
--   2. Agregar índices para búsquedas eficientes.
--   3. Configurar RLS policies.
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Crear tabla reviews
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE NOT NULL,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT CHECK (char_length(comment) <= 1000),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Una reseña por cita (evitar duplicados)
    CONSTRAINT unique_review_per_appointment UNIQUE (appointment_id)
);

-- Habilitar RLS en reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Índices para optimización de búsquedas
-- ─────────────────────────────────────────────────────────────────────────────

-- Búsqueda de reseñas por negocio (para mostrar en perfil)
CREATE INDEX idx_reviews_business_id ON public.reviews(business_id, created_at DESC);

-- Búsqueda de reseña por cita
CREATE INDEX idx_reviews_appointment_id ON public.reviews(appointment_id);

-- Búsqueda de reseñas del cliente
CREATE INDEX idx_reviews_client_id ON public.reviews(client_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Trigger para actualizar updated_at
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. RLS Policies
-- ─────────────────────────────────────────────────────────────────────────────

-- Policy 1: Los clientes pueden VER todas las reseñas (públicas)
CREATE POLICY "Ver todas las reseñas"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (true); -- Todos pueden ver todas las reseñas

-- Policy 2: Los clientes pueden CREAR reseña solo de su propia cita completada
CREATE POLICY "Crear reseña de cita propia"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = client_id
    AND EXISTS (
      SELECT 1 FROM public.appointments
      WHERE id = appointment_id
        AND client_id = auth.uid()
        AND status = 'completed'
    )
  );

-- Policy 3: Los clientes pueden ACTUALIZAR su propia reseña
CREATE POLICY "Actualizar propia reseña"
  ON public.reviews FOR UPDATE
  TO authenticated
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

-- Policy 4: Los clientes pueden ELIMINAR su propia reseña
CREATE POLICY "Eliminar propia reseña"
  ON public.reviews FOR DELETE
  TO authenticated
  USING (auth.uid() = client_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Vista: Reseñas con información detallada del negocio y cliente
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_reviews_detailed AS
SELECT
  r.id,
  r.appointment_id,
  r.business_id,
  r.client_id,
  r.rating,
  r.comment,
  r.created_at,
  r.updated_at,
  b.name AS business_name,
  b.slug AS business_slug,
  p.full_name AS client_name,
  p.avatar_url AS client_avatar,
  COUNT(*) OVER (PARTITION BY r.business_id) AS total_reviews,
  ROUND(AVG(r.rating) OVER (PARTITION BY r.business_id), 2) AS avg_rating
FROM public.reviews r
JOIN public.businesses b ON r.business_id = b.id
JOIN public.profiles p ON r.client_id = p.id;

COMMENT ON VIEW public.v_reviews_detailed IS
  'Vista detallada de reseñas con información del negocio y cliente. Incluye estadísticas agregadas.';
