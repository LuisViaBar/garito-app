"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { ButtonPrimary, ButtonSecondary } from "@/components/ui/buttons";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, FormError, Input, Textarea } from "@/components/ui/field";
import { FormActions } from "@/components/ui/form-actions";
import { CardList, ListCard } from "@/components/ui/list-card";
import { useAccion } from "@/lib/use-accion";
import { crearProyecto } from "./actions";

export type ResumenProyecto = {
  id: string;
  nombre: string;
  archivado: boolean;
  subproyectos: number;
  tareas: number;
  hechas: number;
};

function plural(n: number, singular: string, plural: string) {
  return `${n} ${n === 1 ? singular : plural}`;
}

export function TarjetaProyecto({
  proyecto,
  href,
}: {
  proyecto: ResumenProyecto;
  href: string;
}) {
  const { subproyectos, tareas, hechas } = proyecto;
  const meta = [
    proyecto.archivado ? "Archivado" : null,
    subproyectos > 0 ? plural(subproyectos, "subproyecto", "subproyectos") : null,
    tareas === 0 ? "Sin tareas" : `${hechas} de ${plural(tareas, "tarea hecha", "tareas hechas")}`,
  ]
    .filter(Boolean)
    .join(" · ");

  const completo = tareas > 0 && hechas === tareas;

  return (
    <li>
      <ListCard
        status={completo ? "ok" : undefined}
        statusLabel={completo ? "Todas las tareas hechas" : undefined}
        title={proyecto.nombre}
        meta={meta}
        href={href}
      />
    </li>
  );
}

export function ListaProyectos({ proyectos }: { proyectos: ResumenProyecto[] }) {
  const [mostrarNuevo, setMostrarNuevo] = useState(false);
  const [verArchivados, setVerArchivados] = useState(false);

  const activos = proyectos.filter((p) => !p.archivado);
  const archivados = proyectos.filter((p) => p.archivado);

  const botonNuevo = (
    <ButtonPrimary
      icon={<Plus size={20} strokeWidth={1.75} aria-hidden />}
      onClick={() => setMostrarNuevo(true)}
    >
      Nuevo proyecto
    </ButtonPrimary>
  );

  return (
    <div className="flex flex-col gap-6">
      {mostrarNuevo ? (
        <NuevoProyectoForm onDone={() => setMostrarNuevo(false)} />
      ) : (
        activos.length > 0 && <div>{botonNuevo}</div>
      )}

      {activos.length === 0 ? (
        <EmptyState action={!mostrarNuevo ? botonNuevo : undefined}>
          {archivados.length > 0
            ? "No tienes proyectos activos."
            : "Todavía no hay proyectos que puedas ver. Crea el primero."}
        </EmptyState>
      ) : (
        <CardList>
          {activos.map((p) => (
            <TarjetaProyecto key={p.id} proyecto={p} href={`/proyectos/${p.id}`} />
          ))}
        </CardList>
      )}

      {archivados.length > 0 && (
        <section className="flex flex-col gap-4">
          <div>
            <ButtonSecondary
              aria-expanded={verArchivados}
              onClick={() => setVerArchivados((v) => !v)}
            >
              {verArchivados ? "Ocultar" : "Ver"} archivados ({archivados.length})
            </ButtonSecondary>
          </div>
          {verArchivados && (
            <CardList>
              {archivados.map((p) => (
                <TarjetaProyecto key={p.id} proyecto={p} href={`/proyectos/${p.id}`} />
              ))}
            </CardList>
          )}
        </section>
      )}
    </div>
  );
}

/**
 * Alta de proyecto (raíz o subproyecto, según `padreId`). Al crear un proyecto
 * raíz, la acción redirige a su pantalla; un subproyecto se queda donde está.
 */
export function NuevoProyectoForm({
  padreId,
  onDone,
}: {
  padreId?: string;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useAccion(crearProyecto, onDone);
  const subproyecto = padreId !== undefined;

  return (
    <form
      action={formAction}
      className="flex flex-col gap-4 rounded-card border border-line bg-surface p-4 shadow-card"
    >
      <h2 className="text-screen font-bold">
        {subproyecto ? "Nuevo subproyecto" : "Nuevo proyecto"}
      </h2>
      {padreId && <input type="hidden" name="padre_id" value={padreId} />}

      <Field label="Nombre">
        <Input type="text" name="nombre" required />
      </Field>

      <Field label="Descripción (opcional)">
        <Textarea name="descripcion" />
      </Field>

      <FormError>{state.error}</FormError>

      <FormActions
        pending={pending}
        enviar={subproyecto ? "Crear subproyecto" : "Crear proyecto"}
        enviando="Creando…"
        onCancel={onDone}
      />
    </form>
  );
}
