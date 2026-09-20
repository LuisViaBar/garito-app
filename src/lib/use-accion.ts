"use client";

import { useActionState, useEffect } from "react";
import type { AccionState } from "./types";

const inicial: AccionState = { error: null };

/**
 * `useActionState` para formularios que se cierran al guardar: cuando la
 * acción termina sin error se llama a `onHecho`.
 */
export function useAccion(
  accion: (prev: AccionState, formData: FormData) => Promise<AccionState>,
  onHecho?: () => void,
) {
  const [state, formAction, pending] = useActionState(accion, inicial);

  useEffect(() => {
    if (state !== inicial && !state.error) onHecho?.();
    // Solo reacciona a un nuevo resultado de la acción.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return [state, formAction, pending] as const;
}
