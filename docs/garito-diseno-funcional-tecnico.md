# Garito — Diseño funcional y técnico

Documento de referencia para el desarrollo de la aplicación de gestión del local "Garito".
Pensado para usarse como contexto de trabajo en Claude Code.

---

## 1. Contexto y objetivo

Aplicación privada para los **25 miembros** (24 amigos + yo) de un local compartido llamado "Garito".

**Objetivo principal:** tener de un vistazo la información que ayuda a gestionar el local. No es un ERP ni pretende serlo. Prioridad absoluta a la **simplicidad de uso**: pocas pantallas, directas al grano, usables desde el móvil en treinta segundos.

**Uso previsto:** mayoritariamente móvil, ocasionalmente escritorio.

**Escala:** 25 usuarios, bajo volumen de datos y de tráfico. Todo debe caber holgadamente en planes gratuitos.

---

## 2. Stack tecnológico

| Capa | Tecnología | Por qué |
|---|---|---|
| Frontend | **Next.js** (App Router) + **React** + **TypeScript** | Framework sobre React que ya trae rutas, renderizado en servidor y rutas de API. Un solo proyecto para front y back. |
| Estilos | **Tailwind CSS** | Sistema de utilidades coherente; evita que el diseño se descontrole. Rápido para móvil. |
| PWA | Manifest + service worker | Instalable en la pantalla de inicio, sin pasar por tiendas de apps. Actualización inmediata al desplegar. |
| Backend / datos | **Supabase** (PostgreSQL gestionado) | BBDD real, autenticación, almacenamiento de ficheros y API autogenerada. |
| Autorización | **Row Level Security (RLS)** de Postgres | Las reglas de acceso viven en la base de datos, no solo en el front. |
| Lógica de servidor | **Route Handlers** de Next.js | Para la conciliación bancaria y cualquier cálculo que no deba ejecutarse en el cliente. |
| Almacenamiento de imágenes | **Supabase Storage** | Incluido; no añade piezas nuevas. |
| Despliegue | **Vercel** | Integración nativa con Next.js. Despliegue automático desde GitHub. |

**Decisión de forma de distribución:** PWA, no app nativa.
Se acepta la renuncia a: acceso completo a hardware, notificaciones push totalmente fiables en iOS y transiciones 100 % nativas. Ninguna es bloqueante para este caso de uso.

---

## 3. Modelo de usuarios y permisos

Modelo deliberadamente simple. **Dos roles globales:**

- **admin** — acceso total a todo, incluidos los proyectos privados de otros.
- **miembro** — acceso normal.

**Única excepción a la simplicidad:** la sección de Proyectos tiene permisos por proyecto (ver detalle en §4.3).

El **organigrama no otorga permisos**. Es puramente decorativo/humorístico.

---

## 4. Secciones

### 4.1 Finanzas

**Situación actual:** una persona (el tesorero) accede a la cuenta bancaria donde los miembros ingresan la cuota y controla manualmente quién ha pagado. Los pagos de salida del local se siguen haciendo fuera de la aplicación, de forma manual. La app **no** gestiona gastos, solo ingresos de cuotas.

**Cuota:** importe fijo mensual, **igual para todos**. Vive en una tabla de configuración, no replicado en cada fila.

**Flujo funcional:**

1. El tesorero exporta del banco un extracto de transacciones (CSV / Excel).
2. Lo sube a la aplicación.
3. La app **cruza cada transacción contra los miembros**:
   - **Criterio principal: nombre del ordenante**, normalizado (sin tildes, a mayúsculas, sin dobles espacios, sin partículas tipo "DE", "DEL", "LA"). El IBAN **no se almacena en la base de datos**, por decisión explícita de no guardar datos bancarios personales.
   - **Criterio de apoyo:** importe coincidente con la cuota y concepto de la transacción.
   - **Aprendizaje de alias:** cada vez que el tesorero asigna manualmente una transacción no reconocida, la app guarda esa cadena de ordenante asociada al miembro. En la siguiente importación ya se concilia sola. Con 25 personas, en dos o tres meses el sistema reconoce prácticamente todo.
4. La app muestra una **previsualización** antes de escribir nada:
   - Transacciones conciliadas automáticamente.
   - Transacciones **no reconocidas** → bandeja de revisión manual, donde el tesorero asigna miembro con un clic.
   - Transacciones a descartar (no son cuotas).
5. Solo al confirmar, se escriben los pagos.

**Pantalla de morosos:** listado de miembros con su saldo. Ver §4.1.1.

---

#### 4.1.1 Modelo de saldo: cuenta corriente, no "pagada sí/no"

La realidad del local no encaja en un modelo binario por mes. Hay tres situaciones habituales:

- Un miembro acumula **varios meses sin pagar**.
- Un miembro paga **más de una mensualidad de golpe**, saldando deuda anterior.
- Un miembro paga **por adelantado** varios meses, quedando a favor.

Por eso cada miembro tiene una **cuenta corriente** (un *libro mayor* o *ledger*: un registro cronológico de apuntes que nunca se modifican, solo se añaden). El saldo no se guarda: se calcula sumando los apuntes.

**Dos tipos de apunte:**

