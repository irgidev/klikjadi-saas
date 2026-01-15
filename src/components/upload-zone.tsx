"use client";

import { useState, useCallback } from "react";
import { createBrowserClient } from "@supabase/ssr";
import JSZip from "jszip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { UploadCloud, X, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export function UploadZone({ userId }: { userId: string }) {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [triggerWord, setTriggerWord] = useState("wonyoung"); // Default trigger
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // 1. Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      // Validasi: Maksimal 15 foto biar gak berat
      if (files.length + newFiles.length > 15) {
        alert("Maksimal 15 foto ya!");
        return;
      }
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  // 2. Remove File
  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  // 3. Proses Upload (ZIP -> Storage -> DB)
  const handleUpload = async () => {
    if (files.length < 5) {
      alert("Minimal upload 5 foto biar hasilnya bagus!");
      return;
    }

    setIsUploading(true);
    try {
      // A. Bikin ZIP
      const zip = new JSZip();
      files.forEach((file) => {
        zip.file(file.name, file);
      });
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const zipFile = new File([zipBlob], `training_${Date.now()}.zip`, {
        type: "application/zip",
      });

      // B. Upload ZIP ke Supabase Storage
      const fileName = `${userId}/${Date.now()}_dataset.zip`;
      const { error: uploadError } = await supabase.storage
        .from("training_files")
        .upload(fileName, zipFile);

      if (uploadError) throw uploadError;

      // C. Dapatkan URL File (Private Signed URL gak perlu di sini, kita simpan path-nya aja)
      // Kita simpan record ke Database 'trainings'
      const { error: dbError } = await supabase.from("trainings").insert({
        user_id: userId,
        trigger_word: triggerWord,
        zip_url: fileName, // Path di storage
        status: "processing",
      });

      if (dbError) throw dbError;

      alert("Berhasil upload! Training akan segera dimulai.");
      setFiles([]); // Reset
      router.refresh(); // Refresh dashboard
    } catch (error: any) {
      console.error(error);
      alert("Gagal upload: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="border-2 border-dashed rounded-lg p-8 text-center space-y-4">
          <div className="flex justify-center">
            <UploadCloud className="h-10 w-10 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">Drag & Drop foto kamu di sini</p>
            <p className="text-sm text-muted-foreground">
              atau klik untuk memilih (Min 5, Max 15 foto)
            </p>
          </div>
          <Input
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            id="file-upload"
            onChange={handleFileChange}
            disabled={isUploading}
          />
          <Button variant="outline" asChild>
            <label htmlFor="file-upload" className="cursor-pointer">
              Pilih Foto
            </label>
          </Button>
        </div>

        {/* Input Trigger Word */}
        <div>
          <label className="text-sm font-medium">
            Nama Panggilan (Trigger Word):
          </label>
          <Input
            value={triggerWord}
            onChange={(e) => setTriggerWord(e.target.value)}
            placeholder="misal: wonyoung, budi, siti"
            className="mt-1"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Gunakan satu kata unik tanpa spasi.
          </p>
        </div>

        {/* Preview Files */}
        {files.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {files.map((file, i) => (
              <div
                key={i}
                className="relative group aspect-square bg-gray-100 rounded-md overflow-hidden"
              >
                <img
                  src={URL.createObjectURL(file)}
                  alt="preview"
                  className="object-cover w-full h-full"
                />
                <button
                  onClick={() => removeFile(i)}
                  className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Submit Button */}
        {files.length > 0 && (
          <Button
            onClick={handleUpload}
            className="w-full"
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mengupload &
                Memproses...
              </>
            ) : (
              `Mulai Training (${files.length} Foto)`
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
