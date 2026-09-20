import { notFound } from "next/navigation";
import { ButtonSecondary } from "@/components/ui/buttons";
import { PageHeader } from "@/components/ui/page-header";
import { formatFechaHora } from "@/lib/format";
import { BUCKET_GALERIA, esAlbum, nombreAlbum } from "@/lib/galeria";
import { createClient } from "@/lib/supabase/server";
import type { Foto, Miembro } from "@/lib/types";
import { RejillaFotos, type FotoVista } from "./rejilla";
import { SubirFotos } from "./subir-fotos";

// Fotos por tanda. Se cargan solo miniaturas, pero cada una lleva su URL firmada.
const POR_TANDA = 60;
// Las URL firmadas caducan (§4.5): esta hora sobra para una visita.
const CADUCIDAD_URL_S = 3600;

type FilaFoto = Pick<
  Foto,
  "id" | "storage_path" | "thumbnail_path" | "subida_por" | "created_at"
> & { miembro: { alias: string } | null };

export default async function AlbumPage({
  params,
  searchParams,
}: {
  params: Promise<{ album: string }>;
  searchParams: Promise<{ n?: string }>;
}) {
  const { album } = await params;
  if (!esAlbum(album)) notFound();

  const { n } = await searchParams;
  const limite = Math.min(
    Math.max(Number.parseInt(n ?? "", 10) || POR_TANDA, POR_TANDA),
    1000,
  );

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: miembro } = user
    ? await supabase
        .from("miembros")
        .select("id, rol")
        .eq("auth_user_id", user.id)
        .maybeSingle<Pick<Miembro, "id" | "rol">>()
    : { data: null };

  const { data, error, count } = await supabase
    .from("fotos")
    .select(
      "id, storage_path, thumbnail_path, subida_por, created_at, miembro:miembros(alias)",
      { count: "exact" },
    )
    .eq("album", album)
    .order("created_at", { ascending: false })
    .range(0, limite - 1)
    .returns<FilaFoto[]>();

  if (error) console.error("galeria: error al leer fotos", error);

  const filas = data ?? [];
  const total = count ?? filas.length;

  // Las URL no se guardan (§4.5): se firman ahora, en lote, para las
  // miniaturas y las fotos completas que abre el visor.
  const rutas = filas.flatMap((f) => [f.thumbnail_path, f.storage_path]);
  const urls = new Map<string, string>();
  if (rutas.length > 0) {
    const { data: firmadas, error: errorFirma } = await supabase.storage
      .from(BUCKET_GALERIA)
      .createSignedUrls(rutas, CADUCIDAD_URL_S);
    if (errorFirma) console.error("galeria: error al firmar URLs", errorFirma);
    for (const f of firmadas ?? []) {
      if (f.path && f.signedUrl) urls.set(f.path, f.signedUrl);
      else console.error("galeria: no se pudo firmar", f.path, f.error);
    }
  }

  const esAdmin = miembro?.rol === "admin";
  const fotos: FotoVista[] = filas.map((f) => ({
    id: f.id,
    miniaturaUrl: urls.get(f.thumbnail_path) ?? null,
    fotoUrl: urls.get(f.storage_path) ?? null,
    alias: f.miembro?.alias ?? "—",
    fecha: formatFechaHora(f.created_at),
    puedeBorrar: esAdmin || f.subida_por === miembro?.id,
  }));

  return (
    <>
      <PageHeader title={nombreAlbum(album)} />

      <SubirFotos album={album} />

      <RejillaFotos fotos={fotos} />

      {total > filas.length && (
        <div className="flex flex-col items-center gap-3">
          <p className="text-meta tabular-nums text-ink-2">
            Mostrando {filas.length} de {total}
          </p>
          <ButtonSecondary
            href={`/galeria/${album}?n=${limite + POR_TANDA}`}
          >
            Ver más fotos
          </ButtonSecondary>
        </div>
      )}
    </>
  );
}
