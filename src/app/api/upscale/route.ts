import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const image = formData.get("image") as Blob;

        if (!image) {
            return NextResponse.json(
                { error: "No image provided" },
                { status: 400 }
            );
        }

        // Convert Blob to ArrayBuffer
        const arrayBuffer = await image.arrayBuffer();

        // Hugging Face Inference API URL for Real-ESRGAN
        // UPDATED: Using router.huggingface.co instead of api-inference.huggingface.co
        const MODEL_ID = "ai-forever/Real-ESRGAN";
        const API_URL = `https://router.huggingface.co/hf-inference/models/${MODEL_ID}`;

        const token = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_TOKEN;

        const headers: Record<string, string> = {
            "Content-Type": image.type || "application/octet-stream",
        };

        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        console.log(`Sending request to Hugging Face Model: ${MODEL_ID} at ${API_URL}`);

        // Call Hugging Face API
        const response = await fetch(API_URL, {
            method: "POST",
            headers: headers,
            body: arrayBuffer,
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("HF API Error:", response.status, errorText);

            // Handle 503 Model Loading
            if (response.status === 503) {
                return NextResponse.json(
                    {
                        error: "Model is loading",
                        details: "Model sedang dipersiapkan oleh server. Silakan coba lagi dalam 30 detik."
                    },
                    { status: 503 }
                );
            }

            // Handle 410 Gone / 404 Not Found (Model Moved or Deleted)
            if (response.status === 410 || response.status === 404) {
                return NextResponse.json(
                    {
                        error: "Model API Error",
                        details: "Model AI sedang migrasi atau tidak tersedia saat ini. Silakan coba lagi nanti."
                    },
                    { status: response.status }
                );
            }

            return NextResponse.json(
                { error: "Upscaling failed", details: errorText },
                { status: response.status }
            );
        }

        // Get result as Blob/Buffer
        const resultBuffer = await response.arrayBuffer();

        // Return the image
        return new NextResponse(resultBuffer, {
            headers: {
                "Content-Type": "image/jpeg", // Usually returns JPEG or PNG
                "Content-Length": resultBuffer.byteLength.toString(),
            },
        });

    } catch (error: any) {
        console.error("Upscale API Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message },
            { status: 500 }
        );
    }
}

export const config = {
    api: {
        bodyParser: false,
    },
};
