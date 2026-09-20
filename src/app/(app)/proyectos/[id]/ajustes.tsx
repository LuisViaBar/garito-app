"use client";

import { startTransition, useState } from "react";
import { ConfirmSheet } from "@/components/ui/bottom-sheet";
import { ButtonSecondary } from "@/components/ui/buttons";
import { Field, FormError, Input, Textarea } from "@/components/ui/field";
import { FormActions } from "@/components/ui/form-actions";
import { useAccion } from "@/lib/use-accion";
import {
  cambiarEstadoProyecto,
  editarProyecto,
  eliminarProyecto,
} from "../actions";

/** Ajustes del proyecto: solo para quien lo gestiona (dueño o admin). */
export function Ajustes({
  proyecto,
}: {
  proyecto: {
    id: string;
    nombre: string;
    descripcion: string | null;
    archivado: boolean;
  };
}) {
  const [editando, setEditando] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        <ButtonSecondary
          aria-expanded={editando}
          onClick={() => setEditando((v) => !v)}
        >
          Editar proyecto
        </ButtonSecondary>
        <CambiarEstado proyecto={proyecto} />
      </div>

      {editando && (
        <EditarProyectoForm
          proyecto={proyecto}
          onDone={() => setEditando(false)}
        />
      )}

      <EliminarProyecto proyecto={proyecto} />
    </div>
  );
}

function CambiarEstado({
  proyecto,
}: {
  proyecto: { id: string; archivado: boolean };
}) {
  const [state, formAction, pending] = useAccion(cambiarEstadoProyecto);

  return (
    <form action={formAction} className="contents">
      <input type="hidden" name="proyecto_id" value={proyecto.id} />
      <input
        type="hidden"
        name="estado"
        value={proyecto.archivado ? "activo" : "archivado"}
      />
      <ButtonSecondary type="submit" disabled={pending}>
        {pending ? "Guardando…" : proyecto.archivado ? "Reactivar" : "Archivar"}
      </ButtonSecondary>
      {state.error && (
        <div className="col-span-2">
          <FormError>{state.error}</FormError>
        </div>
      )}
    </form>
  );
}

function EditarProyectoForm({
  proyecto,
  onDone,
}: {
  proyecto: { id: string; nombre: string; descripcion: string | null };
  onDone: () => void;
}) {
  const [state, formAction, pending] = useAccion(editarProyecto, onDone);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-card border border-line bg-surface p-4 shadow-card"
    >
      <input type="hidden" name="proyecto_id" value={proyecto.id} />

      <Field label="Nombre">
        <Input type="text" name="nombre" required defaultValue={proyecto.nombre} />
      </Field>

      <Field label="Descripción (opcional)">
        <Textarea name="descripcion" defaultValue={proyecto.descripcion ?? ""} />
      </Field>

      <FormError>{state.error}</FormError>

      <FormActions
        pending={pending}
        enviar="Guardar cambios"
        enviando="Guardando…"
        onCancel={onDone}
      />
    </form>
  );
}

function EliminarProyecto({ proyecto }: { proyecto: { id: string; nombre: string } }) {
  const [state, formAction, pending] = useAccion(eliminarProyecto);
  const [confirmando, setConfirmando] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <FormError>{state.error}</FormError>
      <div>
        <ButtonSecondary
          tone="danger"
          disabled={pending}
          onClick={() => setConfirmando(true)}
        >
          {pending ? "Borrando…" : "Eliminar proyecto"}
        </ButtonSecondary>
      </div>

      <ConfirmSheet
        open={confirmando}
        title={`¿Borrar "${proyecto.nombre}"?`}
        message="Se borrarán también sus subproyectos, tareas, comentarios y permisos. No se puede deshacer."
        confirmLabel="Borrar proyecto"
        onConfirm={() => {
          setConfirmando(false);
          const datos = new FormData();
          datos.set("proyecto_id", proyecto.id);
          startTransition(() => formAction(datos));
        }}
        onCancel={() => setConfirmando(false)}
      />
    </div>
  );
}
