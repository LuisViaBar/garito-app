import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Miembro } from "@/lib/types";
import { logout } from "./actions";

const SECCIONES = [
  { href: "/", label: "Inicio" },
  { href: "/finanzas", label: "Finanzas" },
  { href: "/almacen", label: "Almacén" },
  { href: "/proyectos", label: "Proyectos" },
  { href: "/organigrama", label: "Organigrama" },
  { href: "/galeria", label: "Galería" },
] as const;

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

  return (
    <>
      <header className="border-b border-gray-200">
        <div className="flex items-center justify-between gap-3 px-4 py-2 text-sm">
          {miembro && (
            <span className="whitespace-nowrap text-gray-500">
              {miembro.alias}
              {miembro.rol === "admin" && " · admin"}
            </span>
          )}
          <form action={logout} className="ml-auto shrink-0">
            <button type="submit" className="text-gray-700 underline">
              Salir
            </button>
          </form>
        </div>
        <nav className="flex items-center gap-4 overflow-x-auto border-t border-gray-100 px-4 py-2 text-sm">
          {SECCIONES.map((seccion) => (
            <Link
              key={seccion.href}
              href={seccion.href}
              className="whitespace-nowrap text-gray-700 hover:text-gray-950"
            >
              {seccion.label}
            </Link>
          ))}
        </nav>
      </header>

      {user && !miembro ? (
        <main className="flex-1 flex items-center justify-center p-6 text-center text-sm text-gray-600">
          Tu cuenta no está vinculada a ningún miembro todavía. Contacta con
          el admin.
        </main>
      ) : (
        children
      )}
    </>
  );
}
