-- Quita productos.unidad: revisado en Fase 2, no aportaba valor suficiente
-- para justificar el campo. Ver docs/garito-diseno-funcional-tecnico.md §5.
--
-- v_stock_bajo hace "select *" de productos, así que depende de todas sus
-- columnas (incluida unidad) y hay que recrearla tras el ALTER. De paso
-- se añade el GRANT que faltaba en la definición original de la vista
-- (sin él, PostgREST devolvía "permission denied" en silencio y la app
-- trataba el stock bajo como una lista vacía).

drop view public.v_stock_bajo;

alter table public.productos drop column unidad;

create view public.v_stock_bajo
  with (security_invoker = true)
  as
  select *
  from public.productos
  where cantidad_actual < umbral_minimo;

grant select on public.v_stock_bajo to authenticated;
