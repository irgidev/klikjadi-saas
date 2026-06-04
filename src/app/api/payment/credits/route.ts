import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/payment/credits
 *
 * Debug endpoint: cek saldo, profile lengkap, dan transaksi terakhir.
 * Buka di browser setelah login untuk inspect database.
 */
export async function GET() {
  try {
    const { createClient: supabaseClient } = await import("@/lib/supabase/server");
    const supabase = await supabaseClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized — silakan login dulu." }, { status: 401 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 1. Profile (FULL row, untuk debug)
    const { data: profile, error: profError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    // 2. Semua transaksi user ini
    const { data: transactions, error: trxError } = await supabaseAdmin
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10);

    // 3. Cek apakah ada transaksi yang status-nya masih pending tapi sudah dibayar di Midtrans
    // (untuk detect orphans)
    const pendingTrx = (transactions || []).filter((t) => t.status === "pending");

    return NextResponse.json({
      // User info
      user_id: user.id,
      email: user.email,

      // Profile debug info
      profile_exists: !!profile,
      profile_error: profError?.message || null,
      profile_raw: profile || null,
      credits_value: profile?.credits,
      credits_type: typeof profile?.credits,
      credits_is_null: profile?.credits === null,
      credits_is_undefined: profile?.credits === undefined,

      // Transactions summary
      total_transactions: (transactions || []).length,
      pending_count: pendingTrx.length,
      paid_count: (transactions || []).filter((t) => t.status === "paid").length,

      // All transactions (last 10)
      recent_transactions: (transactions || []).map((t) => ({
        id: t.id,
        order_id: t.midtrans_order_id,
        amount: t.amount,
        credits: t.credits_purchased,
        status: t.status,
        created_at: t.created_at,
      })),
    });
  } catch (error: any) {
    console.error("[CREDITS-GET] Error:", error);
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 });
  }
}
