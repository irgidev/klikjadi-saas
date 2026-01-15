import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UploadZone } from "@/components/upload-zone";
import {
  Briefcase,
  GraduationCap,
  Users,
  Palette,
  Zap,
  ChevronRight,
  ImageIcon,
  Camera,
  Loader2,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal,
  Clock,
  Sparkles,
} from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();

  // 1. Cek User
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  // 2. Ambil Data
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();
  const { data: trainings } = await supabase
    .from("trainings")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

  // Helper untuk greeting berdasarkan waktu
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Selamat Pagi" : hour < 18 ? "Selamat Siang" : "Selamat Malam";

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      {/* SECTION 1: HEADER & STATS OVERVIEW */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-100 pb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            {greeting}, {profile?.full_name?.split(" ")[0] || "Kreator"}! 👋
          </h1>
          <p className="text-zinc-500 mt-2 text-sm">
            Berikut adalah ringkasan aktivitas studio foto AI kamu.
          </p>
        </div>

        <div className="flex gap-4">
          {/* Stats Card Kecil - Total Foto */}
          <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-white border border-zinc-200 rounded-xl shadow-sm">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">
                Total Foto
              </p>
              <p className="text-sm font-bold text-zinc-900">
                {trainings?.length || 0} Project
              </p>
            </div>
          </div>

          {/* Stats Card Kecil - Sisa Kredit */}
          <div className="flex items-center gap-3 px-4 py-2 bg-white border border-zinc-200 rounded-xl shadow-sm">
            <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase">
                Sisa Kredit
              </p>
              <p className="text-sm font-bold text-zinc-900">
                {profile?.credits || 0} Koin
              </p>
            </div>
            <Link href="/dashboard/credits" className="ml-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              >
                Top Up
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* SECTION 2: MAIN CONTENT (RIWAYAT) - SPAN 8 */}
        <div className="lg:col-span-8 space-y-6">
          {/* Quick Shortcuts (Template Populer) */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-500" /> Template Populer
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                {
                  icon: Briefcase,
                  label: "Karir & BUMN",
                  color: "text-blue-600",
                  bg: "bg-blue-50",
                },
                {
                  icon: GraduationCap,
                  label: "Pendidikan",
                  color: "text-emerald-600",
                  bg: "bg-emerald-50",
                },
                {
                  icon: Users,
                  label: "Studio Grup",
                  color: "text-purple-600",
                  bg: "bg-purple-50",
                },
                {
                  icon: Palette,
                  label: "Ganti Baju",
                  color: "text-pink-600",
                  bg: "bg-pink-50",
                },
              ].map((item, i) => (
                <button
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl border border-zinc-200 bg-white hover:border-orange-300 hover:shadow-sm transition-all group text-left"
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.bg} ${item.color} group-hover:scale-110 transition-transform`}
                  >
                    <item.icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold text-zinc-700 group-hover:text-zinc-900">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Project List / Riwayat */}
          <div className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-zinc-900">
                Riwayat Project
              </h3>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                >
                  Filter
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                >
                  Sort
                </Button>
              </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-sm min-h-[400px]">
              {trainings?.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[400px] text-center p-8 bg-zinc-50/30">
                  <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 border border-zinc-100">
                    <Camera className="w-10 h-10 text-zinc-300" />
                  </div>
                  <h3 className="font-bold text-zinc-900 text-lg">
                    Belum ada foto
                  </h3>
                  <p className="text-zinc-500 text-sm mt-2 max-w-xs mx-auto">
                    Mulai buat pas foto profesional pertamamu sekarang. Cuma
                    butuh 2 menit.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {trainings?.map((item) => (
                    <Link href={`/dashboard/project/${item.id}`} key={item.id}>
                      <div className="p-4 flex items-center gap-4 hover:bg-zinc-50 transition-colors cursor-pointer group">
                        {/* Icon / Thumbnail */}
                        <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0 border border-zinc-200 group-hover:border-orange-200 group-hover:bg-white transition-colors">
                          {item.status === "completed" ? (
                            <ImageIcon className="w-5 h-5 text-zinc-500 group-hover:text-orange-500" />
                          ) : (
                            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold text-sm text-zinc-900 truncate capitalize">
                              {item.trigger_word || "Untitled Project"}
                            </h4>
                            {item.status === "completed" && (
                              <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold border border-green-200">
                                HD READY
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-zinc-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(item.created_at).toLocaleDateString(
                                "id-ID",
                                {
                                  day: "numeric",
                                  month: "short",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                }
                              )}
                            </span>
                            <span>•</span>
                            <span>Flux.1 AI</span>
                          </div>
                        </div>

                        {/* Status & Action */}
                        <div className="flex items-center gap-4">
                          {item.status === "completed" ? (
                            <div className="flex items-center gap-2">
                              <span className="hidden sm:flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-md">
                                <CheckCircle2 className="w-3 h-3" /> Selesai
                              </span>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50 text-zinc-700"
                              >
                                Download
                              </Button>
                            </div>
                          ) : item.status === "failed" ? (
                            <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-md">
                              <AlertCircle className="w-3 h-3" /> Gagal
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md animate-pulse">
                              Memproses...
                            </span>
                          )}
                          <button className="text-zinc-400 hover:text-zinc-600">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 3: SIDEBAR ACTION (UPLOAD) - SPAN 4 */}
        <div className="lg:col-span-4 space-y-6 sticky top-8">
          {/* 1. MAGIC UPLOAD CARD (Warna Oranye Outrank) */}
          <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-3xl p-1 shadow-2xl shadow-orange-500/20 relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

            {/* Inner Content */}
            <div className="bg-white/10 backdrop-blur-md rounded-[22px] p-6 relative z-10 h-full flex flex-col border border-white/10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10 shadow-sm">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-white leading-tight">
                      Butuh Pas Foto?
                    </h3>
                    <p className="text-orange-50 text-xs font-medium opacity-90">
                      Mulai di sini.
                    </p>
                  </div>
                </div>
                <span className="flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                </span>
              </div>

              {/* THE UPLOAD ZONE COMPONENT (White Card inside Orange) */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-white/20">
                {/* Kita passing props khusus jika perlu custom styling di dalam komponen, tapi default white card sudah bagus */}
                <UploadZone userId={user.id} />
              </div>

              <p className="text-center text-[10px] text-orange-50 mt-4 font-medium opacity-80">
                Mendukung JPG/PNG hingga 10MB. <br />
                Privasi dijamin aman & terenkripsi.
              </p>
            </div>

            {/* Hiasan Background */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-red-600/50 to-transparent"></div>
          </div>

          {/* 2. SERVER STATUS */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-bold text-sm text-zinc-700">System Status</h4>
              <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200">
                OPERATIONAL
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>Flux.1 Engine</span>
                <span className="text-green-600 font-medium">98ms latency</span>
              </div>
              <div className="w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden">
                <div className="bg-green-500 w-[98%] h-full rounded-full"></div>
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-500 pt-1">
                <span>Storage API</span>
                <span className="text-green-600 font-medium">Connected</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813a3.75 3.75 0 002.576-2.576l.813-2.846A.75.75 0 019 4.5zM9 15a.75.75 0 01.75.75v1.5h1.5a.75.75 0 010 1.5h-1.5v1.5a.75.75 0 01-1.5 0v-1.5h-1.5a.75.75 0 010-1.5h1.5v-1.5A.75.75 0 019 15z"
        clipRule="evenodd"
      />
    </svg>
  );
}