| Tipo | Signo | Origen |
|---|---|---|
| **Cargo** (devengo) | Negativo | Generado automáticamente, uno por miembro y mes, por el importe de la cuota vigente. |
| **Abono** (pago) | Positivo | Procedente de una transacción bancaria conciliada. |
| **Ajuste** | Cualquiera | Manual, solo admin. Para derramas, correcciones, condonaciones o saldos iniciales. |

**Saldo = suma de todos los apuntes del miembro.**

- Saldo **negativo** → debe dinero.
- Saldo **cero** → al corriente.
- Saldo **positivo** → pagado por adelantado.

**Meses adeudados o adelantados** = saldo ÷ importe de la cuota. Como la cuota es fija e igual para todos, la conversión es directa. El resto de la división (si alguien paga un importe que no es múltiplo exacto) se muestra aparte como "y X € sueltos", sin forzar nada.

**Por qué este modelo y no el binario:**

- Los tres casos se resuelven **solos**, sin lógica especial. Un pago de tres mensualidades es simplemente un abono de 3× la cuota; el saldo se ajusta y punto. Un adelanto se consume automáticamente según se van generando los cargos mensuales, sin ningún proceso que lo "gaste".
- **No hay que decidir a qué mes se imputa cada pago.** Esa decisión, en el modelo binario, es una fuente constante de errores y discusiones.
- Da **trazabilidad completa**: se ve el histórico de apuntes de cada miembro, con fecha y origen.
- Soporta sin cambios futuros escenarios como derramas o cuotas que cambien de importe.

**Vista de detalle de un miembro:** extracto cronológico de sus apuntes con saldo acumulado, igual que una cuenta bancaria.

**Reglas del modelo de saldo:**

- **Los apuntes son inmutables en lo que importa.** Importe, miembro, periodo y tipo **no se editan ni se borran jamás**. Un error se corrige con un **apunte de signo contrario** (contraapunte), dejando ambos visibles. El único campo mutable es `anulado`, que solo escribe el proceso de reversión. Conviene reforzarlo con políticas RLS que denieguen `DELETE` y restrinjan `UPDATE` a esa única columna.
- **El importe se almacena como `numeric(10,2)`, nunca como `float`, `real` o `double`.** La coma flotante no representa exactamente valores como 0,10, así que al sumar muchos apuntes aparecen desviaciones de céntimos imposibles de explicar. Es el error histórico por excelencia en software financiero.
- **La base de datos valida el signo:** un `cargo` siempre negativo, un `abono` siempre positivo, por restricción `CHECK`. Si un bug invirtiera el signo, la deuda de alguien se transformaría en saldo a favor sin que saltara ninguna alarma.
- **La generación de cargos mensuales debe ser idempotente:** restricción de unicidad sobre (miembro_id, periodo) para los cargos **no anulados y que no sean contraapuntes**. Las tres condiciones son necesarias: sin `anulado = false` no se puede relanzar un devengo revertido; sin `anula_apunte_id IS NULL` el propio contraapunte colisionaría con el original, que comparte miembro y periodo.
- **Día de devengo: el 5 de cada mes.** Ese día se genera un cargo por cada miembro activo. Coincide con la **fecha límite de pago**: todos los miembros saben que la transferencia debe estar completada antes del día 5. Es configurable por un admin en la tabla `configuracion`.
- **El día de devengo se limita al rango 1–28**, no 1–31. Un valor de 29, 30 o 31 dejaría febrero sin devengar o lo movería de fecha según el año: un fallo silencioso que solo se detecta meses después, al cuadrar cuentas. Con el rango 1–28 el problema no puede existir. Si algún día hiciera falta devengar a fin de mes, se implementa como una opción explícita ("último día del mes"), nunca como un número.
- **El orden de los apuntes es irrelevante.** El saldo es una suma, así que da igual que el pago se registre antes o después del cargo del mes. Si alguien paga el día 2 y el cargo se genera el día 5, el saldo intermedio queda temporalmente positivo y se regulariza solo. **No hay que ordenar, sincronizar ni bloquear nada.** Es una de las ventajas principales del modelo de cuenta corriente frente al binario.
- **No confundir `periodo` con `created_at`.** `periodo` es el mes al que corresponde la cuota (siempre día 1 del mes, como clave); `created_at` es cuándo se creó el apunte (el día 5). La unicidad va sobre `periodo`, nunca sobre la fecha de creación.
- **Los abonos no se asignan a ningún mes.** El campo `periodo` va vacío en los apuntes de tipo abono. Un ingreso es dinero que entra, sin más; el modelo no necesita saber "de qué mes" es.
- **Consecuencia deseada:** antes del día 5, el cargo del mes en curso todavía no existe, así que nadie aparece como deudor por un mes que aún no se ha devengado. Es el comportamiento correcto y no hay que añadir lógica para conseguirlo.
- Los cargos se generan **para todos los miembros marcados como activos**. Ver nota sobre altas y bajas más abajo.
- El **importe de la cuota se copia en el apunte** en el momento de generarlo. Si algún día cambia la cuota, el histórico no se reescribe. (Única excepción a la regla de no duplicar datos: aquí es correcto, porque es un dato histórico, no derivado.)

**Momento cero y saldo inicial:**

Todos los miembros arrancan el mismo día. El **momento cero** es el primer día que esta lógica se ejecuta en producción: a partir de ahí, la app devenga cuotas mes a mes.

Toda la historia anterior a ese día **no se reconstruye**. Entra en la app como un único apunte de tipo `ajuste` por miembro, con concepto "saldo inicial", que puede ser negativo (venía debiendo) o positivo (venía adelantado).

