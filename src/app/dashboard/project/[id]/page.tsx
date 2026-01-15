import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Calendar, User, Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GalleryGrid } from "@/components/dashboard/GalleryGrid";

export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return redirect("/login");

  // Fetch data project (Mockup dulu kalau DB kosong)
  // const { data: project } = await supabase
  //   .from('trainings')
  //   .select('*')
  //   .eq('id', params.id)
  //   .single()

  // MOCK DATA (Biar halaman bisa dilihat dulu)
  const project = {
    id: params.id,
    trigger_word: "CPNS 2024",
    created_at: new Date().toISOString(),
    status: "completed",
  };

  // Jika project tidak ditemukan (nanti diaktifkan)
  // if (!project) return notFound()

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      {/* HEADER NAV */}
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <Link
          href="/dashboard"
          className="hover:text-zinc-900 transition flex items-center gap-1"
        >
          <ChevronLeft className="w-4 h-4" /> Dashboard
        </Link>
        <span>/</span>
        <span className="text-zinc-900 font-medium capitalize">
          {project.trigger_word}
        </span>
      </div>

      {/* TITLE & ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 capitalize flex items-center gap-3">
            {project.trigger_word}
            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full font-bold border border-green-200">
              SELESAI
            </span>
          </h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-zinc-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />{" "}
              {new Date(project.created_at).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" /> 12 Foto
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Share className="w-4 h-4 mr-2" /> Bagikan Link
          </Button>
          <Button className="bg-orange-600 hover:bg-orange-700 text-white">
            <Download className="w-4 h-4 mr-2" /> Download Semua (.zip)
          </Button>
        </div>
      </div>

      {/* GALLERY COMPONENT */}
      <div className="bg-white border border-zinc-200 rounded-3xl p-6 md:p-8 shadow-sm">
        <GalleryGrid />
      </div>
    </div>
  );
}
