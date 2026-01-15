import {
  Briefcase,
  GraduationCap,
  ShieldCheck,
  Building2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const CATEGORIES = [
  {
    title: "Pendidikan",
    icon: GraduationCap,
    color: "bg-blue-100 text-blue-600",
    desc: "Wajib untuk daftar sekolah & kuliah.",
    items: [
      "Seragam SD/SMP/SMA",
      "Jas Almamater Kampus",
      "Toga Wisuda Lengkap",
      "Ijazah Hitam Putih",
    ],
  },
  {
    title: "Administrasi",
    icon: ShieldCheck,
    color: "bg-indigo-100 text-indigo-600",
    desc: "Dokumen negara & perjalanan.",
    items: [
      "Buku Nikah (Background Biru)",
      "Foto Visa (Schengen/US)",
      "Haji & Umroh (80% Wajah)",
      "KTP & SIM",
    ],
  },
  {
    title: "Dinas & Profesi",
    icon: Building2,
    color: "bg-orange-100 text-orange-600",
    desc: "Seragam resmi abdi negara.",
    items: [
      "Seragam PNS (Khaki)",
      "TNI / Polri Lengkap",
      "Tenaga Medis (Snelli)",
      "Satpam/Security",
    ],
  },
  {
    title: "Studio Grup",
    icon: Users,
    color: "bg-pink-100 text-pink-600",
    desc: "Foto bareng tanpa ketemu.",
    items: [
      "Foto Keluarga Lebaran",
      "Foto Angkatan/Reuni",
      "Foto Tim Kantor",
      "Couple / Pre-wed",
    ],
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 px-6 bg-[#FAFAFA]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <h2 className="text-3xl font-bold mb-2 text-zinc-900">
              Satu Platform, Ratusan Kebutuhan
            </h2>
            <p className="text-zinc-500 text-lg">
              Kami melatih AI khusus untuk memahami konteks foto di Indonesia.
            </p>
          </div>
          <Button
            variant="outline"
            className="rounded-full border-zinc-300 hover:bg-zinc-100"
          >
            Lihat Semua Kategori
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Featured Big Card (KARIR) */}
          <div className="col-span-1 md:col-span-2 bg-white rounded-3xl border border-zinc-200 p-10 flex flex-col justify-between hover:border-orange-300 transition-colors group cursor-pointer relative overflow-hidden shadow-sm hover:shadow-md">
            <div className="z-10 relative">
              <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 mb-6 group-hover:scale-110 transition-transform">
                <Briefcase className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-zinc-900">
                Karir & Profesional
              </h3>
              <p className="text-zinc-500 mb-8 max-w-md text-lg leading-relaxed">
                Paket lengkap untuk melamar kerja. Termasuk pas foto background
                merah/biru, foto full body corporate, hingga headshot LinkedIn
                gaya SCBD.
              </p>
              <div className="flex gap-3 flex-wrap">
                {["CPNS 2024", "BUMN", "Corporate", "LinkedIn", "Bank"].map(
                  (tag, i) => (
                    <span
                      key={i}
                      className="px-4 py-1.5 bg-zinc-100 rounded-full text-sm font-medium text-zinc-600 border border-zinc-200 group-hover:border-orange-200 group-hover:bg-orange-50 group-hover:text-orange-700 transition-colors"
                    >
                      {tag}
                    </span>
                  )
                )}
              </div>
            </div>
            <div className="absolute right-0 bottom-0 w-64 h-64 bg-gradient-to-tl from-orange-50 to-transparent rounded-tl-full opacity-50 group-hover:scale-110 transition-transform duration-700"></div>
          </div>

          {/* Other Cards */}
          {CATEGORIES.map((item, i) => (
            <div
              key={i}
              className="bg-white rounded-3xl border border-zinc-200 p-8 hover:shadow-lg hover:-translate-y-1 hover:border-orange-200 transition-all duration-300 cursor-pointer group shadow-sm flex flex-col h-full"
            >
              {/* Ikon: Warna asli saat diam, Oranye saat hover */}
              <div
                className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-300 group-hover:bg-orange-100 group-hover:text-orange-600`}
              >
                <item.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-2 text-zinc-900 group-hover:text-orange-700 transition-colors">
                {item.title}
              </h3>
              <p className="text-sm text-zinc-400 mb-4 font-medium">
                {item.desc}
              </p>
              <ul className="space-y-3 mt-auto">
                {item.items.map((sub, j) => (
                  <li
                    key={j}
                    className="text-sm text-zinc-600 flex items-center gap-3"
                  >
                    <div className="w-1.5 h-1.5 bg-zinc-300 rounded-full group-hover:bg-orange-500 transition-colors"></div>
                    {sub}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
