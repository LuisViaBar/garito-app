import { ButtonPrimary, ButtonSecondary } from "./buttons";

/**
 * Pie de un formulario en línea: cancelar a la izquierda, enviar a la derecha
 * (mismo orden que `ConfirmSheet`).
 */
export function FormActions({
  pending,
  enviar,
  enviando,
  onCancel,
}: {
  pending: boolean;
  enviar: string;
  enviando: string;
  onCancel: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <ButtonSecondary onClick={onCancel}>Cancelar</ButtonSecondary>
      <ButtonPrimary type="submit" disabled={pending}>
        {pending ? enviando : enviar}
      </ButtonPrimary>
    </div>
  );
}
