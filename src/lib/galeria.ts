import type { Album } from "./types";

/** Los dos álbumes son fijos (§4.5): no hay gestión de álbumes. */
export const ALBUMES: readonly { id: Album; nombre: string }[] = [
  { id: "merchandising", nombre: "Merchandising" },
  { id: "grupo", nombre: "Fotos del grupo" },
];

export const BUCKET_GALERIA = "galeria";

/** Plan gratuito de Supabase Storage (§4.5: "~1 GB"), para mostrar el consumo. */
export const LIMITE_STORAGE_BYTES = 1024 ** 3;

export function esAlbum(valor: string): valor is Album {
  return ALBUMES.some((a) => a.id === valor);
}

export function nombreAlbum(album: Album): string {
  return ALBUMES.find((a) => a.id === album)!.nombre;
}

/**
 * Forma de una ruta de Storage: `<album>/<uuid>.<webp|jpg>` para la foto y
 * `<album>/<uuid>_mini.<webp|jpg>` para la miniatura. Compartida por cliente
 * (que la genera) y servidor (que la valida antes de registrarla).
 */
export function patronRuta(album: Album, miniatura: boolean): RegExp {
  const sufijo = miniatura ? "_mini" : "";
  return new RegExp(
    `^${album}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}${sufijo}\\.(webp|jpg)$`,
  );
}