> ⚠️ **PENDIENTE — lo aporta el propietario del proyecto.** Los saldos iniciales de los 25 miembros los recopilará el usuario y los entregará más adelante. **No inventar, no estimar, no asumir cero.** Hasta disponer de ellos, la fase de Finanzas se desarrolla y se prueba con datos ficticios, y no se pone en producción.

**Altas y bajas de miembros:**

Son un caso **extraordinario y poco frecuente**. Cuando ocurren implican decisiones que la app no gestiona (recálculo del importe de la cuota, reparto de costes, etc.) y que resuelven el tesorero y los socios fuera de la aplicación.

Por tanto: **no construir lógica de prorrateo, ni devengo parcial, ni historial de altas/bajas.** Basta con un campo `activo` en la tabla de miembros: si está activo, devenga cuota; si no, deja de devengar. Cualquier ajuste fino se hace con apuntes manuales de tipo `ajuste`.

Es deuda técnica **asumida conscientemente**: el coste de construirlo bien supera con mucho la frecuencia con la que va a pasar.

---

#### 4.1.2 Ciclo mensual de tesorería

Rutina operativa que sigue el tesorero cada mes. La app debe estar diseñada para que esto se haga en pocos minutos desde el móvil.

1. **Antes del día 5** — cada miembro transfiere su cuota a la cuenta del Garito. Es la fecha límite acordada y conocida por todos.
2. **Día 5** — el tesorero lanza el **devengo** del mes desde la app. Se genera un cargo por miembro activo.
3. **Día 5 o posterior** — el tesorero exporta del banco el fichero de ingresos y lo importa en la app.
4. La app concilia, muestra la **previsualización**, el tesorero resuelve los no reconocidos y confirma.
5. La pantalla de saldos refleja quién está al corriente, quién debe y quién va adelantado.

**Sobre la ventana de exportación del banco:**

Si el fichero se exporta como "últimos 30 días", las importaciones sucesivas **se solapan**: transacciones que ya se importaron el mes pasado volverán a aparecer. Esto es **esperado y correcto**, no un problema: la restricción de unicidad sobre el hash de transacción las descarta en silencio.

De hecho, la recomendación es la contraria a ser preciso con la ventana: **exportar con solape generoso** (45 o 60 días) en vez de ajustar el rango. Un solape de más no cuesta nada; un ingreso que cae fuera de la ventana y se pierde sí, y además es difícil de detectar porque simplemente el miembro aparece como moroso sin motivo.

> Esto convierte la idempotencia de la importación en un requisito **funcional**, no solo en una buena práctica técnica. Si falla, cada importación mensual duplica pagos.

**Previsualización — debe informar del solape.** Al importar, la app indica explícitamente cuántas transacciones son nuevas y cuántas se han descartado por estar ya registradas. Sin eso, el tesorero ve "12 de 30 procesadas" y piensa que algo ha ido mal.

---

#### 4.1.3 Reversión de operaciones (red de seguridad del tesorero)

El tesorero necesita poder deshacer una operación que ha salido mal. **La solución NO es restaurar una copia de seguridad de la base de datos.**

**Por qué no un backup/restore:**

Restaurar una foto completa de la base de datos revierte *todo* lo ocurrido desde ese momento, no solo el error. Mientras el tesorero importaba, otros miembros pueden haber actualizado el stock, comentado en un proyecto o subido fotos. Restaurar destruiría ese trabajo sin que nadie se entere. En una aplicación multiusuario, el backup global es un instrumento de catástrofe, no de corrección rutinaria.

**La solución correcta: reversión por lote.**

Cada importación y cada devengo son un **lote identificable**. Todos los apuntes que genera una operación quedan vinculados a ella. Revertir significa deshacer *solo esa operación*, dejando intacto todo lo demás.

**Operaciones reversibles:**

| Operación | Qué revierte |
|---|---|
| Importación de extracto | Todos los abonos generados por esa importación |
| Devengo mensual | Todos los cargos de ese periodo |
| Carga de saldos iniciales | Todos los ajustes de arranque |

La carga inicial se trata como lote reversible **a propósito**: son 25 importes tecleados a mano, sin nada contra lo que contrastarlos, y es la operación más arriesgada de todo el proyecto. Si no fuera un lote, corregirla obligaría a 25 contraapuntes manuales.

**Cómo funciona la reversión:**

1. El tesorero ve el **historial de operaciones** (qué se importó, cuándo, cuántos apuntes generó, quién lo hizo).
2. Selecciona una y pulsa "revertir", con confirmación explícita que indica cuántos apuntes se van a anular.
3. La app genera un **contraapunte por cada apunte** del lote: mismo importe, signo contrario, vinculado al original mediante `anula_apunte_id`.
4. Los apuntes originales se marcan con `anulado = true`, y las transacciones del lote pasan a estado `anulada`.
5. El lote queda marcado como `anulado`.

Los pasos 3 a 5 son imprescindibles **los tres**: el contraapunte corrige el saldo, y los flags liberan los índices de unicidad para que la operación se pueda relanzar.

Los apuntes originales **no se borran**. El saldo vuelve a su valor previo porque original y contraapunte se cancelan al sumar. La auditoría queda completa: se ve qué pasó, cuándo se deshizo y quién lo deshizo.

