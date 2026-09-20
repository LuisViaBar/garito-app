"use server";

import { revalidatePath } from "next/cache";
import { BUCKET_GALERIA, esAlbum, patronRuta } from "@/lib/galeria";
import { createClient } from "@/lib/supabase/server";
import type { AccionState } from "@/lib/types";

const SIN_PERMISO =
  "No se ha podido: no tienes permiso o la foto ya no existe.";

// Foto (2 MB, el límite del bucket) + miniatura, con margen: solo un tope
// contra valores absurdos; el límite de verdad lo pone el bucket.
const TAMANO_MAX = 4_000_000;

/**
 * Registra en `fotos` una foto que el navegador acaba de subir a Storage (la
 * subida va directa del navegador al bucket: un server action tiene tope de
 * 1 MB por petición). La fila la protege RLS (`subida_por` = uno mismo); aquí
 * solo se comprueba que las rutas tengan la forma esperada, para dar un error
 * legible antes de tocar la base de datos.
 */
export async function registrarFoto(datos: {
  album: string;
  ruta: string;
  miniatura: string;
  tamano: number;
}): Promise<AccionState> {
  const { album, ruta, miniatura, tamano } = datos;

  if (!esAlbum(album)) return { error: "Álbum no válido." };
  if (!patronRuta(album, false).test(ruta) || !patronRuta(album, true).test(miniatura)) {
    return { error: "Ruta de foto no válida." };
  }
  if (!Number.isInteger(tamano) || tamano <= 0 || tamano > TAMANO_MAX) {
    return { error: "Tamaño de foto no válido." };
  }

  const supabase = await createClient();

  // La política exige firmar como uno mismo: se resuelve el miembro aquí.
  const { data: miembroId, error: errorMiembro } =
    await supabase.rpc("miembro_actual_id");
  if (errorMiembro) return { error: errorMiembro.message };
  if (!miembroId) return { error: "Tu cuenta no está vinculada a ningún miembro." };

  const { error } = await supabase.from("fotos").insert({
    album,
    storage_path: ruta,
    thumbnail_path: miniatura,
    tamano_bytes: tamano,
    subida_por: miembroId,
  });

  if (error) {
    return {
      error:
        error.code === "42501"
          ? "No tienes permiso para subir fotos."
          : error.message,
    };
  }

  revalidatePath("/galeria", "layout");
  return { error: null };
}

/**
 * Borra una foto: primero la fila (RLS decide: quien la subió o un admin) y,
 * solo si ha prosperado, los dos ficheros de Storage. Ese orden importa: al
 * revés, un fallo dejaría una fila con la imagen rota en la galería; así, lo
 * peor que puede pasar es un fichero huérfano que ocupa espacio, y se avisa
 * en el log del servidor.
 */
export async function eliminarFoto(
  _prev: AccionState,
  formData: FormData,
): Promise<AccionState> {
  const id = ((formData.get("foto_id") as string | null) ?? "").trim();

  const supabase = await createClient();

  // Con RLS, un DELETE sin permiso no da error: afecta a 0 filas.
  const { data, error } = await supabase
    .from("fotos")
    .delete()
    .eq("id", id)
    .select("storage_path, thumbnail_path");

  if (error) {
    return {
      error: error.code === "42501" ? SIN_PERMISO : error.message,
    };
  }
  if (!data?.length) return { error: SIN_PERMISO };

  const rutas = data.flatMap((f) => [f.storage_path, f.thumbnail_path]);
  const { data: borrados, error: errorStorage } = await supabase.storage
    .from(BUCKET_GALERIA)
    .remove(rutas);

  // Storage tampoco da error si la política impide borrar: devuelve menos
  // objetos de los pedidos.
  if (errorStorage || (borrados?.length ?? 0) < rutas.length) {
    console.error("galeria: la foto se borró pero quedaron ficheros huérfanos", {
      rutas,
      error: errorStorage,
      borrados: borrados?.length ?? 0,
    });
  }

  revalidatePath("/galeria", "layout");
  return { error: null };
}
