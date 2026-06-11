-- =====================================================================
-- Turnito SaaS – Migration: Extend employees table + businesses guards
-- Añade el campo specialty a employees y confirma que businesses tiene
-- los campos description, phone y address del módulo anterior.
-- =====================================================================


-- ─────────────────────────────────────────────────────────────────────
-- 1. employees – añadir campo specialty
--    La tabla base ya existe en la migración de inicialización.
-- ─────────────────────────────────────────────────────────────────────
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS specialty TEXT;

COMMENT ON COLUMN public.employees.specialty IS 'Especialidad o habilidad principal del empleado (ej. Corte, Coloración, Manicure)';

-- ─────────────────────────────────────────────────────────────────────
-- 2. Índice adicional para búsqueda de empleados activos por negocio
--    (ya existe idx_employees_business_id en la migración base,
--     pero añadimos uno filtrado por is_active para las consultas del
--     booking widget)
-- ─────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_employees_business_active
  ON public.employees(business_id, is_active);

-- ─────────────────────────────────────────────────────────────────────
-- 3. RLS – Políticas adicionales para businesses (si no existen)
--    Se usa CREATE POLICY ... IF NOT EXISTS (Postgres 15+).
--    Para compatibilidad con versiones anteriores, las envolvemos en DO.
-- ─────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  -- Política DELETE: solo el propietario puede eliminar su negocio
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'businesses'
      AND policyname = 'Permitir eliminación de negocios al propietario'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Permitir eliminación de negocios al propietario"
        ON public.businesses FOR DELETE
        TO authenticated
        USING (auth.uid() = owner_id)
    $policy$;
  END IF;
END;
$$;
