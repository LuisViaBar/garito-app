@AGENTS.md

# Garito — guía para Claude Code

Aplicación de gestión del local compartido "Garito". El diseño funcional y técnico completo
vive en [docs/garito-diseno-funcional-tecnico.md](docs/garito-diseno-funcional-tecnico.md) —
léelo antes de tocar nada de Finanzas, Almacén o Proyectos, es la fuente de verdad y su
modelo de datos (§5) está **cerrado**: no reinterpretar nombres de campo ni restricciones.

También hay un manual de uso para el tesorero en
[docs/garitApp-manual-tesorero.md](docs/garitApp-manual-tesorero.md).

**Antes de empezar a trabajar, lee [docs/handoff.md](docs/handoff.md).** Es el documento de
traspaso entre sesiones: qué se hizo en la última sesión, decisiones tomadas que no estaban
en el diseño original, gotchas técnicos ya resueltos (para no repetirlos) y qué toca ahora
en detalle. Se actualiza al cerrar cada sesión de trabajo.

## Stack

- Next.js (App Router) + React + TypeScript en modo estricto
- Tailwind CSS
- Supabase (Postgres + Auth + Storage), con Row Level Security desde el primer momento
- Despliegue en Vercel, integración automática con GitHub

## Estado del proyecto

- **Fase 0: completada.** Proyecto Next.js + Tailwind en GitHub
  ([LuisViaBar/garito-app](https://github.com/LuisViaBar/garito-app)), desplegado en Vercel
  ([garito-app.vercel.app](https://garito-app.vercel.app)), con cliente Supabase conectado.
- **Fase 1: completada.** Login por email+contraseña (`@supabase/ssr`, server actions),
  tabla `miembros` con RLS (`supabase/migrations/20260917120000_miembros.sql`), layout con
  navegación validado a 375px. Alta de miembros manual vía panel de Supabase, ver
  [docs/alta-miembros.md](docs/alta-miembros.md). Solo dado de alta el grupo de prueba (~5);
  los 25 reales quedan para el paso a producción (ver
  [docs/pendientes-produccion.md](docs/pendientes-produccion.md)).
- **Fase 2: completada.** Almacén: tablas `productos` y `stock_log` con RLS
  (`supabase/migrations/20260918*.sql`), función `actualizar_stock()` (RPC, SECURITY DEFINER)
  para que cualquier miembro cambie la cantidad dejando registro en `stock_log` de forma
  atómica, vista `v_stock_bajo`, listado con indicador verde/rojo y resumen, alta/edición/
  borrado de productos solo admin, aviso de posible duplicado por mayúsculas/plural al
  crear o renombrar, e historial de cambios consultable por cualquier miembro.
- **Sistema de diseño: implementado** (2026-09-19), previo a la Fase 3. Tokens en
  `src/app/globals.css`, componentes en `src/components/ui/` (ver su README), navegación
  con `AppBar` + `SideDrawer`, Almacén rehecho con ellos. Especificación en
  [docs/garito-sistema-diseno.md](docs/garito-sistema-diseno.md); el acabado visual
  (ilustraciones, microcopy) va al final, en [docs/garito-acabado-visual.md](docs/garito-acabado-visual.md).
- **Fase 3: Proyectos — completada** (2026-09-20). Migración
  `supabase/migrations/20260920100000_proyectos.sql` (`proyectos`, `proyecto_miembros`, `tareas`,
  `comentarios`, RLS con permisos heredados por subproyectos, creación solo por
  `crear_proyecto()`), listado en `/proyectos` y detalle en `/proyectos/[id]` (subproyectos en
  `/proyectos/[id]/[subId]`). Migración aplicada a mano en el SQL Editor.
- **Cambio de orden (2026-09-20):** Finanzas pasa al final porque depende de datos de muestra
  (extracto bancario, saldos iniciales) que aún no han llegado. Fases siguientes en orden:
  4 Galería, 5 Organigrama, 6 Finanzas (apuntes/devengo/saldos), 7 Finanzas (importación
  bancaria), 8 PWA. Ver §8 del documento de diseño para el detalle de cada entregable.

## Reglas de proceso (resumen — el detalle está en §7 del documento de diseño)

1. Trabajar fase por fase; no adelantar funcionalidad de fases futuras.
2. RLS se crea en el mismo paso en que se crea cada tabla, nunca "al final". **Incluye
   siempre el `GRANT` explícito a `authenticated`** (`grant select, insert, update, delete
   on <tabla> to authenticated;`): crear la tabla por SQL Editor no concede privilegios
   automáticamente como sí hace el Table Editor, y sin ese GRANT las políticas RLS no llegan
   a evaluarse (Postgres da "permission denied" antes). **Esto también aplica a las vistas**
   (`grant select on <vista> to authenticated;`): se repitió el mismo error en la Fase 2 con
   `v_stock_bajo` y el fallo fue silencioso (la app trataba la consulta fallida como "sin
   resultados" en vez de mostrar el error). Aprendido en la Fase 1, repetido en la Fase 2, ver
   [docs/pendientes-produccion.md](docs/pendientes-produccion.md).
3. Todo cambio de esquema es una migración versionada en `supabase/migrations/`, nunca a mano
   en el panel de Supabase.
4. Austeridad con dependencias: no instalar una librería para algo resoluble en poco código.
5. Nada de datos derivados almacenados (saldos, totales, contadores) — se calculan con vistas.
6. Toda escritura destructiva o masiva pasa por previsualización + confirmación, y debe ser
   reversible por lote (nunca restaurando backups).
7. Diseño móvil primero: cada pantalla se valida a 375px de ancho antes de darla por buena.

## Diseño — reglas obligatorias

- Los colores, tipografías, espaciados y radios están definidos en `tailwind.config`
  y en las variables CSS de `globals.css`. USAR SIEMPRE LOS TOKENS.
  (Tailwind v4 no tiene `tailwind.config`: los tokens son el bloque `@theme` de `globals.css`,
  que además elimina las clases crudas, así que `text-gray-500` simplemente no compila.)
  Prohibido `text-gray-500`, `bg-red-600`, `rounded-xl` arbitrarios o valores en px sueltos.
- Antes de crear un componente nuevo, comprobar si existe en `components/ui/`.
  Si existe, se usa. Si hace falta uno nuevo, se añade ahí y se documenta.
- Ningún elemento pulsable mide menos de 48x48 px.
- Objetivos pulsables nunca anidados: o navega la fila, o actúan los botones de dentro.
- Todo número usa `tabular-nums`. Todo importe se formatea con Intl es-ES / EUR.
- Color solo con significado: rojo = atención o deuda, verde = correcto o saldo a favor,
  negro = neutro. Nada decorativo lleva color.
- Cada pantalla se valida a 375 px de ancho antes de darse por buena.
- Toda lista tiene su estado vacío.
- Modo oscuro: fuera de alcance en v1, pero no incrustar colores literales que impidan añadirlo.

## Decisiones ya cerradas (no volver a preguntar)

- Día de devengo: el 5 de cada mes, configurable por admin (rango 1–28).
- Importe de la cuota: 20€/mes, configurable por admin.
- Momento cero: el primer día de ejecución en producción; no se reconstruye el histórico anterior.
- Altas y bajas de miembros: fuera del alcance de la app (solo campo `activo`).
- No se almacena IBAN ni ningún dato bancario personal.

## Puntos pendientes que bloquean fases concretas

- Saldos iniciales de los 25 miembros (bloquea poner Finanzas en producción, no su desarrollo).
- Muestra real de extracto bancario y decisión sobre el identificador único de transacción
  (bloquea la fase 7, importación bancaria).

Ver §9 del documento de diseño para el listado completo.
