-- =====================================================================
-- Turnito SaaS – Migration: Appointments Module Extension
-- Fecha: 2026-06-11
--
-- Objetivo:
--   1. Agregar el estado 'no_show' al CHECK constraint de appointments.
--   2. Agregar índice compuesto para detección eficiente de solapamientos.
--   3. Agregar índice para notificaciones tipo appointment.
--   4. Función RPC para verificar solapamientos de citas (opcional, usada por RLS).
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Extender el CHECK constraint de status para incluir 'no_show'
-- ─────────────────────────────────────────────────────────────────────────────
-- El schema inicial solo definía: 'pending', 'confirmed', 'cancelled', 'completed'
-- Extendemos agregando 'no_show' como estado válido.

ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_status_check;

ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_status_check
  CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show'));

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Índice de solapamiento para detección eficiente de doble reserva
-- ─────────────────────────────────────────────────────────────────────────────
-- Complementa el EXCLUDE USING gist del schema inicial.
-- Usado por la consulta de verificación de disponibilidad en appointment.service.js.

CREATE INDEX IF NOT EXISTS idx_appointments_employee_overlap
  ON public.appointments (employee_id, start_time, end_time)
  WHERE status != 'cancelled';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Índice para filtrar citas por negocio + estado (Dashboard del negocio)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_appointments_business_status
  ON public.appointments (business_id, status, start_time DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Índice para citas del cliente autenticado con estado (App móvil)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_appointments_client_status
  ON public.appointments (client_id, status, start_time DESC)
  WHERE client_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Función RPC: Verificar disponibilidad de empleado en un rango de tiempo
--    Puede ser invocada desde el frontend o desde una Edge Function.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.check_employee_availability(
  p_employee_id  UUID,
  p_start_time   TIMESTAMPTZ,
  p_end_time     TIMESTAMPTZ,
  p_exclude_id   UUID DEFAULT NULL
)
RETURNS BOOLEAN
SECURITY DEFINER
LANGUAGE plpgsql AS $$
DECLARE
  conflict_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO conflict_count
  FROM public.appointments
  WHERE employee_id = p_employee_id
    AND status != 'cancelled'
    AND start_time < p_end_time
    AND end_time   > p_start_time
    AND (p_exclude_id IS NULL OR id != p_exclude_id);

  RETURN conflict_count = 0; -- TRUE si disponible, FALSE si hay conflicto
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Política RLS adicional: Eliminar citas (solo cancelar via UPDATE)
--    No se permiten DELETE físicos desde el cliente; solo status = 'cancelled'.
-- ─────────────────────────────────────────────────────────────────────────────

-- Bloquear DELETE directo en appointments para todos los roles
-- (la cancelación se gestiona mediante UPDATE del status)
DROP POLICY IF EXISTS "Bloquear eliminacion fisica de citas" ON public.appointments;

CREATE POLICY "Bloquear eliminacion fisica de citas"
  ON public.appointments FOR DELETE
  TO authenticated
  USING (false); -- Nadie puede hacer DELETE físico desde el cliente

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Vista materializable: Resumen de citas por negocio
--    Útil para dashboards de métricas sin cargar la tabla completa.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW public.v_appointments_summary AS
SELECT
  business_id,
  status,
  DATE(start_time AT TIME ZONE 'UTC') AS appointment_date,
  COUNT(*) AS total
FROM public.appointments
GROUP BY business_id, status, DATE(start_time AT TIME ZONE 'UTC');

COMMENT ON VIEW public.v_appointments_summary IS
  'Vista de resumen de citas agrupadas por negocio, estado y fecha. Útil para dashboards.';
