import { createClient } from "@/lib/supabase/server";
import type { Miembro, Producto } from "@/lib/types";
import { ListaProductos } from "./almacen-client";

export default async function AlmacenPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: miembro } = user
    ? await supabase
        .from("miembros")
        .select("*")
        .eq("auth_user_id", user.id)
        .maybeSingle<Miembro>()
    : { data: null };

  const [
    { data: productos, error: errorProductos },
    { data: bajos, error: errorBajos },
  ] = await Promise.all([
    supabase
      .from("productos")
      .select("*")
      .order("orden", { ascending: true, nullsFirst: false })
      .order("nombre", { ascending: true })
      .returns<Producto[]>(),
    supabase.from("v_stock_bajo").select("id").returns<{ id: string }[]>(),
  ]);

  if (errorProductos) console.error("almacen: error al leer productos", errorProductos);
  if (errorBajos) console.error("almacen: error al leer v_stock_bajo", errorBajos);

  const bajosIds = new Set((bajos ?? []).map((p) => p.id));

  return (
    <main className="flex-1">
      <ListaProductos
        productos={productos ?? []}
        bajosIds={bajosIds}
        esAdmin={miembro?.rol === "admin"}
      />
    </main>
  );
}