**Regla crítica — permitir la reimportación:**

Tras revertir una importación, el tesorero necesita poder **volver a importar el mismo fichero** corregido. Si las transacciones anuladas siguen bloqueando el índice de unicidad por hash, la reimportación fallaría en silencio diciendo "todo son duplicados".

→ El índice único sobre el hash de transacción debe ser **parcial**: aplicar solo a transacciones de importaciones no anuladas.

```sql
CREATE UNIQUE INDEX ... ON transacciones (hash_unico)
  WHERE estado <> 'anulada';
```

Es un detalle pequeño que, si se pasa por alto, deja la función de revertir inservible justo cuando hace falta.

**El mismo problema existe en los apuntes**, y se resuelve igual: el índice de unicidad de cargos excluye los que tienen `anulado = true`. Sin eso, revertir un devengo impediría volver a lanzarlo. Es el patrón general: **toda restricción de unicidad sobre datos reversibles debe ser parcial y excluir lo anulado.**

**Otras reglas:**

- Solo **admin** puede revertir.
- La reversión es **atómica**: o se generan todos los contraapuntes o ninguno. Debe ir en una transacción de base de datos.
- **No se revierte una reversión.** Si hace falta, se vuelve a importar.
- Una reversión queda registrada con autor y fecha, igual que cualquier otra operación.

**Copia de seguridad de verdad (complementaria, no sustitutiva):**

Además de lo anterior, conviene un **botón de exportar a CSV** el libro de apuntes completo. Cuesta muy poco y da al tesorero una copia fuera del sistema que puede guardar donde quiera. Es la red de seguridad para el escenario improbable pero catastrófico: pérdida de la base de datos, error grave de esquema o cierre del servicio.

Recomendación operativa: exportar tras cada cierre mensual.

---

**Reglas de negocio críticas:**

- **El saldo NUNCA se almacena como campo.** Se calcula siempre sumando los apuntes, en una vista de Postgres. Un saldo almacenado se desincroniza tarde o temprano.
- **La importación debe ser idempotente.** Subir dos veces el mismo extracto no puede duplicar pagos. Se consigue con un hash único por transacción, con restricción de unicidad en BBDD.

**Definición exacta del hash de transacción (no dejar al criterio de la implementación):**

```
hash_unico = SHA-256(
  fecha_valor (ISO, AAAA-MM-DD) + '|' +
  importe (2 decimales, punto como separador, con signo) + '|' +
  ordenante_normalizado + '|' +
  concepto normalizado + '|' +
  ocurrencia
)
```

- `ocurrencia` es un contador que vale 0 salvo que **la misma combinación se repita dentro del mismo fichero**, en cuyo caso vale 1, 2, etc. Cubre el caso legítimo de dos ingresos idénticos el mismo día sin que uno se descarte por error.
- La normalización del concepto es la misma que la del ordenante: sin tildes, mayúsculas, espacios colapsados.
- Se guarda en hexadecimal minúscula.

> ⚠️ **Esta definición es un contrato.** Si cambia, todo el histórico de deduplicación queda invalidado y la siguiente importación duplicará pagos antiguos. Cualquier modificación futura exige migrar y recalcular los hashes existentes.

> ⚠️ **DECISIÓN PENDIENTE — requiere la muestra del extracto bancario.**
>
> Antes de implementar la importación (fase 7) hay que revisar un fichero real exportado de la cuenta del Garito y comprobar si **incluye una referencia propia de transacción** de la entidad bancaria (un identificador único por movimiento).
>
> - **Si la incluye:** se usa esa referencia directamente como `hash_unico`. Es más fiable que cualquier composición nuestra, porque la garantiza el banco y no depende de normalizaciones, formatos de fecha ni de cómo venga escrito el concepto.
> - **Si no la incluye:** se usa el hash compuesto definido arriba.
>
> La decisión se toma **una sola vez y es difícil de revertir** (cambiar de criterio invalida el histórico), así que conviene resolverla con la muestra delante y no por defecto.
- **La bandeja de revisión manual es una pieza central, no un caso excepcional.** Al no disponer de IBAN, el cruce por nombre nunca será perfecto: el banco abrevia, el titular de la cuenta puede no coincidir con el apodo del miembro, y algunas entidades truncan el ordenante. La app debe asumir que habrá no reconocidos en cada importación y hacer que asignarlos sea **rápido y cómodo** (lista de miembros filtrable, asignación en un clic). Nunca debe adivinar: ante duda, a la bandeja.
- **Nunca conciliar automáticamente con baja confianza.** Si la coincidencia de nombre es parcial o ambigua, la transacción va a revisión, no se asigna "a lo mejor". Un falso positivo marca como pagado a quien no ha pagado, que es el peor error posible en esta sección.
- Solo **admin** puede importar extractos y editar pagos. El resto solo consulta.

---

### 4.2 Almacén

**Necesidad real:** saber si hay o no hay existencias de lo básico (cerveza, pipas, vasos de plástico, platos, producto de limpieza). No se necesita contabilidad de movimientos ni valoración de inventario.

**Funcionalidad:**

