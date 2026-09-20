"use client";

import { Check, Plus, TriangleAlert } from "lucide-react";
import {
  startTransition,
  useActionState,
  useEffect,
  useState,
  type FormEvent,
} from "react";
import { ConfirmSheet } from "@/components/ui/bottom-sheet";
import { ButtonPrimary, ButtonSecondary } from "@/components/ui/buttons";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, FormError, Input, Select } from "@/components/ui/field";
import { FormActions } from "@/components/ui/form-actions";
import { CardList, ListCard } from "@/components/ui/list-card";
import { SummaryPill } from "@/components/ui/summary-pill";
import { formatCantidad } from "@/lib/format";
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

// Panel desplegado dentro de una tarjeta. Solo hay uno abierto a la vez en
// toda la lista, así en pantalla nunca compiten dos formularios.
type Panel = { id: string; tipo: "cantidad" | "historial" | "editar" };

export function ListaProductos({
  productos,
  bajosIds,
  esAdmin,
}: {
  productos: Producto[];
  bajosIds: Set<string>;
  esAdmin: boolean;
}) {
  const [panel, setPanel] = useState<Panel | null>(null);
  const [mostrarNuevo, setMostrarNuevo] = useState(false);
  const [soloBajos, setSoloBajos] = useState(false);

  const alternar = (id: string, tipo: Panel["tipo"]) =>
    setPanel((actual) =>
      actual?.id === id && actual.tipo === tipo ? null : { id, tipo },
    );

  const filtrando = soloBajos && bajosIds.size > 0;

  // Los productos bajo mínimo suben arriba de la lista; a igualdad de
  // estado se conserva el orden recibido (orden manual, luego nombre).
  const visibles = [...productos]
    .sort((a, b) => (bajosIds.has(a.id) ? 0 : 1) - (bajosIds.has(b.id) ? 0 : 1))
    .filter((p) => !filtrando || bajosIds.has(p.id));

  const botonNuevo = (
    <ButtonPrimary
      icon={<Plus size={20} strokeWidth={1.75} aria-hidden />}
      onClick={() => {
        setPanel(null);
        setMostrarNuevo(true);
      }}
    >
      Nuevo producto
    </ButtonPrimary>
  );

  return (
    <div className="flex flex-col gap-6">
      <SummaryPill
        count={bajosIds.size}
        icon={
          bajosIds.size > 0 ? (
            <TriangleAlert size={20} strokeWidth={1.75} aria-hidden />
          ) : (
            <Check size={20} strokeWidth={1.75} aria-hidden />
          )
        }
        pressed={filtrando}
        onClick={() => setSoloBajos((v) => !v)}
      >
        {bajosIds.size > 0
          ? `${bajosIds.size} producto${bajosIds.size === 1 ? "" : "s"} bajo mínimos`
          : "Todo por encima de mínimos"}
      </SummaryPill>

      {esAdmin && mostrarNuevo && (
        <NuevoProductoForm
          productos={productos}
          onDone={() => setMostrarNuevo(false)}
        />
      )}

      {esAdmin && !mostrarNuevo && productos.length > 0 && (
        <div>{botonNuevo}</div>
      )}

      {productos.length === 0 ? (
        <EmptyState
          action={esAdmin && !mostrarNuevo ? botonNuevo : undefined}
        >
          Todavía no hay productos en el almacén.
        </EmptyState>
      ) : (
        <CardList>
          {visibles.map((producto) => {
            const bajo = bajosIds.has(producto.id);
            const abierto = panel?.id === producto.id ? panel.tipo : null;
            return (
              <li key={producto.id}>
                <ListCard
                  status={bajo ? "alert" : "ok"}
                  statusLabel={bajo ? "Bajo mínimo" : "Por encima del mínimo"}
                  title={producto.nombre}
                  meta={CATEGORIA_LABEL[producto.categoria]}
                  value={formatCantidad(producto.cantidad_actual)}
                  valueNote={`mín. ${formatCantidad(producto.umbral_minimo)}`}
                  actions={
                    <>
                      <ButtonSecondary
                        aria-expanded={abierto === "cantidad"}
                        onClick={() => alternar(producto.id, "cantidad")}
                      >
                        Editar cantidad
                      </ButtonSecondary>
                      <ButtonSecondary
                        aria-expanded={abierto === "historial"}
                        onClick={() => alternar(producto.id, "historial")}
                      >
                        Ver historial
                      </ButtonSecondary>
                      {esAdmin && (
                        <div className="col-span-2">
                          <ButtonSecondary
                            fullWidth
                            aria-expanded={abierto === "editar"}
                            onClick={() => alternar(producto.id, "editar")}
                          >
                            Editar producto
                          </ButtonSecondary>
                        </div>
                      )}
                    </>
                  }
                  panel={
                    abierto === "cantidad" ? (
                      <EditarCantidadForm
                        producto={producto}
                        onDone={() => setPanel(null)}
                      />
                    ) : abierto === "historial" ? (
                      <HistorialPanel productoId={producto.id} />
                    ) : abierto === "editar" ? (
                      <div className="flex flex-col gap-5">
                        <EditarProductoForm
                          producto={producto}
                          productos={productos}
                          onDone={() => setPanel(null)}
                        />
                        <div className="border-t border-line-soft pt-5">
                          <EliminarProductoForm producto={producto} />
                        </div>
                      </div>
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

// Envío de formulario con confirmación en hoja inferior. Si hay aviso, se
// frena el envío y se guarda el FormData; al confirmar se despacha la acción
// con esos mismos datos.
function useEnvioConfirmado(formAction: (datos: FormData) => void) {
  const [pendiente, setPendiente] = useState<{
    mensaje: string;
    datos: FormData;
  } | null>(null);

  return {
    aviso: pendiente?.mensaje ?? null,
    antesDeEnviar(e: FormEvent<HTMLFormElement>, mensaje: string | null) {
      if (!mensaje) return;
      e.preventDefault();
      setPendiente({ mensaje, datos: new FormData(e.currentTarget) });
    },
    confirmar() {
      if (!pendiente) return;
      const { datos } = pendiente;
      setPendiente(null);
      startTransition(() => formAction(datos));
    },
    cancelar() {
      setPendiente(null);
    },
  };
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
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="producto_id" value={producto.id} />

      <Field label="Cantidad nueva">
        <Input
          type="number"
          name="cantidad_nueva"
          inputMode="decimal"
          step="0.01"
          min={0}
          required
          defaultValue={producto.cantidad_actual}
        />
      </Field>

      <Field label="Motivo">
        <Select name="motivo" required defaultValue="">
          <option value="" disabled>
            Elige un motivo
          </option>
          {MOTIVOS.map((motivo) => (
            <option key={motivo} value={motivo}>
              {MOTIVO_LABEL[motivo]}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Nota (opcional)">
        <Input type="text" name="nota" />
      </Field>

      <FormError>{state.error}</FormError>

      <FormActions
        pending={pending}
        enviar="Guardar"
        enviando="Guardando…"
        onCancel={onDone}
      />
    </form>
  );
}

function EditarProductoForm({
  producto,
  productos,
  onDone,
}: {
  producto: Producto;
  productos: Producto[];
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    editarProducto,
    initialState,
  );
  const envio = useEnvioConfirmado(formAction);

  useEffect(() => {
    if (state !== initialState && !state.error) {
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <>
      <form
        action={formAction}
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          const nombre = new FormData(e.currentTarget).get("nombre") as string;
          const parecido = encontrarParecido(nombre, productos, producto.id);
          envio.antesDeEnviar(
            e,
            parecido
              ? `Ya existe un producto parecido: "${parecido.nombre}". ¿Seguro que quieres renombrar "${producto.nombre}" a "${nombre}"?`
              : null,
          );
        }}
      >
        <input type="hidden" name="producto_id" value={producto.id} />

        <Field label="Nombre">
          <Input
            type="text"
            name="nombre"
            required
            defaultValue={producto.nombre}
          />
        </Field>

        <Field label="Categoría">
          <Select name="categoria" required defaultValue={producto.categoria}>
            {CATEGORIAS.map((categoria) => (
              <option key={categoria} value={categoria}>
                {CATEGORIA_LABEL[categoria]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Umbral mínimo">
          <Input
            type="number"
            name="umbral_minimo"
            inputMode="decimal"
            step="0.01"
            min={0}
            required
            defaultValue={producto.umbral_minimo}
          />
        </Field>

        <Field label="Orden (opcional)">
          <Input
            type="number"
            name="orden"
            inputMode="numeric"
            step="1"
            defaultValue={producto.orden ?? undefined}
          />
        </Field>

        <FormError>{state.error}</FormError>

        <FormActions
          pending={pending}
          enviar="Guardar cambios"
          enviando="Guardando…"
          onCancel={onDone}
        />
      </form>

      <ConfirmSheet
        open={envio.aviso !== null}
        title="¿Producto duplicado?"
        message={envio.aviso ?? ""}
        confirmLabel="Renombrar igualmente"
        onConfirm={envio.confirmar}
        onCancel={envio.cancelar}
      />
    </>
  );
}

function EliminarProductoForm({ producto }: { producto: Producto }) {
  const [state, formAction, pending] = useActionState(
    eliminarProducto,
    initialState,
  );
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
          {pending ? "Borrando…" : "Eliminar producto"}
        </ButtonSecondary>
      </div>

      <ConfirmSheet
        open={confirmando}
        title={`¿Borrar "${producto.nombre}"?`}
        message="Se perderá también su histórico de existencias y no se puede deshacer."
        confirmLabel="Borrar producto"
        onConfirm={() => {
          setConfirmando(false);
          const datos = new FormData();
          datos.set("producto_id", producto.id);
          startTransition(() => formAction(datos));
        }}
        onCancel={() => setConfirmando(false)}
      />
    </div>
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
  const envio = useEnvioConfirmado(formAction);

  useEffect(() => {
    if (state !== initialState && !state.error) {
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <>
      <form
        action={formAction}
        className="flex flex-col gap-4 rounded-card border border-line bg-surface p-4 shadow-card"
        onSubmit={(e) => {
          const nombre = new FormData(e.currentTarget).get("nombre") as string;
          const parecido = encontrarParecido(nombre, productos);
          envio.antesDeEnviar(
            e,
            parecido
              ? `Ya existe un producto parecido: "${parecido.nombre}". ¿Seguro que quieres crear "${nombre}" como uno nuevo?`
              : null,
          );
        }}
      >
        <h2 className="text-screen font-bold">Nuevo producto</h2>

        <Field label="Nombre">
          <Input type="text" name="nombre" required />
        </Field>

        <Field label="Categoría">
          <Select name="categoria" required defaultValue="">
            <option value="" disabled>
              Elige una categoría
            </option>
            {CATEGORIAS.map((categoria) => (
              <option key={categoria} value={categoria}>
                {CATEGORIA_LABEL[categoria]}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Cantidad inicial">
          <Input
            type="number"
            name="cantidad_actual"
            inputMode="decimal"
            step="0.01"
            min={0}
            defaultValue={0}
          />
        </Field>

        <Field label="Umbral mínimo">
          <Input
            type="number"
            name="umbral_minimo"
            inputMode="decimal"
            step="0.01"
            min={0}
            defaultValue={0}
          />
        </Field>

        <Field label="Orden (opcional)">
          <Input
            type="number"
            name="orden"
            inputMode="numeric"
            step="1"
          />
        </Field>

        <FormError>{state.error}</FormError>

        <FormActions
          pending={pending}
          enviar="Crear producto"
          enviando="Creando…"
          onCancel={onDone}
        />
      </form>

      <ConfirmSheet
        open={envio.aviso !== null}
        title="¿Producto duplicado?"
        message={envio.aviso ?? ""}
        confirmLabel="Crear igualmente"
        onConfirm={envio.confirmar}
        onCancel={envio.cancelar}
      />
    </>
  );
}

function HistorialPanel({ productoId }: { productoId: string }) {
  const [state, formAction, pending] = useActionState(
    obtenerHistorial,
    initialHistorialState,
  );

  // El panel se monta al pulsar "Ver historial": se pide entonces, y cada
  // apertura trae datos frescos.
  useEffect(() => {
    const datos = new FormData();
    datos.set("producto_id", productoId);
    startTransition(() => formAction(datos));
  }, [productoId, formAction]);

  if (state.error) return <FormError>{state.error}</FormError>;

  if (pending || state.entradas === null) {
    return <p className="text-meta text-ink-2">Cargando…</p>;
  }

  if (state.entradas.length === 0) {
    return <p className="text-meta text-ink-2">Sin cambios registrados.</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-line-soft">
      {state.entradas.map((entrada) => (
        <li key={entrada.id} className="flex flex-col gap-1 py-2 first:pt-0 last:pb-0">
          <p className="flex items-baseline justify-between gap-3 text-label">
            <span className="min-w-0 truncate font-medium">
              {entrada.alias} · {MOTIVO_LABEL[entrada.motivo]}
            </span>
            <span className="shrink-0 font-bold tabular-nums">
              {formatCantidad(entrada.cantidad_anterior)} →{" "}
              {formatCantidad(entrada.cantidad_nueva)}
            </span>
          </p>
          <p className="text-meta text-ink-2">
            {new Date(entrada.created_at).toLocaleString("es-ES", {
              dateStyle: "short",
              timeStyle: "short",
            })}
            {entrada.nota ? ` · ${entrada.nota}` : ""}
          </p>
        </li>
      ))}
    </ul>
  );
}
