import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
    // Lazy init — avoid build-time evaluation of env vars
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
        return NextResponse.json(
            { success: false, error: "Server configuration missing." },
            { status: 500 }
        );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    try {
        const formData = await request.formData();
        const zipFile = formData.get('file') as File;
        const triggerWord = formData.get('trigger_word') as string || 'formal_style';
        const userId = formData.get('user_id') as string;

        if (!zipFile || !userId) {
            return NextResponse.json(
                { success: false, error: "File ZIP dan User ID wajib disertakan." },
                { status: 400 }
            );
        }

        const fileName = `${userId}-${Date.now()}.zip`;
        const { data: storageData, error: storageError } = await supabaseAdmin
            .storage
            .from('training_files')
            .upload(fileName, zipFile);

        if (storageError) throw new Error(`Gagal upload ke storage: ${storageError.message}`);

        const { data: { publicUrl: zipUrl } } = supabaseAdmin
            .storage
            .from('training_files')
            .getPublicUrl(fileName);

        const falResponse = await fetch('https://api.fal.ai/v1/workflows/flux/lora/train', {
            method: 'POST',
            headers: {
                'Authorization': `Key ${process.env.FAL_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                images_data_url: zipUrl,
                trigger_word: triggerWord,
                iter_multiplier: 1,
            })
        });

        if (!falResponse.ok) {
            const falError = await falResponse.text();
            throw new Error(`Fal.ai API Error: ${falError}`);
        }

        const falData = await falResponse.json();

        const { error: dbError } = await supabaseAdmin
            .from('trainings')
            .insert({
                user_id: userId,
                trigger_word: triggerWord,
                model_id: falData.request_id || `req-${Date.now()}`,
                zip_url: zipUrl,
                status: 'processing'
            });

        if (dbError) throw new Error(`Gagal menyimpan ke database: ${dbError.message}`);

        return NextResponse.json({
            success: true,
            message: "Pipeline AI Training berhasil diinisialisasi.",
            request_id: falData.request_id,
            status: "processing"
        });

    } catch (error: any) {
        console.error("AI Training Pipeline Error:", error);
        return NextResponse.json(
            { success: false, error: error.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