- Listado de productos con categoría (bebida / comida / desechables / limpieza / otros), cantidad actual y umbral mínimo. Sin campo de unidad de medida (se valoró en la Fase 2 y se descartó: no aportaba valor suficiente para justificarlo).
- **Cualquier miembro puede editar la cantidad** directamente.
- Cada edición deja **registro de auditoría**: quién, cuándo, valor anterior, valor nuevo, nota opcional. Es consultable por cualquier miembro desde el propio listado ("Ver historial" en cada producto, últimas 20 entradas).
- **Indicador visual de umbral:** verde si está por encima del mínimo, rojo si está por debajo. Resumen arriba del tipo "3 productos bajo mínimos". Los productos bajo mínimo se muestran primero en el listado.
- Solo **admin** puede crear/eliminar productos y fijar umbrales.
- **Aviso de posible duplicado al crear o renombrar un producto:** se compara el nombre (sin mayúsculas, sin acentos, ignorando una "s" final) contra los productos existentes; si hay uno parecido, se pide confirmación antes de guardar, citando con qué producto podría coincidir. Es un aviso, no un bloqueo: se puede confirmar y crear igualmente si de verdad son productos distintos (p. ej. "Vasos" de cristal y "Vaso" de plástico).

**Nota de evolución:** el umbral se implementa de forma que en el futuro pueda disparar una notificación (push o mensaje al grupo) sin rehacer nada. En v1 solo es visual.

**Aclaración importante — `cantidad_actual` NO contradice la regla de "nada de datos derivados":**

En Finanzas el saldo se calcula porque **se deduce** de unos hechos previos (los apuntes). Guardarlo sería duplicar información existente, y por eso se desincronizaría.

En Almacén es al revés. Se decidió **no llevar movimientos de entrada y salida**: nadie apunta "he sacado 6 cervezas". Alguien mira la estantería, cuenta y escribe el número. Ese número **es el dato original**, no se deduce de nada. El `stock_log` es testimonio de los cambios, no su origen.

| | Finanzas | Almacén |
|---|---|---|
| Fuente de verdad | Los apuntes | La propia `cantidad_actual` |
| Papel del histórico | Origen del saldo | Auditoría de quién tocó qué |
| ¿Recalculable? | Sí, sumando apuntes | No, ni hace falta |

→ **No intentar derivar el stock de los movimientos.** No existen tales movimientos.

**Campo `motivo` en el log:** cada edición registra por qué se cambió (`reposicion`, `consumo`, `recuento`, `correccion`). Convierte el histórico de "el 12 de marzo Juan puso 24" en "el 12 de marzo Juan repuso hasta 24", que es mucho más legible meses después.

**Borrado de productos:** no hay campo `archivado`. Un producto que deja de usarse se **borra**, y su histórico en `stock_log` se borra **en cascada**. Decisión consciente: la trazabilidad del almacén es informativa, no contable, y no justifica complicar la interfaz. Solo **admin** puede borrar, y la app debe advertir de que se perderá el histórico.

**Concurrencia:** si dos personas editan el mismo producto a la vez, gana el último en guardar. **Asumido conscientemente para la v1**: es un escenario muy improbable con 25 personas y de consecuencias menores. No implementar control de versiones ni bloqueos.

---

### 4.3 Proyectos

Sección para coordinar iniciativas del local: remodelación, nueva oleada de merchandising, resolución de humedades, etc.

**Estructura:**

- **Proyectos**, con posibilidad de **subproyectos** (un proyecto puede tener un proyecto padre).
- **Anidamiento limitado a dos niveles.** Un proyecto que ya tiene padre no puede ser padre de otro. Sin este límite, la profundidad es infinita y complica consultas, permisos y navegación en móvil sin aportar nada.
- **Los permisos se heredan hacia abajo:** quien tiene acceso a un proyecto lo tiene sobre sus subproyectos, con el mismo nivel. La alternativa (gestionar permisos en cada subproyecto) acabaría ignorándose en la práctica y generaría subproyectos inaccesibles por descuido.
- Dentro de cada proyecto:
  - **Lista de tareas**: título, descripción opcional, responsable asignado, estado.
  - **Tablón de comentarios** a nivel de proyecto (no de tarea, para no fragmentar la conversación).
- **Borrado en cascada:** borrar un proyecto elimina sus subproyectos, tareas, comentarios y permisos. Fuera de su proyecto no significan nada.

**Estados de tarea:** `pendiente` / `en curso` / `hecha`. Nada más. **Sin fecha límite.**

**Estados de proyecto:** `activo` / `archivado`.

**Permisos (la parte con más matiz de toda la app):**

- Quien crea el proyecto es su **dueño**.
- El dueño decide qué miembros tienen acceso y con qué nivel: **ver** o **editar**.
- Quien no esté en la lista **no ve el proyecto en absoluto**.
- Los **admin ven y editan todo** (evita proyectos huérfanos si alguien se desvincula).

Implementación: tabla `proyecto_miembros` + políticas RLS en Postgres. **La visibilidad no se filtra en el frontend**, se filtra en la base de datos.

---

### 4.4 Organigrama

Sección **humorística e informativa**. Cero lógica de negocio, cero impacto en permisos.

- Vista visual con foto de cada miembro y su cargo inventado (presidente, vicepresidente, guardianes...).
- Solo **admin** puede editar los cargos.

---

### 4.5 Galería

Dos álbumes **fijos**, sin gestión de álbumes:

- **Merchandising**
- **Fotos del grupo**

**Funcionalidad:**

- Cualquier miembro sube fotos.
- Borra quien la subió, o un admin.

