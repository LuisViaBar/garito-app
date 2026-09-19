import { AppNav } from "@/components/ui/app-nav";
import { createClient } from "@/lib/supabase/server";
import type { Miembro } from "@/lib/types";
import { logout } from "./actions";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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

  // Una sola columna de 480 px máx., centrada en escritorio.
  return (
    <div className="mx-auto flex w-full max-w-content flex-1 flex-col px-gutter pb-safe">
      <AppNav
        usuario={
          miembro
            ? { alias: miembro.alias, admin: miembro.rol === "admin" }
            : undefined
        }
        onSalir={logout}
      />

      {user && !miembro ? (
        <main className="flex flex-1 items-center justify-center text-center text-body text-ink-2">
          Tu cuenta no está vinculada a ningún miembro todavía. Contacta con
          el admin.
        </main>
      ) : (
        <main className="flex flex-1 flex-col gap-5 pb-10">
          {children}
        </main>
      )}
    </div>
  );
}
