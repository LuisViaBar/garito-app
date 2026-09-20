"use server";

import type { PostgrestError } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type {
  AccionState,
  EstadoProyecto,
  EstadoTarea,
  Permiso,
  Proyecto,
} from "@/lib/types";

const ESTADOS_PROYECTO: EstadoProyecto[] = ["activo", "archivado"];
const ESTADOS_TAREA: EstadoTarea[] = ["pendiente", "en_curso", "hecha"];
const PERMISOS: Permiso[] = ["ver", "editar"];

const SIN_PERMISO =
  "No se ha podido: no tienes permiso o el elemento ya no existe.";

function texto(formData: FormData, campo: string): string {
  return ((formData.get(campo) as string | null) ?? "").trim();
}

function textoOpcional(formData: FormData, campo: string): string | null {
  return texto(formData, campo) || null;
}

function mensaje(error: PostgrestError): string {
  // 42501: RLS o GRANT lo han denegado. El resto de errores de las funciones
  // (P0001) ya vienen redactados para el usuario.
  return error.code === "42501"
    ? "No tienes permiso para hacer esto."
    : error.message;
}

// Toda la sección cuelga de /proyectos: se revalida la lista y los detalles.
function refrescar() {
  revalidatePath("/proyectos", "layout");
}

// ---------------------------------------------------------------------------
// Proyectos
// ---------------------------------------------------------------------------

