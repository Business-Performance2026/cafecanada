import { Coffee } from "lucide-react";

/** Shown when Firebase env vars are missing — tells the owner what to do. */
export function FirebaseSetupNotice() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="max-w-md rounded-3xl border bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-800 text-white">
          <Coffee className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-xl font-bold">Firebase setup needed</h2>
        <p className="mt-2 text-sm text-stone-600">
          This app needs your Firebase project config. Copy <code className="rounded bg-stone-100 px-1">.env.example</code> to{" "}
          <code className="rounded bg-stone-100 px-1">.env</code> and fill in the values from your
          Firebase project settings, then restart the dev server.
        </p>
        <p className="mt-3 text-xs text-stone-400">See README.md for the full setup guide.</p>
      </div>
    </div>
  );
}
