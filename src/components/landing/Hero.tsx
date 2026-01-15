"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Play,
  Sparkles,
  User,
  Check,
  ShieldCheck,
  FileText,
  Download,
  Briefcase,
  ChevronRight,
  Scan,
  X,
  Shirt,
  Palette,
} from "lucide-react";

export function Hero() {
  return (
    <section className="pt-32 pb-20 px-6 relative overflow-hidden bg-[#FAFAFA]">
      {/* CUSTOM STYLE UNTUK ANIMASI NGAMBANG HALUS */}
      <style jsx>{`
        @keyframes float {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-8px);
          } /* Jarak naik turun diperkecil biar smooth */
          100% {
            transform: translateY(0px);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        /* Delay berbeda agar gerakannya tidak barengan */
        .delay-1000 {
          animation-delay: 1s;
        }
        .delay-1500 {
          animation-delay: 1.5s;
        }
        .delay-2000 {
          animation-delay: 2s;
        }
        .delay-2500 {
          animation-delay: 2.5s;
        }
        .delay-3000 {
          animation-delay: 3s;
        }
        .delay-4000 {
          animation-delay: 4s;
        }
      `}</style>

      {/* Background Decoration */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-orange-100/40 to-transparent rounded-[100%] blur-3xl -z-10 pointer-events-none"></div>

      {/* --- FLOATING ELEMENTS (LEBIH RAPAT & HALUS) --- */}

      {/* 1. Kiri Atas: Dokumen (Buku Nikah) - Didekatkan */}
      <div className="absolute top-32 left-[5%] lg:left-[18%] hidden lg:block animate-float delay-1000 z-0">
        <div className="bg-white p-3 rounded-2xl shadow-xl border border-zinc-100 transform -rotate-6 flex items-center gap-3 hover:scale-105 transition-transform cursor-default opacity-90 hover:opacity-100">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-900">Buku Nikah</p>
            <p className="text-[10px] text-zinc-500">Latar Biru</p>
          </div>
        </div>
      </div>

      {/* 2. Kiri Tengah (BARU): Ganti Baju - Posisi rapat ke teks */}
      <div className="absolute top-64 left-[2%] lg:left-[12%] hidden lg:block animate-float delay-3000 z-0">
        <div className="bg-white p-2.5 rounded-xl shadow-lg border border-zinc-100 transform rotate-3 flex items-center gap-2 opacity-80 hover:opacity-100 hover:scale-105 transition-all">
          <div className="w-9 h-9 bg-zinc-100 rounded-lg flex items-center justify-center text-zinc-600">
            <Shirt className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-900">Ganti Kemeja</p>
            <p className="text-[10px] text-zinc-500">Otomatis Rapi</p>
          </div>
        </div>
      </div>

      {/* 3. Kiri Bawah: Visa Ready - Didekatkan */}
      <div className="absolute top-96 left-[8%] lg:left-[20%] hidden lg:block animate-float delay-2000 z-0">
        <div className="bg-white p-3 rounded-2xl shadow-lg border border-zinc-100 transform -rotate-3 flex items-center gap-3 hover:scale-105 transition-transform cursor-default">
          <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
            <FileText className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-zinc-900">Visa Ready</p>
            <p className="text-[10px] text-zinc-500">Schengen / US</p>
          </div>
        </div>
      </div>

      {/* 4. Kanan Atas: Karir (LinkedIn) - Didekatkan */}
      <div className="absolute top-36 right-[5%] lg:right-[18%] hidden lg:block animate-float delay-1500 z-0">
        <div className="bg-white p-3 rounded-2xl shadow-xl border border-zinc-100 transform rotate-6 flex items-center gap-3 hover:scale-105 transition-transform cursor-default opacity-90 hover:opacity-100">
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-900">LinkedIn</p>
            <p className="text-[10px] text-zinc-500">Professional</p>
          </div>
        </div>
      </div>

      {/* 5. Kanan Tengah (BARU): Ganti Background - Posisi rapat */}
      <div className="absolute top-64 right-[2%] lg:right-[12%] hidden lg:block animate-float delay-4000 z-0">
        <div className="bg-white p-2.5 rounded-xl shadow-lg border border-zinc-100 transform -rotate-2 flex items-center gap-2 opacity-80 hover:opacity-100 hover:scale-105 transition-all">
          <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center text-red-600">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-900">Background</p>
            <p className="text-[10px] text-zinc-500">Merah / Biru / Putih</p>
          </div>
        </div>
      </div>

      {/* 6. Kanan Bawah: Kualitas - Didekatkan */}
      <div className="absolute top-96 right-[8%] lg:right-[20%] hidden lg:block animate-float delay-2500 z-0">
        <div className="bg-zinc-900 text-white px-4 py-2.5 rounded-full shadow-xl transform rotate-2 text-xs font-bold flex items-center gap-2 border border-zinc-700 hover:scale-105 transition-transform cursor-default">
          <Sparkles className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />{" "}
          100% Wajah Asli
        </div>
      </div>

      {/* CENTER TEXT */}
      <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-orange-200 rounded-full text-orange-700 text-xs font-bold uppercase tracking-wider mb-4 animate-fade-in-up shadow-sm">
          <Sparkles className="w-3 h-3 fill-orange-700" /> KLIKJADI 1.0
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[1.1] text-zinc-900">
          Foto Studio Profesional <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600">
            Tanpa Perlu ke Studio
          </span>
        </h1>

        <p className="text-xl text-zinc-500 max-w-2xl mx-auto leading-relaxed">
          Platform <strong>All-in-One</strong> untuk kebutuhan visual warga
          Indonesia. Mulai dari foto ijazah, buku nikah, hingga foto profil
          LinkedIn.
          <br className="hidden md:block" /> Cukup upload selfie, jadi dalam
          hitungan detik.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link href="/login">
            <Button
              size="lg"
              className="h-12 px-8 text-base shadow-lg shadow-orange-500/20 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-xl transition-all hover:scale-105 active:scale-95"
            >
              Mulai Buat Foto <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Button
            variant="outline"
            size="lg"
            className="h-12 px-8 text-base rounded-xl bg-white border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900"
          >
            <Play className="w-4 h-4 mr-2 fill-current" /> Lihat Demo
          </Button>
        </div>

        {/* Social Proof */}
        <div className="pt-8 flex flex-col items-center gap-3">
          <div className="flex -space-x-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-9 h-9 rounded-full border-2 border-white bg-zinc-200 shadow-sm"
              ></div>
            ))}
            <div className="w-9 h-9 rounded-full border-2 border-white bg-zinc-100 flex items-center justify-center text-[10px] font-bold text-zinc-600 shadow-sm">
              +2k
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm text-zinc-500">
            <div className="flex gap-0.5 text-yellow-400">
              {[1, 2, 3, 4, 5].map((i) => (
                <StarIcon key={i} className="w-3 h-3 fill-current" />
              ))}
            </div>
            <span className="font-medium text-zinc-700 ml-2">4.9/5</span>
            <span className="text-zinc-400 mx-1">•</span>
            <span>Dari 2.000+ pengguna</span>
          </div>
        </div>
      </div>

      {/* MOCKUP VISUALIZATION (BERCERITA) */}
      <div className="mt-24 max-w-5xl mx-auto relative">
        {/* Efek Glow di belakang Mockup */}
        <div className="absolute inset-0 bg-gradient-to-t from-orange-100/50 to-transparent blur-3xl -z-10"></div>

        <div className="relative bg-white border border-zinc-200 p-2 rounded-3xl shadow-2xl shadow-zinc-200/50">
          {/* Window Controls */}
          <div className="absolute top-5 left-5 flex gap-1.5 z-20">
            <div className="w-2.5 h-2.5 bg-red-400 rounded-full"></div>
            <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full"></div>
            <div className="w-2.5 h-2.5 bg-green-400 rounded-full"></div>
          </div>

          <div className="bg-zinc-50/50 rounded-2xl overflow-hidden aspect-[16/9] md:aspect-[21/9] relative flex items-center justify-center border border-zinc-100">
            {/* Grid Background */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                backgroundImage:
                  "radial-gradient(#cbd5e1 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            ></div>

            <div className="w-full h-full p-8 md:p-12 relative z-10 flex flex-col items-center justify-center">
              {/* STORY FLOW: RAW -> AI -> RESULT */}
              <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 w-full max-w-3xl">
                {/* 1. RAW INPUT */}
                <div className="relative group">
                  <div className="w-32 h-40 bg-white border-2 border-zinc-200 border-dashed rounded-xl flex flex-col items-center justify-center shadow-sm relative overflow-hidden">
                    <User className="w-12 h-12 text-zinc-300" />
                    <div className="absolute top-2 left-2 bg-zinc-100 text-zinc-500 text-[9px] font-bold px-1.5 py-0.5 rounded border border-zinc-200">
                      RAW
                    </div>
                    <div className="absolute bottom-0 w-full bg-zinc-50 p-2 text-center border-t border-zinc-100">
                      <p className="text-[10px] text-zinc-400">
                        selfie_kamar.jpg
                      </p>
                    </div>
                  </div>
                  <div className="absolute -top-3 -right-3 bg-red-100 text-red-600 p-1 rounded-full shadow-sm">
                    <X className="w-3 h-3" />
                  </div>
                  <p className="text-center mt-3 text-xs font-bold text-zinc-500">
                    1. Upload Selfie
                  </p>
                </div>

                {/* ARROW & PROCESS */}
                <div className="flex-1 flex flex-col items-center gap-2">
                  <div className="relative w-full h-1 bg-zinc-200 rounded-full overflow-hidden">
                    <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-400 to-red-500 w-1/2 animate-[shimmer_1.5s_infinite]"></div>
                  </div>
                  <div className="bg-white border border-orange-200 text-orange-600 px-3 py-1 rounded-full text-[10px] font-bold shadow-sm flex items-center gap-1 animate-pulse">
                    <Scan className="w-3 h-3" /> AI Processing...
                  </div>
                </div>

                {/* 3. RESULT */}
                <div className="relative group">
                  <div className="w-32 h-40 bg-white border-2 border-green-500 rounded-xl flex flex-col items-center justify-end shadow-xl relative overflow-hidden transition-transform hover:scale-105">
                    {/* Background Biru Pas Foto */}
                    <div className="absolute inset-0 bg-blue-600"></div>
                    {/* Orang */}
                    <div className="relative z-10 w-24 h-28 bg-zinc-900 rounded-t-full border-b-0 border-4 border-white/20 shadow-2xl"></div>

                    <div className="absolute top-2 right-2 bg-white/20 backdrop-blur-md p-1 rounded text-white">
                      <ShieldCheck className="w-3 h-3" />
                    </div>
                  </div>
                  <div className="absolute -top-3 -right-3 bg-green-500 text-white p-1 rounded-full shadow-lg border-2 border-white">
                    <Check className="w-3 h-3" />
                  </div>
                  <p className="text-center mt-3 text-xs font-bold text-zinc-900">
                    3. Siap Cetak!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StarIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z"
        clipRule="evenodd"
      />
    </svg>
  );
}
