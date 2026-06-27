import type { BackendAuthProvider } from "@tinacms/datalayer";

import { requireEditorFromNodeRequest } from "../../lib/cms/auth";

export const createSupabaseBackendAuthProvider = (): BackendAuthProvider => ({
  async isAuthorized(req) {
    const result = await requireEditorFromNodeRequest(req);

    if (result.ok) {
      return {
        isAuthorized: true,
      };
    }

    return {
      isAuthorized: false,
      errorCode: result.status,
      errorMessage: result.error,
    };
  },
});
