import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  History,
  Image as ImageIcon,
  LogOut,
  LayoutGrid,
  Zap,
  Settings,
  Briefcase,
  GraduationCap,
  ShieldCheck,
} from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex h-screen bg-[#F8F9FA] font-sans text-zinc-900">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-zinc-200 hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-zinc-100 cursor-pointer">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
              K
            </div>
            <span className="font-bold text-zinc-900">KlikJadi</span>
          </Link>
        </div>

        <div className="p-4 space-y-6 overflow-y-auto flex-1">
          <div>
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 px-2">
              Main Menu
            </div>
            <nav className="space-y-1">
              <Link href="/dashboard">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-zinc-600 hover:text-orange-700 hover:bg-orange-50"
                >
                  <LayoutGrid className="w-4 h-4 mr-3" /> Dashboard
                </Button>
              </Link>
              <Button
                variant="ghost"
                disabled
                className="w-full justify-start text-zinc-400"
              >
                <History className="w-4 h-4 mr-3" /> Riwayat (Soon)
              </Button>
              <Button
                variant="ghost"
                disabled
                className="w-full justify-start text-zinc-400"
              >
                <ImageIcon className="w-4 h-4 mr-3" /> Galeri (Soon)
              </Button>
            </nav>
          </div>

          <div>
            <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2 px-2">
              Tools
            </div>
            <nav className="space-y-1">
              <Button
                variant="ghost"
                disabled
                className="w-full justify-start text-zinc-600"
              >
                <Briefcase className="w-4 h-4 mr-3 text-purple-500" /> Pas Foto
                Karir
              </Button>
              <Button
                variant="ghost"
                disabled
                className="w-full justify-start text-zinc-600"
              >
                <GraduationCap className="w-4 h-4 mr-3 text-blue-500" />{" "}
                Pendidikan
              </Button>
              <Button
                variant="ghost"
                disabled
                className="w-full justify-start text-zinc-600"
              >
                <ShieldCheck className="w-4 h-4 mr-3 text-green-500" /> Dokumen
              </Button>
            </nav>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-zinc-100">
          <Link href="/dashboard/credits">
            {/* UBAH WARNA BG DI SINI: Dari zinc-900 ke orange gradient */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white relative overflow-hidden mb-4 cursor-pointer hover:scale-[1.02] transition-transform shadow-lg group">
              <div className="relative z-10">
                {/* Text color diubah jadi orange-100 agar blend dengan bg orange */}
                <p className="text-[10px] text-orange-100 font-bold uppercase mb-1 tracking-wider">
                  Sisa Kredit
                </p>
                <div className="flex items-end justify-between">
                  <span className="text-2xl font-bold text-white">
                    {profile?.credits || 0}
                  </span>
                  <span className="text-[10px] bg-white/20 px-2 py-1 rounded hover:bg-white/30 transition font-medium">
                    Top Up
                  </span>
                </div>
              </div>
              <Zap className="absolute -right-2 -bottom-2 w-16 h-16 text-white/10 rotate-12 group-hover:text-white/20 transition-colors" />
            </div>
          </Link>

          <div className="flex items-center gap-3 px-2 w-full p-2 mt-2">
            <div className="w-8 h-8 bg-zinc-200 rounded-full flex items-center justify-center text-xs font-bold text-zinc-500 uppercase border border-zinc-300">
              {user.email?.substring(0, 2)}
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="text-xs font-bold text-zinc-900 truncate">
                {profile?.full_name || user.email}
              </p>
              <p className="text-[10px] text-zinc-500 truncate">Free Plan</p>
            </div>
            <form action="/auth/signout" method="post">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-zinc-400 hover:text-red-500 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8 max-w-6xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
