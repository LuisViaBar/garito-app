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

---

## Sesión 2026-09-19: sistema de diseño aplicado a toda la app

Se implementó [garito-sistema-diseno.md](garito-sistema-diseno.md) completo, como pide su §10,
**antes** de la Fase 3. Sin cambios de esquema ni de lógica de negocio: solo capa visual.

- Tokens en `globals.css` (`:root` con los valores + `@theme` que los expone a Tailwind).
  Tipografía Archivo / Archivo Black vía `next/font`. Dependencia nueva: `lucide-react`.
- `src/components/ui/`: los 8 componentes de §5 más `Field/Input/Select/FormError`,
  `BottomSheet/ConfirmSheet` y `CardList`. Catálogo y reglas en su `README.md`.
- Navegación: la cabecera con pestañas se sustituyó por `AppBar` + `SideDrawer`
  (Inicio · Finanzas · Almacén · Proyectos · Organigrama · Galería). "Salir" y el alias del
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

## Sesión anterior (2026-09-18)

Se completó y validó en local (con el usuario de prueba y un segundo usuario `miembro`
creado para probar permisos) la **Fase 2 — Almacén**. Resumen ejecutivo:

- Migraciones nuevas en `supabase/migrations/`: `20260918090000_almacen.sql` (tablas
  `productos`/`stock_log`, RLS, función `actualizar_stock()`, vista `v_stock_bajo`),
  `20260918100000_almacen_quitar_unidad.sql` (quita la columna `unidad`, recrea la vista
  con su `GRANT`). Las tres ya están aplicadas a mano en el SQL Editor de Supabase por el
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

## Decisiones tomadas esta sesión (no estaban en el diseño original)

1. **Se descarta el campo `unidad` de `productos`.** Estaba en el modelo de datos
   original (§5) pero se decidió en esta sesión que no aportaba valor suficiente.
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

## Gotchas técnicos descubiertos esta sesión (para no repetirlos)

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
  falta parsear `cantidad_actual`/`umbral_minimo` a mano. Si en Finanzas (Fase 3) se ve
  algo distinto con importes grandes o muchos decimales, revisar esta asunción antes de
  asumir que es un bug.

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

## Qué toca ahora: Fase 3 — Finanzas (apuntes, devengo, saldos y extracto)

Según §8 del diseño, la siguiente fase. **Alcance de la Fase 3, no de la 4**: no incluye
importación bancaria ni conciliación (eso es la Fase 4, bloqueada además por falta de una
muestra real de extracto — ver `pendientes-produccion.md`). En esta fase los abonos se
introducen a mano (vía apuntes de tipo `ajuste`, o una pantalla simple de alta manual de
abono) para poder probar el modelo de saldo con datos ficticios.

Lee §4.1, §4.1.1, §4.1.2 y §4.1.3 completos antes de escribir código — es la parte más
matizada del diseño. Resumen operativo:

- Migraciones: `configuracion` (fila única, `CHECK (id = 1)`, cuota 20€/mes y día de
  devengo 5 por defecto, editable solo admin), `apuntes` (libro mayor, con todos los
  `CHECK` de signo/periodo del §5 — **inmutables salvo el campo `anulado`**), `operaciones`
  (lotes reversibles: de momento solo tipo `devengo` y `saldo_inicial`; `importacion` se
  activa en la Fase 4). RLS + GRANT desde el primer paso, como siempre.
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
  fase** (guardarraíl 8 de `CLAUDE.md` no es solo para la Fase 4): revertir genera un
  contraapunte por cada cargo del lote, marca `anulado = true` y la operación como
  `anulada`, todo en una transacción atómica. Ver §4.1.3 para el procedimiento exacto.
- Carga de saldos iniciales: **bloqueada para producción** hasta que el propietario del
  proyecto entregue los 25 saldos reales (`pendientes-produccion.md`), pero el desarrollo
  y las pruebas de esta fase pueden avanzar con datos ficticios sin esperar a eso.
- Extracto por miembro: cronológico, con saldo acumulado, apuntes anulados visualmente
  atenuados pero presentes.
- Validar cada pantalla a 375px antes de darla por buena (guardarraíl 10).

No hace falta tocar Almacén, Proyectos, Galería ni Organigrama en esta fase.
