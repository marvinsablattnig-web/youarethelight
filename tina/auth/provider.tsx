import React from "react";
import { AbstractAuthProvider } from "tinacms";
import type { LoginScreenProps } from "tinacms";

import { getSupabaseBrowserClient } from "../../lib/supabase/browser";

const getAccessToken = async () => {
  const {
    data: { session },
  } = await getSupabaseBrowserClient().auth.getSession();

  return session?.access_token ?? null;
};

// Tina's AuthWallInner invokes the login screen as a plain function call
// (loginScreen({...})) instead of rendering it as JSX. That means any hooks
// used in here run against AuthWallInner's own fiber, not a fiber of their
// own - and since this function is only called on renders where the user
// isn't authenticated yet, using hooks here causes a hook-count mismatch
// the moment auth state flips ("Rendered fewer hooks than expected"). This
// component must stay hook-free; state is handled via plain DOM updates.
const SupabaseLoginScreen = ({ handleAuthenticate }: LoginScreenProps) => {
  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");

    const submitButton = form.querySelector<HTMLButtonElement>('button[type="submit"]');
    const errorEl = form.parentElement?.querySelector<HTMLParagraphElement>('[data-role="login-error"]') ?? null;

    if (errorEl) {
      errorEl.hidden = true;
      errorEl.textContent = "";
    }

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Wird angemeldet...";
    }

    try {
      await handleAuthenticate({ email, password });
    } catch (submitError) {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Anmelden";
      }

      if (errorEl) {
        errorEl.hidden = false;
        errorEl.textContent =
          submitError instanceof Error ? submitError.message : "Die Anmeldung ist fehlgeschlagen.";
      }
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
              name="email"
              required
              autoComplete="email"
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-base text-white outline-none transition focus:border-amber-300"
              placeholder="editor@example.com"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-slate-200">Passwort</span>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-base text-white outline-none transition focus:border-amber-300"
              placeholder="••••••••"
            />
          </label>

          <button
            type="submit"
            className="w-full rounded-2xl bg-amber-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-70"
          >
            Anmelden
          </button>
        </form>

        <p data-role="login-error" hidden className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-200" />
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