**Restricción técnica importante:** el plan gratuito de Supabase Storage da ~1 GB. Las fotos de móvil lo llenan rápido.
→ **Comprimir y redimensionar en el navegador antes de subir** (lado cliente, p. ej. `canvas` o `browser-image-compression`), y generar **miniatura** para la vista de galería. Nunca cargar los originales en el grid.
→ Se guarda `tamano_bytes` de cada foto para poder vigilar el consumo acumulado desde la propia app, sin entrar en el panel de Supabase.

**Implementación (Fase 4).** Bucket privado `galeria`; rutas `<album>/<uuid>.webp` y `<album>/<uuid>_mini.webp` (`.jpg` si el navegador no codifica WebP). La compresión deja la foto en ≤ 1600 px y la miniatura en ≤ 480 px. `tamano_bytes` suma foto + miniatura. Subida directa del navegador a Storage y registro posterior de la fila. Detalle y decisiones en `docs/handoff.md`.

**Guardar rutas, no URLs.** En la base de datos se almacena la ruta dentro del bucket (`galeria/grupo/abc123.webp`), nunca la URL completa. Si el bucket es privado, las URLs son firmadas y **caducan**: guardarlas dejaría la tabla llena de enlaces muertos en cuestión de horas. La app genera la URL válida en el momento de mostrar la imagen. Como efecto secundario, cambiar de proveedor o reorganizar buckets no obliga a reescribir la tabla.

---

## 5. Modelo de datos

**Estado: CERRADO.** Revisado tabla por tabla y acordado. Los nombres de campo y las restricciones de esta sección son vinculantes: Claude Code debe implementarlos tal cual, no reinterpretarlos. Cualquier desviación se consulta antes.

Notación: `->` indica clave foránea.

