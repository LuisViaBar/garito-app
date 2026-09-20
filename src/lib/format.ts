const eur = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
});

const cantidad = new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 });

/** Importe en formato español con dos decimales: `20,00 €`. */
export function formatEUR(importe: number): string {
  return eur.format(importe);
}

/** Cantidad no monetaria (existencias, umbrales): `18`, `0,5`. */
export function formatCantidad(valor: number): string {
  return cantidad.format(valor);
}

// Zona horaria fija: el mismo texto en servidor (UTC en Vercel) y navegador,
// para que la hidratación no discrepe.
const fechaHora = new Intl.DateTimeFormat("es-ES", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "Europe/Madrid",
});

/** Fecha y hora de un `timestamptz`: `20/9/26, 18:30`. */
export function formatFechaHora(iso: string): string {
  return fechaHora.format(new Date(iso));
}
