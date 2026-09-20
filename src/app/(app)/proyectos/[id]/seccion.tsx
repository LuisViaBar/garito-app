import type { ReactNode } from "react";

/** Bloque de la pantalla de detalle: título de pantalla interior + contenido. */
export function Seccion({
  titulo,
  children,
}: {
  titulo: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-screen font-bold">{titulo}</h2>
      {children}
    </section>
  );
}
