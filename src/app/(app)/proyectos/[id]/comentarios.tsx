"use client";

import { startTransition, useState } from "react";
import { ConfirmSheet } from "@/components/ui/bottom-sheet";
import { ButtonSecondary } from "@/components/ui/buttons";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, FormError, Textarea } from "@/components/ui/field";
import { useAccion } from "@/lib/use-accion";
import { eliminarComentario, publicarComentario } from "../actions";

export type ComentarioVista = {
  id: string;
  alias: string;
  texto: string;
  fecha: string;
  puedeBorrar: boolean;
};

export function Comentarios({
  proyectoId,
  comentarios,
  puedeComentar,
}: {
  proyectoId: string;
  comentarios: ComentarioVista[];
  puedeComentar: boolean;
}) {
  // Cambiar la `key` del formulario lo vacía tras publicar.
  const [version, setVersion] = useState(0);

  return (
    <div className="flex flex-col gap-4">
      {puedeComentar && (
        <NuevoComentario
          key={version}
          proyectoId={proyectoId}
          onPublicado={() => setVersion((v) => v + 1)}
        />
      )}

      {comentarios.length === 0 ? (
        <EmptyState>Todavía no hay comentarios.</EmptyState>
      ) : (
        <ul className="flex flex-col gap-cards">
          {comentarios.map((comentario) => (
            <li key={comentario.id}>
              <TarjetaComentario comentario={comentario} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NuevoComentario({
  proyectoId,
  onPublicado,
}: {
  proyectoId: string;
  onPublicado: () => void;
}) {
  const [state, formAction, pending] = useAccion(publicarComentario, onPublicado);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="proyecto_id" value={proyectoId} />

      <Field label="Nuevo comentario">
        <Textarea name="texto" required />
      </Field>

      <FormError>{state.error}</FormError>

      <div>
        <ButtonSecondary type="submit" disabled={pending}>
          {pending ? "Publicando…" : "Publicar comentario"}
        </ButtonSecondary>
      </div>
    </form>
  );
}

function TarjetaComentario({ comentario }: { comentario: ComentarioVista }) {
  const [state, formAction, pending] = useAccion(eliminarComentario);
  const [confirmando, setConfirmando] = useState(false);

  return (
    <div className="flex flex-col gap-2 rounded-card border border-line bg-surface px-card-x py-card-y shadow-card">
      <p className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 truncate text-label font-bold">
          {comentario.alias}
        </span>
        <span className="shrink-0 text-meta tabular-nums text-ink-2">
          {comentario.fecha}
        </span>
      </p>
      <p className="whitespace-pre-line break-words text-body">
        {comentario.texto}
      </p>

      {comentario.puedeBorrar && (
        <>
          <FormError>{state.error}</FormError>
          <div>
            <ButtonSecondary
              tone="danger"
              disabled={pending}
              onClick={() => setConfirmando(true)}
            >
              {pending ? "Borrando…" : "Borrar"}
            </ButtonSecondary>
          </div>

          <ConfirmSheet
            open={confirmando}
            title="¿Borrar el comentario?"
            message="El comentario desaparece del tablón y no se puede deshacer."
            confirmLabel="Borrar comentario"
            onConfirm={() => {
              setConfirmando(false);
              const datos = new FormData();
              datos.set("comentario_id", comentario.id);
              startTransition(() => formAction(datos));
            }}
            onCancel={() => setConfirmando(false)}
          />
        </>
      )}
    </div>
  );
}
