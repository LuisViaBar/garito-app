-- Fase 4: Galería. Tabla fotos + bucket privado 'galeria' de Supabase Storage.
-- Ver docs/garito-diseno-funcional-tecnico.md §4.5 y §5 (modelo de datos,
-- cerrado: nombres de campo y restricciones tal cual, no reinterpretar).
--
-- Dos álbumes fijos ('merchandising' y 'grupo'), sin gestión de álbumes.
-- Cualquier miembro ve y sube; borra quien subió la foto o un admin.
--
-- Rutas, no URLs (§4.5): storage_path y thumbnail_path son la ruta DENTRO del
-- bucket (p. ej. 'grupo/<uuid>.webp'), nunca una URL firmada, que caduca. La
-- app firma en el momento de mostrar.
--
-- Decisión de interpretación: tamano_bytes guarda el peso de la foto MÁS el de
-- su miniatura, es decir, lo que la fila ocupa de verdad en Storage (§4.5: "para
-- poder vigilar el consumo acumulado"). La miniatura pesa un 5 % de la foto.

create table public.fotos (
  id uuid primary key default gen_random_uuid(),
  album text not null check (album in ('merchandising', 'grupo')),
  storage_path text not null unique,
  thumbnail_path text not null unique,
  tamano_bytes integer not null check (tamano_bytes > 0),
  subida_por uuid not null references public.miembros (id),
  created_at timestamptz not null default now(),
  -- Las rutas cuelgan de la carpeta de su álbum: no se puede registrar una
  -- foto de un álbum apuntando a un fichero de otro ni a una ruta arbitraria.
  check (
    storage_path like album || '/%'
    and thumbnail_path like album || '/%'
  )
);

create index fotos_album_fecha_idx on public.fotos (album, created_at desc);

alter table public.fotos enable row level security;

-- El GRANT explícito es imprescindible además de las políticas RLS (ver
-- miembros.sql y CLAUDE.md, regla de proceso 2). Sin UPDATE: una foto no se
-- edita, se borra y se vuelve a subir.
grant select, insert, delete on public.fotos to authenticated;

create policy "fotos: lectura para autenticados"
  on public.fotos for select
  to authenticated
  using (true);

-- Solo se puede firmar como uno mismo (no falsear quién subió la foto), como
-- en stock_log y comentarios.
create policy "fotos: alta como uno mismo"
  on public.fotos for insert
  to authenticated
  with check (subida_por = public.miembro_actual_id());

create policy "fotos: borrado quien la subio o admin"
  on public.fotos for delete
  to authenticated
  using (subida_por = public.miembro_actual_id() or public.es_admin());

-- ---------------------------------------------------------------------------
-- Consumo del plan gratuito (~1 GB), consultable desde la propia app. Solo
-- devuelve cifras a un admin (la vista corre con los privilegios de su dueño,
-- así que el filtro va dentro). Nada derivado se guarda: se calcula aquí.
-- ---------------------------------------------------------------------------

create view public.v_uso_galeria as
select
  count(*)::integer as fotos,
  coalesce(sum(tamano_bytes), 0)::bigint as bytes
from public.fotos
where public.es_admin();

-- Los GRANT también van en las vistas (CLAUDE.md, regla 2).
grant select on public.v_uso_galeria to authenticated;

-- ---------------------------------------------------------------------------
-- Bucket privado. Límites en el propio bucket como segunda barrera (la app ya
-- comprime en el navegador a ~300 KB): 2 MB por fichero y solo WebP/JPEG, que
-- es lo que produce la compresión en cliente (WebP; JPEG en los Safari que no
-- codifican WebP).
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'galeria',
  'galeria',
  false,
  2097152,
  array['image/webp', 'image/jpeg']
)
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- RLS de storage.objects (Supabase ya concede a authenticated los privilegios
-- de tabla; aquí solo hacen falta las políticas). Todas acotadas al bucket
-- 'galeria': storage.objects es compartida por todos los buckets.

-- Leer, para poder firmar URLs (createSignedUrl exige poder leer el objeto).
create policy "galeria: lectura para autenticados"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'galeria');

-- Subir, solo dentro de la carpeta de uno de los dos álbumes. Sin política de
-- UPDATE: los nombres son UUID, nunca se sobrescribe.
create policy "galeria: subida a un album"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'galeria'
    and (storage.foldername(name))[1] in ('merchandising', 'grupo')
  );

-- Borrar el fichero: quien lo subió (owner_id lo rellena Storage con el uid
-- del que sube) o un admin. Es la misma regla que la de fotos.
create policy "galeria: borrado quien lo subio o admin"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'galeria'
    and (owner_id = (select auth.uid())::text or public.es_admin())
  );
