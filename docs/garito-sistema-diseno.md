# Garito — Sistema de diseño

**Estado: implementar AHORA, antes de la fase 3.**

Este documento define las decisiones visuales que consume cada pantalla. Son transversales: cambiarlas después obliga a tocar todos los componentes. El acabado visual (ilustraciones, imágenes de cabecera, microcopy) va en un documento aparte y se hace al final.

Referencia visual: captura de la sección Almacén aportada por el propietario. El estilo se replica en **todas** las secciones.

---

## 1. Principios

1. **Blanco, negro y nada más, salvo que el dato lo pida.** El color solo aparece para transmitir estado (rojo = atención, verde = correcto). Si todo lleva color, el color deja de significar algo.
2. **Nada requiere precisión con el dedo.** Objetivo mínimo 48×48 px, separación mínima de 8 px entre elementos pulsables. Ver §6.
3. **Una acción principal por pantalla.** El resto son secundarias y se ven como tales.
4. **Móvil primero, siempre.** Se valida a 375 px de ancho. El escritorio es la misma columna centrada.
5. **Densidad media.** Listas cómodas de leer de un vistazo, sin scroll infinito ni tarjetas gigantes.

---

## 2. Color

Se definen como variables CSS y se exponen en `tailwind.config`. **Nunca usar clases de color crudas de Tailwind** (`text-gray-500`, `bg-red-600`): siempre el token.

```css
:root{
  /* superficie */
  --bg:            #EFF1F2;   /* fondo de página: gris claro (ver nota de contraste) */
  --surface:       #FFFFFF;   /* tarjetas */
  --surface-sunk:  #E6E8EA;   /* rehundido: estados vacíos, fila activa, botón pulsado */

  /* texto */
  --ink:           #111214;   /* principal, titulares y datos */
  --ink-2:         #61676C;   /* secundario: categoría, "mín. 20" */
  --ink-3:         #9BA1A6;   /* terciario: placeholders, hints */
  --ink-invert:    #FFFFFF;   /* sobre fondo negro */

  /* líneas */
  --line:          #DCDFE2;   /* borde de tarjeta y separadores */
  --line-soft:     #F0F1F2;   /* divisores internos */

  /* acción */
  --action:        #111214;   /* botón primario: negro */
  --action-hover:  #2A2D30;

  /* estado — el ÚNICO color con significado */
  --alert:         #E23A2E;   /* bajo mínimos, deuda, error */
  --alert-bg:      #FDECEA;
  --ok:            #1FA855;   /* por encima del umbral, al corriente o a favor */
  --ok-bg:         #E9F7EF;
  --warn:          #E0A117;   /* atención sin urgencia (opcional) */

  /* accesibilidad */
  --focus:         #1741C4;   /* anillo de foco visible en teclado */
}
```

**Semántica obligatoria (no reinterpretar):**

| Contexto | Rojo `--alert` | Verde `--ok` | Neutro `--ink` |
|---|---|---|---|
| Almacén | Por debajo del umbral | Por encima del umbral | — |
| Finanzas | Saldo negativo (debe) | Saldo positivo (adelantado) | Saldo cero (al corriente) |
| Formularios | Error de validación | Confirmación de guardado | — |

> El saldo cero va en **negro**, no en verde. Verde significa "tiene saldo a favor", y estar al corriente no es lo mismo. Si ambos son verdes, la pantalla deja de distinguir dos situaciones distintas.

**Modo oscuro: NO en la v1.** Decisión consciente. Pero los colores se declaran como variables CSS desde el primer día, de forma que añadirlo después sea redefinir un bloque y no revisar cada componente.

---

## 3. Tipografía

Una sola familia, dos pesos de trabajo y uno de titular.

```
Display  → Archivo Black (900)   — títulos de sección ("Almacén")
UI       → Archivo (400/500/600/700)
```

Cargar desde Google Fonts con `display=swap` y una pila de reserva real:
`'Archivo', system-ui, -apple-system, 'Segoe UI', sans-serif`

**Escala (móvil):**

| Uso | Tamaño / interlineado | Peso | Notas |
|---|---|---|---|
| Título de sección | 32 / 1.05 | 900 | Tracking −0.02em |
| Título de pantalla interior | 22 / 1.2 | 700 | |
| Nombre de elemento en lista | 17 / 1.25 | 700 | "Cerveza" |
| Cuerpo | 15 / 1.45 | 400 | |
| Etiqueta / acción secundaria | 14 / 1.35 | 500 | "Editar cantidad" |
| Metadato | 13 / 1.3 | 400 | "Bebida", "mín. 20" |
| Dato numérico | 20 / 1.1 | 700 | Ver regla siguiente |

