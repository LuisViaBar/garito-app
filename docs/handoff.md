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

## Última sesión de trabajo (2026-09-17)

Se completaron y verificaron en producción las **Fases 0 y 1**. Resumen ejecutivo:

- Repo: [github.com/LuisViaBar/garito-app](https://github.com/LuisViaBar/garito-app), rama
  `main` únicamente (sin `develop` ni ramas de feature todavía — ver decisión más abajo).
- Desplegado en Vercel: [garito-app.vercel.app](https://garito-app.vercel.app). Cada push a
  `main` se autodespliega ahí (es el slot "Production" de Vercel).
- Supabase: proyecto único (`aagltznsialwvwcnlunr`), usado tanto para desarrollo como para
  lo que Vercel llama "Production" — ver decisión sobre entornos más abajo.
- Login por email + contraseña funcionando de punta a punta, tabla `miembros` con RLS.
- Solo hay **un usuario de prueba dado de alta**: alias `Vuittest`, rol `admin`, email
  `luisviabar+pruebagaritapp@gmail.com`. La contraseña la tiene el propietario del proyecto,
  no está escrita en ningún fichero del repo (a propósito). Para dar de alta a los ~4
  restantes del grupo de prueba, sigue [alta-miembros.md](alta-miembros.md).

## Decisiones tomadas esta sesión (no estaban en el diseño original)

El diseño funcional no fijaba estos puntos; se decidieron durante la Fase 1 y **no hace
falta volver a preguntarlos**:

1. **Login: email + contraseña** (no magic link). El admin crea cada usuario manualmente
   desde el dashboard de Supabase (Authentication → Users → Add user, con "Auto Confirm
   User" marcado) y le pasa la contraseña provisional por otro canal.
2. **Alta de miembros: manual, vía panel de Supabase**, no hay pantalla de invitación en la
   app (podría añadirse en una fase futura si el grupo crece o rota mucho; con 25 personas
   fijas no se justifica ahora). Ver [alta-miembros.md](alta-miembros.md).
3. **Un solo proyecto Supabase y una sola rama (`main`) por ahora**, sin separación
   Preview/Production a nivel de infraestructura. Se decidió conscientemente no montar esa
   separación todavía (grupo de prueba pequeño y de confianza, sin dinero real circulando).
   **Para la próxima fase de trabajo grande (o antes de invitar a los 25 reales) se
   reconsiderará** — queda anotado en
   [pendientes-produccion.md](pendientes-produccion.md#infraestructura--entorno).
4. **Variables de entorno de Vercel en el scope "All Environments"**, no solo Production,
   para evitar que un despliegue reviente por variables que solo estaban en un scope.

## Gotchas técnicos descubiertos esta sesión (para no repetirlos)

- **Toda tabla nueva necesita `GRANT` explícito además de RLS.** Crear una tabla por SQL
  Editor no concede privilegios a `authenticated` (el Table Editor sí lo hace solo). Sin
  `grant select, insert, update, delete on <tabla> to authenticated;`, Postgres devuelve
  "permission denied" **antes** de evaluar las políticas RLS. Ya está aplicado en la
  migración de `miembros`; replicarlo en cada migración nueva (Fase 2: `productos` y
  `stock_log`).
- **El proyecto usa `src/`, así que el fichero de middleware va en `src/proxy.ts`**, no en
  la raíz. Además, esta versión de Next.js (16.3.5) renombró la convención de `middleware.ts`
  a `proxy.ts` (función exportada `proxy`, no `middleware`). El helper de sesión de Supabase
  sigue en `src/lib/supabase/middleware.ts` (nombre descriptivo, no es el fichero de
  convención de Next).
- Cambiar variables de entorno en el dashboard de Vercel **no reconstruye** los despliegues
  ya hechos — hace falta un "Redeploy" explícito para que el build recoja los valores nuevos.
- En este entorno de desarrollo (Windows) no hay `gh` ni `vercel` CLI instalados, ni sesión
  de `git` configurada por defecto (usuario/email locales, ya configurados en este repo).
  Todo el trabajo con GitHub/Vercel se hace por dashboard web.

## Cómo levantar el entorno local

```bash
npm install
npm run dev      # http://localhost:3000
```

Las variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) viven en
`.env.local` (no está en git; plantilla en `.env.example`). Si no existe, pide los valores
al propietario del proyecto — están en el dashboard de Supabase → Project Settings → API.

## Qué toca ahora: Fase 2 — Almacén

Según §8 del diseño, es la siguiente fase y la recomendada para empezar por ser la más
simple. Alcance completo en §4.2 y el modelo de datos (`productos`, `stock_log`) en §5 del
documento de diseño — léelo antes de escribir código, aquí solo el resumen operativo:

- Migración `productos` + `stock_log` con RLS **y sus GRANT** (ver gotcha arriba):
  - `productos`: lectura para cualquier autenticado; alta/borrado de productos y fijar
    umbrales solo admin; **la cantidad la puede editar cualquier miembro**.
  - `stock_log`: inserción por cualquier autenticado (se genera al editar cantidad);
    inmutable después (sin UPDATE/DELETE individual, ver §4.2 — solo se borra en cascada
    si se borra el producto).
- Vista derivada `v_stock_bajo` (productos por debajo de `umbral_minimo`) — no calcular
  esto en el cliente, es una vista de Postgres (guardarraíl 6 de `CLAUDE.md`).
- Pantalla de listado con indicador visual verde/rojo por umbral y resumen tipo
  "3 productos bajo mínimos" arriba.
- Edición de cantidad: cualquier miembro, con motivo obligatorio
  (`reposicion`/`consumo`/`recuento`/`correccion`) — genera la fila de `stock_log`.
- Sin control de concurrencia (gana el último en guardar, es deuda técnica asumida, no
  hay que resolverla).
- Validar la pantalla a 375px antes de darla por buena (guardarraíl 10).

No es necesario tocar nada de Finanzas ni Proyectos en esta fase — son las Fases 3–5.
