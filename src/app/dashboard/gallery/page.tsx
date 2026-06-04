import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { GalleryGrid } from "@/components/dashboard/GalleryGrid";
import { Download, ImageIcon, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function GalleryPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return redirect("/login");

    // ─── ADMIN CLIENT (bypass RLS) ───
    const supabaseAdmin = createSupabaseAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Fetch trainings — sort by id (UUID, newest last by insert order)
    // Tabel trainings hanya punya: id, user_id, trigger_word, model_id, status
    const { data: trainings, error } = await supabaseAdmin
        .from("trainings")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("id", { ascending: false });

    if (error) {
        console.error("[Gallery] Error:", error.message);
    }

    console.log("[Gallery] Trainings count:", trainings?.length);

    // Parse data dari trigger_word format:
    // "Pas Foto 3×4 - Biru | https://meshy-output-url..."
    const photos: { id: string; url: string; title: string; bgColor: string; photoSize: string; createdAt: string }[] = (trainings || [])
        .map((t: any) => {
            const tw = t.trigger_word || "";
            let url = "";
            let title = tw;
            let bgColor = "blue";
            let photoSize = "3x4";

            // Cek apakah ada URL di trigger_word (format: "Title | URL")
            const pipeIdx = tw.indexOf("|");
            if (pipeIdx > 0) {
                url = tw.slice(pipeIdx + 1).trim();
                title = tw.slice(0, pipeIdx).trim();

                // Parse warna dari title
                if (title.includes("Merah")) bgColor = "red";
                else if (title.includes("Putih")) bgColor = "white";

                // Parse ukuran dari title
                if (title.includes("2×3") || title.includes("2x3")) photoSize = "2x3";
                else if (title.includes("4×6") || title.includes("4x6")) photoSize = "4x6";
            }

            return { id: t.id, url, title, bgColor, photoSize, createdAt: "" };
        })
        .filter((p: any) => p.url && p.url.startsWith("http"));

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-100 pb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-zinc-900 flex items-center gap-3">
                        <ImageIcon className="w-8 h-8 text-orange-500" /> Galeri Pas Foto
                    </h1>
                    <p className="text-zinc-500 mt-2">
                        {photos.length} pas foto tersimpan.
                    </p>
                </div>
                <Button className="bg-orange-600 hover:bg-orange-700 text-white" asChild>
                    <a href="/dashboard">
                        <Camera className="w-4 h-4 mr-2" /> Buat Pas Foto Baru
                    </a>
                </Button>
            </div>

            {/* Gallery Grid */}
            <div className="bg-white border border-zinc-200 rounded-3xl p-6 md:p-8 shadow-sm min-h-[400px]">
                <GalleryGrid photos={photos} />
            </div>
        </div>
    );
}
