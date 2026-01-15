import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
// @ts-ignore
import Midtrans from "midtrans-client";

export async function POST(request: Request) {
  console.log("🔥 [CHECKOUT] API Request Diterima");

  try {
    // 0. Validasi Config Environment
    const serverKey = process.env.MIDTRANS_SERVER_KEY;
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;

    if (!serverKey || !clientKey) {
      console.error(
        "❌ [CHECKOUT] CRITICAL: Midtrans Key tidak ditemukan di .env.local"
      );
      return NextResponse.json(
        {
          error: "Konfigurasi Server Key Midtrans hilang. Cek terminal server.",
        },
        { status: 500 }
      );
    }

    const supabase = await createClient();

    // 1. Cek User Login
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized: Harap login terlebih dahulu" },
        { status: 401 }
      );
    }

    // 2. Ambil Data Paket
    const body = await request.json();
    const { planName, price, credits } = body;

    // 3. Setup Midtrans Snap (Sandbox)
    const snap = new Midtrans.Snap({
      isProduction: false,
      serverKey: serverKey,
      clientKey: clientKey,
    });

    // 4. Buat Order ID Unik (TRX-TIMESTAMP-RANDOM)
    const orderId = `TRX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 5. Parameter Transaksi
    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: Number(price),
      },
      item_details: [
        {
          id: planName.replace(/\s+/g, "-").toLowerCase().substring(0, 50),
          price: Number(price),
          quantity: 1,
          name: `${planName.substring(0, 40)}`,
        },
      ],
      customer_details: {
        first_name: user.user_metadata.full_name || "User",
        email: user.email,
      },
      credit_card: { secure: true },
    };

    // 6. Minta Token ke Midtrans
    console.log(`📦 [CHECKOUT] Meminta token untuk Order: ${orderId}`);
    const transaction = await snap.createTransaction(parameter);
    const token = transaction.token;
    console.log("✅ [CHECKOUT] Token berhasil didapat:", token);

    // 7. Simpan Transaksi ke Database
    // PERBAIKAN DI SINI: Hapus field 'id' agar Supabase generate UUID otomatis
    const { error: dbError } = await supabase.from("transactions").insert({
      // id: orderId,  <-- HAPUS INI karena kolom ID di DB tipe UUID, sedangkan orderId string.
      user_id: user.id,
      amount: price,
      credits_purchased: credits,
      status: "pending",
      midtrans_order_id: orderId, // Simpan Order ID String di sini
    });

    if (dbError) {
      console.error("❌ [CHECKOUT] Gagal simpan ke DB:", dbError);
      throw new Error("Gagal simpan DB: " + dbError.message);
    }

    return NextResponse.json({ token });
  } catch (error: any) {
    console.error("💥 [CHECKOUT] ERROR:", error);
    const message = error.message || "Terjadi kesalahan pada server pembayaran";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
