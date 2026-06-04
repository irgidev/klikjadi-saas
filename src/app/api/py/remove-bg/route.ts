import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("image") as File;

        if (!file) {
            return NextResponse.json({ error: "No image provided" }, { status: 400 });
        }

        // Convert File to Blob for forwarding
        // We use the Python Backend URL
        const BACKEND_URL = "http://127.0.0.1:8000/api/remove-bg";

        // Create new FormData for the backend request
        const backendFormData = new FormData();
        backendFormData.append("image", file);

        console.log(`Proxying request to Python Backend: ${BACKEND_URL}`);

        try {
            const response = await fetch(BACKEND_URL, {
                method: "POST",
                body: backendFormData,
                // Do not set Content-Type header manually for FormData, fetch does it correctly with boundary
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Backend Error:", response.status, errorText);

                // Handle 503 Service Unavailable (Model Loading)
                if (response.status === 503) {
                    return NextResponse.json(
                        { error: "Model is loading", details: "Server Python sedang menyiapkan model. Silakan coba lagi dalam 10 detik." },
                        { status: 503 }
                    );
                }

                // Handle Connection Refused (Backend not running)
                return NextResponse.json(
                    { error: "Backend Error", details: `Python Backend returned ${response.status}: ${errorText}` },
                    { status: response.status }
                );
            }

            // Get the image blob from backend
            const imageBlob = await response.blob();
            const arrayBuffer = await imageBlob.arrayBuffer();

            // Return to frontend
            return new NextResponse(arrayBuffer, {
                headers: {
                    "Content-Type": "image/png",
                    "Content-Disposition": `attachment; filename="removed_bg.png"`,
                },
            });

        } catch (fetchError: any) {
            console.error("Fetch Error:", fetchError);
            if (fetchError.cause?.code === 'ECONNREFUSED') {
                return NextResponse.json(
                    {
                        error: "Backend Unavailable",
                        details: "Server Python (FastAPI) belum berjalan di port 8000. Pastikan sudah menjalankan 'uvicorn main:app' di terminal backend."
                    },
                    { status: 503 }
                );
            }
            throw fetchError;
        }

    } catch (error: any) {
        console.error("Proxy Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message },
            { status: 500 }
        );
    }
}
