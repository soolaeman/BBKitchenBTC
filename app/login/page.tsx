"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#0c0c0e] text-white flex items-center justify-center p-6">
      <section className="w-full max-w-md border border-white/10 bg-[#141417] rounded-xl p-8">
        <div className="mb-8">
          <p className="text-[10px] uppercase tracking-[0.25em] text-blue-400 font-mono">
            BBK INTERNAL
          </p>
          <h1 className="mt-2 text-2xl font-bold">Business Control Tower</h1>
          <p className="mt-2 text-sm text-white/50">
            Authorized BBKitchen personnel only.
          </p>
        </div>

        <button
          onClick={() => signIn("google", { redirectTo: "/admin" })}
          className="w-full rounded-lg bg-white text-black px-4 py-3 text-sm font-semibold hover:bg-white/90 transition"
        >
          Continue with Google
        </button>

        <p className="mt-6 text-[11px] leading-5 text-white/35">
          Access is controlled by the server-side BBK email allowlist.
          Your role is assigned from the server configuration, not from
          the browser.
        </p>
      </section>
    </main>
  );
}
