# Garito — Instrucciones para el tesorero

Manual de uso de la sección **Finanzas**. Complementa al documento de diseño funcional y técnico.

Estas acciones solo las puede hacer un usuario **admin**. El resto de miembros solo consulta.

---

## Lo que tienes que entender antes de empezar

La app **no** lleva un registro de "este mes pagado sí / no". Lleva una **cuenta corriente** por miembro, como la de un banco:

- Cada día 5 se genera un **cargo** de 20 € a cada miembro activo.
- Cada ingreso conciliado genera un **abono**.
- El **saldo** es la resta de las dos cosas.

| Saldo | Significa |
|---|---|
| Negativo | Debe dinero |
| Cero | Al corriente |
| Positivo | Ha pagado por adelantado |

**Consecuencia práctica:** no tienes que decidir a qué mes corresponde cada pago. Si alguien te ingresa 60 €, el saldo sube 60 € y ya está. La app calcula sola cuántos meses son.

**No edites ni borres apuntes.** No se puede, y es a propósito. Si algo está mal, se corrige añadiendo otro apunte o revirtiendo la operación entera.

---

## Escenario 1 — Rutina mensual (lo que harás casi siempre)

Cinco minutos desde el móvil.

1. **Día 5 o después** — entra en Finanzas y pulsa **Generar devengo del mes**.
   - Verifica: debe decir que ha generado tantos cargos como miembros activos tengas.
   - Si ya lo lanzaste, no pasa nada: te dirá que ya estaba hecho y no duplicará.

2. **Exporta del banco** el fichero de ingresos.
   - Pide **45 o 60 días**, no 30. El solape no molesta y evita perder ingresos de frontera.

3. **Súbelo** a la app y espera a la **previsualización**.

4. **Revisa la previsualización.** Fíjate en tres números:
   - Cuántas transacciones son nuevas.
   - Cuántas se descartan por estar ya importadas → **esto es normal**, es el solape.
   - Cuántas quedan **sin reconocer** → hay que resolverlas antes de confirmar.

5. **Resuelve las no reconocidas** (ver escenario 2).

6. **Confirma.** Hasta que no confirmes, no se ha escrito nada.

7. **Comprueba la pantalla de saldos.** Si alguien que ha pagado sigue apareciendo en rojo, algo se quedó sin conciliar.

---

## Escenario 2 — Una transacción no aparece asignada

Normal, sobre todo los primeros meses. El banco escribe los nombres a su manera.

1. En la bandeja de revisión, mira el ordenante y el importe.
2. Elige el miembro de la lista.
3. La app **memoriza** ese nombre bancario. El mes que viene ya se conciliará sola.

**Verificación:** si dudas de quién es, **no lo asignes**. Pregunta primero. Marcar como pagado a quien no ha pagado es el peor error que puedes cometer aquí, porque nadie lo va a detectar.

---

## Escenario 3 — Un ingreso que no es una cuota

Alguien ingresa dinero para otra cosa (una derrama, una compra conjunta, un error).

- En la previsualización, márcalo como **descartada**.
- No genera abono y no afecta a ningún saldo.
- Si ese dinero sí debe contar para alguien, hazlo después con un **ajuste manual** (escenario 6).

---

## Escenario 4 — Alguien paga varios meses de golpe, o por adelantado

**No hagas nada especial.** Lo único que tienes que hacer es conciliarlo con esa persona.

- Paga 80 € debiendo 60 → su saldo pasa a +20 €, queda un mes adelantado.
- Paga 120 € estando al día → seis meses por delante. Los cargos de los próximos meses irán consumiendo ese saldo solos.

La pantalla de saldos te lo muestra ya traducido a meses.

---

## Escenario 5 — Me he equivocado en una importación o en un devengo

No restaures nada ni toques la base de datos. Usa **revertir**.

1. Ve al **historial de operaciones**.
2. Localiza la operación (verás fecha, quién la hizo y cuántos apuntes generó).
3. Pulsa **Revertir** y confirma.
4. La app genera un apunte contrario por cada uno. Los saldos vuelven a como estaban.
5. **Puedes volver a importar el mismo fichero** corregido.

**Qué verás después:** los apuntes anulados siguen visibles, atenuados, junto a sus contrarios. Es correcto. El histórico no se borra nunca, solo se corrige.

**Lo que no se puede hacer:** revertir una reversión. Si te lías, vuelve a importar.

---

## Escenario 6 — Ajuste manual

Para lo que no viene del banco: una derrama, una condonación, corregir un error concreto, o dinero que entró por otra vía.

1. Entra en el miembro.
2. Añade un apunte de tipo **ajuste**, con importe y un concepto claro.
   - Negativo = le cargas dinero.
   - Positivo = le abonas dinero.
3. **Escribe siempre un concepto explicativo.** Dentro de seis meses no te acordarás.

---

## Escenario 7 — Arranque (una sola vez)

Antes de usar la app en serio hay que cargar con qué saldo empieza cada uno.

1. Reúne los 25 saldos iniciales. Negativo si venía debiendo, positivo si venía adelantado.
2. Cárgalos como operación de tipo **saldo inicial**.
3. **Revísalos uno a uno antes de confirmar.** Es la operación más delicada de todas: son cifras tecleadas a mano y no hay nada con lo que contrastarlas.
4. Si te equivocas, es un lote reversible: puedes deshacerla entera y repetir.

---

## Escenario 8 — Ver el detalle de un miembro

Entra en su ficha y verás su extracto: todos sus apuntes en orden con el saldo acumulado, igual que una cuenta bancaria.

Es lo que debes enseñarle a alguien que te discuta lo que debe.

---

## Cierre mensual — verificaciones recomendadas

Cada mes, después de confirmar la importación:

- [ ] El número de cargos del devengo coincide con el número de miembros activos.
- [ ] No queda ninguna transacción en la bandeja de revisión.
- [ ] Nadie con saldo raro: un número que no sea múltiplo aproximado de 20 € merece una mirada.
- [ ] **Exporta el libro de apuntes a CSV** y guárdalo donde quieras. Es tu copia fuera del sistema.

---

## Resumen de qué hace cada cosa

| Acción | Cuándo | Se puede deshacer |
|---|---|---|
| Generar devengo | Día 5 de cada mes | Sí, revirtiendo el lote |
| Importar extracto | Después del devengo | Sí, revirtiendo el lote |
| Asignar transacción | En la previsualización | Sí, antes de confirmar |
| Descartar transacción | En la previsualización | Sí, antes de confirmar |
| Ajuste manual | Cuando haga falta | Con otro ajuste contrario |
| Carga de saldos iniciales | Una sola vez | Sí, revirtiendo el lote |
| Exportar CSV | Cada cierre mensual | No modifica nada |

---

## Tres cosas que no debes hacer

1. **Asignar una transacción "a ver si cuela".** Ante la duda, pregunta.
2. **Ajustar la ventana de exportación del banco para que sea exacta.** Exporta de más.
3. **Intentar cuadrar un saldo editando apuntes.** No se puede, y no hace falta: se corrige añadiendo.
