import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * La tarjeta de lista, el componente más usado de la app.
 *
 *   ● Nombre                      18   ›     ← fila principal
 *     Metadato                mín. 20
 *   ───────────────────────────────────────
 *   [ Acción 1 ]        [ Acción 2 ]         ← fila de acciones (opcional)
 *   ───────────────────────────────────────
 *   panel desplegable                        ← `panel` (opcional)
 *
 * Los objetivos pulsables nunca se anidan: la fila principal navega (si hay
 * `href`) y los botones viven en su propia fila, fuera del área de navegación.
 * Sin `href` la fila principal es solo informativa y no lleva chevron.
 */
export function ListCard({
  status,
  statusLabel,
  title,
  meta,
  value,
  valueNote,
  href,
  actions,
  panel,
}: {
  /** Punto de estado: rojo = atención, verde = correcto. Sin punto si se omite. */
  status?: "alert" | "ok";
  /** Texto para lectores de pantalla: el color solo no puede ser el único canal. */
  statusLabel?: string;
  title: string;
  meta?: string;
  value?: ReactNode;
  valueNote?: string;
  href?: string;
  actions?: ReactNode;
  panel?: ReactNode;
}) {
  const principal = (
    <>
      {status && (
        <span
          className={`size-2.5 shrink-0 rounded-pill ${
            status === "alert" ? "bg-alert" : "bg-ok"
          }`}
          aria-hidden
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-item font-bold">
          {statusLabel && <span className="sr-only">{statusLabel}: </span>}
          {title}
        </p>
        {meta && <p className="truncate text-meta text-ink-2">{meta}</p>}
      </div>
      {(value !== undefined || valueNote) && (
        <div className="shrink-0 text-right tabular-nums">
          {value !== undefined && (
            <p className="text-figure font-bold">{value}</p>
          )}
          {valueNote && <p className="text-meta text-ink-2">{valueNote}</p>}
        </div>
      )}
      {href && (
        <ChevronRight
          size={20}
          strokeWidth={1.75}
          className="shrink-0 text-ink-3"
          aria-hidden
        />
      )}
    </>
  );

  const filaPrincipal =
    "flex min-h-12 items-center gap-3 px-card-x py-card-y";

  return (
    <div className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
      {href ? (
        <Link href={href} className={filaPrincipal}>
          {principal}
        </Link>
      ) : (
        <div className={filaPrincipal}>{principal}</div>
      )}

      {actions && (
        <div className="grid grid-cols-2 gap-2 border-t border-line-soft px-card-x py-3">
          {actions}
        </div>
      )}

      {panel && (
        <div className="border-t border-line-soft px-card-x py-card-y">
          {panel}
        </div>
      )}
    </div>
  );
}

/** Contenedor de `ListCard` con la separación de lista (10 px). */
export function CardList({ children }: { children: ReactNode }) {
  return <ul className="flex flex-col gap-cards">{children}</ul>;
}
