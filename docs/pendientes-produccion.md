# Pendientes para el paso a Producción

Documento vivo. Se actualiza al cerrar cada fase de desarrollo. Los items no se borran:
se marcan como resueltos (`[x]`) con la fecha en que se resolvieron. Mientras este documento
tenga bloqueantes sin marcar, **no se pasa a producción**.

Contexto: todo el desarrollo (esta fase y las siguientes) corre contra el entorno **Preview**
de Vercel y el proyecto Supabase actual, con datos y usuarios sintéticos/de prueba. El paso a
producción es un evento explícito y posterior, no algo que ocurra fase a fase.

---

## Bloqueantes de negocio (dependen del propietario del proyecto)

- [ ] Saldos iniciales de los 25 miembros — ver [§4.1.1](garito-diseno-funcional-tecnico.md).
      Bloquea poner **Finanzas** en producción (no su desarrollo, que usa datos ficticios).
- [ ] Muestra real de un extracto bancario del Garito + decisión sobre el identificador único
      de transacción (referencia propia del banco vs. hash compuesto) — ver §4.1 y §9.
      Bloquea implementar bien la **Fase 7** (importación bancaria).
- [ ] Nombre exacto del titular bancario de cada miembro, para precargar `alias_bancarios`
      y reducir conciliación manual en los primeros meses reales.
- [ ] Cargos concretos del organigrama (Fase 5, decorativo, no bloqueante funcional).

## Infraestructura / entorno

- [ ] **Decidir si Producción usa el mismo proyecto Supabase actual** (limpiando los datos y
      usuarios de prueba) **o un proyecto Supabase nuevo, separado del de Preview.**
      Recomendación: proyecto separado — evita el riesgo de arrastrar usuarios/datos de prueba
      a un entorno con dinero real, y permite seguir probando cosas en Preview sin tocar
      producción después del lanzamiento.
- [ ] Variables de entorno de **Production** en Vercel (distintas de las de **Preview**), una
      vez tomada la decisión anterior.
- [ ] Confirmar si se usa un dominio propio en Vercel para producción o el `*.vercel.app` actual.
- [ ] Revisar que ninguna política RLS quedó abierta "temporalmente" durante el desarrollo
      (repasar cada tabla contra §5 del diseño antes de abrir producción).
- [ ] Dar de alta a los 25 miembros reales (frente al grupo de ~5 de prueba de la Fase 1).
- [ ] Purgar usuarios y datos de prueba del entorno que finalmente se use como producción.
- [ ] Exportar/guardar en algún sitio fuera de la app la contraseña de base de datos de Supabase
      de producción (la del propietario del proyecto, nunca compartida con el asistente).

## Deuda técnica asumida conscientemente (documentada en el diseño, no son bugs)

- Altas y bajas de miembros: sin prorrateo ni devengo parcial (§4.1.1).
- Borrado de productos: sin campo `archivado`, histórico de `stock_log` se borra en cascada (§4.2).
- Concurrencia en Almacén: gana el último en guardar, sin bloqueos (§4.2).

## Por fase

### Fase 0 — Proyecto base
- Completada. Sin deuda pendiente.

### Fase 1 — Auth, tabla `miembros`, roles, layout y navegación
- Completada: login email+contraseña, tabla `miembros` + RLS, layout con nav validado a 375px.
- Alta manual vía panel de Supabase (ver [docs/alta-miembros.md](alta-miembros.md)); de momento
  solo el grupo de prueba (~5), no los 25 reales — pendiente en la lista de infraestructura arriba.
- **Lección aprendida, aplicable a toda tabla futura:** crear una tabla por SQL Editor no
  concede privilegios al rol `authenticated` automáticamente (a diferencia del Table Editor).
  Sin `GRANT ... ON <tabla> TO authenticated;` las políticas RLS nunca llegan a evaluarse:
  Postgres devuelve `permission denied for table` antes de mirar las políticas. Toda migración
  nueva debe incluir el `GRANT` explícito junto con `ENABLE ROW LEVEL SECURITY` y sus políticas,
  en el mismo paso.

### Fase 2 — Almacén
- Completada: tablas `productos` y `stock_log` con RLS, función `actualizar_stock()` (RPC,
  SECURITY DEFINER) que actualiza la cantidad e inserta el `stock_log` en una sola sentencia
  atómica, vista `v_stock_bajo`, listado con indicador verde/rojo (los productos bajo mínimo
  suben arriba), alta/edición/borrado de producto solo admin, aviso de posible duplicado por
  mayúsculas/plural al crear o renombrar, e historial de cambios visible por cualquier miembro.
- Se descartó el campo `unidad` de `productos` (decisión tomada en esta fase, ver §4.2 y §5).
- **La misma lección de la Fase 1 se repitió con una vista:** `v_stock_bajo` tampoco tenía
  `GRANT` explícito. La diferencia con una tabla es que el fallo fue **silencioso** — el error
  de PostgREST no se comprobaba en el código, así que la app interpretó "0 filas por permission
  denied" como "ningún producto bajo mínimo", y todos los productos aparecían en verde aunque
  no lo estuvieran. Doble lección: el `GRANT` aplica también a vistas, y **toda consulta debe
  comprobar su `error`**, aunque sea de solo lectura, para que un fallo así no quede oculto.

### Fase 3 — Proyectos
- Implementada: tablas `proyectos`, `proyecto_miembros`, `tareas` y `comentarios` con RLS
  (migración `20260920100000_proyectos.sql`), permisos heredados por subproyectos resueltos en
  la base de datos, alta de proyectos solo por la función `crear_proyecto()`.
- [x] Migración aplicada en el SQL Editor y validada (2026-09-20), incluidos ataques directos a la
      API con un usuario no admin. Ver handoff.
- [ ] Probar los niveles `ver` y "sin acceso" con un segundo usuario **no admin** (el único
      disponible hasta ahora, `Vuittest`, es admin y lo ve todo).
- **Repasar antes de producción** (ya listado arriba, aquí con lo específico): las políticas de
  esta fase usan cinco funciones `SECURITY DEFINER` (`proyecto_raiz_id`, `creador_proyecto_id`,
  `permiso_proyecto`, `puede_gestionar_proyecto`, `crear_proyecto`). Comprobar que ninguna
  expone más de lo previsto y que `crear_proyecto` no es ejecutable por `anon`.
