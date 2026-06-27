import type { IncomingHttpHeaders, IncomingMessage } from "http";

import { createClient, type User } from "@supabase/supabase-js";

export type AuthenticatedEditor = {
  id: string;
  email: string;
};

type AuthResult =
  | {
      ok: true;
      user: AuthenticatedEditor;
    }
  | {
      ok: false;
      error: string;
      status: number;
    };

const LOCAL_EDITOR: AuthenticatedEditor = {
  id: "local-editor",
  email: "local@tinacms.dev",
};

let adminClient:
  | ReturnType<typeof createClient>
  | null = null;

export const isLocalTinaMode = () => process.env.TINA_PUBLIC_IS_LOCAL === "true";

export const getAllowedEditorEmails = () =>
  (process.env.TINACMS_ALLOWED_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

const requireServerEnv = (name: string) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

export const getSupabaseAdminClient = () => {
  if (adminClient) {
    return adminClient;
  }

  adminClient = createClient(
    requireServerEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireServerEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  return adminClient;
};

const getHeaderValue = (headers: Headers | IncomingHttpHeaders, name: string) => {
  if (headers instanceof Headers) {
    return headers.get(name);
  }

  const value = headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value ?? null;
};

export const extractBearerToken = (headers: Headers | IncomingHttpHeaders) => {
  const authorization = getHeaderValue(headers, "authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim() || null;
};

const isAllowedEditor = (user: User) => {
  const allowedEmails = getAllowedEditorEmails();
  const email = user.email?.toLowerCase();

  if (!email) {
    return false;
  }

  if (allowedEmails.length === 0) {
    return false;
  }

  return allowedEmails.includes(email);
};

export const authenticateEditorToken = async (token: string): Promise<AuthResult> => {
  try {
    const supabase = getSupabaseAdminClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return {
        ok: false,
        error: "Ungueltige oder abgelaufene Session.",
        status: 401,
      };
    }

    if (!isAllowedEditor(user)) {
      return {
        ok: false,
        error: "Dieses Konto ist nicht als Editor freigeschaltet.",
        status: 403,
      };
    }

    return {
      ok: true,
      user: {
        id: user.id,
        email: user.email || "",
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Editor-Authentifizierung fehlgeschlagen.",
      status: 500,
    };
  }
};

export const requireEditorFromHeaders = async (
  headers: Headers | IncomingHttpHeaders,
): Promise<AuthResult> => {
  if (isLocalTinaMode()) {
    return {
      ok: true,
      user: LOCAL_EDITOR,
    };
  }

  const token = extractBearerToken(headers);

  if (!token) {
    return {
      ok: false,
      error: "Editor-Login erforderlich.",
      status: 401,
    };
  }

  return authenticateEditorToken(token);
};

export const requireEditorFromNodeRequest = (request: IncomingMessage) =>
  requireEditorFromHeaders(request.headers);
