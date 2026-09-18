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
