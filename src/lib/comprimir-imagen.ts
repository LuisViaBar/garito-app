/**
 * Compresión de fotos en el navegador antes de subirlas (§4.5): las fotos de
 * móvil pesan 3-8 MB y el plan gratuito de Storage da ~1 GB. Sin librerías:
 * `canvas` basta. Solo cliente (usa DOM).
 *
 * Genera la foto (lado mayor ≤ 1600 px) y una miniatura (≤ 480 px, suficiente
 * para una rejilla de 3 columnas en pantalla de 3x). Nunca se sube el original.
 */

const LADO_FOTO = 1600;
const LADO_MINIATURA = 480;
// Calidades a probar, de mejor a peor, hasta que la foto quepa en el límite.
const CALIDADES_FOTO = [0.8, 0.65, 0.5];
const CALIDAD_MINIATURA = 0.7;
// Por debajo del límite de 2 MB del bucket con margen.
const PESO_MAX_FOTO = 1_500_000;

export type ImagenComprimida = { foto: Blob; miniatura: Blob };

type Origen = {
  fuente: CanvasImageSource;
  ancho: number;
  alto: number;
  liberar: () => void;
};

async function decodificar(archivo: File): Promise<Origen> {
  try {
    // `from-image` aplica la orientación EXIF: sin ella las fotos de móvil
    // hechas en vertical saldrían tumbadas.
    const bitmap = await createImageBitmap(archivo, {
      imageOrientation: "from-image",
    });
    return {
      fuente: bitmap,
      ancho: bitmap.width,
      alto: bitmap.height,
      liberar: () => bitmap.close(),
    };
  } catch {
    // Navegadores sin createImageBitmap con opciones: se decodifica con <img>,
    // que ya orienta según EXIF.
    const url = URL.createObjectURL(archivo);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return {
        fuente: img,
        ancho: img.naturalWidth,
        alto: img.naturalHeight,
        liberar: () => URL.revokeObjectURL(url),
      };
    } catch (error) {
      URL.revokeObjectURL(url);
      throw error;
    }
  }
}

function pintar(origen: Origen, ladoMax: number): HTMLCanvasElement {
  const escala = Math.min(1, ladoMax / Math.max(origen.ancho, origen.alto));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(origen.ancho * escala));
  canvas.height = Math.max(1, Math.round(origen.alto * escala));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("El navegador no permite procesar imágenes.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(origen.fuente, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function aBlob(
  canvas: HTMLCanvasElement,
  tipo: string,
  calidad: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error("No se pudo codificar la imagen.")),
      tipo,
      calidad,
    );
  });
}

// WebP pesa ~30 % menos que JPEG. Los Safari que no lo codifican devuelven un
// PNG en silencio (enorme para una foto): se detecta por el tipo del resultado
// y se recurre a JPEG.
async function codificar(canvas: HTMLCanvasElement, calidad: number) {
  const webp = await aBlob(canvas, "image/webp", calidad);
  if (webp.type === "image/webp") return webp;
  return aBlob(canvas, "image/jpeg", calidad);
}

/** Extensión de fichero según el tipo real del resultado (webp o jpg). */
export function extension(blob: Blob): "webp" | "jpg" {
  return blob.type === "image/webp" ? "webp" : "jpg";
}

export async function comprimirImagen(archivo: File): Promise<ImagenComprimida> {
  const origen = await decodificar(archivo);
  try {
    const canvasFoto = pintar(origen, LADO_FOTO);
    let foto = await codificar(canvasFoto, CALIDADES_FOTO[0]);
    for (const calidad of CALIDADES_FOTO.slice(1)) {
      if (foto.size <= PESO_MAX_FOTO) break;
      foto = await codificar(canvasFoto, calidad);
    }
    if (foto.size > PESO_MAX_FOTO) {
      throw new Error("La foto sigue pesando demasiado tras comprimirla.");
    }

    const miniatura = await codificar(
      pintar(origen, LADO_MINIATURA),
      CALIDAD_MINIATURA,
    );
    return { foto, miniatura };
  } finally {
    origen.liberar();
  }
}
