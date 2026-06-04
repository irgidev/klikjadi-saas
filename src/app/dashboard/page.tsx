import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UploadZone } from "@/components/upload-zone";
import {
  Zap,
  Camera,
  History,
  Sparkles,
  ArrowRight,
} from "lucide-react";

// Force fresh data — no caching
export const dynamic = "force-dynamic";

/**
 * Server-side payment verification.
 * Dipanggil langsung dari dashboard component (bukan dari client/popup).
 * Lebih reliable karena berjalan di server context.
 */
async function verifyPayment(orderId: string): Promise<{
  success: boolean;
  message: string;
  totalCredits?: number;
}> {
  const log = (msg: string, data?: any) =>
    console.log(`[DASHBOARD-VERIFY] ${msg}`, data !== undefined ? JSON.stringify(data).slice(0, 500) : "");

  try {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    if (!serverKey) return { success: false, message: "Midtrans key tidak dikonfigurasi." };

    // 1. Cek ke Midtrans
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
    const baseUrl = isProduction ? "https://api.midtrans.com/v2" : "https://api.sandbox.midtrans.com/v2";

    const res = await fetch(`${baseUrl}/${orderId}/status`, {
      headers: {
        "Accept": "application/json",
        "Authorization": "Basic " + Buffer.from(serverKey + ":").toString("base64"),
      },
    });

    const text = await res.text();
    if (!res.ok) return { success: false, message: `Midtrans error (${res.status})` };

    const data = JSON.parse(text);
    log("Midtrans response", { status: data.transaction_status, fraud: data.fraud_status });

    if (!["capture", "settlement"].includes(data.transaction_status)) {
      return { success: false, message: `Status pembayaran: "${data.transaction_status}"` };
    }

    // 2. Proses database
    const { createClient: createSupabaseAdmin } = await import("@supabase/supabase-js");
    const admin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Cari transaksi
    const { data: trx } = await admin
      .from("transactions")
      .select("*")
      .eq("midtrans_order_id", orderId)
      .single();

    if (!trx) return { success: false, message: "Transaksi tidak ditemukan di database." };
    log("Transaksi found", { id: trx.id, status: trx.status, credits: trx.credits_purchased });

    // Sudah pernah diproses → baca saldo terbaru
    if (trx.status === "paid") {
      const { data: prof } = await admin.from("profiles").select("credits").eq("id", trx.user_id).single();
      const bal = typeof prof?.credits === "number" ? prof.credits : 0;
      log("Already paid, balance", { credits: bal, raw: prof?.credits });
      return { success: true, message: `Pembayaran sudah dikonfirmasi. Saldo: ${bal}`, totalCredits: bal };
    }

    // Update transaksi → paid
    await admin.from("transactions").update({ status: "paid" }).eq("id", trx.id);

    // Baca profile SEBELUM update (debug + safety)
    const { data: profileBefore, error: profErr } = await admin
      .from("profiles")
      .select("*")
      .eq("id", trx.user_id)
      .single();

    log("Profile before update", {
      found: !!profileBefore,
      credits: profileBefore?.credits,
      type: typeof profileBefore?.credits,
      keys: profileBefore ? Object.keys(profileBefore) : [],
      err: profErr?.message,
    });

    // Kalau profile tidak ada → buat baru
    if (!profileBefore || profErr) {
      log("⚠️ Profile tidak ketemu! Mencoba insert baru...", { userId: trx.user_id });
      const { error: insErr } = await admin
        .from("profiles")
        .insert({ id: trx.user_id, credits: trx.credits_purchased });

      if (insErr) {
        log("❌ Insert gagal!", insErr.message);
        return { success: false, message: `Gagal buat profile: ${insErr.message}` };
      }
      log("✅ Profile baru dibuat", { credits: trx.credits_purchased });
      return { success: true, message: `Berhasil! +${trx.credits_purchased} kredit ditambahkan.`, totalCredits: trx.credits_purchased };
    }

    // Update kredit
    const current = (typeof profileBefore.credits === "number") ? profileBefore.credits : 0;
    const add = (typeof trx.credits_purchased === "number") ? trx.credits_purchased : 0;
    const newCredits = current + add;

    log("Updating credits", { current, add, newCredits });

    const { error: updErr } = await admin
      .from("profiles")
      .update({ credits: newCredits })
      .eq("id", trx.user_id);

    if (updErr) {
      log("❌ Update kredit GAGAL!", updErr.message);
      return { success: false, message: `Gagal update kredit: ${updErr.message}` };
    }

    // Verifikasi final: baca kembali
    const { data: profileAfter } = await admin.from("profiles").select("credits").eq("id", trx.user_id).single();
    const finalBal = typeof profileAfter?.credits === "number" ? profileAfter?.credits : "?";
    log("✅ Verify after update", { finalBalance: finalBal });

    return {
      success: true,
      message: `🎉 Berhasil! +${add} kredit ditambahkan. Total: ${finalBal}`,
      totalCredits: typeof finalBal === "number" ? finalBal : undefined,
    };
  } catch (e: any) {
    log("ERROR", e?.message || e);
    return { success: false, message: e?.message || "Terjadi kesalahan." };
  }
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ verify?: string }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  const params = await searchParams;

  // ─── Handle payment verification (server-side!) ───
  let verifyResult: Awaited<ReturnType<typeof verifyPayment>> | null = null;
  if (params.verify) {
    console.log(`[DASHBOARD] Verifying payment: ${params.verify}`);
    verifyResult = await verifyPayment(params.verify);
    console.log("[DASHBOARD] Verify result:", verifyResult);
  }

  // Ambil data user (FRESH — setelah verify kalau ada)
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // ─── Kredit: pakai admin client sebagai sumber kebenaran ───
  // Regular client kadang return stale/0 karena RLS atau cache.
  // Verify pakai service_role → itu yang benar.
  let displayCredits = verifyResult?.totalCredits ?? null;

  if (displayCredits === null) {
    // Kalau tidak ada verify, baca langsung pakai admin client
    try {
      const { createClient: createAdmin } = await import("@supabase/supabase-js");
      const adminClient = createAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );
      const { data: adminProfile } = await adminClient
        .from("profiles")
        .select("credits")
        .eq("id", user.id)
        .single();
      displayCredits = typeof adminProfile?.credits === "number" ? adminProfile.credits : (profile?.credits ?? 0);
    } catch {
      displayCredits = profile?.credits ?? 0;
    }
  }

  const { data: trainings } = await supabase
    .from("trainings")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Selamat Pagi" : hour < 18 ? "Selamat Siang" : "Selamat Malam";

  const displayName = profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split("@")[0] || "User";

  return (
    <div className="max-w-4xl mx-auto pb-20 space-y-8">
      {/* ===== HEADER ===== */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            {greeting}, {displayName}!
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Buat pas foto profesional dalam hitungan detik.
          </p>
        </div>

        {/* Credit Badge */}
        <div className="flex items-center gap-3 bg-white border border-zinc-200 px-4 py-2 rounded-full shadow-sm">
          <Zap className="w-4 h-4 text-orange-500 fill-orange-500" />
          <span className="text-sm font-bold text-zinc-700">
            {displayCredits} Kredit
          </span>
          <Link href="/dashboard/credits">
            <Button size="sm" variant="ghost" className="h-7 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50 -mr-2">
              Top Up
            </Button>
          </Link>
        </div>
      </div>

      {/* ===== MAIN: PAS FOTO GENERATOR ===== */}
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
        {/* Card Header */}
        <div className="bg-gradient-to-r from-orange-500 via-orange-500 to-red-500 px-6 py-5">
          <div className="flex items-center gap-3 text-white">
            <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight">Pas Foto Generator</h2>
              <p className="text-orange-100 text-xs mt-0.5">AI-powered • Background Biru, Merah, Putih</p>
            </div>
          </div>
        </div>

        {/* Upload Zone */}
        <div className="p-6 md:p-8">
          <UploadZone userId={user.id} />
        </div>
      </div>

      {/* ===== HOW IT WORKS (Mini) ===== */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            step: "1",
            title: "Upload Selfie",
            desc: "Foto wajah jelas, menghadap depan",
            icon: Camera,
          },
          {
            step: "2",
            title: "Pilih Opsi",
            desc: "Warna background & ukuran foto",
            icon: Sparkles,
          },
          {
            step: "3",
            title: "Download",
            desc: "Pas foto siap cetak!",
            icon: ArrowRight,
          },
        ].map((item) => (
          <div
            key={item.step}
            className="flex flex-col items-center text-center p-4 bg-white rounded-2xl border border-zinc-100"
          >
            <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center font-bold text-sm mb-2">
              {item.step}
            </div>
            <h4 className="font-bold text-sm text-zinc-900">{item.title}</h4>
            <p className="text-[11px] text-zinc-500 mt-1">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* ===== RECENT HISTORY (Compact) ===== */}
      {(trainings && trainings.length > 0) && (
        <div className="pt-4 border-t border-zinc-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              <History className="w-4 h-4 text-zinc-400" /> Riwayat Terkini
            </h2>
            <Link href="/dashboard/history" className="text-xs font-medium text-orange-600 hover:text-orange-700">
              Lihat Semua →
            </Link>
          </div>
          <div className="space-y-2">
            {trainings.slice(0, 3).map((item) => (
              <Link href={`/dashboard/project/${item.id}`} key={item.id}>
                <div className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-50 transition-colors border border-transparent hover:border-zinc-200 group">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900">{item.trigger_word || "Pas Foto"}</h4>
                      <p className="text-[10px] text-zinc-500">{new Date(item.created_at).toLocaleDateString('id-ID')}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
