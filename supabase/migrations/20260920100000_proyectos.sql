-- Fase 3: Proyectos. Tablas proyectos, proyecto_miembros, tareas y
-- comentarios. Ver docs/garito-diseno-funcional-tecnico.md §4.3 y §5 (modelo
-- de datos, cerrado: nombres de campo y restricciones tal cual, no
-- reinterpretar).
--
-- Modelo de permisos (§4.3): la visibilidad la decide la base de datos, no el
-- frontend. El acceso vive SOLO en el proyecto raíz (proyecto_miembros) y los
-- subproyectos lo heredan: la función permiso_proyecto() resuelve siempre
-- contra la raíz. Los admin ven y editan todo.
--
--   ver     → lee proyecto, tareas y comentarios.
--   editar  → además crea/edita/borra tareas y publica comentarios.
--   dueño   → (creador del proyecto o de su raíz) y admin: además editan el
--             proyecto (nombre, descripción, estado), lo borran y gestionan
--             quién tiene acceso. Ver puede_gestionar_proyecto().

create table public.proyectos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null check (length(btrim(nombre)) > 0),
  descripcion text,
  proyecto_padre_id uuid references public.proyectos (id) on delete cascade,
  creador_id uuid not null references public.miembros (id),
  estado text not null default 'activo'
    check (estado in ('activo', 'archivado')),
  created_at timestamptz not null default now()
);

create table public.proyecto_miembros (
  proyecto_id uuid not null references public.proyectos (id) on delete cascade,
  miembro_id uuid not null references public.miembros (id),
  permiso text not null check (permiso in ('ver', 'editar')),
  primary key (proyecto_id, miembro_id)
);

create table public.tareas (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos (id) on delete cascade,
  titulo text not null check (length(btrim(titulo)) > 0),
  descripcion text,
  responsable_id uuid references public.miembros (id),
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'en_curso', 'hecha')),
  orden smallint,
  created_at timestamptz not null default now()
);

create table public.comentarios (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references public.proyectos (id) on delete cascade,
  miembro_id uuid not null references public.miembros (id),
  texto text not null check (length(btrim(texto)) > 0),
  created_at timestamptz not null default now()
);

create index proyectos_padre_idx on public.proyectos (proyecto_padre_id);
create index tareas_proyecto_idx on public.tareas (proyecto_id);
create index comentarios_proyecto_idx on public.comentarios (proyecto_id);

alter table public.proyectos enable row level security;
alter table public.proyecto_miembros enable row level security;
alter table public.tareas enable row level security;
alter table public.comentarios enable row level security;

-- El GRANT explícito es imprescindible además de las políticas RLS (ver
-- miembros.sql y CLAUDE.md, regla de proceso 2). Aquí además va por columnas
-- en las UPDATE: lo que no se lista es inmutable para el cliente
-- (proyecto_padre_id, creador_id, proyecto_id, miembro_id...). Los
-- proyectos no se insertan directamente: solo por crear_proyecto().
grant select, delete on public.proyectos to authenticated;
grant update (nombre, descripcion, estado) on public.proyectos to authenticated;

grant select, insert, delete on public.proyecto_miembros to authenticated;
grant update (permiso) on public.proyecto_miembros to authenticated;

grant select, insert, delete on public.tareas to authenticated;
grant update (titulo, descripcion, responsable_id, estado, orden)
  on public.tareas to authenticated;

grant select, insert, delete on public.comentarios to authenticated;

-- ---------------------------------------------------------------------------
-- Funciones auxiliares de las políticas. SECURITY DEFINER por el mismo
-- motivo que es_admin() (miembros.sql): proyectos y proyecto_miembros se
-- consultan mutuamente desde sus políticas, y sin esto RLS entraría en
-- recursión infinita. es_admin() y miembro_actual_id() ya existen
-- (miembros.sql y almacen.sql).
-- ---------------------------------------------------------------------------

-- La raíz de un proyecto: él mismo si no tiene padre, o su padre. El
-- anidamiento es de 2 niveles como máximo, así que basta un salto.
create function public.proyecto_raiz_id(p_id uuid)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(proyecto_padre_id, id) from public.proyectos where id = p_id;
$$;

create function public.creador_proyecto_id(p_id uuid)
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select creador_id from public.proyectos where id = p_id;
$$;

