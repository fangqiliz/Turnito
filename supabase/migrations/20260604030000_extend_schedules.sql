-- =====================================================================
-- Turnito SaaS – Migration: Extend schedules table
-- La tabla schedules ya existe en la migración base (init_schema).
-- Esta migración añade índices de rendimiento y comentarios de columna.
-- =====================================================================

-- ─────────────────────────────────────────────────────────────────────
-- 1. Índices de rendimiento para el módulo Schedules
-- ─────────────────────────────────────────────────────────────────────

-- Horarios activos de un negocio (dashboard / booking widget)
CREATE INDEX IF NOT EXISTS idx_schedules_business_active
  ON public.schedules(business_id, is_active);

-- Horarios de un empleado por día (generación de slots libres)
-- Complementa idx_schedules_employee_day de la migración base
CREATE INDEX IF NOT EXISTS idx_schedules_employee_active
  ON public.schedules(employee_id, is_active);

-- ─────────────────────────────────────────────────────────────────────
-- 2. Comentarios de columnas
-- ─────────────────────────────────────────────────────────────────────
COMMENT ON TABLE  public.schedules              IS 'Horarios laborales semanales de los empleados por negocio (tenant)';
COMMENT ON COLUMN public.schedules.day_of_week  IS '0=domingo, 1=lunes, 2=martes, 3=miércoles, 4=jueves, 5=viernes, 6=sábado';
COMMENT ON COLUMN public.schedules.start_time   IS 'Hora de inicio del turno en formato TIME (HH:MM:SS)';
COMMENT ON COLUMN public.schedules.end_time     IS 'Hora de fin del turno en formato TIME (HH:MM:SS), debe ser > start_time';
COMMENT ON COLUMN public.schedules.is_active    IS 'Soft-disable: false excluye el horario del cálculo de slots disponibles';

-- ─────────────────────────────────────────────────────────────────────
-- 3. Verificación del constraint UNIQUE que previene duplicados exactos
--    (employee_id, day_of_week, start_time) ya está en init_schema:
--    CONSTRAINT unique_employee_day_slot UNIQUE (employee_id, day_of_week, start_time)
--    Este constraint actúa como red de seguridad ante condiciones de carrera.
--    La detección de solapamientos parciales se hace en el servicio JS.
-- ─────────────────────────────────────────────────────────────────────
