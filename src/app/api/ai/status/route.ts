import { NextResponse } from 'next/server';
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

const MESHY_API_KEY = process.env.MESHY_API_KEY;
const MESHY_BASE_URL = "https://api.meshy.ai/openapi/v1";

/**
 * GET /api/ai/status?task_id=xxx&user_id=xxx&bg_color=xxx&photo_size=xxx
 *
 * Polling endpoint untuk cek status task Meshy.
 * Ketika SUCCEEDED: simpan hasil ke tabel trainings & kurangi kredit.
 */
export async function GET(request: Request) {
  const log = (msg: string, data?: any) =>
    console.log(`[Meshy-Status] ${msg}`, data !== undefined ? JSON.stringify(data).slice(0, 300) : "");

  try {
    if (!MESHY_API_KEY || MESHY_API_KEY === "your_meshy_api_key_here") {
      return NextResponse.json(
        { success: false, error: "Meshy API Key belum dikonfigurasi." },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('task_id');
    const userId = searchParams.get('user_id');
    const bgColor = searchParams.get('bg_color') || 'blue';
    const photoSize = searchParams.get('photo_size') || '3x4';

    if (!taskId) {
      return NextResponse.json({ success: false, error: "task_id diperlukan." }, { status: 400 });
    }

    log("Polling task", { taskId });

    // GET task status dari Meshy
    const res = await fetch(`${MESHY_BASE_URL}/image-to-image/${taskId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${MESHY_API_KEY}`,
        "Accept": "application/json",
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      log("Poll FAILED", { status: res.status, body: errText.slice(0, 300) });
      return NextResponse.json(
        { success: false, error: `Meshy API error (${res.status}): ${errText}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    log("Task status", { id: data.id, status: data.status, progress: data.progress });

    // ─── SUKSES → Simpan ke DB, kurangi kredit, return image ───
    if (data.status === "SUCCEEDED") {
      const imageUrl = data.image_urls?.[0];
      if (!imageUrl) {
        log("SUCCEEDED tapi tidak ada image_urls", data);
        return NextResponse.json({ success: false, status: "error", error: "Task selesai tapi gambar tidak ditemukan." });
      }

      // Simpan ke trainings & kurangi kredit
      if (userId) {
        try {
          const supabaseAdmin = createSupabaseAdmin(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!,
            { auth: { autoRefreshToken: false, persistSession: false } }
          );

          const bgLabels: Record<string, string> = { blue: "Biru", red: "Merah", white: "Putih" };
          const sizeLabels: Record<string, string> = { "2x3": "2×3", "3x4": "3×4", "4x6": "4×6" };
          const triggerWord = `Pas Foto ${sizeLabels[photoSize]} - ${bgLabels[bgColor]} | ${imageUrl}`;

          // INSERT ke trainings (hanya kolom yang ada: id, user_id, trigger_word, model_id, status)
          const { error: insertError } = await supabaseAdmin
            .from("trainings")
            .insert({
              user_id: userId,
              trigger_word: triggerWord,
              model_id: `meshy:${taskId}`,
              status: "completed",
            });

          if (insertError) {
            log("Insert trainings gagal:", insertError.message);
          } else {
            log("✅ Disimpan ke trainings");
          }

          // ─── KURANGI KREDIT (-1 per generate) ───
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("credits")
            .eq("id", userId)
            .single();

          const currentCredits = profile?.credits ?? 0;
          if (currentCredits > 0) {
            const { error: updateError } = await supabaseAdmin
              .from("profiles")
              .update({ credits: currentCredits - 1 })
              .eq("id", userId);

            if (updateError) {
              log("Gagal kurangi kredit:", updateError.message);
            } else {
              log(`✅ Kredit dikurangi: ${currentCredits} → ${currentCredits - 1}`);
            }
          } else {
            log("⚠️ Kredit = 0, tidak ada yang dikurangi");
          }
        } catch (dbErr: any) {
          log("DB Error (non-fatal)", dbErr.message);
        }
      }

      log("SUCCESS! Image ready");
      return NextResponse.json({
        success: true,
        url: imageUrl,
        status: "completed",
      });
    }

    // FAILED
    if (data.status === "FAILED") {
      log("Task FAILED", data);
      return NextResponse.json({
        success: false,
        status: "failed",
        error: data.error_message || "Gagal generate gambar.",
      });
    }

    // Masih processing
    return NextResponse.json({
      success: true,
      status: "processing",
      progress: data.progress || null,
      meshy_status: data.status,
    });

  } catch (error: any) {
    console.error("[Meshy-Status] Error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
