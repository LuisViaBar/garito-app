import { ButtonPrimary } from "@/components/ui/buttons";
import { Field, FormError, Input } from "@/components/ui/field";
import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-content flex-1 flex-col justify-center px-gutter pt-safe pb-safe">
      <form
        action={login}
        className="my-10 flex flex-col gap-5 rounded-card border border-line bg-surface p-5 shadow-card"
      >
        <h1 className="font-display text-section tracking-display">Garito</h1>

        <Field label="Email">
          <Input
            name="email"
            type="email"
            required
            autoComplete="email"
          />
        </Field>

        <Field label="Contraseña">
          <Input
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </Field>

        <FormError>
          {error ? "Email o contraseña incorrectos." : null}
        </FormError>

        <ButtonPrimary type="submit" fullWidth>
          Entrar
        </ButtonPrimary>
      </form>
    </main>
  );
}
