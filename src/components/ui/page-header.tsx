import type { ReactNode } from "react";

/**
 * Título de sección en Display a la izquierda y hueco a la derecha para la
 * ilustración de la sección. Altura fija: la ilustración no descoloca el
 * contenido al cargar.
 */
export function PageHeader({
  title,
  illustration,
}: {
  title: string;
  illustration?: ReactNode;
}) {
  return (
    <header className="flex h-20 items-center justify-between gap-4">
      <h1 className="font-display text-section tracking-display">{title}</h1>
      {illustration && (
        <div className="flex h-full shrink-0 items-center">{illustration}</div>
      )}
    </header>
  );
}
