# Estado del proyecto — documento de traspaso entre sesiones

Este documento se actualiza **al cerrar cada sesión de trabajo** (no necesariamente cada
fase). Es el punto de entrada para retomar el proyecto: qué hay hecho, qué toca ahora y qué
hay que saber que no está en ningún otro sitio. Complementa, no repite:

- [garito-diseno-funcional-tecnico.md](garito-diseno-funcional-tecnico.md) — el diseño
  funcional y técnico cerrado. La fuente de verdad de qué se construye y por qué.
- [../CLAUDE.md](../CLAUDE.md) — stack, guardarraíles de proceso, estado resumido de fases
  y decisiones cerradas. Se lee automáticamente al abrir el proyecto.
- [pendientes-produccion.md](pendientes-produccion.md) — lista viva de bloqueantes para el
  paso a producción (no confundir con "qué toca programar ahora", que es este documento).
- [alta-miembros.md](alta-miembros.md) — runbook operativo para dar de alta a un miembro.
- [garito-sistema-diseno.md](garito-sistema-diseno.md) — sistema de diseño (tokens, componentes,
  navegación); el catálogo de componentes vive en `src/components/ui/README.md`.
- [garito-acabado-visual.md](garito-acabado-visual.md) — ilustraciones, iconos y microcopy;
  va al final del proyecto, no antes.
- [garito-modelo-relacional.html](garito-modelo-relacional.html) — diagrama del modelo de datos.
- [garitApp-manual-tesorero.md](garitApp-manual-tesorero.md) — manual de uso de Finanzas.

---

## Estado actual (léelo primero)

Última actualización: 2026-09-20. Las sesiones de más abajo, en orden cronológico inverso,
guardan el detalle y las decisiones de cada fase. **Esta sección es la foto actual** y se
mantiene al día al cerrar cada sesión.

### Fases

| Fase | Estado |
|---|---|
| 0 Base (Next.js, Tailwind, Supabase, Vercel) | Completada |
| 1 Auth, tabla `miembros`, roles, layout | Completada |
| 2 Almacén | Completada |
| Sistema de diseño | Implementado (2026-09-19), previo a la Fase 3 |
| 3 Proyectos | Completada; falta ejercitar en la UI con un usuario no admin (ver Sesión 2026-09-20) |
| 4 Galería | Código ya publicado en `main`; migración `20260920120000_galeria.sql` aplicada; **pendientes** aplicar `20260920130000_galeria_vista_invoker.sql` y hacer las pruebas de la Sesión 2026-09-20 (2) |
| 5 Finanzas: apuntes, devengo, saldos, extracto | Sin empezar. Se desarrolla con datos ficticios (alcance al final de este documento) |
| 6 Finanzas: importación bancaria | Bloqueada: falta una muestra real de extracto |
| 7 PWA | Sin empezar |
| Organigrama | **Fuera del alcance** (2026-09-20): sin menú, sin ruta y sin `miembros.departamento` |

### Migraciones (`supabase/migrations/`; no hay CLI, se aplican a mano en el SQL Editor)

| Migración | Estado |
|---|---|
| `20260917120000_miembros.sql` | Aplicada |
| `20260918090000_almacen.sql` | Aplicada |
| `20260918100000_almacen_quitar_unidad.sql` | Aplicada |
| `20260920100000_proyectos.sql` | Aplicada |
| `20260920120000_galeria.sql` | Aplicada (2026-09-20; visibles `fotos` y `v_uso_galeria` en el Table Editor). Faltan las pruebas de la sesión 2026-09-20 (2) |
| `20260920130000_galeria_vista_invoker.sql` | **Pendiente de aplicar** (una línea: `alter view public.v_uso_galeria set (security_invoker = true);`). Corrige `v_uso_galeria`, que salió `UNRESTRICTED` |
| `20260920140000_quitar_departamento.sql` | Aplicada (2026-09-20) |

### Entorno y accesos

