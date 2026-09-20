"use client";

import { Plus } from "lucide-react";
import { startTransition, useState } from "react";
import { ConfirmSheet } from "@/components/ui/bottom-sheet";
import { ButtonPrimary, ButtonSecondary } from "@/components/ui/buttons";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, FormError, Input, Select, Textarea } from "@/components/ui/field";
import { FormActions } from "@/components/ui/form-actions";
import { CardList, ListCard } from "@/components/ui/list-card";
import type { EstadoTarea, Tarea } from "@/lib/types";
import { useAccion } from "@/lib/use-accion";
import {
  cambiarEstadoTarea,
  crearTarea,
  editarTarea,
  eliminarTarea,
} from "../actions";

export type TareaVista = Tarea & { responsable_alias: string | null };
export type Opcion = { id: string; alias: string };

const ESTADO_LABEL: Record<EstadoTarea, string> = {
  pendiente: "Pendiente",
  en_curso: "En curso",
  hecha: "Hecha",
};
const ESTADOS = Object.keys(ESTADO_LABEL) as EstadoTarea[];

// Botón rápido de la tarjeta: lleva la tarea al siguiente estado.
const SIGUIENTE: Record<EstadoTarea, { estado: EstadoTarea; label: string }> = {
  pendiente: { estado: "en_curso", label: "Empezar" },
  en_curso: { estado: "hecha", label: "Marcar hecha" },
  hecha: { estado: "pendiente", label: "Reabrir" },
};

type Panel = { id: string; tipo: "editar" | "detalle" };

export function ListaTareas({
  proyectoId,
  tareas,
  responsables,
  puedeEditar,
}: {
  proyectoId: string;
  tareas: TareaVista[];
  responsables: Opcion[];
  puedeEditar: boolean;
}) {
  const [panel, setPanel] = useState<Panel | null>(null);
  const [mostrarNueva, setMostrarNueva] = useState(false);

  const alternar = (id: string, tipo: Panel["tipo"]) =>
    setPanel((actual) =>
      actual?.id === id && actual.tipo === tipo ? null : { id, tipo },
    );

  // Las abiertas primero (en su orden manual); las hechas, al final.
  const visibles = [...tareas].sort(
    (a, b) => Number(a.estado === "hecha") - Number(b.estado === "hecha"),
  );

  const botonNueva = (
    <ButtonPrimary
      icon={<Plus size={20} strokeWidth={1.75} aria-hidden />}
      onClick={() => {
        setPanel(null);
        setMostrarNueva(true);
      }}
    >
      Nueva tarea
    </ButtonPrimary>
  );

  return (
    <div className="flex flex-col gap-4">
      {puedeEditar && mostrarNueva && (
        <NuevaTareaForm
          proyectoId={proyectoId}
          responsables={responsables}
          onDone={() => setMostrarNueva(false)}
        />
      )}

      {puedeEditar && !mostrarNueva && tareas.length > 0 && (
        <div>{botonNueva}</div>
      )}

      {tareas.length === 0 ? (
        <EmptyState action={puedeEditar && !mostrarNueva ? botonNueva : undefined}>
          Este proyecto todavía no tiene tareas.
        </EmptyState>
      ) : (
        <CardList>
          {visibles.map((tarea) => {
            const abierto = panel?.id === tarea.id ? panel.tipo : null;
            const hecha = tarea.estado === "hecha";
            return (
              <li key={tarea.id}>
                <ListCard
                  status={hecha ? "ok" : undefined}
                  statusLabel={hecha ? "Hecha" : undefined}
                  title={tarea.titulo}
                  meta={`${ESTADO_LABEL[tarea.estado]} · ${tarea.responsable_alias ?? "Sin responsable"}`}
                  actions={
                    puedeEditar ? (
                      <>
                        <AvanzarEstado tarea={tarea} />
                        <ButtonSecondary
                          aria-expanded={abierto === "editar"}
                          onClick={() => alternar(tarea.id, "editar")}
                        >
                          Editar
                        </ButtonSecondary>
                      </>
                    ) : (
                      <ButtonSecondary
                        aria-expanded={abierto === "detalle"}
                        onClick={() => alternar(tarea.id, "detalle")}
                      >
                        Ver detalle
                      </ButtonSecondary>
                    )
                  }
                  panel={
                    abierto === "editar" ? (
                      <div className="flex flex-col gap-5">
                        <EditarTareaForm
                          tarea={tarea}
                          responsables={responsables}
                          onDone={() => setPanel(null)}
                        />
                        <div className="border-t border-line-soft pt-5">
                          <EliminarTareaForm tarea={tarea} />
                        </div>
                      </div>
                    ) : abierto === "detalle" ? (
                      <p className="whitespace-pre-line text-body text-ink-2">
                        {tarea.descripcion ?? "Sin descripción."}
                      </p>
                    ) : undefined
                  }
                />
              </li>
            );
          })}
        </CardList>
      )}
    </div>
  );
}

