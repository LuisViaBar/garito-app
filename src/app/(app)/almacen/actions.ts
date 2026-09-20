"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { AccionState, Categoria, Motivo } from "@/lib/types";

export type { AccionState };

export type HistorialEntrada = {
  id: string;
  cantidad_anterior: number;
  cantidad_nueva: number;
  motivo: Motivo;
  nota: string | null;
  created_at: string;
  alias: string;
};

export type HistorialState = {
  error: string | null;
  entradas: HistorialEntrada[] | null;
};

type HistorialFila = {
  id: string;
  cantidad_anterior: number;
  cantidad_nueva: number;
  motivo: Motivo;
  nota: string | null;
  created_at: string;
  miembro: { alias: string } | null;
};

const CATEGORIAS: Categoria[] = [
  "bebida",
  "comida",
  "desechables",
  "limpieza",
  "otros",
];
const MOTIVOS: Motivo[] = ["reposicion", "consumo", "recuento", "correccion"];

function numeroOpcional(valor: FormDataEntryValue | null): number | null {
  if (valor === null || valor === "") return null;
  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}

export async function actualizarCantidad(
  _prev: AccionState,
  formData: FormData,
): Promise<AccionState> {
  const productoId = formData.get("producto_id") as string;
  const cantidadNueva = Number(formData.get("cantidad_nueva"));
  const motivo = formData.get("motivo") as string;
  const nota = (formData.get("nota") as string) || null;

  if (!Number.isFinite(cantidadNueva) || cantidadNueva < 0) {
    return { error: "La cantidad debe ser un número igual o mayor que 0." };
  }
  if (!MOTIVOS.includes(motivo as Motivo)) {
    return { error: "Elige un motivo válido." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("actualizar_stock", {
    p_producto_id: productoId,
    p_cantidad_nueva: cantidadNueva,
    p_motivo: motivo,
    p_nota: nota,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/almacen");
  return { error: null };
}

export async function crearProducto(
  _prev: AccionState,
  formData: FormData,
): Promise<AccionState> {
  const nombre = (formData.get("nombre") as string)?.trim();
  const categoria = formData.get("categoria") as string;
  const umbralMinimo = Number(formData.get("umbral_minimo") ?? 0);
  const cantidadActual = Number(formData.get("cantidad_actual") ?? 0);
  const orden = numeroOpcional(formData.get("orden"));

  if (!nombre) return { error: "El nombre es obligatorio." };
  if (!CATEGORIAS.includes(categoria as Categoria)) {
    return { error: "Elige una categoría válida." };
  }
  if (!Number.isFinite(umbralMinimo) || umbralMinimo < 0) {
    return { error: "El umbral mínimo debe ser un número igual o mayor que 0." };
  }
  if (!Number.isFinite(cantidadActual) || cantidadActual < 0) {
    return { error: "La cantidad inicial debe ser un número igual o mayor que 0." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("productos").insert({
    nombre,
    categoria,
    umbral_minimo: umbralMinimo,
    cantidad_actual: cantidadActual,
    orden,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/almacen");
  return { error: null };
}

export async function editarProducto(
  _prev: AccionState,
  formData: FormData,
): Promise<AccionState> {
  const productoId = formData.get("producto_id") as string;
  const nombre = (formData.get("nombre") as string)?.trim();
  const categoria = formData.get("categoria") as string;
  const umbralMinimo = Number(formData.get("umbral_minimo") ?? 0);
  const orden = numeroOpcional(formData.get("orden"));

  if (!nombre) return { error: "El nombre es obligatorio." };
  if (!CATEGORIAS.includes(categoria as Categoria)) {
    return { error: "Elige una categoría válida." };
  }
  if (!Number.isFinite(umbralMinimo) || umbralMinimo < 0) {
    return { error: "El umbral mínimo debe ser un número igual o mayor que 0." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("productos")
    .update({
      nombre,
      categoria,
      umbral_minimo: umbralMinimo,
      orden,
    })
    .eq("id", productoId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/almacen");
  return { error: null };
}

export async function eliminarProducto(
  _prev: AccionState,
  formData: FormData,
): Promise<AccionState> {
  const productoId = formData.get("producto_id") as string;

  const supabase = await createClient();
  const { error } = await supabase.from("productos").delete().eq("id", productoId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/almacen");
  return { error: null };
}

export async function obtenerHistorial(
  _prev: HistorialState,
  formData: FormData,
): Promise<HistorialState> {
  const productoId = formData.get("producto_id") as string;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("stock_log")
    .select("id, cantidad_anterior, cantidad_nueva, motivo, nota, created_at, miembro:miembros(alias)")
    .eq("producto_id", productoId)
    .order("created_at", { ascending: false })
    .limit(20)
    .returns<HistorialFila[]>();

  if (error) {
    return { error: error.message, entradas: null };
  }

  const entradas: HistorialEntrada[] = (data ?? []).map((fila) => ({
    id: fila.id,
    cantidad_anterior: fila.cantidad_anterior,
    cantidad_nueva: fila.cantidad_nueva,
    motivo: fila.motivo,
    nota: fila.nota,
    created_at: fila.created_at,
    alias: fila.miembro?.alias ?? "—",
  }));

  return { error: null, entradas };
}
