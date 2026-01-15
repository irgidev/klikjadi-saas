import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, X, Instagram, Twitter, Linkedin } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* NAVBAR */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold transform -rotate-6 shadow-md">
              K
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-900">
              KlikJadi
            </span>
          </div>
          <div className="hidden md:flex gap-8 text-sm font-medium text-zinc-600">
            <Link href="#features" className="hover:text-orange-600 transition">
              Fitur
            </Link>
            <Link href="#pricing" className="hover:text-orange-600 transition">
              Harga
            </Link>
            <Link href="#faq" className="hover:text-orange-600 transition">
              Bantuan
            </Link>
          </div>
          <div className="flex gap-3">
            <Link href="/login">
              <Button
                variant="ghost"
                className="hidden sm:flex text-zinc-600 hover:text-zinc-900"
              >
                Masuk
              </Button>
            </Link>
            <Link href="/login">
              <Button className="bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg shadow-zinc-900/20">
                Daftar Gratis
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <main>
        <Hero />

        {/* COMPARISON SECTION (DENGAN BAYANGAN SEIMBANG) */}
        <section className="py-24 px-6 bg-white border-y border-zinc-200">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4 text-zinc-900">
                Kenapa harus ribet kalau bisa sat-set?
              </h2>
              <p className="text-zinc-500">
                Tinggalkan cara lama yang membuang waktu dan uang.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 relative items-center">
              {/* VS Badge */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 bg-zinc-900 rounded-full flex items-center justify-center text-white font-bold border-4 border-white z-10 hidden md:flex shadow-xl text-lg">
                VS
              </div>

              {/* OLD WAY (Shadow disamakan intensitasnya) */}
              <div className="relative h-full">
                {/* Glow Merah di Belakang */}
                <div className="absolute inset-0 bg-red-500/5 blur-3xl -z-10 rounded-full transform scale-90"></div>

                <div className="bg-red-50/50 p-8 rounded-3xl border border-red-100 shadow-2xl shadow-red-100/50 hover:border-red-200 transition-colors h-full flex flex-col">
                  <div className="flex items-center gap-3 mb-6 text-red-600 bg-red-100/50 w-fit px-4 py-2 rounded-full">
                    <X className="w-5 h-5" />
                    <h3 className="font-bold text-sm uppercase tracking-wide">
                      Cara Lama (Studio)
                    </h3>
                  </div>
                  <ul className="space-y-5 flex-1">
                    {[
                      "Harus mandi & dandan rapi dulu (mager)",
                      "Perjalanan macet & antre di studio",
                      "Biaya mahal (50rb - 150rb per pose)",
                      "File foto nunggu 3-4 hari baru jadi",
                      "Malu kalau pose kaku dilihat fotografer",
                    ].map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-4 text-red-900/80"
                      >
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 shrink-0"></div>
                        <span className="font-medium">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* NEW WAY (Shadow disamakan intensitasnya) */}
              <div className="relative h-full">
                {/* Glow Hijau di Belakang */}
                <div className="absolute inset-0 bg-green-500/5 blur-3xl -z-10 rounded-full transform scale-90"></div>

                <div className="bg-green-50/50 p-8 rounded-3xl border border-green-100 shadow-2xl shadow-green-100/50 hover:border-green-200 transition-colors relative overflow-hidden h-full flex flex-col">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-green-100/50 to-transparent rounded-bl-full -z-10"></div>

                  <div className="flex items-center gap-3 mb-6 text-green-600 bg-green-100/50 w-fit px-4 py-2 rounded-full">
                    <Check className="w-5 h-5" />
                    <h3 className="font-bold text-sm uppercase tracking-wide">
                      Cara KlikJadi (AI)
                    </h3>
                  </div>
                  <ul className="space-y-5 flex-1">
                    {[
                      "Upload selfie santai dari kasur (bangun tidur oke)",
                      "Ganti baju & background otomatis (Instan)",
                      "Mulai dari Rp 15.000 saja (Hemat 90%)",
                      "Langsung jadi dalam 2 menit",
                      "Privasi aman, diproses oleh mesin",
                    ].map((item, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-4 text-green-900 font-medium"
                      >
                        <div className="mt-0.5 bg-green-200 p-0.5 rounded-full text-green-700">
                          <Check className="w-3 h-3" />
                        </div>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Features />

        {/* PRICING SECTION (LIST LENGKAP SEMUA) */}
        <section
          id="pricing"
          className="py-24 px-6 bg-[#FAFAFA] border-t border-zinc-200"
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-4xl font-bold text-zinc-900">
                Simple Pricing
              </h2>
              <p className="text-zinc-500 max-w-2xl mx-auto">
                Sistem kredit yang transparan. Bayar hanya saat kamu ingin
                membuat foto baru. Kredit tidak pernah hangus.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 items-end">
              {/* Plan 1 */}
              <div className="p-8 rounded-3xl border border-zinc-200 bg-white hover:border-orange-200 transition-all hover:shadow-lg flex flex-col h-full">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-zinc-900">
                    Pay-as-you-go
                  </h3>
                  <p className="text-sm text-zinc-500 mt-1">Coba-coba dulu.</p>
                </div>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-black text-zinc-900">
                    15rb
                  </span>
                  <span className="text-zinc-500 text-sm font-medium">
                    /foto
                  </span>
                </div>
                <p className="text-sm text-zinc-500 mb-8 pb-8 border-b border-zinc-100">
                  Tanpa komitmen. Bayar pas butuh aja. Cocok untuk kebutuhan
                  mendadak.
                </p>
                {/* LIST ADDED */}
                <ul className="space-y-4 mb-8 flex-1">
                  {[
                    "Akses semua model AI",
                    "Resolusi Standar (720p)",
                    "Simpan di cloud 24 jam",
                  ].map((f, i) => (
                    <li key={i} className="flex gap-3 text-sm text-zinc-600">
                      <Check className="w-4 h-4 text-zinc-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/login">
                  <Button variant="outline" className="w-full h-12 rounded-xl">
                    Top Up Sekarang
                  </Button>
                </Link>
              </div>

              {/* Plan 2 (Popular) */}
              <div className="p-8 rounded-3xl border-2 border-orange-500 bg-white shadow-2xl shadow-orange-500/10 scale-105 z-10 relative flex flex-col h-full">
                <div className="absolute top-0 right-0 left-0 -mt-4 flex justify-center">
                  <span className="bg-orange-600 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg">
                    Paling Laris
                  </span>
                </div>
                <div className="mb-4 mt-2">
                  <h3 className="text-xl font-bold text-zinc-900">
                    Starter Pack
                  </h3>
                  <p className="text-sm text-orange-600 font-medium mt-1">
                    Hemat 40%
                  </p>
                </div>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-5xl font-black text-zinc-900">
                    45rb
                  </span>
                  <span className="text-zinc-500 text-sm font-medium">
                    /paket
                  </span>
                </div>
                <p className="text-sm text-zinc-500 mb-8 pb-8 border-b border-orange-100">
                  Paket wajib untuk Jobseeker & Mahasiswa. Dapat 5x kesempatan
                  generate.
                </p>
                <ul className="space-y-4 mb-8 flex-1">
                  {[
                    "5 Koin Kredit",
                    "Resolusi HD (Siap Cetak)",
                    "Prioritas Server (Cepat)",
                    "Ganti Background Unlimited",
                  ].map((f, i) => (
                    <li
                      key={i}
                      className="flex gap-3 text-sm font-medium text-zinc-700"
                    >
                      <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                        <Check className="w-3 h-3" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/login">
                  <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white h-12 rounded-xl shadow-lg shadow-orange-500/20">
                    Ambil Paket Hemat
                  </Button>
                </Link>
              </div>

              {/* Plan 3 */}
              <div className="p-8 rounded-3xl border border-zinc-200 bg-white hover:border-orange-200 transition-all hover:shadow-lg flex flex-col h-full">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-zinc-900">
                    Studio Pro
                  </h3>
                  <p className="text-sm text-zinc-500 mt-1">
                    Untuk profesional.
                  </p>
                </div>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-black text-zinc-900">
                    150rb
                  </span>
                  <span className="text-zinc-500 text-sm font-medium">
                    /bulan
                  </span>
                </div>
                <p className="text-sm text-zinc-500 mb-8 pb-8 border-b border-zinc-100">
                  Untuk agency, fotografer, atau penggunaan rutin volume tinggi.
                </p>
                {/* LIST ADDED */}
                <ul className="space-y-4 mb-8 flex-1">
                  {[
                    "Unlimited Generate",
                    "Akses API",
                    "Model Custom (LoRA)",
                    "Support VIP",
                    "Lisensi Komersial",
                  ].map((f, i) => (
                    <li key={i} className="flex gap-3 text-sm text-zinc-600">
                      <Check className="w-4 h-4 text-zinc-400 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/login">
                  <Button variant="outline" className="w-full h-12 rounded-xl">
                    Hubungi Sales
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER (LENGKAP) */}
      <footer className="bg-zinc-900 text-white pt-20 pb-10 px-6 border-t border-zinc-800">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12 mb-16 border-b border-zinc-800 pb-12">
          <div className="md:col-span-1 space-y-6">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center text-zinc-900 font-bold text-lg">
                K
              </div>
              <span className="font-bold text-2xl tracking-tight">
                KlikJadi
              </span>
            </div>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Platform AI foto nomor #1 di Indonesia. Membantu ribuan orang
              mendapatkan pekerjaan impian dengan foto profesional dalam
              hitungan detik.
            </p>
            <div className="flex gap-4">
              <Link
                href="#"
                className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-orange-600 transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </Link>
              <Link
                href="#"
                className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-orange-600 transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </Link>
              <Link
                href="#"
                className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center hover:bg-orange-600 transition-colors"
              >
                <Linkedin className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-lg">Produk</h4>
            <ul className="space-y-4 text-sm text-zinc-400">
              <li>
                <Link href="#" className="hover:text-orange-500 transition">
                  Pas Foto Otomatis
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-orange-500 transition">
                  Foto Studio AI
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-orange-500 transition">
                  Restorasi Foto Lama
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-orange-500 transition">
                  Ganti Background
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-lg">Perusahaan</h4>
            <ul className="space-y-4 text-sm text-zinc-400">
              <li>
                <Link href="#" className="hover:text-orange-500 transition">
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-orange-500 transition">
                  Karir
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-orange-500 transition">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-orange-500 transition">
                  Kontak
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-lg">Legal</h4>
            <ul className="space-y-4 text-sm text-zinc-400">
              <li>
                <Link href="#" className="hover:text-orange-500 transition">
                  Kebijakan Privasi
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-orange-500 transition">
                  Syarat & Ketentuan
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-orange-500 transition">
                  Kebijakan Refund
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center text-zinc-500 text-sm gap-4">
          <p>&copy; 2026 PT Klik Jadi Digital. Made in Jakarta.</p>
          <div className="flex gap-6">
            <span>Bahasa Indonesia</span>
            <span>IDR (Rp)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
