listo, pero en esto hice unos cambios


CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (
    (recipient_type = 'user' AND recipient_id = auth.uid()) OR
    (recipient_type = 'employee' AND 
     recipient_id = (SELECT id FROM public.employees WHERE user_id = auth.uid()))
  );

-- Los usuarios solo pueden actualizar sus propias notificaciones (marcar como leído)
CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (
    (recipient_type = 'user' AND recipient_id = auth.uid()) OR
    (recipient_type = 'employee' AND 
     recipient_id = (SELECT id FROM public.employees WHERE user_id = auth.uid()))
  )
  WITH CHECK (
    (recipient_type = 'user' AND recipient_id = auth.uid()) OR
    (recipient_type = 'employee' AND 
     recipient_id = (SELECT id FROM public.employees WHERE user_id = auth.uid()))