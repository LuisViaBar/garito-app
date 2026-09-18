"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { Categoria, Motivo, Producto } from "@/lib/types";
import {
  actualizarCantidad,
  crearProducto,
  editarProducto,
  eliminarProducto,
  obtenerHistorial,
  type AccionState,
  type HistorialState,
} from "./actions";

const CATEGORIA_LABEL: Record<Categoria, string> = {
  bebida: "Bebida",
  comida: "Comida",
  desechables: "Desechables",
  limpieza: "Limpieza",
  otros: "Otros",
};

const MOTIVO_LABEL: Record<Motivo, string> = {
  reposicion: "Reposición",
  consumo: "Consumo",
  recuento: "Recuento",
  correccion: "Corrección",
};

const CATEGORIAS = Object.keys(CATEGORIA_LABEL) as Categoria[];
const MOTIVOS = Object.keys(MOTIVO_LABEL) as Motivo[];

const initialState: AccionState = { error: null };
const initialHistorialState: HistorialState = { error: null, entradas: null };

// Normalización para detectar duplicados por mayúsculas o plural simple
// (p. ej. "Pipas" vs "pipa"): minúsculas, sin acentos, sin "s" final.
function normalizarNombre(nombre: string): string {
  const base = nombre
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  return base.endsWith("s") ? base.slice(0, -1) : base;
}

function encontrarParecido(
  nombre: string,
  productos: Producto[],
  excluirId?: string,
): Producto | undefined {
  const normalizado = normalizarNombre(nombre);
  if (!normalizado) return undefined;
  return productos.find(
    (p) => p.id !== excluirId && normalizarNombre(p.nombre) === normalizado,
  );
}

