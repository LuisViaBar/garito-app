"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { startTransition, useEffect, useRef, useState } from "react";
import { ConfirmSheet } from "@/components/ui/bottom-sheet";
import { ButtonSecondary } from "@/components/ui/buttons";
import { EmptyState } from "@/components/ui/empty-state";
import { FormError } from "@/components/ui/field";
import { useAccion } from "@/lib/use-accion";
import { eliminarFoto } from "../actions";

export type FotoVista = {
  id: string;
  miniaturaUrl: string | null;
  fotoUrl: string | null;
  alias: string;
  fecha: string;
  puedeBorrar: boolean;
};

export function RejillaFotos({ fotos }: { fotos: FotoVista[] }) {
  const [abierta, setAbierta] = useState<number | null>(null);

  if (fotos.length === 0) {
    return <EmptyState>Todavía no hay fotos en este álbum.</EmptyState>;
  }

  return (
    <>
      <ul className="grid grid-cols-3 gap-1">
        {fotos.map((foto, i) => (
          <li key={foto.id}>
            <button
              type="button"
              onClick={() => setAbierta(i)}
              aria-label={`Ver foto de ${foto.alias}, ${foto.fecha}`}
              className="block aspect-square w-full overflow-hidden rounded-field bg-surface-sunk"
            >
              {foto.miniaturaUrl && (
                // <img> y no next/image: las URL firmadas cambian en cada carga
                // y caducan, y la miniatura ya viene reducida desde el cliente.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={foto.miniaturaUrl}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover"
                />
              )}
            </button>
          </li>
        ))}
      </ul>

      <Visor
        fotos={fotos}
        indice={abierta}
        onCambiar={setAbierta}
        onCerrar={() => setAbierta(null)}
      />
    </>
  );
}

/**
 * Foto a pantalla completa sobre un `<dialog>` nativo (foco atrapado, Escape y
 * capa superior gratis, como `BottomSheet`). La miniatura, que ya está en
 * caché, se ve al instante mientras llega la foto completa.
 */
function Visor({
  fotos,
  indice,
  onCambiar,
  onCerrar,
}: {
  fotos: FotoVista[];
  indice: number | null;
  onCambiar: (indice: number) => void;
  onCerrar: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [state, formAction, pending] = useAccion(eliminarFoto, () => {
    setConfirmando(false);
    onCerrar();
  });

  const foto = indice !== null ? fotos[indice] : undefined;
  const abierto = foto !== undefined;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (abierto && !dialog.open) dialog.showModal();
    if (!abierto && dialog.open) dialog.close();
  }, [abierto]);

  useEffect(() => {
    if (indice === null) return;
    const alPulsar = (e: KeyboardEvent) => {
      if (confirmando) return;
      if (e.key === "ArrowLeft" && indice > 0) onCambiar(indice - 1);
      if (e.key === "ArrowRight" && indice < fotos.length - 1) {
        onCambiar(indice + 1);
      }
    };
    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [indice, fotos.length, confirmando, onCambiar]);

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        onCerrar();
      }}
      aria-label="Foto"
      className="m-0 h-full max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-ink"
    >
      {foto && indice !== null && (
        <div className="mx-auto flex h-full w-full max-w-content flex-col bg-ink">
          <div className="relative min-h-0 flex-1">
            {foto.miniaturaUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={foto.miniaturaUrl}
                alt=""
                aria-hidden
                className="absolute inset-0 size-full object-contain"
              />
            )}
            {foto.fotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={foto.id}
                src={foto.fotoUrl}
                alt={`Foto de ${foto.alias}`}
                className="absolute inset-0 size-full object-contain"
              />
            ) : (
              <p className="absolute inset-0 flex items-center justify-center px-gutter text-center text-body text-ink-invert">
                No se ha podido cargar la foto. Recarga la página.
              </p>
            )}

            <button
              type="button"
              onClick={onCerrar}
              aria-label="Cerrar"
              className="absolute right-2 top-2 flex size-12 items-center justify-center rounded-pill bg-surface text-ink shadow-float"
            >
              <X size={24} strokeWidth={1.75} aria-hidden />
            </button>
            {indice > 0 && (
              <button
                type="button"
                onClick={() => onCambiar(indice - 1)}
                aria-label="Foto anterior"
                className="absolute left-2 top-1/2 flex size-12 -translate-y-1/2 items-center justify-center rounded-pill bg-surface text-ink shadow-float"
              >
                <ChevronLeft size={24} strokeWidth={1.75} aria-hidden />
              </button>
            )}
            {indice < fotos.length - 1 && (
              <button
                type="button"
                onClick={() => onCambiar(indice + 1)}
                aria-label="Foto siguiente"
                className="absolute right-2 top-1/2 flex size-12 -translate-y-1/2 items-center justify-center rounded-pill bg-surface text-ink shadow-float"
              >
                <ChevronRight size={24} strokeWidth={1.75} aria-hidden />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 bg-surface px-gutter pt-3 pb-safe">
            <div className="min-w-0 pb-3">
              <p className="truncate text-label font-bold">{foto.alias}</p>
              <p className="text-meta tabular-nums text-ink-2">
                {foto.fecha} · {indice + 1} de {fotos.length}
              </p>
              <FormError>{state.error}</FormError>
            </div>
            {foto.puedeBorrar && (
              <div className="pb-3">
                <ButtonSecondary
                  tone="danger"
                  disabled={pending}
                  onClick={() => setConfirmando(true)}
                >
                  {pending ? "Borrando…" : "Borrar"}
                </ButtonSecondary>
              </div>
            )}
          </div>

          <ConfirmSheet
            open={confirmando}
            title="¿Borrar la foto?"
            message="La foto desaparece de la galería para todos y no se puede deshacer."
            confirmLabel="Borrar foto"
            onConfirm={() => {
              setConfirmando(false);
              const datos = new FormData();
              datos.set("foto_id", foto.id);
              startTransition(() => formAction(datos));
            }}
            onCancel={() => setConfirmando(false)}
          />
        </div>
      )}
    </dialog>
  );
}
