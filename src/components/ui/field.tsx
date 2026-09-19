import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from "react";

const CONTROL =
  "h-12 w-full rounded-field border border-line bg-surface px-3 text-item text-ink placeholder:text-ink-3 disabled:opacity-50";

/** Etiqueta + control. Envuelve un `Input` o un `Select`. */
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-label font-medium text-ink-2">
      {label}
      {children}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${CONTROL} tabular-nums`} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={CONTROL} />;
}

/** Error de validación: rojo = atención. */
export function FormError({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="text-label text-alert">
      {children}
    </p>
  );
}
