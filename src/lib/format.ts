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
