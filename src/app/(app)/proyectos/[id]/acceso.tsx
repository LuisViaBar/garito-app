"use client";

import { startTransition, useState } from "react";
import { ConfirmSheet } from "@/components/ui/bottom-sheet";
import { ButtonSecondary } from "@/components/ui/buttons";
import { Field, FormError, Select } from "@/components/ui/field";
import { FormActions } from "@/components/ui/form-actions";
import { CardList, ListCard } from "@/components/ui/list-card";
import type { Permiso } from "@/lib/types";
import { useAccion } from "@/lib/use-accion";
import { cambiarPermiso, darAcceso, quitarAcceso } from "../actions";
import type { Opcion } from "./tareas";

export type AccesoVista = {
  miembro_id: string;
  alias: string;
  permiso: Permiso;
  esCreador: boolean;
};

const PERMISO_LABEL: Record<Permiso, string> = {
  ver: "Solo ver",
  editar: "Puede editar",
};

// Texto del botón que lleva al otro nivel.
const CAMBIO_LABEL: Record<Permiso, string> = {
  ver: "Solo lectura",
  editar: "Permitir editar",
};

/**
 * Quién tiene acceso al proyecto. Solo se gestiona en el proyecto raíz: un
 * subproyecto hereda el acceso y aquí solo se muestra (`heredadoDe`).
 */
export function Acceso({
  proyectoId,
  accesos,
  candidatos,
  puedeGestionar,
  heredadoDe,
}: {
  proyectoId: string;
  accesos: AccesoVista[];
  candidatos: Opcion[];
  puedeGestionar: boolean;
  heredadoDe?: string;
}) {
  const [mostrarAlta, setMostrarAlta] = useState(false);
  const gestiona = puedeGestionar && heredadoDe === undefined;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-body text-ink-2">
        {heredadoDe !== undefined
          ? `Este subproyecto hereda el acceso de «${heredadoDe}»; se gestiona desde el proyecto principal.`
          : "Quien no está en la lista no ve el proyecto. Los administradores ven y editan todo."}
      </p>

      {gestiona &&
        (mostrarAlta ? (
          <DarAccesoForm
            proyectoId={proyectoId}
            candidatos={candidatos}
            onDone={() => setMostrarAlta(false)}
          />
        ) : (
          candidatos.length > 0 && (
            <div>
              <ButtonSecondary onClick={() => setMostrarAlta(true)}>
                Dar acceso
              </ButtonSecondary>
            </div>
          )
        ))}

      <CardList>
        {accesos.map((acceso) => (
          <li key={acceso.miembro_id}>
            <ListCard
              title={acceso.alias}
              meta={`${acceso.esCreador ? "Dueño · " : ""}${PERMISO_LABEL[acceso.permiso]}`}
              actions={
                gestiona && !acceso.esCreador ? (
                  <>
                    <CambiarPermiso proyectoId={proyectoId} acceso={acceso} />
                    <QuitarAcceso proyectoId={proyectoId} acceso={acceso} />
                  </>
                ) : undefined
              }
            />
          </li>
        ))}
      </CardList>
    </div>
  );
}

function DarAccesoForm({
  proyectoId,
  candidatos,
  onDone,
}: {
  proyectoId: string;
  candidatos: Opcion[];
  onDone: () => void;
}) {
  const [state, formAction, pending] = useAccion(darAcceso, onDone);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-card border border-line bg-surface p-4 shadow-card"
    >
      <h3 className="text-screen font-bold">Dar acceso</h3>
      <input type="hidden" name="proyecto_id" value={proyectoId} />

      <Field label="Miembro">
        <Select name="miembro_id" required defaultValue="">
          <option value="" disabled>
            Elige un miembro
          </option>
          {candidatos.map((c) => (
            <option key={c.id} value={c.id}>
              {c.alias}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Nivel de acceso">
        <Select name="permiso" required defaultValue="ver">
          <option value="ver">{PERMISO_LABEL.ver}</option>
          <option value="editar">{PERMISO_LABEL.editar}</option>
        </Select>
      </Field>

      <FormError>{state.error}</FormError>

      <FormActions
        pending={pending}
        enviar="Dar acceso"
        enviando="Guardando…"
        onCancel={onDone}
      />
    </form>
  );
}

function CambiarPermiso({
  proyectoId,
  acceso,
}: {
  proyectoId: string;
  acceso: AccesoVista;
}) {
  const [state, formAction, pending] = useAccion(cambiarPermiso);
  const nuevo: Permiso = acceso.permiso === "editar" ? "ver" : "editar";

  return (
    <form action={formAction} className="contents">
      <input type="hidden" name="proyecto_id" value={proyectoId} />
      <input type="hidden" name="miembro_id" value={acceso.miembro_id} />
      <input type="hidden" name="permiso" value={nuevo} />
      <ButtonSecondary type="submit" disabled={pending}>
        {pending ? "Guardando…" : CAMBIO_LABEL[nuevo]}
      </ButtonSecondary>
      {state.error && (
        <div className="col-span-2">
          <FormError>{state.error}</FormError>
        </div>
      )}
    </form>
  );
}

function QuitarAcceso({
  proyectoId,
  acceso,
}: {
  proyectoId: string;
  acceso: AccesoVista;
}) {
  const [state, formAction, pending] = useAccion(quitarAcceso);
  const [confirmando, setConfirmando] = useState(false);

  return (
    <>
      <ButtonSecondary
        tone="danger"
        disabled={pending}
        onClick={() => setConfirmando(true)}
      >
        {pending ? "Quitando…" : "Quitar acceso"}
      </ButtonSecondary>
      {state.error && (
        <div className="col-span-2">
          <FormError>{state.error}</FormError>
        </div>
      )}

      <ConfirmSheet
        open={confirmando}
        title={`¿Quitar el acceso a ${acceso.alias}?`}
        message="Dejará de ver el proyecto, sus subproyectos, tareas y comentarios. Puedes volver a darle acceso cuando quieras."
        confirmLabel="Quitar acceso"
        onConfirm={() => {
          setConfirmando(false);
          const datos = new FormData();
          datos.set("proyecto_id", proyectoId);
          datos.set("miembro_id", acceso.miembro_id);
          startTransition(() => formAction(datos));
        }}
        onCancel={() => setConfirmando(false)}
      />
    </>
  );
}