```
miembros
  id, auth_user_id (UNIQUE) -> auth.users,
  nombre,                 -- nombre real completo; lo usa la conciliación bancaria
  alias,                  -- apodo; es lo que se muestra en la interfaz
  email,
  rol ('admin' | 'miembro'),
  departamento (texto, humorístico; alimenta el organigrama),
  activo,                 -- determina si devenga cuota
  created_at
  -- sin foto_url por ahora (se añadirá si se decide ilustrar el organigrama)
  -- sin fechas de alta/baja: altas y bajas son extraordinarias (ver §4.1.1)
  -- NO se almacena IBAN ni ningún dato bancario personal (decisión explícita)

alias_bancarios          -- aprendizaje de la conciliación por nombre
  id, miembro_id -> miembros.id,
  ordenante_normalizado text UNIQUE,
  creado_por -> miembros.id, created_at

configuracion           -- FILA ÚNICA, columnas tipadas. Editable solo por admin
  id (CHECK id = 1),    -- garantiza que nunca haya más de una fila
  importe_cargo_mensual numeric(10,2) NOT NULL DEFAULT 20.00,   -- importe de la cuota
  dia_devengo smallint NOT NULL DEFAULT 5
    CHECK (dia_devengo BETWEEN 1 AND 28),               -- ver nota sobre meses cortos
  updated_by -> miembros.id,
  updated_at

apuntes                 -- libro mayor: cuenta corriente de cada miembro
  id, miembro_id -> miembros.id,
  tipo ('cargo' | 'abono' | 'ajuste'),
  importe numeric(10,2) NOT NULL,        -- NUNCA float/real/double (ver reglas)
  periodo (date, día 1 del mes; OBLIGATORIO en cargos, NULL en abonos y ajustes),
  transaccion_id (nullable) -> transacciones.id,   -- solo en abonos
  lote_id (nullable) -> operaciones.id,   -- permite revertir el lote completo
  anulado boolean NOT NULL DEFAULT false, -- lo marca el proceso de reversión
  anula_apunte_id (nullable) -> apuntes.id,  -- este apunte es el contraapunte de aquel
  concepto, creado_por -> miembros.id, created_at

  CHECK (tipo <> 'cargo' OR importe < 0)     -- un cargo siempre resta
  CHECK (tipo <> 'abono' OR importe > 0)     -- un abono siempre suma
  CHECK ((tipo = 'cargo') = (periodo IS NOT NULL))  -- periodo solo en cargos

  UNIQUE (miembro_id, periodo)
    WHERE tipo = 'cargo' AND anulado = false AND anula_apunte_id IS NULL

  -- Importe, miembro, periodo y tipo son INMUTABLES: nunca se editan ni se borran.
  -- 'anulado' es el ÚNICO campo mutable, y solo lo escribe la reversión.
  -- Las correcciones se hacen con contraapuntes, no editando.

operaciones             -- lotes reversibles (importaciones, devengos, carga inicial)
  id, tipo ('importacion' | 'devengo' | 'saldo_inicial'),
  periodo (nullable, para devengos), nombre_archivo (nullable),
  estado ('confirmada' | 'anulada'),
  ejecutado_por -> miembros.id, ejecutado_en,
  anulada_por (nullable) -> miembros.id, anulada_en (nullable)

-- (la antigua tabla 'importaciones' queda absorbida por 'operaciones')

transacciones           -- reflejo en bruto de lo que dice el banco
  id, lote_id -> operaciones.id,
  hash_unico text,      -- ver definición exacta más abajo
  fecha_valor date, importe numeric(10,2),
  ordenante text, ordenante_normalizado text, concepto text,
  datos_originales jsonb,   -- fila cruda del fichero, tal cual llegó
  miembro_id (nullable) -> miembros.id,
  estado ('conciliada' | 'pendiente' | 'descartada' | 'anulada')
  UNIQUE INDEX (hash_unico) WHERE estado <> 'anulada'   -- índice PARCIAL: permite reimportar tras revertir

productos
  id, nombre,
  categoria CHECK (categoria IN ('bebida','comida','desechables','limpieza','otros')),
  cantidad_actual numeric(10,2) NOT NULL DEFAULT 0,
  umbral_minimo  numeric(10,2) NOT NULL DEFAULT 0,
  orden smallint,                       -- control del orden de listado
  created_at
  -- cantidad_actual es FUENTE DE VERDAD, no dato derivado (ver §4.2)
  -- decimal, no entero: cubre unidades contables y magnitudes continuas (1,5 L)
  -- cantidad_actual solo se actualiza vía la función actualizar_stock() (RPC,
  --   SECURITY DEFINER): en la misma sentencia actualiza el producto e
  --   inserta el stock_log, así el histórico nunca puede desincronizarse
  --   del valor real. La política RLS de UPDATE de la tabla es solo-admin
  --   (nombre/categoria/umbral_minimo/orden); la función es el único camino
  --   para que cualquier miembro cambie la cantidad.

stock_log               -- auditoría de cambios de existencias. INMUTABLE
  id, producto_id -> productos.id ON DELETE CASCADE,
  miembro_id -> miembros.id,
  cantidad_anterior numeric(10,2), cantidad_nueva numeric(10,2),
  motivo CHECK (motivo IN ('reposicion','consumo','recuento','correccion')),
  nota text, created_at
  -- nunca se edita ni se borra individualmente, igual que los apuntes contables
  -- excepción: al borrar un producto se borra su histórico en cascada (decisión consciente)

proyectos
  id, nombre, descripcion,
  proyecto_padre_id (nullable) -> proyectos.id ON DELETE CASCADE,
  creador_id -> miembros.id,
  estado ('activo' | 'archivado'),
  created_at
  -- ANIDAMIENTO MÁXIMO 2 NIVELES: un proyecto con padre no puede ser padre de otro.
  --   Validar en la app (y en trigger si se quiere reforzar en BBDD).
  -- LOS PERMISOS SE HEREDAN: el acceso al padre da acceso a sus subproyectos.

proyecto_miembros
  PRIMARY KEY (proyecto_id, miembro_id)   -- impide permisos contradictorios
  proyecto_id -> proyectos.id ON DELETE CASCADE,
  miembro_id  -> miembros.id,
  permiso ('ver' | 'editar')
  -- El CREADOR tiene también su fila con permiso 'editar', aunque conste
  --   en proyectos.creador_id. Simplifica las políticas RLS: la pregunta pasa
  --   a ser "¿estás en la tabla?" en vez de encadenar casos especiales.

tareas
  id, proyecto_id -> proyectos.id ON DELETE CASCADE,
  titulo, descripcion,
  responsable_id (nullable) -> miembros.id,
  estado ('pendiente' | 'en_curso' | 'hecha'),
  orden smallint,        -- permite reordenar la lista
  created_at
  -- sin control de acceso propio: hereda el del proyecto

comentarios
  id, proyecto_id -> proyectos.id ON DELETE CASCADE,
  miembro_id -> miembros.id, texto, created_at
  -- sin control de acceso propio: hereda el del proyecto

fotos
  id, album CHECK (album IN ('merchandising','grupo')),
  storage_path text,        -- RUTA de Supabase Storage, NO una URL completa
  thumbnail_path text,      -- ídem para la miniatura
  tamano_bytes integer,     -- permite vigilar el consumo del plan gratuito
  subida_por -> miembros.id, created_at
  -- Nunca guardar URLs firmadas: caducan y dejarían la tabla llena de enlaces
  --   muertos. La app genera la URL válida en el momento de mostrar la imagen.
```

**Vistas derivadas (no tablas):**

- `v_saldo_miembro` — saldo actual de cada miembro (suma de apuntes), meses adeudados o adelantados, y resto en euros.
- `v_extracto_miembro` — apuntes cronológicos con saldo acumulado (función ventana `SUM() OVER (PARTITION BY miembro_id ORDER BY ...)`).
- `v_stock_bajo` — productos por debajo del umbral.

> ⚠️ **TRAMPA — el cálculo del saldo suma TODOS los apuntes, incluidos los anulados.**
>
> Es contraintuitivo y por eso es peligroso. La reversión ya corrige el saldo mediante el contraapunte: original −20 € más contraapunte +20 € suman cero. Si además se filtrara `WHERE anulado = false`, se eliminaría el −20 € pero se mantendría el +20 €, y el miembro aparecería con **20 € a favor que nunca pagó**.
>
> El flag `anulado` existe **únicamente** para los índices de unicidad y para poder atenuar visualmente esas líneas en el extracto. **Nunca para filtrar sumas.**

---

## 6. API

La aplicación debe **exponer servicios API** para permitir automatizaciones externas.

