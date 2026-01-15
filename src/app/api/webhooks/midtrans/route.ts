import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const notification = await request.json();
    console.log("🔔 [WEBHOOK] Notifikasi masuk:", notification.order_id);

    // 1. Validasi Signature (Wajib biar aman)
    const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
    const {
      order_id,
      status_code,
      gross_amount,
      transaction_status,
      signature_key,
    } = notification;

    const payload = order_id + status_code + gross_amount + serverKey;
    const hash = crypto.createHash("sha512").update(payload).digest("hex");

    if (hash !== signature_key) {
      console.error("⛔ [WEBHOOK] Signature Salah!");
      return NextResponse.json({ error: "Invalid Signature" }, { status: 403 });
    }

    // 2. Cek Status Pembayaran
    const isPaid = ["capture", "settlement"].includes(transaction_status);
    const isFraud = notification.fraud_status === "deny";

    if (isPaid && !isFraud) {
      // Gunakan SERVICE ROLE untuk bypass RLS
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
      );

      // A. Cari Transaksi
      const { data: trx, error: fetchError } = await supabaseAdmin
        .from("transactions")
        .select("*")
        .eq("midtrans_order_id", order_id)
        .single();

      if (fetchError || !trx) {
        console.error("❌ [WEBHOOK] Transaksi tidak ketemu di DB");
        return NextResponse.json(
          { error: "Transaction not found" },
          { status: 404 }
        );
      }

      if (trx.status === "paid")
        return NextResponse.json({ message: "Already processed" });

      // B. Update Status Transaksi
      await supabaseAdmin
        .from("transactions")
        .update({ status: "paid" })
        .eq("id", trx.id);

      // C. Tambah Kredit User
      const { data: userProfile } = await supabaseAdmin
        .from("profiles")
        .select("credits")
        .eq("id", trx.user_id)
        .single();

      const newCredits = (userProfile?.credits || 0) + trx.credits_purchased;

      await supabaseAdmin
        .from("profiles")
        .update({ credits: newCredits })
        .eq("id", trx.user_id);

      console.log(
        `🎉 [WEBHOOK] Sukses! User ${trx.user_id} nambah ${trx.credits_purchased} kredit.`
      );
    }

    return NextResponse.json({ status: "OK" });
  } catch (error: any) {
    console.error("💥 [WEBHOOK] Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
