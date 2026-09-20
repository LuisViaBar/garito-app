"use client";

import { Camera } from "lucide-react";
import { useRef, useState } from "react";
import { ButtonPrimary } from "@/components/ui/buttons";
import { FormError } from "@/components/ui/field";
import { comprimirImagen, extension } from "@/lib/comprimir-imagen";
import { BUCKET_GALERIA } from "@/lib/galeria";
import { createClient } from "@/lib/supabase/client";
import type { Album } from "@/lib/types";
import { registrarFoto } from "../actions";

type Progreso = { actual: number; total: number };

export function SubirFotos({ album }: { album: Album }) {
  const input = useRef<HTMLInputElement>(null);
  const [progreso, setProgreso] = useState<Progreso | null>(null);
  const [errores, setErrores] = useState<string[]>([]);
  const [subidas, setSubidas] = useState(0);

  async function subir(archivos: File[]) {
    const supabase = createClient();
    const fallos: string[] = [];
    let correctas = 0;
    setErrores([]);
    setSubidas(0);

    // Una a una: comprimir una foto de 12 MP ocupa mucha memoria en un móvil.
    for (const [i, archivo] of archivos.entries()) {
      setProgreso({ actual: i + 1, total: archivos.length });
      try {
        await subirUna(supabase, album, archivo);
        correctas += 1;
      } catch (error) {
        fallos.push(
          `${archivo.name}: ${error instanceof Error ? error.message : "no se pudo subir."}`,
        );
      }
    }

    setProgreso(null);
    setErrores(fallos);
    setSubidas(correctas);
  }

  const subiendo = progreso !== null;

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          const archivos = Array.from(e.target.files ?? []);
          // Vaciar el input permite volver a elegir el mismo fichero.
          e.target.value = "";
          if (archivos.length > 0) void subir(archivos);
        }}
      />

      <div>
        <ButtonPrimary
          icon={<Camera size={20} strokeWidth={1.75} aria-hidden />}
          disabled={subiendo}
          onClick={() => input.current?.click()}
        >
          {subiendo ? "Subiendo…" : "Subir fotos"}
        </ButtonPrimary>
      </div>

      <div aria-live="polite" className="flex flex-col gap-1">
        {progreso && (
          <p className="text-label tabular-nums text-ink-2">
            Subiendo foto {progreso.actual} de {progreso.total}…
          </p>
        )}
        {!subiendo && subidas > 0 && (
          <p className="text-label tabular-nums text-ok">
            {subidas === 1 ? "1 foto subida." : `${subidas} fotos subidas.`}
          </p>
        )}
        {errores.map((error) => (
          <FormError key={error}>{error}</FormError>
        ))}
      </div>
    </div>
  );
}

async function subirUna(
  supabase: ReturnType<typeof createClient>,
  album: Album,
  archivo: File,
) {
  if (!archivo.type.startsWith("image/")) {
    throw new Error("no es una imagen.");
  }

  let comprimida;
  try {
    comprimida = await comprimirImagen(archivo);
  } catch {
    throw new Error("no se ha podido leer la imagen (prueba con JPG o PNG).");
  }
  const { foto, miniatura } = comprimida;

  const id = crypto.randomUUID();
  const ruta = `${album}/${id}.${extension(foto)}`;
  const rutaMiniatura = `${album}/${id}_mini.${extension(miniatura)}`;
  const bucket = supabase.storage.from(BUCKET_GALERIA);
  const opciones = (blob: Blob) => ({
    contentType: blob.type,
    cacheControl: "31536000", // el nombre es un UUID: el contenido nunca cambia
    upsert: false,
  });

  const { error: errorFoto } = await bucket.upload(ruta, foto, opciones(foto));
  if (errorFoto) throw new Error(errorFoto.message);

  const { error: errorMini } = await bucket.upload(
    rutaMiniatura,
    miniatura,
    opciones(miniatura),
  );
  if (errorMini) {
    await bucket.remove([ruta]);
    throw new Error(errorMini.message);
  }

  const { error } = await registrarFoto({
    album,
    ruta,
    miniatura: rutaMiniatura,
    tamano: foto.size + miniatura.size,
  });
  if (error) {
    // Sin fila no hay quien vea estos ficheros ni quien los borre: se retiran.
    await bucket.remove([ruta, rutaMiniatura]);
    throw new Error(error);
  }
}