**Regla no negociable para números:** todo dato numérico (cantidades, importes, saldos) usa `font-variant-numeric: tabular-nums`. Sin eso, las cifras bailan de ancho al cambiar y una lista de saldos se lee fatal. Es una línea de CSS y se nota en cada pantalla de Finanzas.

**Importes:** siempre dos decimales y símbolo detrás, formato español: `20,00 €`. Nunca `€20.00`. Usar `Intl.NumberFormat('es-ES', {style:'currency', currency:'EUR'})`, no concatenación manual.

---

## 4. Espaciado, radios y elevación

**Escala base 4.** Valores permitidos: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64. Nada intermedio.

| Elemento | Valor |
|---|---|
| Margen lateral de pantalla | 16 |
| Separación entre tarjetas de lista | 10 |
| Padding interno de tarjeta | 14 / 16 |
| Separación título ↔ contenido | 20 |
| Separación entre bloques | 24 |

**Radios:**

| Elemento | Radio |
|---|---|
| Tarjeta de lista | 14 |
| Botón, pastilla de resumen | 12 |
| Campo de formulario | 10 |
| Chip, badge | 999 (pastilla) |
| Punto de estado | círculo, 10 px |

**Elevación (revisada 2026-09-19):** las tarjetas y pastillas son **blancas sobre fondo de página gris** (`--bg`), con borde de 1 px `--line` y un toque de sombra (`--shadow-card`: `0 1px 2px rgba(17,18,20,.06), 0 2px 8px rgba(17,18,20,.05)`). El contraste por bloques evita que se confundan con el fondo. Sombra fuerte únicamente en elementos flotantes reales (menú lateral, modal, hoja inferior):
`0 8px 28px rgba(17,18,20,.14)`

> Decisión del propietario tras probar la v1 (fondo blanco + solo borde): los bloques se perdían. Consecuencia: `--ink-2` se oscureció de `#6C7277` a `#61676C` para mantener ≥4,5:1 sobre el gris de página y sobre `--surface-sunk`.

---

## 5. Componentes base

Estos seis se construyen **antes** de seguir con Finanzas. Cualquier pantalla nueva se arma con ellos; si hace falta uno nuevo, se añade al sistema, no se improvisa dentro de la pantalla.

### 5.1 `PageHeader`
Título en Display a la izquierda, espacio reservado a la derecha para la ilustración de la sección (ver documento de acabado visual). Altura fija para que la ilustración no descoloque el contenido al cargar.

### 5.2 `SummaryPill`
Pastilla de ancho completo, fondo blanco, borde `--line`, radio 12, altura 52.
Icono a la izquierda · texto · chevron a la derecha. Pulsable entera.
Uso: "5 productos bajo mínimos", "3 miembros con deuda".
Si el número es 0, cambia a texto neutro sin chevron y sin color.

### 5.3 `ButtonPrimary`
Fondo `--action`, texto `--ink-invert`, radio 12, altura 48, padding lateral 20, peso 600. Icono opcional a la izquierda.
Ancho automático, alineado a la izquierda. **Máximo uno por pantalla.**

### 5.4 `ButtonSecondary`
Fondo transparente, borde 1 px `--line`, texto `--ink`, misma altura 48.
Sustituye a los enlaces subrayados de la captura (ver §6).

### 5.5 `ListCard`
El componente más usado de la app. Estructura:

```
┌───────────────────────────────────────────────┐
│ ● Nombre del elemento              18    ›    │   ← fila principal, pulsable
│   Metadato                      mín. 20       │
├───────────────────────────────────────────────┤
│ [ Acción 1 ]            [ Acción 2 ]          │   ← fila de acciones, 48 px
└───────────────────────────────────────────────┘
```

- Punto de estado 10 px: `--alert` o `--ok`.
- Nombre 17/700, metadato 13/400 `--ink-2`.
- Dato numérico a la derecha, 20/700, tabular.
- Valor de referencia debajo, 13/400 `--ink-2`.
- Chevron `--ink-3`, solo indicativo: **la fila entera es el objetivo pulsable**, no el chevron.
- Fila de acciones separada por divisor `--line-soft`.

### 5.6 `EmptyState`
Fondo `--surface-sunk`, radio 14, texto centrado `--ink-2`, y la acción primaria si procede. Toda lista debe tener el suyo; una lista vacía sin explicación parece una app rota.

