import { notFound, redirect } from "next/navigation";
import { formatFechaHora } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import type {
  Comentario,
  Miembro,
  Proyecto,
  ProyectoMiembro,
  Tarea,
} from "@/lib/types";
import type { ResumenProyecto } from "../proyectos-client";
import { Acceso, type AccesoVista } from "./acceso";
import { Ajustes } from "./ajustes";
import { Comentarios, type ComentarioVista } from "./comentarios";
import { Seccion } from "./seccion";
import { Subproyectos } from "./subproyectos";
import { ListaTareas, type Opcion, type TareaVista } from "./tareas";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type MiembroBasico = Pick<Miembro, "id" | "alias" | "activo">;

/**
 * Pantalla de detalle de un proyecto (raíz o subproyecto). `padreId` viene de
 * la URL de un subproyecto (`/proyectos/<padre>/<sub>`) y se comprueba contra
 * la base de datos.
 *
 * Nada de lo que se ve se filtra aquí: si el usuario no tiene acceso, RLS
 * devuelve 0 filas y la pantalla es un 404, igual que un proyecto que no
 * existe. Los permisos que se calculan abajo solo deciden qué controles se
 * pintan; quien manda es la base de datos.
 */
export async function DetalleProyecto({
  id,
  padreId,
}: {
  id: string;
  padreId?: string;
}) {
  if (!UUID.test(id) || (padreId !== undefined && !UUID.test(padreId))) {
    notFound();
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: yo } = user
    ? await supabase
        .from("miembros")
        .select("*")
        .eq("auth_user_id", user.id)
        .maybeSingle<Miembro>()
    : { data: null };
  if (!yo) notFound();

  const { data: proyecto, error: errorProyecto } = await supabase
    .from("proyectos")
    .select("*")
    .eq("id", id)
    .maybeSingle<Proyecto>();

  if (errorProyecto) console.error("proyecto: error al leer el proyecto", errorProyecto);
  if (!proyecto) notFound();

  // Un subproyecto tiene su dirección canónica bajo la de su padre.
  if (proyecto.proyecto_padre_id && proyecto.proyecto_padre_id !== padreId) {
    redirect(`/proyectos/${proyecto.proyecto_padre_id}/${proyecto.id}`);
  }
  if (!proyecto.proyecto_padre_id && padreId !== undefined) notFound();

  const esSub = proyecto.proyecto_padre_id !== null;
  const raizId = proyecto.proyecto_padre_id ?? proyecto.id;

  const [
    { data: raiz, error: errorRaiz },
    { data: tareas, error: errorTareas },
    { data: comentarios, error: errorComentarios },
    { data: subs, error: errorSubs },
    { data: accesos, error: errorAccesos },
    { data: miembros, error: errorMiembros },
  ] = await Promise.all([
    // La raíz es el propio proyecto salvo en un subproyecto (nombre y dueño).
    esSub
      ? supabase
          .from("proyectos")
          .select("*")
          .eq("id", raizId)
          .maybeSingle<Proyecto>()
      : Promise.resolve({ data: proyecto, error: null }),
    supabase
      .from("tareas")
      .select("*")
      .eq("proyecto_id", id)
      .order("orden", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true })
      .returns<Tarea[]>(),
    supabase
      .from("comentarios")
      .select("*")
      .eq("proyecto_id", id)
      .order("created_at", { ascending: false })
      .limit(100)
      .returns<Comentario[]>(),
    supabase
      .from("proyectos")
      .select("*")
      .eq("proyecto_padre_id", id)
      .order("nombre", { ascending: true })
      .returns<Proyecto[]>(),
    supabase
      .from("proyecto_miembros")
      .select("*")
      .eq("proyecto_id", raizId)
      .returns<ProyectoMiembro[]>(),
    supabase
      .from("miembros")
      .select("id, alias, activo")
      .order("alias", { ascending: true })
      .returns<MiembroBasico[]>(),
  ]);

  for (const [nombre, error] of [
    ["raíz", errorRaiz],
    ["tareas", errorTareas],
    ["comentarios", errorComentarios],
    ["subproyectos", errorSubs],
    ["accesos", errorAccesos],
    ["miembros", errorMiembros],
  ] as const) {
    if (error) console.error(`proyecto: error al leer ${nombre}`, error);
  }

  // Tareas de los subproyectos, solo para el resumen de sus tarjetas.
  const idsSubs = (subs ?? []).map((s) => s.id);
  const { data: tareasSubs, error: errorTareasSubs } = idsSubs.length
    ? await supabase
        .from("tareas")
        .select("proyecto_id, estado")
        .in("proyecto_id", idsSubs)
        .returns<Pick<Tarea, "proyecto_id" | "estado">[]>()
    : { data: [], error: null };
  if (errorTareasSubs) console.error("proyecto: error al leer tareas de subproyectos", errorTareasSubs);

  // --- Permisos (solo para decidir qué controles se pintan) ---------------
  const esAdmin = yo.rol === "admin";
  const miAcceso = (accesos ?? []).find((a) => a.miembro_id === yo.id);
  const puedeEditar = esAdmin || miAcceso?.permiso === "editar";
  const puedeGestionar =
    esAdmin ||
    (miAcceso !== undefined &&
      (proyecto.creador_id === yo.id || raiz?.creador_id === yo.id));

  // --- Modelos de vista ---------------------------------------------------
  const aliasDe = new Map((miembros ?? []).map((m) => [m.id, m.alias]));

  const accesosVista: AccesoVista[] = (accesos ?? [])
    .map((a) => ({
      miembro_id: a.miembro_id,
      alias: aliasDe.get(a.miembro_id) ?? "—",
      permiso: a.permiso,
      esCreador: a.miembro_id === raiz?.creador_id,
    }))
    .sort((a, b) => Number(b.esCreador) - Number(a.esCreador) || a.alias.localeCompare(b.alias, "es"));

  // Candidatos a acceso: miembros activos que aún no lo tienen.
  const conAcceso = new Set((accesos ?? []).map((a) => a.miembro_id));
  const candidatos: Opcion[] = (miembros ?? [])
    .filter((m) => m.activo && !conAcceso.has(m.id))
    .map((m) => ({ id: m.id, alias: m.alias }));

  // Responsables posibles: los que tienen acceso, más quien ya lo sea de una
  // tarea (por si perdió el acceso después).
  const responsablesIds = new Set([
    ...conAcceso,
    ...(tareas ?? []).flatMap((t) => (t.responsable_id ? [t.responsable_id] : [])),
  ]);
  const responsables: Opcion[] = [...responsablesIds]
    .map((mid) => ({ id: mid, alias: aliasDe.get(mid) ?? "—" }))
    .sort((a, b) => a.alias.localeCompare(b.alias, "es"));

  const tareasVista: TareaVista[] = (tareas ?? []).map((t) => ({
    ...t,
    responsable_alias: t.responsable_id ? (aliasDe.get(t.responsable_id) ?? "—") : null,
  }));

  const comentariosVista: ComentarioVista[] = (comentarios ?? []).map((c) => ({
    id: c.id,
    alias: aliasDe.get(c.miembro_id) ?? "—",
    texto: c.texto,
    fecha: formatFechaHora(c.created_at),
    puedeBorrar: c.miembro_id === yo.id || puedeGestionar,
  }));

  const resumenesSubs: ResumenProyecto[] = (subs ?? []).map((s) => {
    const suyas = (tareasSubs ?? []).filter((t) => t.proyecto_id === s.id);
    return {
      id: s.id,
      nombre: s.nombre,
      archivado: s.estado === "archivado",
      subproyectos: 0,
      tareas: suyas.length,
      hechas: suyas.filter((t) => t.estado === "hecha").length,
    };
  });

  const meta = [
    proyecto.estado === "archivado" ? "Archivado" : null,
    esSub ? `Subproyecto de ${raiz?.nombre ?? "—"}` : null,
    `Creado por ${aliasDe.get(proyecto.creador_id) ?? "—"}`,
    puedeEditar ? null : "Acceso de solo lectura",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <header className="flex flex-col gap-2">
        <h1 className="break-words text-screen font-bold">{proyecto.nombre}</h1>
        <p className="text-meta text-ink-2">{meta}</p>
        {proyecto.descripcion && (
          <p className="whitespace-pre-line break-words text-body text-ink-2">
            {proyecto.descripcion}
          </p>
        )}
      </header>

      <Seccion titulo="Tareas">
        <ListaTareas
          proyectoId={proyecto.id}
          tareas={tareasVista}
          responsables={responsables}
          puedeEditar={puedeEditar}
        />
      </Seccion>

      {!esSub && (
        <Seccion titulo="Subproyectos">
          <Subproyectos
            padreId={proyecto.id}
            subproyectos={resumenesSubs}
            puedeCrear={puedeEditar}
          />
        </Seccion>
      )}

      <Seccion titulo="Comentarios">
        <Comentarios
          proyectoId={proyecto.id}
          comentarios={comentariosVista}
          puedeComentar={puedeEditar}
        />
      </Seccion>

      <Seccion titulo="Acceso">
        <Acceso
          proyectoId={raizId}
          accesos={accesosVista}
          candidatos={candidatos}
          puedeGestionar={puedeGestionar}
          heredadoDe={esSub ? (raiz?.nombre ?? "—") : undefined}
        />
      </Seccion>

      {puedeGestionar && (
        <Seccion titulo="Ajustes">
          <Ajustes
            proyecto={{
              id: proyecto.id,
              nombre: proyecto.nombre,
              descripcion: proyecto.descripcion,
              archivado: proyecto.estado === "archivado",
            }}
          />
        </Seccion>
      )}
    </>
  );
}