function AvanzarEstado({ tarea }: { tarea: TareaVista }) {
  const [state, formAction, pending] = useAccion(cambiarEstadoTarea);
  const siguiente = SIGUIENTE[tarea.estado];

  // `contents`: el formulario no genera caja y el botón sigue siendo una
  // celda de la fila de acciones.
  return (
    <form action={formAction} className="contents">
      <input type="hidden" name="tarea_id" value={tarea.id} />
      <input type="hidden" name="estado" value={siguiente.estado} />
      <ButtonSecondary type="submit" disabled={pending}>
        {pending ? "Guardando…" : siguiente.label}
      </ButtonSecondary>
      {state.error && (
        <div className="col-span-2">
          <FormError>{state.error}</FormError>
        </div>
      )}
    </form>
  );
}

function CamposTarea({
  tarea,
  responsables,
}: {
  tarea?: TareaVista;
  responsables: Opcion[];
}) {
  return (
    <>
      <Field label="Título">
        <Input type="text" name="titulo" required defaultValue={tarea?.titulo} />
      </Field>

      <Field label="Descripción (opcional)">
        <Textarea name="descripcion" defaultValue={tarea?.descripcion ?? ""} />
      </Field>

      <Field label="Responsable">
        <Select name="responsable_id" defaultValue={tarea?.responsable_id ?? ""}>
          <option value="">Sin responsable</option>
          {responsables.map((r) => (
            <option key={r.id} value={r.id}>
              {r.alias}
            </option>
          ))}
        </Select>
      </Field>
    </>
  );
}

function NuevaTareaForm({
  proyectoId,
  responsables,
  onDone,
}: {
  proyectoId: string;
  responsables: Opcion[];
  onDone: () => void;
}) {
  const [state, formAction, pending] = useAccion(crearTarea, onDone);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-card border border-line bg-surface p-4 shadow-card"
    >
      <h3 className="text-screen font-bold">Nueva tarea</h3>
      <input type="hidden" name="proyecto_id" value={proyectoId} />

      <CamposTarea responsables={responsables} />

      <FormError>{state.error}</FormError>

      <FormActions
        pending={pending}
        enviar="Crear tarea"
        enviando="Creando…"
        onCancel={onDone}
      />
    </form>
  );
}

function EditarTareaForm({
  tarea,
  responsables,
  onDone,
}: {
  tarea: TareaVista;
  responsables: Opcion[];
  onDone: () => void;
}) {
  const [state, formAction, pending] = useAccion(editarTarea, onDone);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="tarea_id" value={tarea.id} />

      <CamposTarea tarea={tarea} responsables={responsables} />

      <Field label="Estado">
        <Select name="estado" defaultValue={tarea.estado}>
          {ESTADOS.map((estado) => (
            <option key={estado} value={estado}>
              {ESTADO_LABEL[estado]}
            </option>
          ))}
        </Select>
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

function EliminarTareaForm({ tarea }: { tarea: TareaVista }) {
  const [state, formAction, pending] = useAccion(eliminarTarea);
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
          {pending ? "Borrando…" : "Eliminar tarea"}
        </ButtonSecondary>
      </div>

      <ConfirmSheet
        open={confirmando}
        title={`¿Borrar "${tarea.titulo}"?`}
        message="La tarea se borra del proyecto y no se puede deshacer."
        confirmLabel="Borrar tarea"
        onConfirm={() => {
          setConfirmando(false);
          const datos = new FormData();
          datos.set("tarea_id", tarea.id);
          startTransition(() => formAction(datos));
        }}
        onCancel={() => setConfirmando(false)}
      />
    </div>
  );
}