**Además, dos piezas de navegación:**

### 5.7 `AppBar`
Altura 56. Botón hamburguesa a la **izquierda**, 48×48, icono 24. Sin título (el título vive en `PageHeader`, debajo). Respeta el área segura superior del móvil.

### 5.8 `SideDrawer`
Menú lateral que entra desde la izquierda, ancho 280, fondo blanco, sombra de elevación, fondo de página atenuado al 40 %.
Cada sección: fila de 56 px con icono 22 a la izquierda y etiqueta 16/600. Sección activa con fondo `--surface-sunk`.
Se cierra pulsando fuera, con gesto de arrastre o con Escape.

Orden del menú: **Inicio · Finanzas · Almacén · Proyectos · Organigrama · Galería**.

---

## 6. Reglas de interacción táctil

Esto no es estética, es lo que hace que la app se use sin pelearse con ella.

1. **Objetivo pulsable mínimo 48×48 px**, aunque el icono dibujado sea de 22. El área se amplía con padding, no agrandando el dibujo.
2. **Separación mínima de 8 px** entre dos elementos pulsables contiguos.
3. **Nada de enlaces de texto subrayado como acción principal.** En la captura, "Editar cantidad" y "Ver historial" son objetivos pequeños y pegados: exactamente el problema que quieres evitar. Se sustituyen por dos `ButtonSecondary` de 48 px de alto repartidos en la fila.
4. **Prohibido anidar objetivos pulsables.** Si la tarjeta entera navega al detalle, dentro no puede haber botones; o bien la tarjeta no navega y los botones hacen el trabajo. Mezclar las dos cosas provoca pulsaciones accidentales constantes. **Decisión para Garito:** la fila principal navega al detalle, y las acciones van en su propia fila separada por un divisor, fuera del área de navegación.
5. **Ancho máximo de contenido 480 px**, centrado en escritorio. Una app de listas estirada a 1400 px se vuelve ilegible.
6. **Área segura:** respetar `env(safe-area-inset-top/bottom)`. En PWA instalada, sin eso el contenido se mete bajo la barra del sistema.
7. **Estado de foco visible** con anillo `--focus` de 2 px. No eliminar el `outline` por estética.
8. **Toda acción destructiva o masiva pide confirmación** en hoja inferior, con el botón de confirmar a la derecha y el de cancelar a la izquierda.

---

## 7. Iconografía

- Librería: **`lucide-react`**. Coherente, ligera, licencia MIT, se importa solo lo usado.
- Grosor de trazo `1.75`, tamaño `22` en menú y `20` en línea de texto.
- Color `--ink` o `--ink-2`. **Nunca un icono de color** salvo que represente estado.
- Un icono por sección en el menú lateral:

| Sección | Icono |
|---|---|
| Inicio | `home` |
| Finanzas | `wallet` |
| Almacén | `package` |
| Proyectos | `hammer` |
| Organigrama | `users` |
| Galería | `image` |

> Los iconos de interfaz salen de esta librería. Las **ilustraciones** (furgoneta, cabeceras) son otra cosa distinta y van en el documento de acabado visual.

---

## 8. Estructura de pantallas

**Inicio.** Limpia: `AppBar` con hamburguesa y una sola imagen. Sin tarjetas, sin resúmenes, sin datos. Es la portada.

**Sección.** `AppBar` → `PageHeader` (título + ilustración) → `SummaryPill` si aplica → acción primaria → lista de `ListCard`.

**Detalle.** `AppBar` con flecha de volver a la izquierda → título → contenido → acciones al final.

---

## 9. Reglas para `CLAUDE.md`

Copiar tal cual al fichero de contexto del proyecto:

```markdown
## Diseño — reglas obligatorias

- Los colores, tipografías, espaciados y radios están definidos en `tailwind.config`
  y en las variables CSS de `globals.css`. USAR SIEMPRE LOS TOKENS.
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
```

---

## 10. Orden de trabajo recomendado

1. Definir tokens en `globals.css` y `tailwind.config`.
2. Cargar la tipografía y verificar la reserva.
3. Construir los ocho componentes de §5.
4. **Rehacer el Almacén con ellos.** Es la prueba real: si algo del sistema chirría, se ve aquí y corregirlo todavía es barato.
5. Añadir las reglas de §9 a `CLAUDE.md`.
6. Continuar con la fase 3.

El paso 4 no es opcional. Un sistema de diseño no se valida mirándolo, se valida usándolo en una pantalla de verdad.
