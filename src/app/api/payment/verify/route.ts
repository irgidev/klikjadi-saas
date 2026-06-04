import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/payment/verify?orderId=XXX
 *
 * Server-side verification — dipanggil oleh dashboard saat ada ?verify= param.
 * Lebih reliable daripada client-side fetch (yang bisa gagal di popup context).
 */
export async function GET(request: Request) {
  const log = (msg: string, data?: any) =>
    console.log(`[PAYMENT-VERIFY] ${msg}`, data !== undefined ? JSON.stringify(data).slice(0, 500) : "");

  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get("orderId");

    log("GET verify request", { orderId });

    if (!orderId) {
      return NextResponse.json({ success: false, error: "Order ID diperlukan." }, { status: 400 });
    }

    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";

    if (!serverKey) {
      log("ERROR: MIDTRANS_SERVER_KEY tidak ada");
      return NextResponse.json({ success: false, error: "Server key tidak dikonfigurasi." }, { status: 500 });
    }

    // ─── 1. Cek status ke Midtrans API (raw HTTP) ───
    const midtransBaseUrl = isProduction
      ? "https://api.midtrans.com/v2"
      : "https://api.sandbox.midtrans.com/v2";

    let midtransResponse: Response;
    try {
      midtransResponse = await fetch(`${midtransBaseUrl}/${orderId}/status`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Authorization": "Basic " + Buffer.from(serverKey + ":").toString("base64"),
          "Content-Type": "application/json",
        },
      });
    } catch (fetchErr: any) {
      log("FAILED connect ke Midtrans", fetchErr.message);
      return NextResponse.json({ success: false, error: `Tidak bisa terhubung ke Midtrans: ${fetchErr.message}` }, { status: 502 });
    }

    const midtransText = await midtransResponse.text();

    if (!midtransResponse.ok) {
      log("Midtrans non-200", { status: midtransResponse.status, body: midtransText.slice(0, 300) });
      return NextResponse.json({ success: false, error: `Midtrans error (${midtransResponse.status})` }, { status: midtransResponse.status });
    }

    let midtransData: any;
    try {
      midtransData = JSON.parse(midtransText);
    } catch {
      return NextResponse.json({ success: false, error: "Gagal parse respons Midtrans." }, { status: 502 });
    }

    const trxStatus = midtransData.transaction_status;
    const fraudStatus = midtransData.fraud_status;
    log("Midtrans status", { trxStatus, fraudStatus, gross_amount: midtransData.gross_amount });

    const isPaid = ["capture", "settlement"].includes(trxStatus);
    const isFraud = fraudStatus === "deny";

    if (!isPaid || isFraud) {
      return NextResponse.json({
        success: false,
        midtrans_status: trxStatus,
        message: `Status: "${trxStatus}". Belum bisa diproses.`,
      });
    }

    // ─── 2. Database operations ───
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      log("ERROR: Supabase credentials missing");
      return NextResponse.json({ success: false, error: "Config database kurang." }, { status: 500 });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Cari transaksi
    const { data: trx, error: fetchError } = await supabaseAdmin
      .from("transactions")
      .select("*")
      .eq("midtrans_order_id", orderId)
      .single();

    if (fetchError || !trx) {
      log("Transaksi tidak ditemukan", { error: fetchError?.message, orderId });
      return NextResponse.json({ success: false, error: "Transaksi tidak ditemukan." }, { status: 404 });
    }
    log("Transaksi ditemukan", { id: trx.id, user_id: trx.user_id, credits: trx.credits_purchased, status: trx.status });

    // Sudah paid → ambil saldo terbaru
    if (trx.status === "paid") {
      const { data: prof } = await supabaseAdmin
        .from("profiles")
        .select("credits")
        .eq("id", trx.user_id)
        .single();

      const latest = typeof prof?.credits === "number" ? prof.credits : 0;
      log("Already paid, current balance", { credits: latest, raw: prof?.credits, type: typeof prof?.credits });
      return NextResponse.json({
        success: true,
        already_processed: true,
        total_credits: latest,
        message: `Sudah diproses. Saldo: ${latest}`,
      });
    }

    // ─── 3. Update transaksi → paid ───
    const { error: updTrxErr } = await supabaseAdmin
      .from("transactions")
      .update({ status: "paid" })
      .eq("id", trx.id);

    if (updTrxErr) {
      log("Gagal update transaksi", updTrxErr);
      return NextResponse.json({ success: false, error: "Gagal update transaksi: " + updTrxErr.message }, { status: 500 });
    }

    // ─── 4. AMBIL SALDO SAAT INI (sebelum update) ───
    const { data: profileBefore, error: profBeforeErr } = await supabaseAdmin
      .from("profiles")
      .select("*")  // SELECT ALL — untuk debug!
      .eq("id", trx.user_id)
      .single();

    log("Profile SEBELUM update", {
      found: !!profileBefore,
      error: profBeforeErr?.message,
      credits: profileBefore?.credits,
      creditsType: typeof profileBefore?.credits,
      fullRow: profileBefore ? Object.keys(profileBefore) : [],
    });

    if (!profileBefore || profBeforeErr) {
      log("⚠️ PROFILE TIDAK KETEMU!", { userId: trx.user_id, error: profBeforeErr?.message });
      // Jangan crash — coba insert kalau memang belum ada
      const { error: insertErr } = await supabaseAdmin
        .from("profiles")
        .insert({ id: trx.user_id, credits: trx.credits_purchased })
        .select("credits")
        .single();

      if (insertErr) {
        log("Insert profile juga gagal!", insertErr.message);
        return NextResponse.json({
          success: false,
          error: `Profile tidak ditemukan dan gagal dibuat: ${insertErr.message}`,
          debug: `userId: ${trx.user_id}`,
        }, { status: 500 });
      }

      log("✅ Profile baru DIBUAT dengan kredit", { credits: trx.credits_purchased });
      return NextResponse.json({
        success: true,
        credits_added: trx.credits_purchased,
        total_credits: trx.credits_purchased,
        message: `Berhasil! +${trx.credits_purchased} kredit. (Profile baru dibuat)`,
      });
    }

    // ─── 5. UPDATE KREDIT ───
    const currentCredits = (typeof profileBefore.credits === "number") ? profileBefore.credits : 0;
    const creditsToAdd = (typeof trx.credits_purchased === "number") ? trx.credits_purchased : 0;
    const newCredits = currentCredits + creditsToAdd;

    log("Melakukan update kredit", { from: currentCredits, add: creditsToAdd, to: newCredits });

    const { error: updProfErr } = await supabaseAdmin
      .from("profiles")
      .update({ credits: newCredits })
      .eq("id", trx.user_id);

    if (updProfErr) {
      log("❌ GAGAL update kredit!", { message: updProfErr.message, details: JSON.stringify(updProfErr).slice(0, 300) });
      return NextResponse.json({
        success: false,
        error: `Gagal menambahkan kredit: ${updProfErr.message}`,
        debug: `userId=${trx.user_id}, current=${currentCredits}, add=${creditsToAdd}, new=${newCredits}`,
      }, { status: 500 });
    }

    // ─── 6. VERIFIKASI: baca kembali untuk konfirmasi ───
    const { data: profileAfter, error: profAfterErr } = await supabaseAdmin
      .from("profiles")
      .select("credits")
      .eq("id", trx.user_id)
      .single();

    const finalCredits = typeof profileAfter?.credits === "number" ? profileAfter?.credits : "UNKNOWN";
    log("✅ VERIFY SETELAH UPDATE", { credits: finalCredits, error: profAfterErr?.message });

    return NextResponse.json({
      success: true,
      credits_added: creditsToAdd,
      total_credits: finalCredits,
      message: `Berhasil! +${creditsToAdd} kredit ditambahkan. Total: ${finalCredits}`,
    });

  } catch (error: any) {
    log("UNEXPECTED ERROR", error?.message || error);
    return NextResponse.json(
      { success: false, error: error?.message || "Terjadi kesalahan tak terduga." },
      { status: 500 }
    );
  }
}

// Keep POST for backward compatibility, but just delegate to GET logic
export async function POST(request: Request) {
  // Read orderId from body, then delegate
  const body = await request.json().catch(() => ({}));
  const orderId = body.orderId;

  // Reconstruct a fake URL with searchParams
  const url = new URL(request.url);
  if (orderId) url.searchParams.set("orderId", orderId);

  // Call GET logic
  return GET(new Request(url, { method: "GET", headers: request.headers }));
}