- Repo [github.com/LuisViaBar/garito-app](https://github.com/LuisViaBar/garito-app), rama `main`
  única. Cada push a `main` despliega solo en [garito-app.vercel.app](https://garito-app.vercel.app).
- Todo el entorno es aún de pruebas (datos ficticios, ~5 usuarios), aunque Vercel lo llame
  "Production". Un solo proyecto Supabase (`aagltznsialwvwcnlunr`). Antes de invitar a los 25
  reales hay decisiones pendientes (mismo o distinto proyecto Supabase, ramas y Preview): ver
  [pendientes-produccion.md](pendientes-produccion.md).
- No hay `gh`, `vercel` ni CLI de Supabase: todo por sus dashboards.
- Usuarios de prueba: `Vuittest` (admin, `luisviabar+pruebagaritapp@gmail.com`) y `miembro1`
  (rol `miembro`). Las contraseñas no están en el repo: pídelas al propietario. Para dar de alta
  más, [alta-miembros.md](alta-miembros.md).

### Qué toca ahora, por orden

1. **Cerrar Galería** (la lleva otra sesión): aplicar `20260920130000_galeria_vista_invoker.sql` y
   hacer las pruebas de la sesión 2026-09-20 (2).
2. **Probar Proyectos con `miembro1` en la UI** (`ver`, `editar`, sin acceso; ver Sesión 2026-09-20).
3. **Fase 5, Finanzas (apuntes)**: alcance y resumen operativo al final de este documento.
   Antes de escribir código, leer §4.1 del diseño completo.
4. **Fase 6 (importación) y producción**, cuando el propietario aporte los saldos iniciales y la
   muestra de extracto (`pendientes-produccion.md`). **Fase 7 (PWA)** y el acabado visual, al final.

### Cómo trabajar cuando hay varias sesiones sobre la misma carpeta

- Ha habido más de una sesión de Claude Code sobre el mismo árbol de trabajo. Antes de commitear:
  `git status` y `git diff`; stagear ficheros o hunks concretos, nunca `git add -A`.
- **`git push` publica todos los commits locales, también los de otra sesión.** El 2026-09-20 el
  push del Organigrama subió sin querer el commit de galería que estaba sin publicar. Mirar
  `git log origin/main..HEAD` antes de empujar.
- **Lo que hay en `docs/` del repo es la versión canónica.** Si el propietario trae copias editadas
  desde fuera (OneDrive), compararlas con `git diff` antes de commitear: la del 2026-09-20 era
  anterior a varias decisiones y las revertía (`unidad` en `productos`, fondo gris, `actualizar_stock`).
  Se aplicó solo lo pedido y el resto se descartó.
- Una migración cuenta como hecha cuando el propietario confirma que la aplicó. Anotarlo aquí.

---

## Sesión 2026-09-20 (2): Fase 4 — Galería (código listo, migración sin aplicar)

Hecho: migración `20260920120000_galeria.sql`, `/galeria` (lista de los dos álbumes con su
contador; el admin ve además el espacio usado frente a 1 GB) y `/galeria/[album]` (rejilla de
3 columnas, visor a pantalla completa con anterior/siguiente y borrado, subida múltiple con
progreso). `tsc` y `eslint` pasan. **No se ha aplicado la migración ni se ha probado contra
Supabase**: en el navegador se validó a 375 px la pantalla vacía, la rejilla y el visor con datos
falsos (página temporal ya borrada), y la compresión con el código real (foto sintética de
4032×3024 y 5,7 MB → 1600×1200 WebP de 268 KB + miniatura de 480 px y 26 KB; una imagen
pequeña no se amplía; un fichero corrupto se rechaza).

**Para cerrar la fase (a mano, en este orden):**

1. Pegar `20260920120000_galeria.sql` en el SQL Editor. Si falla con `must be owner of table
   objects` en las políticas de `storage.objects`, crearlas desde Storage → Policies con las
   mismas condiciones (están comentadas en la migración). Comprobar que `storage.objects` tiene
   la columna `owner_id` (la política de borrado depende de ella).
2. Subir 2-3 fotos reales de móvil (idealmente iPhone y Android) a cada álbum y comprobar que
   pesan ~250-400 KB en Storage, que no salen tumbadas y que la miniatura carga en la rejilla.
3. Con un usuario **no admin**: puede subir, ve todo, solo ve "Borrar" en sus fotos. Borrar una
   foto suya deja `fotos` **y** los dos ficheros de Storage limpios (mirar el bucket). Un admin
   puede borrar las de otros. Atacar la API con la sesión no admin: `delete` sobre una foto
   ajena debe afectar a 0 filas, `insert` con `subida_por` de otro debe dar 403, y subir a una
   carpeta que no sea un álbum debe rechazarse.
4. Con el admin: `/galeria` muestra "Espacio de la galería"; con un no admin no aparece.

Decisiones tomadas que el diseño no cerraba (revisables):

1. **Subida directa navegador → Storage**, y después un server action (`registrarFoto`) que
   inserta la fila. Un server action tiene tope de 1 MB por petición, y así los ficheros no pasan
   por Vercel. Si el registro falla, el cliente borra los ficheros que acaba de subir.
2. **Bucket `galeria`, rutas `<album>/<uuid>.webp` y `<album>/<uuid>_mini.webp`** (`.jpg` en los
   Safari que no codifican WebP). El §4.4 escribe `galeria/grupo/abc123.webp` sin aclarar si
   `galeria` es el bucket o una carpeta; se interpretó como bucket. Un `CHECK` obliga a que las
   rutas cuelguen de la carpeta de su álbum.
3. **`tamano_bytes` = foto + miniatura**, es decir, lo que la fila ocupa de verdad en Storage.
4. **Compresión**: lado mayor 1600 px, WebP a calidad 0,8 (baja hasta 0,5 si pasara de 1,5 MB);
   miniatura de 480 px. Sin dependencias (`canvas`). Un GIF animado se guarda como imagen fija.
5. **Segunda barrera en el bucket**: 2 MB por fichero y solo `image/webp` / `image/jpeg`.
6. **Dos pantallas** (lista de álbumes → álbum) en vez de pestañas, para reutilizar `ListCard`
   y la flecha de volver de `AppNav`; no hace falta ningún componente nuevo en `ui/`.
7. **Paginación por tandas de 60** (`?n=120`, "Ver más fotos"). Todas las URL firmadas (miniatura
   y foto) se generan en el servidor en un solo lote y duran 1 h; no se guardan en BBDD.
8. **Borrado**: primero la fila (RLS decide) y luego los ficheros; si estos fallan queda un
   fichero huérfano (se registra en el log del servidor) en vez de una fila con imagen rota.
9. **Sin edición de fotos** (no hay UPDATE ni GRANT de UPDATE): se borra y se vuelve a subir.
10. El visor es un `<dialog>` propio en la carpeta de la ruta (`rejilla.tsx`), no un componente
    de `ui/`: es específico de la galería.

Gotchas de esta sesión:

- **Toda vista nueva lleva `with (security_invoker = true)`** (como `v_stock_bajo`). Sin ello corre
  con los privilegios de su dueño, se salta el RLS y Supabase la marca `UNRESTRICTED`.
  `v_uso_galeria` salió sin ello y se corrigió con `20260920130000_galeria_vista_invoker.sql`.
- **En el Table Editor de Supabase `v_uso_galeria` siempre sale a 0**: el panel consulta como
  `postgres`, donde `es_admin()` es falso. Para verla de verdad hay que consultarla desde la app.
- **Storage tampoco da error cuando una política impide borrar**: `remove()` devuelve menos
  objetos de los pedidos. Por eso `eliminarFoto` compara cuántos se borraron.
- **Safari que no codifica WebP devuelve un PNG en silencio** en `canvas.toBlob('image/webp')`
  (enorme para una foto): `comprimir-imagen.ts` mira el `type` del resultado y recurre a JPEG.
- **Orientación EXIF**: `createImageBitmap(..., { imageOrientation: "from-image" })`; sin ello
  las fotos verticales de móvil salen tumbadas.
- Otro chat ya tenía `next dev` en el puerto 3000 sobre esta carpeta; `preview_start` con
  `name` falla en ese caso. Se puede abrir con `preview_start` con `url` (recarga en caliente).

---

## Sesión 2026-09-20: Fase 3 — Proyectos (completada)

**Cambio de plan:** el documento de diseño §8 se reordenó por petición del propietario. Finanzas
se aplaza al final porque depende de datos de muestra que aún no han llegado. Nuevo orden:
3 Proyectos · 4 Galería · 5 Finanzas (apuntes) · 6 Finanzas (importación) · 7 PWA. (El
Organigrama, que era la 5, se sacó del alcance el mismo día y las siguientes se renumeraron.)
Ya actualizadas las referencias de número de fase en `CLAUDE.md`, `pendientes-produccion.md`,
`alta-miembros.md` y en el propio diseño (§4.1, §8, §9). El propietario confirmó que el orden
inicial de su edición tenía apuntes e importación al revés y se corrigió: apuntes (5) antes que
importación (6), con la numeración ya sin Organigrama.

Hecho: migración `20260920100000_proyectos.sql`, listado `/proyectos`, detalle
`/proyectos/[id]` y subproyecto `/proyectos/[id]/[subId]` con tareas, subproyectos,
comentarios, gestión de acceso y ajustes (editar/archivar/borrar). `tsc`, `eslint` y
`next build` pasan. Migración aplicada por el propietario en el SQL Editor (no hay Postgres
local ni CLI). Validado a 375 px (sin desbordes ni objetivos < 48 px) y en uso real con `miembro1`
(dueño) y `Vuittest` (admin): crear proyecto, subproyectos, tareas, comentarios y dar acceso.
Además se atacó la API directamente con la sesión de `miembro1` (no admin) y RLS/GRANT
rechazaron los 11 intentos: INSERT directo en `proyectos`, cambiar `creador_id` o
`proyecto_padre_id`, mover una tarea de proyecto, dar acceso en un subproyecto, borrar o rebajar
la fila del creador, subproyecto de subproyecto, comentar firmando como otro, y `anon` sin acceso
a tablas ni a `crear_proyecto`.

Decisiones tomadas que el diseño no cerraba (revisables):

1. **Cualquier miembro puede crear proyectos** (será su dueño). Un subproyecto solo puede
   crearlo quien tenga `editar` en el padre.
2. **Los permisos viven solo en el proyecto raíz.** Los subproyectos no tienen filas en
   `proyecto_miembros`: `permiso_proyecto()` resuelve siempre contra la raíz (herencia). La
   pantalla de un subproyecto muestra el acceso de solo lectura, con aviso.
3. **Tres niveles de poder:** `ver` (lee todo), `editar` (tareas y comentarios), **dueño**
   (creador del proyecto o de su raíz) y admin (además: editar nombre/descripción, archivar,
   borrar, repartir accesos). Función `puede_gestionar_proyecto()`.
4. **Un miembro con `ver` no comenta**: comentar exige `editar`. Un comentario lo borra su autor
   o quien gestiona el proyecto; no se editan.
5. **El creador conserva siempre su fila `editar`** en la raíz: la política impide quitársela o
   rebajarla.
6. **Proyectos solo se insertan por `crear_proyecto()`** (RPC `SECURITY DEFINER`, mismo patrón
   que `actualizar_stock`), no hay política de INSERT. Inserta el proyecto y la fila del creador
   en una transacción. `UPDATE` con `GRANT` por columnas: `proyecto_padre_id` y `creador_id`
   son inmutables para el cliente. El límite de 2 niveles está en app, en la RPC y en un trigger.
7. **Añadidos al modelo cerrado (§5), sin cambiar nombres ni restricciones existentes:**
   `CHECK` de texto no vacío en `nombre`/`titulo`/`texto` y `DEFAULT` en los estados.
8. **Archivar no bloquea nada**: un proyecto archivado sigue siendo editable; solo se oculta en
   un desplegable "Ver archivados" de la lista.
9. **`tareas.orden` se asigna al crear (al final) pero aún no hay UI para reordenar.** La lista
   pone las abiertas antes que las hechas. Reordenar queda para cuando se pida.
10. **Los responsables de tarea se eligen entre quienes tienen acceso al proyecto**; un admin sin
    fila en `proyecto_miembros` no es asignable salvo que se le dé acceso.
11. **`AppNav` decide la flecha de volver por la ruta**: `/a/b/c` vuelve a `/a/b`. Por eso el
    subproyecto está bajo `/proyectos/[id]/[subId]` (la flecha lleva al padre). Un subproyecto
    abierto por `/proyectos/[subId]` redirige a su dirección canónica.

Piezas nuevas reutilizables: `Textarea` y `FormActions` en `components/ui/` (Almacén migrado a
`FormActions`), `useAccion` en `src/lib/use-accion.ts`, `formatFechaHora` en `lib/format.ts`
(zona fija Europe/Madrid para que servidor y navegador coincidan al hidratar).

Gotchas de esta sesión:

- **Con RLS, un `UPDATE`/`DELETE` sin permiso no da error: afecta a 0 filas.** Las acciones de
  Proyectos encadenan `.select("id")` y tratan "0 filas" como error de permisos; sin eso la UI
  diría "guardado" sin haber guardado nada. Aplicarlo a toda escritura futura.
- **No usar `upsert` de PostgREST con `GRANT UPDATE` por columnas**: su `ON CONFLICT DO UPDATE`
  intenta escribir todas las columnas del payload (incluida la clave) y falla por permisos. Por
  eso "dar acceso" (INSERT) y "cambiar permiso" (UPDATE) son acciones separadas.
- **Recursión de RLS entre `proyectos` y `proyecto_miembros`** (cada una consulta a la otra): se
  evita con funciones `SECURITY DEFINER` (`permiso_proyecto` y compañía), como `es_admin()`.
- **`supabase.rpc()` sin tipos generados** infiere un array: para una función que devuelve una
  fila usar `.single<T>()`.
- Un heredoc de bash con `<<'EOF'` dentro de un comando con rutas `(app)/[id]` falló en esta
  máquina; para ficheros nuevos usar la herramienta Write.

**Sin probar aún — falta un segundo usuario NO admin.** `Vuittest` es admin y ve/edita todo, así
que "solo ver" y "sin acceso" no se han podido ejercitar de verdad (solo por lectura de las
políticas). Al dar de alta otro miembro de prueba con `rol = 'miembro'`, comprobar: con `ver`
no aparecen los botones de edición y una escritura directa devuelve 403; sin acceso el proyecto
da 404; `editar` puede tareas y comentarios pero no ve "Ajustes".

---

## Sesión 2026-09-19: sistema de diseño aplicado a toda la app

Se implementó [garito-sistema-diseno.md](garito-sistema-diseno.md) completo, como pide su §10,
**antes** de la Fase 3. Sin cambios de esquema ni de lógica de negocio: solo capa visual.

- Tokens en `globals.css` (`:root` con los valores + `@theme` que los expone a Tailwind).
  Tipografía Archivo / Archivo Black vía `next/font`. Dependencia nueva: `lucide-react`.
- `src/components/ui/`: los 8 componentes de §5 más `Field/Input/Select/FormError`,
  `BottomSheet/ConfirmSheet` y `CardList`. Catálogo y reglas en su `README.md`.
- Navegación: la cabecera con pestañas se sustituyó por `AppBar` + `SideDrawer`
  (Inicio · Finanzas · Almacén · Proyectos · Galería). "Salir" y el alias del
  usuario viven ahora al pie/cabecera del menú lateral.
- Almacén rehecho con los componentes: cada producto es una `ListCard` con botones
  "Editar cantidad" / "Ver historial" (y "Editar producto" para admin) en su propia fila.
  Login, Inicio y las secciones "próximamente" también migrados. Validado a 375 px.

Decisiones tomadas que la especificación no cerraba (revisables):

1. **La `SummaryPill` de Almacén filtra**: al pulsarla muestra solo los productos bajo mínimos
   (segundo toque, todos). El diseño solo dice "pulsable entera".
2. **Las filas de Almacén no llevan chevron ni navegan**: no hay pantalla de detalle de
   producto. Cuando exista (o en Finanzas), pasar `href` a `ListCard` lo activa.
3. **Los formularios siguen en línea dentro de la tarjeta** (`panel`), no en hoja inferior:
   con teclado móvil una hoja fija puede quedar tapada. Las **confirmaciones** (borrar producto,
   aviso de nombre duplicado) sí usan `ConfirmSheet`, sustituyendo a `window.confirm`.
4. **"Editar producto"** sustituye al botón "Admin" y agrupa edición + borrado.
5. **Inicio** muestra solo la marca "Garito" hasta que llegue la imagen del acabado visual.
7. **Contraste por bloques** (petición del propietario, mismo día): fondo de página gris
   (`--bg` `#EFF1F2`), tarjetas blancas con `--shadow-card`, `--surface-sunk` más oscuro que el
   fondo y `--ink-2`/`--line` ligeramente más oscuros. Sustituye a "casi sin sombra" de §4 del
   documento de diseño (ya actualizado). No volver a "borde sin sombra" sin preguntar.
6. `AppBar` es `sticky` (para no perder la hamburguesa al hacer scroll): no estaba especificado.

Gotchas de esta sesión:

- **Tailwind v4 no lee `tailwind.config`**: el tema va en `@theme` dentro de `globals.css`.
  Se resetean las familias (`--color-*: initial`, etc.) para que las clases crudas no compilen.
- **No poner dos utilidades de padding solapadas** (`pb-10 pb-safe`, `py-10 pt-safe`): gana la
  que Tailwind emita última, no la última escrita. Separar en contenedores anidados.
- El linter de React (compiler) prohíbe leer `ref.current` en render, incluso dentro de
  closures devueltas por un hook; `useEnvioConfirmado` guarda el `FormData` en estado en vez de
  usar `requestSubmit()` + ref.
- `<dialog>` nativo: la tecla Escape *sintética* (herramientas de test) no lo cierra; la real sí.

## Sesión 2026-09-18: Fase 2 — Almacén (completada)

Se completó y validó en local (con el usuario de prueba y un segundo usuario `miembro`
creado para probar permisos) la **Fase 2 — Almacén**. Resumen ejecutivo:

- Migraciones nuevas en `supabase/migrations/`: `20260918090000_almacen.sql` (tablas
  `productos`/`stock_log`, RLS, función `actualizar_stock()`, vista `v_stock_bajo`),
  `20260918100000_almacen_quitar_unidad.sql` (quita la columna `unidad`, recrea la vista
  con su `GRANT`). Ambas ya están aplicadas a mano en el SQL Editor de Supabase por el
  propietario del proyecto (seguimos sin CLI de Supabase en este entorno).
- Pantalla `/almacen` funcionando de punta a punta: listado con indicador verde/rojo,
  resumen "N productos bajo mínimos" con esos productos subidos arriba de la lista,
  edición de cantidad por cualquier miembro con motivo + nota, alta/edición/borrado de
  producto solo admin (con confirmación al borrar), aviso de posible duplicado al
  crear/renombrar, e historial de cambios ("Ver historial", últimas 20 entradas)
  visible por cualquier miembro.
- Probado desde dos perspectivas: admin (`Vuittest`) y un segundo usuario de prueba con
  `rol = 'miembro'` creado ex profeso para verificar que no ve los controles de admin y
  que sí puede editar cantidad. Validado a 375px.

### Decisiones de la sesión 2026-09-18 (no estaban en el diseño original)

1. **Se descarta el campo `unidad` de `productos`.** Estaba en el modelo de datos
   original (§5) pero se decidió en esa sesión que no aportaba valor suficiente.
   Ya actualizado en `garito-diseno-funcional-tecnico.md` §4.2 y §5.
2. **Aviso de posible duplicado por mayúsculas/plural**, no exigido por el diseño
   original: al crear o renombrar un producto se normaliza el nombre (minúsculas, sin
   acentos, sin "s" final) y si coincide con uno existente se pide confirmación antes de
   guardar. Es un aviso, no un bloqueo — se puede confirmar y crear igual. Implementado
   solo en cliente (heurística simple, sin `CHECK`/índice en BBDD): es adrede, para no
   bloquear casos legítimos (p. ej. "Vasos" de cristal vs. "Vaso" de plástico).
3. **La actualización de `cantidad_actual` va exclusivamente por la función
   `actualizar_stock()`** (RPC, `SECURITY DEFINER`), no por `UPDATE` directo de cliente:
   en la misma sentencia actualiza el producto e inserta el `stock_log`, evitando que el
   histórico pueda desincronizarse del valor real si un segundo paso fallara. La política
   RLS de `UPDATE` de `productos` es solo-admin (cubre nombre/categoría/umbral/orden); la
   función es el único camino para que un miembro no-admin cambie la cantidad.

### Gotchas de la sesión 2026-09-18 (para no repetirlos)

- **El `GRANT` explícito también hace falta en las vistas, no solo en las tablas.**
  Repetición del gotcha de la Fase 1: `v_stock_bajo` se creó sin
  `grant select ... to authenticated;` y PostgREST devolvía "permission denied". La
  diferencia importante: el fallo fue **silencioso**, porque el código no comprobaba el
  `error` de esa consulta, así que la app interpretó "0 filas por error de permisos" como
  "ningún producto bajo mínimo" — **todos** los productos aparecían en verde, no solo el
  que se estaba probando. Ya corregido (la página ahora hace `console.error` de cualquier
  error de lectura) y documentado en `CLAUDE.md` regla 2 y en `pendientes-produccion.md`.
  **Lección general: toda consulta de solo lectura debe comprobar su `error`, aunque
  parezca inofensiva.**
- **Una vista `select *` sobre una tabla depende de todas sus columnas.** Para quitar
  `productos.unidad` hubo que hacer `DROP VIEW v_stock_bajo` antes del `ALTER TABLE ...
  DROP COLUMN`, y recrearla después. Si se vuelve a tocar el esquema de `productos`,
  revisar si `v_stock_bajo` necesita el mismo tratamiento.
- **Los campos `numeric` de Postgres llegan como `number` de JS**, no como `string`, a
  través de PostgREST/supabase-js (a diferencia de otros drivers de Postgres). No hace
  falta parsear `cantidad_actual`/`umbral_minimo` a mano. Si en Finanzas (Fases 5-6) se ve
  algo distinto con importes grandes o muchos decimales, revisar esta asunción antes de
  asumir que es un bug.

## Sesión 2026-09-17: Fases 0 y 1 (completadas)

Hecho: proyecto Next.js (App Router, TypeScript estricto) + Tailwind en GitHub y Vercel, cliente
Supabase con `@supabase/ssr`, login por email y contraseña con server actions,
`src/proxy.ts` que protege todas las rutas salvo `/login`, tabla `miembros` con RLS
(`20260917120000_miembros.sql`) y layout con navegación. Verificado en local y en producción.

Decisiones que el diseño no cerraba (no hace falta volver a preguntarlas):

1. **Login con email y contraseña**, no magic link. El admin crea cada usuario en el dashboard de
   Supabase (Authentication → Users → Add user, con "Auto Confirm User") y pasa la contraseña
   provisional por otro canal.
2. **Alta de miembros manual por el panel de Supabase**, sin pantalla de invitación en la app
   ([alta-miembros.md](alta-miembros.md)). Con 25 personas fijas no se justifica más.
3. **Un solo proyecto Supabase y una sola rama (`main`)** por ahora, sin separar Preview y
   Production. Se reconsidera antes de invitar a los 25 (`pendientes-produccion.md`).
4. **Variables de entorno de Vercel en "All Environments"**, para que ningún despliegue reviente
   por variables que solo estaban en un scope.

Gotchas:

- **Toda tabla nueva necesita `GRANT` explícito además de RLS**: crearla por SQL Editor no
  concede privilegios a `authenticated` y Postgres da "permission denied" antes de evaluar las
  políticas. Reglas completas en `CLAUDE.md` (regla 2).
- **El middleware va en `src/proxy.ts`** (el proyecto usa `src/`) y, en Next.js 16, la función
  exportada se llama `proxy`, no `middleware`. El helper de sesión está en
  `src/lib/supabase/middleware.ts`.
- **Cambiar variables de entorno en Vercel no reconstruye** los despliegues existentes: hace falta
  un "Redeploy". Un 500 en producción con el mismo código que funciona en local es casi siempre eso.
- Cambios de layout: validar siempre a 375 px. La primera cabecera con pestañas desbordaba y dejaba
  fuera el alias y "Salir"; de ahí salió la barra superior actual.

---

## Cómo levantar el entorno local

```bash
npm install
npm run dev      # http://localhost:3000
```

Las variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) viven en
`.env.local` (no está en git; plantilla en `.env.example`). Si no existe, pide los valores
al propietario del proyecto — están en el dashboard de Supabase → Project Settings → API.

Para previsualizar en el navegador desde Claude Code hay un `.claude/launch.json` con la
configuración `garito-dev` (npm run dev, puerto 3000).

## Fase 5 — Finanzas (apuntes): alcance y resumen operativo

Finanzas se aplazó al final porque depende de datos de muestra que aún no han llegado (extracto
bancario y saldos iniciales, ver `pendientes-produccion.md`). La nota de alcance se redactó
cuando Finanzas era la Fase 3 y sigue vigente.

**Alcance de la Fase 5 (apuntes, devengo, saldos y extracto), no de la 6**: no incluye
importación bancaria ni conciliación (eso es la Fase 6, bloqueada además por falta de una
muestra real de extracto — ver `pendientes-produccion.md`). En esta fase los abonos se
introducen a mano (vía apuntes de tipo `ajuste`, o una pantalla simple de alta manual de
abono) para poder probar el modelo de saldo con datos ficticios.

Lee §4.1, §4.1.1, §4.1.2 y §4.1.3 completos antes de escribir código — es la parte más
matizada del diseño. Resumen operativo:

- Migraciones: `configuracion` (fila única, `CHECK (id = 1)`, cuota 20€/mes y día de
  devengo 5 por defecto, editable solo admin), `apuntes` (libro mayor, con todos los
  `CHECK` de signo/periodo del §5 — **inmutables salvo el campo `anulado`**), `operaciones`
  (lotes reversibles: de momento solo tipo `devengo` y `saldo_inicial`; `importacion` se
  activa en la Fase 6). RLS + GRANT desde el primer paso, como siempre.
- Vistas derivadas (nunca guardar el saldo): `v_saldo_miembro`, `v_extracto_miembro` (con
  `SUM() OVER (PARTITION BY miembro_id ORDER BY ...)`). **Ojo con la trampa del §5: el
  saldo suma TODOS los apuntes, incluidos los anulados** — el contraapunte ya compensa al
  original; filtrar `WHERE anulado = false` duplicaría la corrección y dejaría a alguien
  con saldo a favor que nunca pagó.
- Pantalla de saldos/morosos: listado de miembros con su saldo (deudor/al corriente/
  adelantado) y meses adeudados o adelantados (saldo ÷ cuota).
- Botón "lanzar devengo del mes" (admin): genera un cargo por cada miembro activo, agrupado
  en una fila de `operaciones` tipo `devengo`. Debe ser idempotente (unicidad parcial sobre
  `(miembro_id, periodo)` ya especificada en §5) y **reversible por lote desde esta misma
  fase** (el guardarraíl 8 no es solo para la importación): revertir genera un
  contraapunte por cada cargo del lote, marca `anulado = true` y la operación como
  `anulada`, todo en una transacción atómica. Ver §4.1.3 para el procedimiento exacto.
- Carga de saldos iniciales: **bloqueada para producción** hasta que el propietario del
  proyecto entregue los 25 saldos reales (`pendientes-produccion.md`), pero el desarrollo
  y las pruebas de esta fase pueden avanzar con datos ficticios sin esperar a eso.
- Extracto por miembro: cronológico, con saldo acumulado, apuntes anulados visualmente
  atenuados pero presentes.
- Validar cada pantalla a 375px antes de darla por buena (guardarraíl 10).
- Lecciones de fases anteriores que aplican aquí: toda vista lleva `with (security_invoker = true)`
  y su `GRANT`; toda consulta de lectura comprueba su `error`; toda escritura encadena
  `.select("id")` y trata "0 filas" como error de permisos; las operaciones que tocan varias
  tablas van en una función `SECURITY DEFINER` (patrón `actualizar_stock()` y `crear_proyecto()`).
  Importes: se formatean con `Intl` es-ES / EUR y `tabular-nums` (reglas de diseño de `CLAUDE.md`).
