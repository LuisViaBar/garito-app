-- Tabla miembros. Ver docs/garito-diseno-funcional-tecnico.md §5 (modelo de
-- datos, cerrado: nombres de campo y restricciones tal cual, no reinterpretar).

create table public.miembros (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users (id) on delete cascade,
  nombre text not null,
  alias text not null,
  email text not null,
  rol text not null check (rol in ('admin', 'miembro')),
  departamento text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.miembros enable row level security;

-- El GRANT es imprescindible además de las políticas RLS: en Postgres, RLS
-- solo se evalúa si el rol ya tiene el privilegio de base sobre la tabla.
-- El Table Editor de Supabase lo añade solo; al crear la tabla por SQL hay
-- que concederlo a mano. Las políticas de abajo siguen siendo las que
-- deciden qué filas/columnas se ven realmente.
grant select, insert, update, delete on public.miembros to authenticated;

-- SECURITY DEFINER: evita la recursión de RLS que se produciría si una
-- política de la propia tabla miembros tuviera que consultar miembros.
create function public.es_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.miembros
    where auth_user_id = auth.uid() and rol = 'admin'
  );
$$;

-- Cualquier miembro autenticado ve la lista completa: la usan Finanzas,
-- Almacén, Proyectos y Organigrama para mostrar nombres de otros miembros.
create policy "miembros: lectura para autenticados"
  on public.miembros for select
  to authenticated
  using (true);

-- Solo un admin puede crear, editar o borrar miembros (altas/bajas son
-- manuales y extraordinarias, ver §4.1.1 del diseño).
create policy "miembros: escritura solo admin"
  on public.miembros for all
  to authenticated
  using (public.es_admin())
  with check (public.es_admin());
