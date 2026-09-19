"use client";

import { LogOut, X, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export type NavItem = { href: string; label: string; icon: LucideIcon };

const UMBRAL_ARRASTRE = 80; // px que hay que arrastrar hacia la izquierda para cerrar

function activo(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

/**
 * Menú lateral: entra desde la izquierda, 280 px, fondo de página atenuado.
 * Se cierra pulsando fuera, arrastrando hacia la izquierda, con la X o con
 * Escape. Cerrado, queda `inert` (sin foco ni lectura por pantalla).
 */
export function SideDrawer({
  open,
  onClose,
  items,
  usuario,
  onSalir,
}: {
  open: boolean;
  onClose: () => void;
  items: readonly NavItem[];
  usuario?: { alias: string; admin: boolean };
  /** Server action de cierre de sesión. */
  onSalir: () => void | Promise<void>;
}) {
  const pathname = usePathname();
  const panelRef = useRef<HTMLElement>(null);
  const inicioX = useRef<number | null>(null);
  const [arrastre, setArrastre] = useState(0);

  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    panel?.focus();
    document.body.style.overflow = "hidden";

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab" || !panel) return;
      // Atrapa el foco dentro del menú mientras está abierto.
      const enfocables = panel.querySelectorAll<HTMLElement>("a, button");
      const primero = enfocables[0];
      const ultimo = enfocables[enfocables.length - 1];
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  const fila =
    "flex h-14 w-full items-center gap-3 rounded-button px-3 text-left text-menu font-semibold";

  return (
    <>
      <div
        aria-hidden
        onClick={onClose}
        className={`fixed inset-0 z-20 bg-ink/40 transition-opacity ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <nav
        ref={panelRef}
        tabIndex={-1}
        inert={!open}
        aria-label="Menú principal"
        onTouchStart={(e) => {
          inicioX.current = e.touches[0].clientX;
        }}
        onTouchMove={(e) => {
          if (inicioX.current === null) return;
          setArrastre(Math.min(0, e.touches[0].clientX - inicioX.current));
        }}
        onTouchEnd={() => {
          if (arrastre < -UMBRAL_ARRASTRE) onClose();
          inicioX.current = null;
          setArrastre(0);
        }}
        style={
          open && arrastre !== 0
            ? { transform: `translateX(${arrastre}px)`, transition: "none" }
            : undefined
        }
        className={`fixed inset-y-0 left-0 z-30 flex w-70 flex-col bg-surface pb-safe pt-safe transition-transform outline-none ${
          open ? "translate-x-0 shadow-float" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center justify-between pl-5 pr-2">
          {usuario ? (
            <p className="min-w-0 truncate text-body font-semibold">
              {usuario.alias}
              {usuario.admin && (
                <span className="font-normal text-ink-2"> · admin</span>
              )}
            </p>
          ) : (
            <span />
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="flex size-12 shrink-0 items-center justify-center rounded-button text-ink"
          >
            <X size={22} strokeWidth={1.75} aria-hidden />
          </button>
        </div>

        <ul className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
          {items.map(({ href, label, icon: Icono }) => {
            const esActivo = activo(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onClose}
                  aria-current={esActivo ? "page" : undefined}
                  className={`${fila} ${esActivo ? "bg-surface-sunk" : ""}`}
                >
                  <Icono size={22} strokeWidth={1.75} aria-hidden />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>

        <form action={onSalir} className="border-t border-line-soft p-2">
          <button type="submit" className={`${fila} text-ink-2`}>
            <LogOut size={22} strokeWidth={1.75} aria-hidden />
            Salir
          </button>
        </form>
      </nav>
    </>
  );
}
