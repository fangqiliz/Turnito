-- =====================================================================
-- Turnito SaaS Database Migration: Make employee_id Nullable
-- Fecha: 2026-07-05
--
-- Objetivo:
--   Permitir que las citas se creen sin empleado asignado inicialmente.
--   Si el empleado seleccionado no tiene horario o no está disponible,
--   la cita se crea con employee_id = NULL y puede ser reasignada posteriormente.
--
-- Cambios:
--   1. Alterar la columna employee_id para permitir NULL
--   2. Actualizar la restricción de exclusión para ignorar filas con employee_id IS NULL
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Cambiar la columna employee_id para permitir NULL
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.appointments
  ALTER COLUMN employee_id DROP NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Actualizar la restricción de exclusión para ignorar citas sin empleado
-- ─────────────────────────────────────────────────────────────────────────────
-- Primero, eliminar la restricción antigua que no permite NULL
ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_no_employee_overlap;

-- Crear una nueva restricción que ignora filas donde employee_id IS NULL
-- Esto permite que múltiples citas tengan employee_id = NULL sin conflicto
ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_no_employee_overlap EXCLUDE USING gist (
    employee_id WITH =, 
    tstzrange(start_time, end_time) WITH &&
  ) WHERE (status != 'cancelled' AND employee_id IS NOT NULL);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Documentación del cambio
-- ─────────────────────────────────────────────────────────────────────────────
-- Comportamiento nuevo:
--   - Si el cliente selecciona un empleado pero este no tiene horario o no está disponible,
--     la cita se crea con employee_id = NULL
--   - El gerente del negocio puede asignar un empleado disponible posteriormante
--   - La restricción de exclusión ya no se aplica a citas con employee_id = NULL
--     (múltiples citas pueden existir sin empleado asignado)
