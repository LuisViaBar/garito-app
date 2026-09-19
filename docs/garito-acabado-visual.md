# Garito — Acabado visual

**Estado: implementar AL FINAL, como fase de cierre.**

Todo lo que hay aquí se apoya en huecos que el sistema de diseño ya deja reservados. Retrasarlo no cuesta nada: no obliga a tocar lógica ni a reescribir componentes.

El sistema de diseño (tokens, componentes, reglas táctiles) va en el documento aparte y **ese sí se hace ahora**.

---

## 1. Lenguaje de ilustración

Un solo estilo en toda la app, coherente con la furgoneta de la captura:

- **Dibujo a línea, hecho a mano**, trazo irregular, aspecto de boceto.
- **Monocromo negro** sobre fondo transparente. El único color permitido es el rojo de marca `#E23A2E`, y solo en detalles mínimos tipo el rótulo "EL GARITO".
- Sin relleno de grises, sin sombreados, sin degradados.
- Objetos y escenas del local, no personas reconocibles.

Esto importa más de lo que parece: si cada ilustración tiene un estilo distinto, la app parece un collage. Un solo trazo, aunque sea tosco, da unidad.

---

## 2. Dónde van las imágenes

| Ubicación | Qué es | Tratamiento |
|---|---|---|
| **Inicio** | Ilustración grande, la portada de la app | Centrada, ancho máximo 320, es el único contenido |
| **Login** | Ilustración propia, distinta de la de inicio | Encima del formulario, ancho máximo 260 |
| **Cabecera de sección** | Ilustración pequeña a la derecha del título | Altura fija 72, alineada arriba a la derecha |
| **Estados vacíos** | Opcional, un objeto suelto | Altura 96, centrado, opacidad 0.6 |
| **Menú lateral** | Logotipo o rótulo en la cabecera del menú | Altura 40 |

**Regla de implementación:** el `PageHeader` reserva ese espacio **desde ahora**, con altura fija. Si no, al añadir las ilustraciones al final el contenido se desplaza y hay que reajustar cada pantalla.

---

## 3. Ficheros que hay que reunir

Guardar todo en `public/ilustraciones/` dentro del repositorio.

### 3.1 Ilustraciones (las aportas tú)

| Fichero | Contenido sugerido | Formato | Tamaño |
|---|---|---|---|
| `inicio.svg` | La escena principal del Garito | SVG, o PNG transparente | ≥ 1200 px de ancho |
| `login.svg` | Algo distinto: la puerta, el cartel, la llave | SVG o PNG | ≥ 800 px |
| `sec-finanzas.svg` | Hucha, billetes, caja registradora | SVG o PNG | ≥ 400 px |
| `sec-almacen.svg` | La furgoneta de la captura | SVG o PNG | ≥ 400 px |
| `sec-proyectos.svg` | Herramientas, escalera, brocha | SVG o PNG | ≥ 400 px |
| `sec-organigrama.svg` | Corona, banda presidencial | SVG o PNG | ≥ 400 px |
| `sec-galeria.svg` | Cámara de fotos | SVG o PNG | ≥ 400 px |
| `logo.svg` | El rótulo "EL GARITO" | SVG preferente | — |

**Especificaciones comunes:**

- **Fondo transparente obligatorio.** Un fondo blanco incrustado se nota en cuanto la tarjeta que hay detrás no es blanca pura.
- **SVG mejor que PNG.** Escala sin pixelarse, pesa mucho menos y el trazo se ve nítido en pantallas de alta densidad. Si las dibujas a mano y las escaneas, se pueden vectorizar.
- Si acaban siendo PNG: exportar al doble del tamaño de uso y comprimir. Sin esto, la app carga megas en ilustraciones decorativas.
- Sin texto incrustado salvo el rótulo de marca. El texto dentro de una imagen no se puede traducir, ni se lee bien, ni lo interpreta un lector de pantalla.

### 3.2 Iconos de la PWA (se generan a partir del logo)

Necesarios para que la app se instale con buen aspecto en la pantalla de inicio:

| Fichero | Tamaño | Notas |
|---|---|---|
| `icon-192.png` | 192×192 | Fondo **sólido**, no transparente |
| `icon-512.png` | 512×512 | Ídem |
| `icon-maskable-512.png` | 512×512 | Con margen de seguridad del 20 % alrededor |
| `apple-touch-icon.png` | 180×180 | iOS ignora el manifest y usa este |
| `favicon.ico` | 32×32 | Pestaña del navegador |

El icono *maskable* existe porque Android recorta el icono con la forma que tenga el lanzador (círculo, cuadrado redondeado, gota). Sin margen, recorta parte del dibujo.

---

## 4. Microcopy y tono

Se ajusta al final, cuando las pantallas ya existen y se ve cómo suenan en contexto.

- Tuteo y lenguaje directo. Es una app entre amigos, no un banco.
- Los estados vacíos son la oportunidad de que la app tenga gracia: "Aquí no hay nada. Alguien tendrá que ir a comprar."
- **Excepción: Finanzas se mantiene sobria.** Los mensajes sobre dinero ajeno no se prestan a bromas. "Debe 40 €" y nada más.
- El Organigrama es lo contrario: ahí el tono es el contenido.

---

## 5. Animación

Mínima y funcional. Nada decorativo.

- Menú lateral: entrada y salida en 200 ms, curva `ease-out`.
- Hojas inferiores de confirmación: 180 ms.
- Cambios de estado (punto rojo ↔ verde): transición de color de 120 ms.
- Nada más. Sin animaciones de entrada de listas, sin efectos al hacer scroll.
- Respetar `prefers-reduced-motion`: si el usuario lo tiene activado, todo instantáneo.

---

## 6. Repaso final antes de dar por cerrada la app

- [ ] Todas las ilustraciones comparten trazo y peso visual.
- [ ] Ninguna imagen supera los 150 KB.
- [ ] Todas tienen `alt` descriptivo, o `alt=""` si son puramente decorativas.
- [ ] La app instalada en el móvil muestra el icono correcto, sin recortes raros.
- [ ] Las ilustraciones no desplazan el contenido al cargar (altura reservada).
- [ ] Revisión a 375 px y a 430 px de ancho.
- [ ] Contraste de texto verificado: mínimo 4,5:1 sobre blanco.
