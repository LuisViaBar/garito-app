@AGENTS.md

# Garito — guía para Claude Code

Aplicación de gestión del local compartido "Garito". El diseño funcional y técnico completo
vive en [docs/garito-diseno-funcional-tecnico.md](docs/garito-diseno-funcional-tecnico.md) —
léelo antes de tocar nada de Finanzas, Almacén o Proyectos, es la fuente de verdad y su
modelo de datos (§5) está **cerrado**: no reinterpretar nombres de campo ni restricciones.

También hay un manual de uso para el tesorero en
[docs/garitApp-manual-tesorero.md](docs/garitApp-manual-tesorero.md).

## Stack

- Next.js (App Router) + React + TypeScript en modo estricto
- Tailwind CSS
- Supabase (Postgres + Auth + Storage), con Row Level Security desde el primer momento
- Despliegue en Vercel, integración automática con GitHub

## Estado del proyecto

- **Fase actual: 0** — proyecto Next.js + Tailwind creado localmente. Pendiente: conectar
  Supabase, subir a GitHub y desplegar en Vercel.
- Fases siguientes en orden: 1 Auth/miembros/roles, 2 Almacén, 3 Finanzas (apuntes/devengo/saldos),
  4 Finanzas (importación bancaria), 5 Proyectos, 6 Galería, 7 Organigrama, 8 PWA.
  Ver §8 del documento de diseño para el detalle de cada entregable.

## Reglas de proceso (resumen — el detalle está en §7 del documento de diseño)

1. Trabajar fase por fase; no adelantar funcionalidad de fases futuras.
2. RLS se crea en el mismo paso en que se crea cada tabla, nunca "al final".
3. Todo cambio de esquema es una migración versionada en `supabase/migrations/`, nunca a mano
   en el panel de Supabase.
4. Austeridad con dependencias: no instalar una librería para algo resoluble en poco código.
5. Nada de datos derivados almacenados (saldos, totales, contadores) — se calculan con vistas.
6. Toda escritura destructiva o masiva pasa por previsualización + confirmación, y debe ser
   reversible por lote (nunca restaurando backups).
7. Diseño móvil primero: cada pantalla se valida a 375px de ancho antes de darla por buena.

## Decisiones ya cerradas (no volver a preguntar)

- Día de devengo: el 5 de cada mes, configurable por admin (rango 1–28).
- Importe de la cuota: 20€/mes, configurable por admin.
- Momento cero: el primer día de ejecución en producción; no se reconstruye el histórico anterior.
- Altas y bajas de miembros: fuera del alcance de la app (solo campo `activo`).
- No se almacena IBAN ni ningún dato bancario personal.

## Puntos pendientes que bloquean fases concretas

- Saldos iniciales de los 25 miembros (bloquea poner Finanzas en producción, no su desarrollo).
- Muestra real de extracto bancario y decisión sobre el identificador único de transacción
  (bloquea la fase 4, importación bancaria).

Ver §9 del documento de diseño para el listado completo.
