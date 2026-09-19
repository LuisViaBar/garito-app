import { ArrowLeft, Menu } from "lucide-react";
import Link from "next/link";
import { forwardRef } from "react";

/**
 * Barra superior de 56 px, sin título (el título vive en `PageHeader`).
 * Izquierda: hamburguesa (pantallas de sección) o flecha de volver (detalle).
 * Los botones miden 48×48 aunque el icono dibujado sea de 24.
 */
export const AppBar = forwardRef<
  HTMLButtonElement,
  { onMenu?: () => void; backHref?: string }
>(function AppBar({ onMenu, backHref }, ref) {
  const boton =
    "-ml-3 flex size-12 items-center justify-center rounded-button text-ink";

  return (
    <div className="sticky top-0 z-10 bg-page pt-safe">
      <div className="flex h-14 items-center">
        {backHref ? (
          <Link href={backHref} className={boton} aria-label="Volver">
            <ArrowLeft size={24} strokeWidth={1.75} aria-hidden />
          </Link>
        ) : (
          <button
            ref={ref}
            type="button"
            onClick={onMenu}
            className={boton}
            aria-label="Abrir menú"
          >
            <Menu size={24} strokeWidth={1.75} aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
});
