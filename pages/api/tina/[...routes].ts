import { LocalBackendAuthProvider, TinaNodeBackend } from "@tinacms/datalayer";

import { createSupabaseBackendAuthProvider } from "../../../tina/auth/backend";
import databaseClient from "../../../tina/__generated__/databaseClient";

const isLocal = process.env.TINA_PUBLIC_IS_LOCAL === "true";

const handler = TinaNodeBackend({
  authProvider: isLocal ? LocalBackendAuthProvider() : createSupabaseBackendAuthProvider(),
  databaseClient,
});

export default function tinaHandler(req: unknown, res: unknown) {
  return handler(req as never, res as never);
}
