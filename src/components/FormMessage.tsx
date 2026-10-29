export function FormMessage({ state }: { state?: { error?: string; success?: string } }) {
  if (state?.error) return <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800">{state.error}</p>;
  if (state?.success)
    return <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{state.success}</p>;
  return null;
}
