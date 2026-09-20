"use client";

import { useState } from "react";
import { ButtonSecondary } from "@/components/ui/buttons";
import { EmptyState } from "@/components/ui/empty-state";
import { CardList } from "@/components/ui/list-card";
import {
  NuevoProyectoForm,
  TarjetaProyecto,
  type ResumenProyecto,
} from "../proyectos-client";

export function Subproyectos({
  padreId,
  subproyectos,
  puedeCrear,
}: {
  padreId: string;
  subproyectos: ResumenProyecto[];
  puedeCrear: boolean;
}) {
  const [mostrarNuevo, setMostrarNuevo] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      {mostrarNuevo ? (
        <NuevoProyectoForm
          padreId={padreId}
          onDone={() => setMostrarNuevo(false)}
        />
      ) : (
        puedeCrear && (
          <div>
            <ButtonSecondary onClick={() => setMostrarNuevo(true)}>
              Nuevo subproyecto
            </ButtonSecondary>
          </div>
        )
      )}

      {subproyectos.length === 0 ? (
        <EmptyState>Este proyecto no tiene subproyectos.</EmptyState>
      ) : (
        <CardList>
          {subproyectos.map((sub) => (
            <TarjetaProyecto
              key={sub.id}
              proyecto={sub}
              href={`/proyectos/${padreId}/${sub.id}`}
            />
          ))}
        </CardList>
      )}
    </div>
  );
}
