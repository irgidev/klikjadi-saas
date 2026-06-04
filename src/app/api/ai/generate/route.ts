import { NextResponse } from 'next/server';
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

// Meshy API Configuration
const MESHY_API_KEY = process.env.MESHY_API_KEY;
const MESHY_BASE_URL = "https://api.meshy.ai/openapi/v1";

export async function POST(request: Request) {
  const log = (msg: string, data?: any) =>
    console.log(`[Meshy] ${msg}`, data !== undefined ? JSON.stringify(data).slice(0, 300) : "");

  try {
    // Check API key
    if (!MESHY_API_KEY || MESHY_API_KEY === "your_meshy_api_key_here") {
      return NextResponse.json(
        { success: false, error: "Meshy API Key belum dikonfigurasi. Tambahkan MESHY_API_KEY di .env.local" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const userId = formData.get('user_id') as string;
    const bgColor = (formData.get('bg_color') as string) || "blue";
    const photoSize = (formData.get('photo_size') as string) || "3x4";

    if (!file || !userId) {
      return NextResponse.json(
        { success: false, error: "File foto dan User ID wajib disertakan." },
        { status: 400 }
      );
    }

    // ─── CEK KREDIT (admin client, bypass RLS) ───
    const supabaseAdmin = createSupabaseAdmin(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .single();

    const credits = profile?.credits ?? 0;
    log("Cek kredit", { userId, credits });

    if (credits <= 0) {
      return NextResponse.json(
        { success: false, error: "Kredit habis! Silakan top-up kredit terlebih dahulu.", code: "INSUFFICIENT_CREDITS" },
        { status: 402 } // Payment Required
      );
    }

    // Convert file to Base64 Data URI
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');
    const dataUrl = `data:${file.type || 'image/jpeg'};base64,${base64Image}`;

    // ─── Background colors dengan HEX CODE EXSAK ───
    const bgPrompts: Record<string, string> = {
      blue: "solid plain smooth bright blue studio background, exact color #0090FF, vivid clear pas-foto blue",
      red: "solid plain smooth deep red studio background, exact color #DB1514, standard Indonesian pas-foto red",
      white: "solid plain smooth pure white studio background, exact color #FFFFFF, clean white",
    };

    const sizePrompts: Record<string, string> = {
      "2x3": "ID photo portrait 2x3 cm ratio, head and shoulders composition, formal pose for KTP/SIM",
      "3x4": "ID photo portrait 3x4 cm ratio, head and shoulders composition, formal pose for ijazah/lamaran",
      "4x6": "ID photo portrait 4x6 cm ratio, head and shoulders composition, formal pose for passport/visa",
    };

    const prompt = `Transform this selfie into a professional photorealistic Indonesian ID/passport photo (pas foto). The person must face directly at the camera with a completely neutral expression, closed mouth, wearing a neat crisp white dress shirt and a tailored black suit blazer. The background MUST be ${bgPrompts[bgColor] || bgPrompts.blue}. This is a ${sizePrompts[photoSize] || sizePrompts["3x4"]}. Professional even soft studio lighting illuminating the face evenly from the front, sharp focus on both eyes, highly detailed skin texture, official government ID photograph quality, 8K resolution, photorealistic no shadows on the background, the background is a single flat solid color with zero gradient or pattern.`;

    log("Creating image-to-image task", { bgColor, photoSize, credits });

    // ─── STEP 1: Create Task (async) ───
    const createResponse = await fetch(`${MESHY_BASE_URL}/image-to-image`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MESHY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ai_model: "nano-banana",
        prompt: prompt,
        reference_image_urls: [dataUrl],
      }),
    });

    if (!createResponse.ok) {
      const errText = await createResponse.text();
      log("Create task FAILED", { status: createResponse.status, body: errText.slice(0, 300) });
      throw new Error(`Meshy API error (${createResponse.status}): ${errText}`);
    }

    const createData = await createResponse.json();
    const taskId = createData.result;

    if (!taskId) {
      log("No task ID in response", createData);
      throw new Error("Meshy tidak mengembalikan task ID.");
    }

    log("Task created", { taskId });

    return NextResponse.json({
      success: true,
      task_id: taskId,
      message: "Task dibuat. Menunggu proses AI...",
      processing: true,
    });

  } catch (error: any) {
    console.error("[Meshy] Generation Error:", error.message);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