export async function crearProyecto(
  _prev: AccionState,
  formData: FormData,
): Promise<AccionState> {
  const nombre = texto(formData, "nombre");
  const padreId = textoOpcional(formData, "padre_id");

  if (!nombre) return { error: "El nombre es obligatorio." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("crear_proyecto", {
      p_nombre: nombre,
      p_descripcion: textoOpcional(formData, "descripcion"),
      p_padre_id: padreId,
    })
    .single<Proyecto>();

  if (error) return { error: mensaje(error) };

  refrescar();
  // Un proyecto nuevo se abre para empezar a llenarlo; un subproyecto se
  // queda en la pantalla de su padre.
  if (!padreId && data) redirect(`/proyectos/${data.id}`);
  return { error: null };
}

export async function editarProyecto(
  _prev: AccionState,
  formData: FormData,
): Promise<AccionState> {
  const id = texto(formData, "proyecto_id");
  const nombre = texto(formData, "nombre");

  if (!nombre) return { error: "El nombre es obligatorio." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("proyectos")
    .update({ nombre, descripcion: textoOpcional(formData, "descripcion") })
    .eq("id", id)
    .select("id");

  if (error) return { error: mensaje(error) };
  if (!data?.length) return { error: SIN_PERMISO };

  refrescar();
  return { error: null };
}

export async function cambiarEstadoProyecto(
  _prev: AccionState,
  formData: FormData,
): Promise<AccionState> {
  const id = texto(formData, "proyecto_id");
  const estado = texto(formData, "estado");

  if (!ESTADOS_PROYECTO.includes(estado as EstadoProyecto)) {
    return { error: "Estado no válido." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("proyectos")
    .update({ estado })
    .eq("id", id)
    .select("id");

  if (error) return { error: mensaje(error) };
  if (!data?.length) return { error: SIN_PERMISO };

  refrescar();
  return { error: null };
}

export async function eliminarProyecto(
  _prev: AccionState,
  formData: FormData,
): Promise<AccionState> {
  const id = texto(formData, "proyecto_id");

  const supabase = await createClient();

  // Se lee el padre antes de borrar para volver a su pantalla si era un
  // subproyecto. Si no se ve (sin acceso), el borrado tampoco será posible.
  const { data: proyecto, error: errorLectura } = await supabase
    .from("proyectos")
    .select("proyecto_padre_id")
    .eq("id", id)
    .maybeSingle<{ proyecto_padre_id: string | null }>();

  if (errorLectura) return { error: mensaje(errorLectura) };
  if (!proyecto) return { error: SIN_PERMISO };

  const { data, error } = await supabase
    .from("proyectos")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) return { error: mensaje(error) };
  if (!data?.length) return { error: SIN_PERMISO };

  refrescar();
  redirect(
    proyecto.proyecto_padre_id
      ? `/proyectos/${proyecto.proyecto_padre_id}`
      : "/proyectos",
  );
}

// ---------------------------------------------------------------------------
// Tareas
// ---------------------------------------------------------------------------

export async function crearTarea(
  _prev: AccionState,
  formData: FormData,
): Promise<AccionState> {
  const proyectoId = texto(formData, "proyecto_id");
  const titulo = texto(formData, "titulo");

  if (!titulo) return { error: "El título es obligatorio." };

  const supabase = await createClient();

  // La tarea nueva va al final de la lista.
  const { data: ultima, error: errorOrden } = await supabase
    .from("tareas")
    .select("orden")
    .eq("proyecto_id", proyectoId)
    .not("orden", "is", null)
    .order("orden", { ascending: false })
    .limit(1)
    .returns<{ orden: number }[]>();

  if (errorOrden) return { error: mensaje(errorOrden) };

  const { error } = await supabase.from("tareas").insert({
    proyecto_id: proyectoId,
    titulo,
    descripcion: textoOpcional(formData, "descripcion"),
    responsable_id: textoOpcional(formData, "responsable_id"),
    orden: (ultima?.[0]?.orden ?? 0) + 1,
  });

  if (error) return { error: mensaje(error) };

  refrescar();
  return { error: null };
}

export async function editarTarea(
  _prev: AccionState,
  formData: FormData,
): Promise<AccionState> {
  const id = texto(formData, "tarea_id");
  const titulo = texto(formData, "titulo");
  const estado = texto(formData, "estado");

  if (!titulo) return { error: "El título es obligatorio." };
  if (!ESTADOS_TAREA.includes(estado as EstadoTarea)) {
    return { error: "Estado no válido." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tareas")
    .update({
      titulo,
      descripcion: textoOpcional(formData, "descripcion"),
      responsable_id: textoOpcional(formData, "responsable_id"),
      estado,
    })
    .eq("id", id)
    .select("id");

  if (error) return { error: mensaje(error) };
  if (!data?.length) return { error: SIN_PERMISO };

  refrescar();
  return { error: null };
}

export async function cambiarEstadoTarea(
  _prev: AccionState,
  formData: FormData,
): Promise<AccionState> {
  const id = texto(formData, "tarea_id");
  const estado = texto(formData, "estado");

  if (!ESTADOS_TAREA.includes(estado as EstadoTarea)) {
    return { error: "Estado no válido." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tareas")
    .update({ estado })
    .eq("id", id)
    .select("id");

  if (error) return { error: mensaje(error) };
  if (!data?.length) return { error: SIN_PERMISO };

  refrescar();
  return { error: null };
}

export async function eliminarTarea(
  _prev: AccionState,
  formData: FormData,
): Promise<AccionState> {
  const id = texto(formData, "tarea_id");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tareas")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) return { error: mensaje(error) };
  if (!data?.length) return { error: SIN_PERMISO };

  refrescar();
  return { error: null };
}

// ---------------------------------------------------------------------------
// Comentarios
// ---------------------------------------------------------------------------

export async function publicarComentario(
  _prev: AccionState,
  formData: FormData,
): Promise<AccionState> {
  const proyectoId = texto(formData, "proyecto_id");
  const comentario = texto(formData, "texto");

  if (!comentario) return { error: "Escribe algo antes de publicar." };

  const supabase = await createClient();

  // La política exige firmar como uno mismo: se resuelve el miembro aquí.
  const { data: miembroId, error: errorMiembro } =
    await supabase.rpc("miembro_actual_id");
  if (errorMiembro) return { error: mensaje(errorMiembro) };
  if (!miembroId) return { error: "Tu cuenta no está vinculada a ningún miembro." };

  const { error } = await supabase.from("comentarios").insert({
    proyecto_id: proyectoId,
    miembro_id: miembroId,
    texto: comentario,
  });

  if (error) return { error: mensaje(error) };

  refrescar();
  return { error: null };
}

export async function eliminarComentario(
  _prev: AccionState,
  formData: FormData,
): Promise<AccionState> {
  const id = texto(formData, "comentario_id");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comentarios")
    .delete()
    .eq("id", id)
    .select("id");

  if (error) return { error: mensaje(error) };
  if (!data?.length) return { error: SIN_PERMISO };

  refrescar();
  return { error: null };
}

// ---------------------------------------------------------------------------
// Acceso (proyecto_miembros). Solo en proyectos raíz: los subproyectos heredan.
// ---------------------------------------------------------------------------

export async function darAcceso(
  _prev: AccionState,
  formData: FormData,
): Promise<AccionState> {
  const proyectoId = texto(formData, "proyecto_id");
  const miembroId = texto(formData, "miembro_id");
  const permiso = texto(formData, "permiso");

  if (!miembroId) return { error: "Elige un miembro." };
  if (!PERMISOS.includes(permiso as Permiso)) {
    return { error: "Elige un nivel de acceso." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("proyecto_miembros").insert({
    proyecto_id: proyectoId,
    miembro_id: miembroId,
    permiso,
  });

  if (error) {
    return {
      error:
        error.code === "23505" ? "Ese miembro ya tiene acceso." : mensaje(error),
    };
  }

  refrescar();
  return { error: null };
}

export async function cambiarPermiso(
  _prev: AccionState,
  formData: FormData,
): Promise<AccionState> {
  const proyectoId = texto(formData, "proyecto_id");
  const miembroId = texto(formData, "miembro_id");
  const permiso = texto(formData, "permiso");

  if (!PERMISOS.includes(permiso as Permiso)) {
    return { error: "Elige un nivel de acceso." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("proyecto_miembros")
    .update({ permiso })
    .eq("proyecto_id", proyectoId)
    .eq("miembro_id", miembroId)
    .select("miembro_id");

  if (error) return { error: mensaje(error) };
  if (!data?.length) return { error: SIN_PERMISO };

  refrescar();
  return { error: null };
}

export async function quitarAcceso(
  _prev: AccionState,
  formData: FormData,
): Promise<AccionState> {
  const proyectoId = texto(formData, "proyecto_id");
  const miembroId = texto(formData, "miembro_id");

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("proyecto_miembros")
    .delete()
    .eq("proyecto_id", proyectoId)
    .eq("miembro_id", miembroId)
    .select("miembro_id");

  if (error) return { error: mensaje(error) };
  if (!data?.length) return { error: SIN_PERMISO };

  refrescar();
  return { error: null };
}
