"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { ButtonPrimary, ButtonSecondary } from "./buttons";

/**
 * Hoja inferior modal, sobre `<dialog>` nativo: foco atrapado, Escape y capa
 * superior gratis. Se cierra con Escape o pulsando fuera de la hoja.
 * Es un elemento flotante real, así que lleva sombra de elevación.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // El <dialog> ocupa toda la pantalla: un clic sobre él (y no sobre la
        // hoja de dentro) es un clic fuera.
        if (e.target === e.currentTarget) onClose();
      }}
      aria-label={title}
      className="m-0 h-full max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-ink/40"
    >
      <div className="flex h-full items-end justify-center">
        <div className="max-h-full w-full max-w-content overflow-y-auto rounded-t-card bg-surface px-gutter pt-5 shadow-float pb-safe">
          <h2 className="text-screen font-bold">{title}</h2>
          <div className="pb-5 pt-4">{children}</div>
        </div>
      </div>
    </dialog>
  );
}

/**
 * Confirmación de una acción destructiva o masiva: cancelar a la izquierda,
 * confirmar a la derecha.
 */
export function ConfirmSheet({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <BottomSheet open={open} onClose={onCancel} title={title}>
      <p className="text-body text-ink-2">{message}</p>
      <div className="mt-6 flex items-center justify-between gap-2">
        <ButtonSecondary onClick={onCancel}>Cancelar</ButtonSecondary>
        <ButtonPrimary onClick={onConfirm}>{confirmLabel}</ButtonPrimary>
      </div>
    </BottomSheet>
  );
}
