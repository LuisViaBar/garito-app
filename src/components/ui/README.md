# Componentes de UI

Sistema de diseño de Garito: [docs/garito-sistema-diseno.md](../../../docs/garito-sistema-diseno.md).
Los tokens (color, tipografía, radios, espaciado, sombra) viven en `src/app/globals.css`;
aquí solo hay componentes que los consumen. **Antes de crear uno nuevo, mira si ya existe
aquí. Si hace falta uno nuevo, se añade en esta carpeta y se lista en esta tabla.**

| Componente | Fichero | Uso |
|---|---|---|
| `AppNav` | `app-nav.tsx` | `AppBar` + `SideDrawer` con su estado. Ya montado en `(app)/layout.tsx`; no se usa a mano. |
| `AppBar` | `app-bar.tsx` | Barra superior de 56 px. `onMenu` → hamburguesa (secciones); `backHref` → flecha de volver (detalle). |
| `SideDrawer` | `side-drawer.tsx` | Menú lateral. El orden y los iconos de las secciones se definen en `app-nav.tsx`. |
| `PageHeader` | `page-header.tsx` | Título de sección en Display + hueco `illustration` a la derecha (altura fija). |
| `SummaryPill` | `summary-pill.tsx` | Resumen a ancho completo. Con `count === 0` se vuelve neutro y sin chevron. |
| `ButtonPrimary` | `buttons.tsx` | Acción principal. **Máximo uno por pantalla.** Acepta `href` (enlace) o `onClick`/`type`. |
| `ButtonSecondary` | `buttons.tsx` | Acción secundaria con borde. `tone="danger"` para destructivas. `aria-expanded` la marca como pulsada. |
| `ListCard` / `CardList` | `list-card.tsx` | Tarjeta de lista: fila principal (navega si hay `href`) + fila de `actions` + `panel` desplegable. |
| `EmptyState` | `empty-state.tsx` | Estado vacío de toda lista, con `action` opcional. |
| `Field` / `Input` / `Select` / `FormError` | `field.tsx` | Campos de formulario de 48 px con etiqueta y error. |
| `BottomSheet` / `ConfirmSheet` | `bottom-sheet.tsx` | Hoja inferior modal. `ConfirmSheet`: toda acción destructiva o masiva (cancelar izquierda, confirmar derecha). |

Formato: `formatEUR` y `formatCantidad` en `src/lib/format.ts` (Intl es-ES). Nunca concatenar
importes a mano.

## Reglas de uso que no se ven en el código

- Los colores solo llevan significado (rojo atención/deuda, verde correcto/a favor). Las clases
  crudas de Tailwind (`text-gray-500`, `rounded-xl`…) **no compilan**: el tema las elimina a
  propósito; solo existen los tokens (`text-ink-2`, `border-line`, `rounded-card`, `text-meta`…).
- Un objetivo pulsable nunca contiene a otro. Si la fila navega, los botones van en `actions`.
- Los formularios de una tarjeta se despliegan en `panel`; solo uno abierto a la vez en la lista.
