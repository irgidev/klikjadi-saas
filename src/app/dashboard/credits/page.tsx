"use client";

import { Button } from "@/components/ui/button";
import { Check, Star, ChevronRight, Zap, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

// Definisi Tipe Paket
const PLANS = [
  {
    name: "Pay-as-you-go",
    priceDisplay: "15.000",
    price: 15000,
    unit: "/foto",
    desc: "Coba-coba dulu. Tanpa komitmen.",
    credits: 1,
    features: [
      "Akses semua model AI",
      "Resolusi Standar (720p)",
      "Simpan di cloud 24 jam",
      "Support Standard",
    ],
    popular: false,
  },
  {
    name: "Starter Pack",
    priceDisplay: "45.000",
    price: 45000,
    unit: "/paket",
    desc: "Hemat banget buat Jobseeker & Mahasiswa.",
    credits: 5,
    features: [
      "5 Koin Kredit",
      "Resolusi HD (Siap Cetak)",
      "Prioritas Server (Cepat)",
      "Ganti Background Unlimited",
      "Simpan selamanya",
    ],
    popular: true,
  },
  {
    name: "Studio Pro",
    priceDisplay: "150.000",
    price: 150000,
    unit: "/bulan",
    desc: "Untuk agency & fotografer profesional.",
    credits: 20,
    features: [
      "20 Koin Kredit",
      "Resolusi 4K Ultra HD",
      "Model Custom (LoRA)",
      "Support Jalur VIP",
      "Lisensi Komersial",
    ],
    popular: false,
  },
];

export default function CreditsPage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const router = useRouter();

  // Load Snap Script Secara Manual (Lebih Aman)
  useEffect(() => {
    const snapUrl =
      process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === "true"
        ? "https://app.midtrans.com/snap/snap.js"
        : "https://app.sandbox.midtrans.com/snap/snap.js";

    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";

    const scriptId = "midtrans-snap";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.src = snapUrl;
      script.id = scriptId;
      script.setAttribute("data-client-key", clientKey);
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const handleBuy = async (plan: (typeof PLANS)[0]) => {
    setLoadingPlan(plan.name);
    try {
      // 1. Panggil API Checkout
      const response = await fetch("/api/payment/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planName: plan.name,
          price: plan.price,
          credits: plan.credits,
        }),
      });

      // Cek status HTTP terlebih dahulu
      if (!response.ok) {
        let errorMessage = `Gagal menghubungi server pembayaran (${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          console.error("Non-JSON error response during checkout:", e);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data.token) {
        throw new Error(
          "Token pembayaran tidak ditemukan dalam respons server"
        );
      }

      // 2. Munculkan Pop-up Midtrans (Snap)
      if (typeof window !== "undefined" && (window as any).snap) {
        (window as any).snap.pay(data.token, {
          onSuccess: function (result: any) {
            toast.success("Pembayaran Berhasil! Kredit sedang diproses.");
            setTimeout(() => {
              router.push("/dashboard");
              router.refresh();
            }, 2000);
          },
          onPending: function (result: any) {
            toast.info("Menunggu pembayaran... Cek dashboard nanti.");
            router.push("/dashboard");
          },
          onError: function (result: any) {
            toast.error("Pembayaran Gagal!");
          },
          onClose: function () {
            toast("Pop-up ditutup.");
          },
        });
      } else {
        toast.error("Sistem pembayaran belum siap. Coba refresh halaman.");
      }
    } catch (error: any) {
      console.error("Checkout Error:", error);
      toast.error(error.message || "Terjadi kesalahan saat checkout");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-4">
      {/* Header */}
      <div className="text-center mb-12 space-y-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center text-sm font-medium text-zinc-500 hover:text-zinc-900 transition mb-4"
        >
          <ChevronRight className="w-4 h-4 rotate-180 mr-1" /> Kembali ke
          Dashboard
        </Link>
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="p-2 bg-orange-100 rounded-xl">
            <Zap className="w-6 h-6 text-orange-600 fill-orange-600" />
          </div>
        </div>
        <h1 className="text-4xl font-black tracking-tight text-zinc-900">
          Top Up Kredit
        </h1>
        <p className="text-lg text-zinc-500 max-w-xl mx-auto">
          Sistem kredit yang transparan.{" "}
          <span className="font-bold text-zinc-900">
            1 Kredit = 1x Training Model AI.
          </span>{" "}
          Kredit tidak akan hangus selamanya.
        </p>
      </div>

      {/* Pricing Grid */}
      <div className="grid md:grid-cols-3 gap-6 items-end">
        {PLANS.map((plan, i) => (
          <div
            key={i}
            className={`relative p-8 rounded-3xl flex flex-col h-full transition-all duration-300 ${
              plan.popular
                ? "bg-white border-2 border-orange-500 shadow-2xl shadow-orange-500/10 scale-105 z-10"
                : "bg-white border border-zinc-200 hover:border-orange-200 hover:shadow-lg"
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-0 right-0 flex justify-center">
                <span className="bg-orange-600 text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-wider shadow-lg flex items-center gap-1.5">
                  <Star className="w-3 h-3 fill-white" /> Paling Laris
                </span>
              </div>
            )}

            <div className="mb-4 mt-2">
              <h3 className="text-xl font-bold text-zinc-900">{plan.name}</h3>
              <p className="text-sm text-zinc-500 mt-1 min-h-[40px]">
                {plan.desc}
              </p>
            </div>

            <div className="flex items-baseline gap-1 mb-6 pb-6 border-b border-zinc-100">
              <span className="text-sm font-semibold text-zinc-400">Rp</span>
              <span
                className={`text-5xl font-black tracking-tight text-zinc-900`}
              >
                {plan.priceDisplay}
              </span>
              <span className="text-zinc-400 text-sm font-medium">
                {plan.unit}
              </span>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              {plan.features.map((feat, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-3 text-sm font-medium text-zinc-700"
                >
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      plan.popular
                        ? "bg-orange-100 text-orange-600"
                        : "bg-zinc-100 text-zinc-400"
                    }`}
                  >
                    <Check className="w-3 h-3" />
                  </div>
                  {feat}
                </li>
              ))}
            </ul>

            <Button
              onClick={() => handleBuy(plan)}
              disabled={loadingPlan !== null}
              className={`w-full h-12 rounded-xl text-base font-bold transition-all ${
                plan.popular
                  ? "bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-500/20"
                  : "bg-white border-2 border-zinc-100 hover:border-zinc-300 text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {loadingPlan === plan.name ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Proses...
                </>
              ) : (
                "Pilih Paket Ini"
              )}
            </Button>
          </div>
        ))}
      </div>

      {/* Footer Note */}
      <div className="mt-16 pt-8 border-t border-zinc-200 text-center">
        <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-4">
          Didukung Pembayaran Aman
        </p>
        <div className="flex justify-center gap-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
          <div className="h-8 px-3 bg-zinc-100 rounded flex items-center text-[10px] font-bold text-zinc-600">
            QRIS
          </div>
          <div className="h-8 px-3 bg-zinc-100 rounded flex items-center text-[10px] font-bold text-zinc-600">
            GOPAY
          </div>
          <div className="h-8 px-3 bg-zinc-100 rounded flex items-center text-[10px] font-bold text-zinc-600">
            BCA
          </div>
          <div className="h-8 px-3 bg-zinc-100 rounded flex items-center text-[10px] font-bold text-zinc-600">
            MANDIRI
          </div>
        </div>
      </div>
    </div>
  );
}
