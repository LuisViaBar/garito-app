import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Comun = {
  icon?: ReactNode;
  fullWidth?: boolean;
  children: ReactNode;
};

type ComoBoton = Comun &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
    href?: undefined;
  };

type ComoEnlace = Comun & { href: string };

type Props = ComoBoton | ComoEnlace;

const BASE =
  "inline-flex h-12 min-w-12 items-center justify-center gap-2 rounded-button select-none disabled:opacity-50";

function render(clases: string, { icon, fullWidth, children, ...resto }: Props) {
  const clase = `${BASE} ${fullWidth ? "w-full" : ""} ${clases}`;
  const contenido = (
    <>
      {icon}
      {children}
    </>
  );

  if (resto.href !== undefined) {
    return (
      <Link href={resto.href} className={clase}>
        {contenido}
      </Link>
    );
  }

  const { type = "button", ...botonProps } = resto;
  return (
    <button type={type} className={clase} {...botonProps}>
      {contenido}
    </button>
  );
}

/**
 * Acción principal de la pantalla. Fondo negro, ancho automático, alineado a
 * la izquierda. Máximo uno por pantalla.
 */
export function ButtonPrimary(props: Props) {
  return render(
    "bg-action px-5 text-body font-semibold text-ink-invert hover:bg-action-hover",
    props,
  );
}

/**
 * Acción secundaria: borde, sin relleno. Sustituye a los enlaces subrayados.
 * `tone="danger"` para acciones destructivas (rojo = atención).
 * Si lleva `aria-expanded`, se ve "pulsado" mientras el panel está abierto.
 */
export function ButtonSecondary({
  tone = "neutral",
  ...props
}: Props & { tone?: "neutral" | "danger" }) {
  return render(
    `border border-line bg-transparent px-4 text-label font-medium aria-expanded:bg-surface-sunk ${
      tone === "danger" ? "text-alert" : "text-ink"
    }`,
    props,
  );
}
