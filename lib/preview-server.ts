import "server-only";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { hasDatabase, previewMode } from "@/lib/preview";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type Viewer = {
  /** null when Supabase isn't configured. */
  supabase: Supabase | null;
  /** The signed-in user, or null. Never throws on a bad/unreachable DB. */
  user: User | null;
  /** True when the page should render sample data + <PreviewBanner />:
   *  preview mode is on and there's no signed-in user. */
  preview: boolean;
};

/**
 * One call for "who is looking at this page, and should they get the
 * sample-data preview?" Use it on gated pages and in server actions
 * instead of `createClient()` + `auth.getUser()` + `redirect('/login')`:
 *
 *   const { supabase, user, preview } = await getViewer();
 *   if (preview) return <SampleVersion />;      // + <PreviewBanner />
 *   if (!user || !supabase) redirect("/login?next=/binder");
 */
export async function getViewer(): Promise<Viewer> {
  if (!hasDatabase) return { supabase: null, user: null, preview: previewMode };
  const supabase = await createClient();
  let user: User | null = null;
  try {
    const { data } = await supabase.auth.getUser();
    user = data.user ?? null;
  } catch {
    user = null;
  }
  return { supabase, user, preview: previewMode && !user };
}
