"use client";

import {
  Hammer,
  House,
  Image as ImageIcon,
  Package,
  Users,
  Wallet,
} from "lucide-react";
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

/** Barra superior + menú lateral: la navegación de toda la app. */
export function AppNav({
  usuario,
  onSalir,
}: {
  usuario?: { alias: string; admin: boolean };
  onSalir: () => void | Promise<void>;
}) {
  const [abierto, setAbierto] = useState(false);
  const hamburguesa = useRef<HTMLButtonElement>(null);

  const cerrar = useCallback(() => {
    setAbierto(false);
    hamburguesa.current?.focus();
  }, []);

  return (
    <>
      <AppBar ref={hamburguesa} onMenu={() => setAbierto(true)} />
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
