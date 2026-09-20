import { CardList, ListCard } from "@/components/ui/list-card";
import { PageHeader } from "@/components/ui/page-header";
import { formatBytes, formatCantidad } from "@/lib/format";
import { ALBUMES, LIMITE_STORAGE_BYTES } from "@/lib/galeria";
import { createClient } from "@/lib/supabase/server";
import type { Miembro } from "@/lib/types";

export default async function GaleriaPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: miembro } = user
    ? await supabase
        .from("miembros")
        .select("rol")
        .eq("auth_user_id", user.id)
        .maybeSingle<Pick<Miembro, "rol">>()
    : { data: null };
  const esAdmin = miembro?.rol === "admin";

  const [conteos, { data: uso, error: errorUso }] = await Promise.all([
    Promise.all(
      ALBUMES.map((album) =>
        supabase
          .from("fotos")
          .select("id", { count: "exact", head: true })
          .eq("album", album.id),
      ),
    ),
    // Solo el admin ve el consumo (la vista devuelve ceros a los demás).
    esAdmin
      ? supabase
          .from("v_uso_galeria")
          .select("fotos, bytes")
          .maybeSingle<{ fotos: number; bytes: number }>()
      : Promise.resolve({ data: null, error: null }),
  ]);

  conteos.forEach(({ error }, i) => {
    if (error) console.error(`galeria: error al contar ${ALBUMES[i].id}`, error);
  });
  if (errorUso) console.error("galeria: error al leer v_uso_galeria", errorUso);

  const porcentaje = uso
    ? Math.round((uso.bytes / LIMITE_STORAGE_BYTES) * 100)
    : null;

  return (
    <>
      <PageHeader title="Galería" />

      <CardList>
        {ALBUMES.map((album, i) => {
          const total = conteos[i].count ?? 0;
          return (
            <li key={album.id}>
              <ListCard
                title={album.nombre}
                meta={total === 1 ? "1 foto" : `${formatCantidad(total)} fotos`}
                href={`/galeria/${album.id}`}
              />
            </li>
          );
        })}
      </CardList>

      {uso && porcentaje !== null && (
        <p
          className={`text-meta tabular-nums ${
            porcentaje >= 80 ? "text-alert" : "text-ink-2"
          }`}
        >
          Espacio de la galería: {formatBytes(uso.bytes)} de{" "}
          {formatBytes(LIMITE_STORAGE_BYTES)} ({porcentaje} %)
        </p>
      )}
    </>
  );
}
