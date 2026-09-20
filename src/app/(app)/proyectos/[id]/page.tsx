import { DetalleProyecto } from "./detalle";

export default async function ProyectoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DetalleProyecto id={id} />;
}
