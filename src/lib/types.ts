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
