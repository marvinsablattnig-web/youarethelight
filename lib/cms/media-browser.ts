import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export const getSupabaseAuthHeaders = async () => {
  const {
    data: { session },
  } = await getSupabaseBrowserClient().auth.getSession();

  if (!session?.access_token) {
    return {} as Record<string, string>;
  }

  return {
    Authorization: `Bearer ${session.access_token}`,
  } satisfies Record<string, string>;
};
