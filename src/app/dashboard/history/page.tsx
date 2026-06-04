import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  XCircle,
  Receipt,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

// Batas waktu: 1 jam (dalam milidetik)
const EXPIRY_MS = 60 * 60 * 1000;

export default async function HistoryPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return redirect("/login");

    // ─── ADMIN CLIENT ───
    const supabaseAdmin = createSupabaseAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Fetch transaksi — sort by id (id berisi timestamp: TRX-{timestamp}-{random})
    const { data: transactions, error } = await supabaseAdmin
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("id", { ascending: false });

    if (error) {
        console.error("[History] Error:", error.message);
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 pb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-3">
                        <Receipt className="w-8 h-8 text-orange-500" /> Riwayat Pembayaran
                    </h1>
                    <p className="text-zinc-500 mt-2">
                        Semua riwayat top-up kredit kamu.
                    </p>
                </div>
                <Button className="bg-orange-600 hover:bg-orange-700 text-white" asChild>
                    <a href="/dashboard/credits">
                        <CreditCard className="w-4 h-4 mr-2" /> Top Up Kredit
                    </a>
                </Button>
            </div>

            {/* Transaction List */}
            <div className="space-y-3">
                {!transactions || transactions.length === 0 ? (
                    /* Empty State */
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-zinc-50 border border-dashed border-zinc-200 rounded-2xl">
                        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 border border-zinc-100">
                            <Receipt className="w-8 h-8 text-zinc-300" />
                        </div>
                        <h3 className="text-lg font-bold text-zinc-900 mb-2">Belum Ada Transaksi</h3>
                        <p className="text-sm text-zinc-500 max-w-sm mb-6">
                            Kamu belum melakukan top-up kredit. Yuk isi saldo sekarang!
                        </p>
                        <Button className="bg-orange-600 hover:bg-orange-700 text-white" asChild>
                            <a href="/dashboard/credits">
                                <CreditCard className="w-4 h-4 mr-2" /> Top Up Sekarang
                            </a>
                        </Button>
                    </div>
                ) : (
                    transactions.map((trx: any) => (
                        <TransactionCard key={trx.id} trx={trx} />
                    ))
                )}
            </div>
        </div>
    );
}

function TransactionCard({ trx }: { trx: any }) {
    // Status dasar dari DB
    const isPaid = trx.status === "paid" || trx.status === "settlement" || trx.status === "capture";
    const isPending = trx.status === "pending" || trx.status === "processing";

    // Extract timestamp dari ID format: TRX-1778138079070-472
    let displayDate = "-";
    let createdAtMs: number | null = null;
    const tsMatch = trx.id?.match(/TRX-(\d{13})/);
    if (tsMatch?.[1]) {
        createdAtMs = parseInt(tsMatch[1]);
        displayDate = new Date(createdAtMs).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    }

    // Jika pending lebih dari 1 jam → anggap gagal (kadaluarsa)
    const isExpired = isPending && createdAtMs ? (Date.now() - createdAtMs) > EXPIRY_MS : false;

    return (
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between gap-4">
                {/* Left: Icon + Details */}
                <div className="flex items-center gap-4 min-w-0">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        isPaid
                            ? "bg-green-50"
                            : isExpired
                                ? "bg-red-50"
                                : isPending
                                    ? "bg-blue-50"
                                    : "bg-red-50"
                    }`}>
                        {isPaid ? (
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                        ) : isExpired || (!isPending && !isPaid) ? (
                            <XCircle className="w-6 h-6 text-red-600" />
                        ) : (
                            <Clock className="w-6 h-6 text-blue-600 animate-pulse" />
                        )}
                    </div>

                    <div className="min-w-0">
                        <p className="font-bold text-zinc-900 truncate">
                            Top-Up {trx.credits_purchased} Kredit
                        </p>
                        <p className="text-xs text-zinc-400 mt-0.5">
                            Order #{trx.midtrans_order_id?.split("-")[1]?.slice(0, 8) || trx.id.slice(4, 12)}
                            {" • "}
                            {displayDate}
                            {isExpired && (
                                <span className="text-red-500 ml-1">· Kadaluarsa</span>
                            )}
                        </p>
                    </div>
                </div>

                {/* Right: Amount + Status */}
                <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                        <p className="font-bold text-lg text-zinc-900">
                            Rp {(trx.amount || 0).toLocaleString("id-ID")}
                        </p>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
                            isPaid
                                ? "bg-green-100 text-green-700"
                                : isExpired
                                    ? "bg-red-100 text-red-700"
                                : isPending
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-red-100 text-red-700"
                        }`}>
                            {isPaid ? "Berhasil" : isExpired ? "Gagal (Kadaluarsa)" : isPending ? "Menunggu" : "Gagal"}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
