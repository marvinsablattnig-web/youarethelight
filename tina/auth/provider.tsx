import React, { useEffect, useState } from "react";
import { AbstractAuthProvider } from "tinacms";
import type { LoginScreenProps } from "tinacms";

import { getSupabaseBrowserClient } from "../../lib/supabase/browser";

const getAccessToken = async () => {
  const {
    data: { session },
  } = await getSupabaseBrowserClient().auth.getSession();

  return session?.access_token ?? null;
};

const SupabaseLoginScreen = ({ handleAuthenticate }: LoginScreenProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "sending">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkAuthorization = async () => {
      try {
        const token = await getAccessToken();

        if (!token) {
          return;
        }

        const response = await fetch("/api/admin/session", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok && isMounted) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null;
          setError(body?.error || "Dieses Konto darf den Admin-Bereich nicht verwalten.");
        }
      } catch {
        if (isMounted) {
          setError("Die aktuelle Session konnte nicht geprüft werden.");
        }
      }
    };

    void checkAuthorization();

    return () => {
      isMounted = false;
    };
  }, []);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setStatus("sending");

    try {
      await handleAuthenticate({
        email,
        password,
      });
    } catch (submitError) {
      setStatus("idle");
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Die Anmeldung ist fehlgeschlagen.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/40 backdrop-blur">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">
            Tina Admin
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
            Editor Login
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            Melde dich mit deinem freigeschalteten Supabase-Konto an.
          </p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">E-Mail</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-base text-white outline-none transition focus:border-amber-300"
              placeholder="editor@example.com"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">Passwort</span>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-base text-white outline-none transition focus:border-amber-300"
              placeholder="••••••••"
            />
          </label>

          <button
            type="submit"
            disabled={status === "sending"}
            className="w-full rounded-2xl bg-amber-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {status === "sending" ? "Wird angemeldet..." : "Anmelden"}
          </button>
        </form>

        {error ? (
          <p className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
};

SupabaseLoginScreen.displayName = "SupabaseLoginScreen";

const TinaSessionProvider = ({ children }: { children?: React.ReactNode }) => <>{children}</>;

TinaSessionProvider.displayName = "TinaSessionProvider";

export class SupabaseTinaAuthProvider extends AbstractAuthProvider {
  async authenticate(props?: Record<string, string>) {
    const email = props?.email?.trim().toLowerCase();
    const password = props?.password;

    if (!email) {
      throw new Error("Bitte gib eine E-Mail-Adresse ein.");
    }

    if (!password) {
      throw new Error("Bitte gib dein Passwort ein.");
    }

    const { data, error } = await getSupabaseBrowserClient().auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data.session?.access_token) {
      throw new Error("Es wurde keine gültige Session zurückgegeben.");
    }

    // Force a full reload instead of letting Tina swap the login screen for the
    // authenticated app in place: that in-place transition is untested for this
    // provider (the previous magic-link flow only ever became "authenticated" via
    // a fresh page load after the email redirect) and crashes with a React hooks
    // error when triggered live.
    window.location.reload();

    return {
      id_token: data.session.access_token,
    };
  }

  async getUser() {
    const {
      data: { user },
      error,
    } = await getSupabaseBrowserClient().auth.getUser();

    if (error) {
      return null;
    }

    return user;
  }

  async getToken() {
    const {
      data: { session },
    } = await getSupabaseBrowserClient().auth.getSession();

    if (!session?.access_token) {
      return null;
    }

    return {
      id_token: session.access_token,
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    };
  }

  async authorize() {
    const token = await getAccessToken();

    if (!token) {
      return null;
    }

    const response = await fetch("/api/admin/session", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  }

  async logout() {
    await getSupabaseBrowserClient().auth.signOut();
    window.location.assign("/admin/index.html");
  }

  getLoginStrategy() {
    return "LoginScreen" as const;
  }

  getLoginScreen() {
    return SupabaseLoginScreen;
  }

  getSessionProvider() {
    return TinaSessionProvider;
  }
}
