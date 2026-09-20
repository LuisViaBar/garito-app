-- Quita miembros.departamento: el Organigrama queda fuera del alcance del
-- proyecto y el campo solo lo alimentaba a él. Ver
-- docs/garito-diseno-funcional-tecnico.md §5.
--
-- Ninguna vista ni política depende de la columna (comprobado: no hay
-- vistas sobre miembros y el GRANT es a nivel de tabla), así que no hace
-- falta CASCADE. Borra el dato de la columna, irreversible.

alter table public.miembros drop column departamento;
