import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Route Handler wajib export function dengan nama method HTTP (GET, POST, dll)
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // Jika ada parameter 'next', gunakan. Jika tidak, default ke /dashboard
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient(); // Await wajib di Next.js 15
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Login sukses, lempar ke dashboard
      return NextResponse.redirect(`${origin}${next}`);
    } else {
      console.error("Auth Error:", error);
    }
  }

  // Jika gagal atau tidak ada code, balik ke login dengan pesan error
  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
