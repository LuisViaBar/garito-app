export type Miembro = {
  id: string;
  auth_user_id: string;
  nombre: string;
  alias: string;
  email: string;
  rol: "admin" | "miembro";
  departamento: string | null;
  activo: boolean;
  created_at: string;
};

export type Categoria =
  | "bebida"
  | "comida"
  | "desechables"
  | "limpieza"
  | "otros";

export type Motivo = "reposicion" | "consumo" | "recuento" | "correccion";

export type Producto = {
  id: string;
  nombre: string;
  categoria: Categoria;
  cantidad_actual: number;
  umbral_minimo: number;
  orden: number | null;
  created_at: string;
};

export type StockLog = {
  id: string;
  producto_id: string;
  miembro_id: string;
  cantidad_anterior: number;
  cantidad_nueva: number;
  motivo: Motivo;
  nota: string | null;
  created_at: string;
};

export type AccionState = { error: string | null };

export type EstadoProyecto = "activo" | "archivado";
export type EstadoTarea = "pendiente" | "en_curso" | "hecha";
export type Permiso = "ver" | "editar";

export type Proyecto = {
  id: string;
  nombre: string;
  descripcion: string | null;
  proyecto_padre_id: string | null;
  creador_id: string;
  estado: EstadoProyecto;
  created_at: string;
};

export type ProyectoMiembro = {
  proyecto_id: string;
  miembro_id: string;
  permiso: Permiso;
};

export type Tarea = {
  id: string;
  proyecto_id: string;
  titulo: string;
  descripcion: string | null;
  responsable_id: string | null;
  estado: EstadoTarea;
  orden: number | null;
  created_at: string;
};

export type Comentario = {
  id: string;
  proyecto_id: string;
  miembro_id: string;
  texto: string;
  created_at: string;
};
