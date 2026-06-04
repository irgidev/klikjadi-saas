import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  History,
  Image as ImageIcon,
  LogOut,
  LayoutGrid,
  Zap,
  Receipt,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Baca kredit pakai admin client (bypass RLS)
  let credits = profile?.credits ?? 0;
  try {
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    const { data: adm } = await admin
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();
    if (typeof adm?.credits === "number") {
      credits = adm.credits;
    }
  } catch {
    // fallback ke nilai regular client
  }

  // Nama tampilan (fallback chain)
  const displayName =
    profile?.full_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split("@")[0] ||
    "User";

  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <div className="flex h-screen bg-[#F8F9FA] font-sans text-zinc-900">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-zinc-200 hidden md:flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-zinc-100">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
              K
            </div>
            <span className="font-bold text-zinc-900 text-lg">KlikJadi</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <Link href="/dashboard">
            <Button
              variant="ghost"
              className="w-full justify-start text-zinc-600 hover:text-orange-700 hover:bg-orange-50 font-medium"
            >
              <LayoutGrid className="w-4 h-4 mr-3" /> Pas Foto
            </Button>
          </Link>
          <Link href="/dashboard/gallery">
            <Button
              variant="ghost"
              className="w-full justify-start text-zinc-600 hover:text-orange-700 hover:bg-orange-50 font-medium"
            >
              <ImageIcon className="w-4 h-4 mr-3" /> Galeri
            </Button>
          </Link>
          <Link href="/dashboard/history">
            <Button
              variant="ghost"
              className="w-full justify-start text-zinc-600 hover:text-orange-700 hover:bg-orange-50 font-medium"
            >
              <Receipt className="w-4 h-4 mr-3" /> Pembayaran
            </Button>
          </Link>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-5 border-t border-zinc-100 space-y-6">
          {/* Credits Card */}
          <Link href="/dashboard/credits">
            <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-4 text-white relative overflow-hidden cursor-pointer hover:scale-[1.02] transition-transform shadow-md group">
              <div className="relative z-10">
                <p className="text-[10px] text-orange-100 font-bold uppercase mb-1 tracking-wider">
                  Sisa Kredit
                </p>
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-black text-white leading-none">
                    {credits}
                  </span>
                  <span className="text-[11px] bg-white/20 px-2.5 py-1 rounded-md hover:bg-white/30 transition font-medium">
                    Top Up
                  </span>
                </div>
              </div>
              <Zap className="absolute -right-2 -bottom-2 w-16 h-16 text-white/10 rotate-12 group-hover:text-white/20 transition-colors" />
            </div>
          </Link>

          {/* User Info + Logout — dipisah jauh dari kredit */}
          <div className="pt-4 border-t border-zinc-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center text-sm font-bold text-orange-700 border border-orange-200 shrink-0 shadow-sm">
                {avatarLetter}
              </div>
              <div className="text-left min-w-0 flex-1">
                <p className="text-sm font-bold text-zinc-900 truncate leading-tight">
                  {displayName}
                </p>
                <p className="text-[11px] text-zinc-400 truncate">{user.email}</p>
              </div>
              <form action="/auth/signout" method="post" className="shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-zinc-400 hover:text-red-500 hover:bg-red-50"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8 max-w-5xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
