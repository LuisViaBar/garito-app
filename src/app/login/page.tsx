import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const { error } = await searchParams;

  return (
    <main className="flex-1 flex flex-col items-center justify-center p-6">
      <form
        action={login}
        className="w-full max-w-sm flex flex-col gap-4 rounded-lg border border-gray-200 p-6"
      >
        <h1 className="text-xl font-semibold text-center">Garito</h1>

        <div className="flex flex-col gap-1">
          <label htmlFor="email" className="text-sm text-gray-600">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded border border-gray-300 px-3 py-2"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password" className="text-sm text-gray-600">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="rounded border border-gray-300 px-3 py-2"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600">
            Email o contraseña incorrectos.
          </p>
        )}

        <button
          type="submit"
          className="rounded bg-gray-900 px-3 py-2 text-white"
        >
          Entrar
        </button>
      </form>
    </main>
  );
}
