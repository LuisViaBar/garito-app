import { PageHeader } from "@/components/ui/page-header";
import { createClient } from "@/lib/supabase/server";
import type { Proyecto, Tarea } from "@/lib/types";
import { ListaProyectos, type ResumenProyecto } from "./proyectos-client";

export default async function ProyectosPage() {
  const supabase = await createClient();

  // La base de datos ya filtra por permisos (RLS): aquí solo llega lo que el
  // usuario puede ver.
  const [
    { data: proyectos, error: errorProyectos },
    { data: tareas, error: errorTareas },
  ] = await Promise.all([
    supabase
      .from("proyectos")
      .select("*")
      .order("nombre", { ascending: true })
      .returns<Proyecto[]>(),
    supabase
      .from("tareas")
      .select("proyecto_id, estado")
      .returns<Pick<Tarea, "proyecto_id" | "estado">[]>(),
  ]);

  if (errorProyectos) console.error("proyectos: error al leer proyectos", errorProyectos);
  if (errorTareas) console.error("proyectos: error al leer tareas", errorTareas);

  const todos = proyectos ?? [];
  const raices = todos.filter((p) => p.proyecto_padre_id === null);

  // Las cifras de un proyecto raíz suman las de sus subproyectos.
  const resumenes: ResumenProyecto[] = raices.map((raiz) => {
    const familia = new Set(
      todos
        .filter((p) => p.id === raiz.id || p.proyecto_padre_id === raiz.id)
        .map((p) => p.id),
    );
    const suyas = (tareas ?? []).filter((t) => familia.has(t.proyecto_id));
    return {
      id: raiz.id,
      nombre: raiz.nombre,
      archivado: raiz.estado === "archivado",
      subproyectos: familia.size - 1,
      tareas: suyas.length,
      hechas: suyas.filter((t) => t.estado === "hecha").length,
    };
  });

  return (
    <>
      <PageHeader title="Proyectos" />
      <ListaProyectos proyectos={resumenes} />
    </>
  );
}