- Supabase genera automáticamente una API REST sobre las tablas, respetando RLS. Esa es la vía por defecto para lecturas.
- Para lógica propia, Route Handlers en Next.js. Endpoints previstos:
  - `POST /api/finanzas/importar` — subida y **previsualización** del extracto (no escribe).
  - `POST /api/finanzas/confirmar` — confirmación de la importación previsualizada.
  - `GET  /api/finanzas/saldos` — saldo de todos los miembros (deudores y adelantados).
  - `GET  /api/finanzas/miembro/:id/extracto` — apuntes con saldo acumulado.
  - `POST /api/finanzas/devengo` — genera los cargos del mes en curso (idempotente).
  - `GET  /api/finanzas/operaciones` — historial de importaciones y devengos.
  - `POST /api/finanzas/operaciones/:id/revertir` — anula un lote mediante contraapuntes (atómico, solo admin).
  - `GET  /api/finanzas/exportar` — libro de apuntes completo en CSV.
  - `GET  /api/almacen/bajo-minimos` — productos bajo umbral.
- Autenticación por token de Supabase. **Ningún endpoint sin autenticar.**

---

## 7. Guardarraíles para el desarrollo con Claude Code

Estas son instrucciones de proceso, tan importantes como las funcionales.

1. **Trabajar por fases, nunca la app entera de golpe.** Una fase, se valida, y se pasa a la siguiente. Generar todo junto produce código que no se puede revisar y arrastra errores.

2. **Mantener un `CLAUDE.md` en la raíz** con stack, convenciones y decisiones tomadas. Se actualiza al cerrar cada fase.

3. **RLS desde el primer momento.** Al crear una tabla, se crean sus políticas en el mismo paso. Nunca "ya lo aseguramos al final". Hay datos de pagos de 25 personas.

4. **Todo cambio de esquema va en una migración versionada** dentro del repositorio (`supabase/migrations/`). Nada de tocar el esquema a mano en el panel de Supabase.

5. **Austeridad con las dependencias.** No instalar una librería para algo que se resuelve en veinte líneas. Cada dependencia es deuda técnica futura.

6. **Nada de datos derivados almacenados** (deuda, totales, contadores). Se calculan con vistas.

7. **Toda escritura destructiva o masiva pasa por previsualización + confirmación.**

8. **Toda operación masiva debe ser reversible por lote.** Importaciones y devengos se agrupan en un lote identificable y se deshacen con contraapuntes, nunca borrando ni restaurando copias de la base de datos. La reversión va en una transacción atómica.

9. **TypeScript en modo estricto** y tipos generados desde el esquema de Supabase.

10. **Diseño móvil primero.** Cada pantalla se valida a 375 px de ancho antes de darla por buena.

---

## 8. Fases sugeridas

| Fase | Contenido | Entregable validable |
|---|---|---|
| 0 | Proyecto Next.js + Tailwind + Supabase + despliegue en Vercel | Web vacía desplegada |
| 1 | Autenticación, tabla `miembros`, roles, layout y navegación | Login funcionando, 25 usuarios dados de alta |
| 2 | Almacén (la sección más simple y de valor inmediato) | Consulta y edición de stock con log |
| 3 | Proyectos: proyectos, subproyectos, tareas, comentarios, permisos | Proyecto de remodelación en uso |
| 4 | Galería (con compresión en cliente) | Dos álbumes operativos |
| 5 | Organigrama | Pantalla de cachondeo |
| 6 | Finanzas: modelo de apuntes, devengo mensual, saldos y extracto | Saldos calculados sobre apuntes introducidos a mano |
| 7 | Finanzas: importación de extracto con conciliación y previsualización | Importación real desde el banco |
| 8 | PWA: manifest, service worker, instalación | App instalable en el móvil |

**Recomendación:** empezar por el Almacén y no por Finanzas. Es la sección más sencilla, valida el stack completo de punta a punta y da valor útil desde la primera semana. Finanzas es la que tiene más reglas delicadas y conviene abordarla con el terreno ya asentado.

---

## 9. Puntos abiertos

- Definir los cargos concretos del organigrama.
- Confirmar el formato exacto del extracto bancario: columnas disponibles y, sobre todo, **cómo aparece escrito el ordenante** (nombre completo, abreviado, truncado, en mayúsculas). Al ser el criterio principal de cruce, **condiciona directamente la fiabilidad de la conciliación**. Conviene exportar un extracto de muestra real y revisarlo antes de la fase 7.
- ⚠️ **Decidir el identificador único de transacción** a la vista de esa misma muestra: referencia propia del banco (preferente) o hash compuesto. Ver §4.1. Decisión de una sola vez, costosa de revertir.
- Recopilar el **nombre exacto del titular bancario de cada miembro** para precargar la tabla de alias y reducir el trabajo manual de las primeras importaciones.
- Decidir si en el futuro se activan notificaciones (PWA push vs. mensaje al grupo de WhatsApp desde la API).
- ⚠️ **Saldos iniciales de los 25 miembros — LOS APORTA EL PROPIETARIO DEL PROYECTO.** Bloquean la puesta en producción de Finanzas. Ver §4.1.1.

**Decisiones ya cerradas (no volver a preguntar):**

- Día de devengo: **el 5 de cada mes**, configurable por admin dentro del rango 1–28.
- Importe de la cuota: **20 € al mes**, configurable por admin.
- Momento cero: **el primer día de ejecución en producción**. No se reconstruye el histórico anterior.
- Altas y bajas: **fuera del alcance de la app**. Solo el campo `activo`.
