import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // ─── Pastikan row profiles ada & terisi nama ───
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const admin = createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!,
          { auth: { autoRefreshToken: false, persistSession: false } }
        );

        // Cek apakah profile sudah ada
        const { data: existing } = await admin
          .from("profiles")
          .select("id, full_name")
          .eq("id", user.id)
          .single();

        // Ambil nama dari metadata OAuth (Google/Github/etc) atau dari email
        const metaName =
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.user_metadata?.preferred_username ||
          null;

        // Extract nama dari email sebagai fallback terakhir: "nama@email.com" → "Nama"
        const emailName = user.email?.split("@")[0]
          ?.replace(/[._-]/g, " ")
          ?.replace(/\b\w/g, (c) => c.toUpperCase()) || null;

        const displayName = metaName || emailName || "User";

        if (!existing) {
          // Profile belum ada → buat baru dengan nama
          await admin.from("profiles").insert({
            id: user.id,
            email: user.email,
            full_name: displayName,
            credits: 0,
          });
          console.log(`[AUTH] Profile baru dibuat untuk ${user.email} → "${displayName}"`);
        } else if (!existing.full_name) {
          // Profile ada tapi nama kosong → update
          await admin
            .from("profiles")
            .update({ full_name: displayName })
            .eq("id", user.id);
          console.log(`[AUTH] Nama diupdate untuk ${user.email} → "${displayName}"`);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
