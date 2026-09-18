-- Fase 2: Almacén. Tablas productos + stock_log. Ver
-- docs/garito-diseno-funcional-tecnico.md §4.2 y §5 (modelo de datos,
-- cerrado: nombres de campo y restricciones tal cual, no reinterpretar).

create table public.productos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  categoria text not null
    check (categoria in ('bebida', 'comida', 'desechables', 'limpieza', 'otros')),
  unidad text not null,
  cantidad_actual numeric(10,2) not null default 0,
  umbral_minimo numeric(10,2) not null default 0,
  orden smallint,
  created_at timestamptz not null default now()
);

create table public.stock_log (
  id uuid primary key default gen_random_uuid(),
  producto_id uuid not null references public.productos (id) on delete cascade,
  miembro_id uuid not null references public.miembros (id),
  cantidad_anterior numeric(10,2) not null,
  cantidad_nueva numeric(10,2) not null,
  motivo text not null
    check (motivo in ('reposicion', 'consumo', 'recuento', 'correccion')),
  nota text,
  created_at timestamptz not null default now()
);

alter table public.productos enable row level security;
alter table public.stock_log enable row level security;

-- El GRANT es imprescindible además de las políticas RLS (ver miembros.sql
-- y CLAUDE.md, regla de proceso 2): sin él, Postgres deniega el acceso
-- antes de llegar a evaluar RLS.
grant select, insert, update, delete on public.productos to authenticated;
grant select, insert on public.stock_log to authenticated;

-- Devuelve el id de miembro del usuario autenticado actual. SECURITY
-- DEFINER por el mismo motivo que es_admin() (miembros.sql): evita la
-- recursión de RLS al consultar miembros desde una política de miembros.
create function public.miembro_actual_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select id from public.miembros where auth_user_id = auth.uid();
$$;

-- productos: lectura para cualquier autenticado.
create policy "productos: lectura para autenticados"
  on public.productos for select
  to authenticated
  using (true);

-- productos: alta, borrado y edición de campos (nombre, categoria, unidad,
-- umbral_minimo, orden) solo admin (§4.2). La edición de cantidad_actual
-- por cualquier miembro NO pasa por esta política de UPDATE: va por la
-- función actualizar_stock() de abajo, que es SECURITY DEFINER.
create policy "productos: alta solo admin"
  on public.productos for insert
  to authenticated
  with check (public.es_admin());

create policy "productos: edicion solo admin"
  on public.productos for update
  to authenticated
  using (public.es_admin())
  with check (public.es_admin());

create policy "productos: borrado solo admin"
  on public.productos for delete
  to authenticated
  using (public.es_admin());

-- stock_log: auditoría inmutable (§4.2). Lectura para cualquier
-- autenticado. Inserción solo puede atribuirse el propio miembro que
-- inserta (no se puede falsear "quién" hizo el cambio). Sin políticas de
-- UPDATE/DELETE: no se edita ni se borra individualmente. El borrado en
-- cascada al eliminar un producto lo hace la restricción de clave foránea,
-- que no pasa por RLS.
create policy "stock_log: lectura para autenticados"
  on public.stock_log for select
  to authenticated
  using (true);

create policy "stock_log: insercion para autenticados"
  on public.stock_log for insert
  to authenticated
  with check (miembro_id = public.miembro_actual_id());

-- Único camino para que "cualquier miembro" cambie cantidad_actual: esta
-- función actualiza el producto e inserta el stock_log en la misma
-- sentencia (Postgres la ejecuta como una única transacción implícita), de
-- modo que el histórico nunca queda desincronizado del valor real.
-- SECURITY DEFINER: bypassa la política de UPDATE (solo-admin) igual que
-- es_admin() bypassa RLS de miembros; la propia función exige que quien
-- llama esté vinculado a un miembro.
create function public.actualizar_stock(
  p_producto_id uuid,
  p_cantidad_nueva numeric,
  p_motivo text,
  p_nota text default null
)
returns public.productos
language plpgsql
security definer
set search_path = public
as $$
declare
  v_miembro_id uuid;
  v_cantidad_anterior numeric(10,2);
  v_producto public.productos;
begin
  v_miembro_id := public.miembro_actual_id();
  if v_miembro_id is null then
    raise exception 'El usuario autenticado no está vinculado a ningún miembro';
  end if;

  if p_motivo not in ('reposicion', 'consumo', 'recuento', 'correccion') then
    raise exception 'Motivo no válido: %', p_motivo;
  end if;

  select cantidad_actual into v_cantidad_anterior
  from public.productos
  where id = p_producto_id
  for update;

  if not found then
    raise exception 'Producto no encontrado';
  end if;

  update public.productos
  set cantidad_actual = p_cantidad_nueva
  where id = p_producto_id
  returning * into v_producto;

  insert into public.stock_log
    (producto_id, miembro_id, cantidad_anterior, cantidad_nueva, motivo, nota)
  values
    (p_producto_id, v_miembro_id, v_cantidad_anterior, p_cantidad_nueva, p_motivo, p_nota);

  return v_producto;
end;
$$;

grant execute on function public.actualizar_stock(uuid, numeric, text, text) to authenticated;

-- Vista derivada: productos por debajo del umbral mínimo (regla de proceso
-- 5, CLAUDE.md — nada de contadores/derivados almacenados).
-- security_invoker: la vista respeta el RLS del usuario que consulta, no
-- el del propietario de la vista.
create view public.v_stock_bajo
  with (security_invoker = true)
  as
  select *
  from public.productos
  where cantidad_actual < umbral_minimo;
