"use client";

import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";
import { Loader2, Star } from "lucide-react";
import { useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);

    // Lazy init Supabase client only when user clicks login
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] p-6 font-sans">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden grid md:grid-cols-2 min-h-[600px] border border-zinc-100">
        {/* LEFT: FORM */}
        <div className="p-10 md:p-16 flex flex-col justify-center">
          <div className="mb-8 cursor-pointer">
            <Link href="/" className="flex items-center gap-2 mb-4 group">
              <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center text-white font-bold group-hover:scale-110 transition-transform">
                K
              </div>
              <span className="font-bold text-zinc-900">KlikJadi</span>
            </Link>
            <h1 className="text-3xl font-bold text-zinc-900">Welcome Back</h1>
            <p className="text-zinc-500 mt-2">
              Masuk untuk melanjutkan project foto kamu.
            </p>
          </div>

          <div className="space-y-4">
            <Button
              variant="outline"
              onClick={handleLogin}
              className="w-full h-14 bg-white hover:bg-zinc-50 text-zinc-700 font-semibold rounded-xl flex items-center justify-center gap-3 border-zinc-300"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              Masuk dengan Google
            </Button>

            <div className="flex items-center gap-4 py-4">
              <div className="h-px bg-zinc-200 flex-1"></div>
              <span className="text-xs text-zinc-400 uppercase font-bold">
                Aman & Terenkripsi
              </span>
              <div className="h-px bg-zinc-200 flex-1"></div>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-zinc-400">
            Dengan masuk, Anda setuju dengan Syarat & Ketentuan KlikJadi.com
          </p>
        </div>

        {/* RIGHT: VISUAL */}
        <div className="hidden md:flex bg-zinc-900 text-white p-12 flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-medium border border-white/10 mb-6">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />{" "}
              Trusted by 10k+ Users
            </div>
            <h2 className="text-4xl font-bold leading-tight">
              "Website penyelamat skripsi! Foto wisuda jadi dalam 5 menit."
            </h2>
          </div>

          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center font-bold text-lg">
              S
            </div>
            <div>
              <p className="font-bold">Sari Roti</p>
              <p className="text-zinc-400 text-sm">Mahasiswi UI</p>
            </div>
          </div>

          {/* Background Decoration */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-orange-600/30 to-purple-600/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        </div>
      </div>
    </div>
  );
}
