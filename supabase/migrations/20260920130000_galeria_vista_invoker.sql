-- Fase 4, corrección: v_uso_galeria se creó sin security_invoker, así que corría
-- con los privilegios de su dueño (postgres) y se saltaba el RLS de fotos
-- (Supabase la marcaba como UNRESTRICTED). Se alinea con v_stock_bajo: la vista
-- respeta el RLS de quien consulta. El resultado no cambia: fotos es legible por
-- cualquier autenticado y el filtro es_admin() sigue dentro de la vista.
alter view public.v_uso_galeria set (security_invoker = true);
