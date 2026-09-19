import type { ReactNode } from "react";

/**
 * Estado vacío de una lista. Toda lista tiene el suyo: una lista vacía sin
 * explicación parece una app rota. `action` es la acción primaria si procede.
 */
export function EmptyState({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-card bg-surface-sunk px-card-x py-8 text-center text-body text-ink-2">
      <p>{children}</p>
      {action}
    </div>
  );
}