-- Nivel de acceso del usuario actual a un proyecto: 'editar', 'ver' o null
-- (sin acceso). Admin → 'editar' siempre. Los subproyectos heredan el de su
-- raíz.
create function public.permiso_proyecto(p_id uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select case
    when public.es_admin() then 'editar'
    else (
      select pm.permiso
      from public.proyecto_miembros pm
      where pm.proyecto_id = public.proyecto_raiz_id(p_id)
        and pm.miembro_id = public.miembro_actual_id()
    )
  end;
$$;

-- ¿Puede el usuario actual gestionar el proyecto (editarlo, borrarlo,
-- repartir accesos)? Admin, o el creador del proyecto o de su raíz, siempre
-- que conserve acceso.
create function public.puede_gestionar_proyecto(p_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.es_admin()
    or (
      public.permiso_proyecto(p_id) is not null
      and public.miembro_actual_id() in (
        public.creador_proyecto_id(p_id),
        public.creador_proyecto_id(public.proyecto_raiz_id(p_id))
      )
    );
$$;

-- ---------------------------------------------------------------------------
-- proyectos: lectura solo con acceso (regla de oro: quien no está en la
-- lista no ve el proyecto). Sin política de INSERT: se crea con
-- crear_proyecto(). Edición y borrado, solo quien gestiona; el borrado
-- arrastra subproyectos, tareas, comentarios y permisos por ON DELETE CASCADE
-- (las acciones referenciales no pasan por RLS).
-- ---------------------------------------------------------------------------

create policy "proyectos: lectura con acceso"
  on public.proyectos for select
  to authenticated
  using (public.permiso_proyecto(id) is not null);

create policy "proyectos: edicion quien gestiona"
  on public.proyectos for update
  to authenticated
  using (public.puede_gestionar_proyecto(id))
  with check (public.puede_gestionar_proyecto(id));

create policy "proyectos: borrado quien gestiona"
  on public.proyectos for delete
  to authenticated
  using (public.puede_gestionar_proyecto(id));

-- Refuerzo en BBDD del límite de 2 niveles (§4.3): un proyecto que ya tiene
-- padre no puede ser padre de otro. proyecto_padre_id no es actualizable
-- por el cliente (GRANT por columnas), así que basta vigilar el INSERT.
create function public.proyectos_limite_niveles()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.proyecto_padre_id is not null and exists (
    select 1 from public.proyectos
    where id = new.proyecto_padre_id and proyecto_padre_id is not null
  ) then
    raise exception 'Un subproyecto no puede tener subproyectos (máximo 2 niveles)';
  end if;
  return new;
end;
$$;

create trigger proyectos_limite_niveles
  before insert on public.proyectos
  for each row execute function public.proyectos_limite_niveles();

-- ---------------------------------------------------------------------------
-- proyecto_miembros: ven la lista todos los que tienen acceso (sirve para
-- asignar responsables); la modifica solo quien gestiona. Solo existe en
-- proyectos raíz (los subproyectos heredan). El creador conserva siempre su
-- fila con 'editar': no se puede quitar ni rebajar (§5).
-- ---------------------------------------------------------------------------

create policy "proyecto_miembros: lectura con acceso"
  on public.proyecto_miembros for select
  to authenticated
  using (public.permiso_proyecto(proyecto_id) is not null);

create policy "proyecto_miembros: alta quien gestiona"
  on public.proyecto_miembros for insert
  to authenticated
  with check (
    public.puede_gestionar_proyecto(proyecto_id)
    and public.proyecto_raiz_id(proyecto_id) = proyecto_id
  );

create policy "proyecto_miembros: cambio quien gestiona"
  on public.proyecto_miembros for update
  to authenticated
  using (
    public.puede_gestionar_proyecto(proyecto_id)
    and public.proyecto_raiz_id(proyecto_id) = proyecto_id
  )
  with check (
    public.puede_gestionar_proyecto(proyecto_id)
    and (
      permiso = 'editar'
      or miembro_id <> public.creador_proyecto_id(proyecto_id)
    )
  );

create policy "proyecto_miembros: baja quien gestiona"
  on public.proyecto_miembros for delete
  to authenticated
  using (
    public.puede_gestionar_proyecto(proyecto_id)
    and public.proyecto_raiz_id(proyecto_id) = proyecto_id
    and miembro_id <> public.creador_proyecto_id(proyecto_id)
  );

-- ---------------------------------------------------------------------------
-- tareas y comentarios: sin control de acceso propio, heredan el del proyecto
-- (§5). Leer, con acceso; escribir, con 'editar'.
-- ---------------------------------------------------------------------------

create policy "tareas: lectura con acceso"
  on public.tareas for select
  to authenticated
  using (public.permiso_proyecto(proyecto_id) is not null);

create policy "tareas: alta con permiso de edicion"
  on public.tareas for insert
  to authenticated
  with check (public.permiso_proyecto(proyecto_id) = 'editar');

create policy "tareas: cambio con permiso de edicion"
  on public.tareas for update
  to authenticated
  using (public.permiso_proyecto(proyecto_id) = 'editar')
  with check (public.permiso_proyecto(proyecto_id) = 'editar');

create policy "tareas: borrado con permiso de edicion"
  on public.tareas for delete
  to authenticated
  using (public.permiso_proyecto(proyecto_id) = 'editar');

create policy "comentarios: lectura con acceso"
  on public.comentarios for select
  to authenticated
  using (public.permiso_proyecto(proyecto_id) is not null);

-- Solo se puede firmar como uno mismo (no falsear el autor), como en stock_log.
create policy "comentarios: alta con permiso de edicion"
  on public.comentarios for insert
  to authenticated
  with check (
    public.permiso_proyecto(proyecto_id) = 'editar'
    and miembro_id = public.miembro_actual_id()
  );

-- Sin UPDATE: un comentario no se edita. Lo borra su autor o quien gestiona
-- el proyecto (moderación).
create policy "comentarios: borrado autor o quien gestiona"
  on public.comentarios for delete
  to authenticated
  using (
    miembro_id = public.miembro_actual_id()
    or public.puede_gestionar_proyecto(proyecto_id)
  );

-- ---------------------------------------------------------------------------
-- crear_proyecto(): único camino para crear proyectos. En una sola
-- transacción inserta el proyecto y, si es raíz, la fila de su creador en
-- proyecto_miembros con 'editar' (§5), de modo que nunca puede quedar un
-- proyecto sin dueño con acceso. Para crear un subproyecto hace falta poder
-- editar el padre. SECURITY DEFINER: el creador todavía no tiene acceso al
-- proyecto que va a crear, así que la política de lectura no lo dejaría.
-- ---------------------------------------------------------------------------

create function public.crear_proyecto(
  p_nombre text,
  p_descripcion text default null,
  p_padre_id uuid default null
)
returns public.proyectos
language plpgsql
security definer
set search_path = public
as $$
declare
  v_miembro_id uuid;
  v_proyecto public.proyectos;
begin
  v_miembro_id := public.miembro_actual_id();
  if v_miembro_id is null then
    raise exception 'El usuario autenticado no está vinculado a ningún miembro';
  end if;

  if p_nombre is null or length(btrim(p_nombre)) = 0 then
    raise exception 'El nombre del proyecto es obligatorio';
  end if;

  if p_padre_id is not null then
    if not exists (select 1 from public.proyectos where id = p_padre_id) then
      raise exception 'Proyecto padre no encontrado';
    end if;
    if public.permiso_proyecto(p_padre_id) is distinct from 'editar' then
      raise exception 'No tienes permiso para crear subproyectos en este proyecto';
    end if;
  end if;

  -- El trigger proyectos_limite_niveles rechaza un padre que ya sea subproyecto.
  insert into public.proyectos (nombre, descripcion, proyecto_padre_id, creador_id)
  values (btrim(p_nombre), nullif(btrim(p_descripcion), ''), p_padre_id, v_miembro_id)
  returning * into v_proyecto;

  if p_padre_id is null then
    insert into public.proyecto_miembros (proyecto_id, miembro_id, permiso)
    values (v_proyecto.id, v_miembro_id, 'editar');
  end if;

  return v_proyecto;
end;
$$;

revoke execute on function public.crear_proyecto(text, text, uuid) from public, anon;
grant execute on function public.crear_proyecto(text, text, uuid) to authenticated;
