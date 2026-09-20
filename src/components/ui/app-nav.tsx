"use client";

import {
  Hammer,
  House,
  Image as ImageIcon,
  Package,
  Users,
  Wallet,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { AppBar } from "./app-bar";
import { SideDrawer, type NavItem } from "./side-drawer";

// Orden del menú fijado por el sistema de diseño (§5.8) e iconos por sección (§7).
const SECCIONES: readonly NavItem[] = [
  { href: "/", label: "Inicio", icon: House },
  { href: "/finanzas", label: "Finanzas", icon: Wallet },
  { href: "/almacen", label: "Almacén", icon: Package },
  { href: "/proyectos", label: "Proyectos", icon: Hammer },
  { href: "/organigrama", label: "Organigrama", icon: Users },
  { href: "/galeria", label: "Galería", icon: ImageIcon },
];

/**
 * Barra superior + menú lateral: la navegación de toda la app. En una pantalla
 * de detalle (`/seccion/algo`) la hamburguesa se sustituye por la flecha de
 * volver a la pantalla de nivel superior, que es la misma ruta sin el último
 * segmento (sistema de diseño §8).
 */
export function AppNav({
  usuario,
  onSalir,
}: {
  usuario?: { alias: string; admin: boolean };
  onSalir: () => void | Promise<void>;
}) {
  const [abierto, setAbierto] = useState(false);
  const segmentos = usePathname().split("/").filter(Boolean);
  const hamburguesa = useRef<HTMLButtonElement>(null);

  const cerrar = useCallback(() => {
    setAbierto(false);
    hamburguesa.current?.focus();
  }, []);

  return (
    <>
      <AppBar
        ref={hamburguesa}
        onMenu={() => setAbierto(true)}
        backHref={
          segmentos.length > 1 ? `/${segmentos.slice(0, -1).join("/")}` : undefined
        }
      />
      <SideDrawer
        open={abierto}
        onClose={cerrar}
        items={SECCIONES}
        usuario={usuario}
        onSalir={onSalir}
      />
    </>
  );
}
