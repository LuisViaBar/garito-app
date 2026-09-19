import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Pastilla de resumen a ancho completo ("5 productos bajo mínimos").
 * - Con `count > 0` y `onClick`: pulsable entera, icono y texto en rojo, chevron.
 * - Con `count === 0` (o sin `onClick`): texto neutro, sin chevron ni color.
 */
export function SummaryPill({
  count,
  icon,
  children,
  onClick,
  pressed,
}: {
  count: number;
  icon: ReactNode;
  children: ReactNode;
  onClick?: () => void;
  /** Estado del filtro que activa la pastilla, si lo hay. */
  pressed?: boolean;
}) {
  const base =
    "flex h-13 w-full items-center gap-3 rounded-button border border-line px-4 shadow-card text-left text-body";

  if (count === 0 || !onClick) {
    return (
      <div className={`${base} bg-surface text-ink-2`}>
        {icon}
        <span className="min-w-0 flex-1">{children}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={`${base} font-medium text-alert ${pressed ? "bg-surface-sunk" : "bg-surface"}`}
    >
      {icon}
      <span className="min-w-0 flex-1">{children}</span>
      <ChevronRight
        size={20}
        strokeWidth={1.75}
        className={`shrink-0 text-ink-3 ${pressed ? "rotate-90" : ""}`}
        aria-hidden
      />
    </button>
  );
}
