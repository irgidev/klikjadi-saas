import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/py/remove-bg
 *
 * Background removal using HuggingFace Inference API (BiRefNet).
 * Replaces local Python backend for Vercel/serverless deployment.
 */
export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("image") as File;

        if (!file) {
            return NextResponse.json({ error: "No image provided" }, { status: 400 });
        }

        // HuggingFace Inference API — BiRefNet general model
        const MODEL_ID = "brad-sc/birefnet-general";
        const API_URL = `https://router.huggingface.co/hf-inference/models/${MODEL_ID}`;

        const token = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY;

        const arrayBuffer = await file.arrayBuffer();

        const headers: Record<string, string> = {
            "Content-Type": file.type || "application/octet-stream",
        };

        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        console.log(`[Remove-BG] Sending to HuggingFace: ${MODEL_ID}`);

        const response = await fetch(API_URL, {
            method: "POST",
            headers,
            body: arrayBuffer,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("[Remove-BG] HF Error:", response.status, errorText);

            if (response.status === 503) {
                return NextResponse.json(
                    { error: "Model is loading", details: "Model sedang dipersiapkan. Coba lagi dalam 30 detik." },
                    { status: 503 }
                );
            }

            if (response.status === 410 || response.status === 404) {
                return NextResponse.json(
                    { error: "Model unavailable", details: "Model AI sedang tidak tersedia." },
                    { status: response.status }
                );
            }

            return NextResponse.json(
                { error: "Background removal failed", details: errorText },
                { status: response.status }
            );
        }

        const resultBuffer = await response.arrayBuffer();

        return new NextResponse(resultBuffer, {
            headers: {
                "Content-Type": "image/png",
                "Content-Length": resultBuffer.byteLength.toString(),
            },
        });

    } catch (error: any) {
        console.error("[Remove-BG] Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message },
            { status: 500 }
        );
    }
}

// Next.js 16: FormData body parsing is automatic — no config needed
