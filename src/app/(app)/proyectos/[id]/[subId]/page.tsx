import { DetalleProyecto } from "../detalle";

export default async function SubproyectoPage({
  params,
}: {
  params: Promise<{ id: string; subId: string }>;
}) {
  const { id, subId } = await params;
  return <DetalleProyecto id={subId} padreId={id} />;
}