export function ListaProductos({
  productos,
  bajosIds,
  esAdmin,
}: {
  productos: Producto[];
  bajosIds: Set<string>;
  esAdmin: boolean;
}) {
  const [expandido, setExpandido] = useState<string | null>(null);
  const [modoAdmin, setModoAdmin] = useState<string | null>(null);
  const [mostrarNuevo, setMostrarNuevo] = useState(false);

  // Los productos bajo mínimo suben arriba de la lista; a igualdad de
  // estado se conserva el orden recibido (orden manual, luego nombre).
  const productosOrdenados = [...productos].sort((a, b) => {
    const bajoA = bajosIds.has(a.id) ? 0 : 1;
    const bajoB = bajosIds.has(b.id) ? 0 : 1;
    return bajoA - bajoB;
  });

  return (
    <div className="flex flex-col gap-4 p-4">
      <div
        className={`rounded border px-3 py-2 text-sm ${
          bajosIds.size > 0
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-green-200 bg-green-50 text-green-700"
        }`}
      >
        {bajosIds.size > 0
          ? `${bajosIds.size} producto${bajosIds.size === 1 ? "" : "s"} bajo mínimos`
          : "Todo por encima de mínimos"}
      </div>

      {esAdmin && (
        <div>
          <button
            type="button"
            onClick={() => setMostrarNuevo((v) => !v)}
            className="rounded bg-gray-900 px-3 py-2 text-sm text-white"
          >
            {mostrarNuevo ? "Cancelar" : "+ Nuevo producto"}
          </button>
          {mostrarNuevo && (
            <div className="mt-2 rounded border border-gray-200 p-3">
              <NuevoProductoForm
                productos={productos}
                onDone={() => setMostrarNuevo(false)}
              />
            </div>
          )}
        </div>
      )}

      {productos.length === 0 ? (
        <p className="text-center text-sm text-gray-500">
          No hay productos todavía.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {productosOrdenados.map((producto) => {
            const bajo = bajosIds.has(producto.id);
            return (
              <li
                key={producto.id}
                className="rounded border border-gray-200 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                        bajo ? "bg-red-500" : "bg-green-500"
                      }`}
                      aria-hidden
                    />
                    <div className="min-w-0">
                      <p className="truncate font-medium">{producto.nombre}</p>
                      <p className="text-xs text-gray-500">
                        {CATEGORIA_LABEL[producto.categoria]}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-medium">{producto.cantidad_actual}</p>
                    <p className="text-xs text-gray-400">
                      mín. {producto.umbral_minimo}
                    </p>
                  </div>
                </div>

                <div className="mt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandido((v) => (v === producto.id ? null : producto.id))
                    }
                    className="text-sm text-gray-700 underline"
                  >
                    {expandido === producto.id ? "Cerrar" : "Editar cantidad"}
                  </button>
                  <HistorialToggle productoId={producto.id} />
                </div>

                {expandido === producto.id && (
                  <div className="mt-2">
                    <EditarCantidadForm
                      producto={producto}
                      onDone={() => setExpandido(null)}
                    />
                  </div>
                )}

                {esAdmin && (
                  <div className="mt-2 border-t border-gray-100 pt-2">
                    <button
                      type="button"
                      onClick={() =>
                        setModoAdmin((v) => (v === producto.id ? null : producto.id))
                      }
                      className="text-sm text-gray-500 underline"
                    >
                      {modoAdmin === producto.id ? "Cerrar admin" : "Admin"}
                    </button>

                    {modoAdmin === producto.id && (
                      <div className="mt-2 flex flex-col gap-3">
                        <EditarProductoForm
                          producto={producto}
                          productos={productos}
                        />
                        <EliminarProductoForm producto={producto} />
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function EditarCantidadForm({
  producto,
  onDone,
}: {
  producto: Producto;
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    actualizarCantidad,
    initialState,
  );

  useEffect(() => {
    if (state !== initialState && !state.error) {
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="producto_id" value={producto.id} />

      <label className="flex flex-col gap-1 text-sm text-gray-600">
        Cantidad nueva
        <input
          type="number"
          name="cantidad_nueva"
          step="0.01"
          min={0}
          required
          defaultValue={producto.cantidad_actual}
          className="rounded border border-gray-300 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-gray-600">
        Motivo
        <select
          name="motivo"
          required
          defaultValue=""
          className="rounded border border-gray-300 px-3 py-2"
        >
          <option value="" disabled>
            Elige un motivo
          </option>
          {MOTIVOS.map((motivo) => (
            <option key={motivo} value={motivo}>
              {MOTIVO_LABEL[motivo]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm text-gray-600">
        Nota (opcional)
        <input
          type="text"
          name="nota"
          className="rounded border border-gray-300 px-3 py-2"
        />
      </label>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-gray-900 px-3 py-2 text-sm text-white disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}

function EditarProductoForm({
  producto,
  productos,
}: {
  producto: Producto;
  productos: Producto[];
}) {
  const [state, formAction, pending] = useActionState(
    editarProducto,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        const nombre = new FormData(e.currentTarget).get("nombre") as string;
        const parecido = encontrarParecido(nombre, productos, producto.id);
        if (parecido) {
          const ok = window.confirm(
            `Ya existe un producto parecido: "${parecido.nombre}". ¿Seguro que quieres renombrar "${producto.nombre}" a "${nombre}"?`,
          );
          if (!ok) e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="producto_id" value={producto.id} />

      <label className="flex flex-col gap-1 text-sm text-gray-600">
        Nombre
        <input
          type="text"
          name="nombre"
          required
          defaultValue={producto.nombre}
          className="rounded border border-gray-300 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-gray-600">
        Categoría
        <select
          name="categoria"
          required
          defaultValue={producto.categoria}
          className="rounded border border-gray-300 px-3 py-2"
        >
          {CATEGORIAS.map((categoria) => (
            <option key={categoria} value={categoria}>
              {CATEGORIA_LABEL[categoria]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm text-gray-600">
        Umbral mínimo
        <input
          type="number"
          name="umbral_minimo"
          step="0.01"
          min={0}
          required
          defaultValue={producto.umbral_minimo}
          className="rounded border border-gray-300 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-gray-600">
        Orden (opcional)
        <input
          type="number"
          name="orden"
          step="1"
          defaultValue={producto.orden ?? undefined}
          className="rounded border border-gray-300 px-3 py-2"
        />
      </label>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded border border-gray-300 px-3 py-2 text-sm disabled:opacity-50"
      >
        {pending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}

function EliminarProductoForm({ producto }: { producto: Producto }) {
  const [state, formAction, pending] = useActionState(
    eliminarProducto,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={formAction}
      onSubmit={(e) => {
        const ok = window.confirm(
          `¿Borrar "${producto.nombre}"? Se perderá también su histórico de existencias y no se puede deshacer.`,
        );
        if (!ok) e.preventDefault();
      }}
    >
      <input type="hidden" name="producto_id" value={producto.id} />
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="rounded border border-red-300 px-3 py-2 text-sm text-red-700 disabled:opacity-50"
      >
        {pending ? "Borrando…" : "Eliminar producto"}
      </button>
    </form>
  );
}

function NuevoProductoForm({
  productos,
  onDone,
}: {
  productos: Producto[];
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    crearProducto,
    initialState,
  );

  useEffect(() => {
    if (state !== initialState && !state.error) {
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form
      action={formAction}
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        const nombre = new FormData(e.currentTarget).get("nombre") as string;
        const parecido = encontrarParecido(nombre, productos);
        if (parecido) {
          const ok = window.confirm(
            `Ya existe un producto parecido: "${parecido.nombre}". ¿Seguro que quieres crear "${nombre}" como uno nuevo?`,
          );
          if (!ok) e.preventDefault();
        }
      }}
    >
      <label className="flex flex-col gap-1 text-sm text-gray-600">
        Nombre
        <input
          type="text"
          name="nombre"
          required
          className="rounded border border-gray-300 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-gray-600">
        Categoría
        <select
          name="categoria"
          required
          defaultValue=""
          className="rounded border border-gray-300 px-3 py-2"
        >
          <option value="" disabled>
            Elige una categoría
          </option>
          {CATEGORIAS.map((categoria) => (
            <option key={categoria} value={categoria}>
              {CATEGORIA_LABEL[categoria]}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm text-gray-600">
        Cantidad inicial
        <input
          type="number"
          name="cantidad_actual"
          step="0.01"
          min={0}
          defaultValue={0}
          className="rounded border border-gray-300 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-gray-600">
        Umbral mínimo
        <input
          type="number"
          name="umbral_minimo"
          step="0.01"
          min={0}
          defaultValue={0}
          className="rounded border border-gray-300 px-3 py-2"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-gray-600">
        Orden (opcional)
        <input
          type="number"
          name="orden"
          step="1"
          className="rounded border border-gray-300 px-3 py-2"
        />
      </label>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-gray-900 px-3 py-2 text-sm text-white disabled:opacity-50"
      >
        {pending ? "Creando…" : "Crear producto"}
      </button>
    </form>
  );
}

function HistorialToggle({ productoId }: { productoId: string }) {
  const [state, formAction, pending] = useActionState(
    obtenerHistorial,
    initialHistorialState,
  );
  const [abierto, setAbierto] = useState(false);

  return (
    <div>
      <form action={formAction}>
        <input type="hidden" name="producto_id" value={productoId} />
        <button
          type="submit"
          onClick={(e) => {
            if (abierto) {
              e.preventDefault();
            }
            setAbierto((v) => !v);
          }}
          className="text-sm text-gray-500 underline"
        >
          {abierto ? "Ocultar historial" : "Ver historial"}
        </button>
      </form>

      {abierto && (
        <div className="mt-2 flex flex-col gap-1 text-xs text-gray-600">
          {pending && <p>Cargando…</p>}
          {state.error && <p className="text-red-600">{state.error}</p>}
          {state.entradas?.length === 0 && <p>Sin cambios registrados.</p>}
          {state.entradas?.map((entrada) => (
            <p key={entrada.id}>
              {new Date(entrada.created_at).toLocaleString("es-ES")} ·{" "}
              {entrada.alias} · {MOTIVO_LABEL[entrada.motivo]}:{" "}
              {entrada.cantidad_anterior} → {entrada.cantidad_nueva}
              {entrada.nota ? ` (${entrada.nota})` : ""}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
