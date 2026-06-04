"use client";

import { useState } from "react";
import imageCompression from "browser-image-compression";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  UploadCloud,
  X,
  Loader2,
  Download,
  Camera,
  Palette,
  Ruler,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Background color options for pas foto
const BG_COLORS = [
  { name: "Biru", value: "blue", bgClass: "bg-blue-600", borderClass: "border-blue-600" },
  { name: "Merah", value: "red", bgClass: "bg-red-600", borderClass: "border-red-600" },
  { name: "Putih", value: "white", bgClass: "bg-white", borderClass: "border-zinc-300" },
];

// Standard Indonesian pas foto sizes
const PHOTO_SIZES = [
  { label: "2 × 3 cm", value: "2x3", desc: "KTP, SIM" },
  { label: "3 × 4 cm", value: "3x4", desc: "Ijazah, Lamaran" },
  { label: "4 × 6 cm", value: "4x6", desc: "Paspor, Visa" },
];

export function UploadZone({ userId }: { userId: string }) {
  const [files, setFiles] = useState<File[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [selectedBgColor, setSelectedBgColor] = useState<string>("blue");
  const [selectedSize, setSelectedSize] = useState<string>("3x4");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles([e.target.files[0]]);
      setGeneratedImageUrl(null);
    }
  };

  const removeFile = () => {
    setFiles([]);
    setGeneratedImageUrl(null);
  };

  const handleGeneratePhoto = async () => {
    if (files.length === 0) {
      alert("Pilih foto terlebih dahulu!");
      return;
    }

    setIsGenerating(true);
    try {
      // Compress image before sending
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(files[0], options);

      const formData = new FormData();
      formData.append("file", compressedFile);
      formData.append("user_id", userId);
      formData.append("bg_color", selectedBgColor);
      formData.append("photo_size", selectedSize);

      const response = await fetch("/api/ai/generate", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle khusus: kredit habis
        if (data.code === "INSUFFICIENT_CREDITS") {
          throw new Error("Kredit habis! Silakan top-up kredit terlebih dahulu di halaman Kredit.");
        }
        throw new Error(data.error || "Terjadi kesalahan saat memproses gambar.");
      }

      // Handle async processing (task_id returned)
      if (data.processing && data.task_id) {
        // Poll for result
        const resultUrl = await pollForResult(data.task_id);
        if (resultUrl) {
          setGeneratedImageUrl(resultUrl);
        } else {
          throw new Error("Gagal mendapatkan hasil gambar. Coba lagi.");
        }
      } else {
        setGeneratedImageUrl(data.url);
      }
    } catch (error: any) {
      console.error(error);
      alert("Gagal memproses foto: " + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  // Poll Meshy for async task completion
  const pollForResult = async (taskId: string): Promise<string | null> => {
    const maxAttempts = 90; // ~3 minutes max (Meshy butuh waktu agak lama)
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      try {
        const params = new URLSearchParams({
          task_id: taskId,
          user_id: userId,
          bg_color: selectedBgColor,
          photo_size: selectedSize,
        });
        const res = await fetch(`/api/ai/status?${params.toString()}`);
        const data = await res.json();
        if (data.success && data.url) {
          return data.url;
        }
        if (data.status === "failed") {
          return null;
        }
      } catch {
        continue;
      }
    }
    return null;
  };

  const handleDownload = async () => {
    if (!generatedImageUrl) return;
    try {
      const response = await fetch(generatedImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const bgColorLabel = BG_COLORS.find((b) => b.value === selectedBgColor)?.name || "biru";
      const sizeLabel = PHOTO_SIZES.find((s) => s.value === selectedSize)?.label || "3x4";
      a.download = `pas-foto-${sizeLabel.replace(/\s/g, '-')}-${bgColorLabel.toLowerCase()}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      // Fallback jika fetch terblokir CORS
      window.open(generatedImageUrl, "_blank");
    }
  };

  // Reset everything for a new photo
  const handleNewPhoto = () => {
    setFiles([]);
    setGeneratedImageUrl(null);
  };

  return (
    <Card className="overflow-hidden border-0 shadow-none">
      <CardContent className="p-0 space-y-0">
        {!generatedImageUrl ? (
          <>
            {/* ===== STEP 1: UPLOAD AREA ===== */}
            <div className="border-2 border-dashed rounded-2xl p-8 text-center space-y-4 transition-colors hover:border-orange-300 hover:bg-orange-50/30">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center">
                  <Camera className="h-8 w-8 text-orange-600" />
                </div>
              </div>
              <div>
                <p className="font-bold text-lg text-zinc-900">Upload Foto Selfie</p>
                <p className="text-sm text-zinc-500 mt-1">
                  Pastikan wajah terlihat jelas, menghadap depan, dan pencahayaan cukup.
                </p>
              </div>

              {!files.length ? (
                <>
                  <Input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="file-upload"
                    onChange={handleFileChange}
                    disabled={isGenerating}
                  />
                  <Button
                    variant="outline"
                    asChild
                    disabled={isGenerating}
                    className="px-8 py-5 rounded-xl font-bold text-sm border-2 hover:border-orange-400 hover:bg-orange-50 transition-all"
                  >
                    <label htmlFor="file-upload" className="cursor-pointer flex items-center gap-2">
                      <UploadCloud className="h-5 w-5" /> Pilih Foto Selfie
                    </label>
                  </Button>
                </>
              ) : (
                /* Preview uploaded file */
                <div className="space-y-4">
                  <div className="relative inline-block mx-auto group aspect-[3/4] w-[180px] bg-zinc-100 rounded-xl overflow-hidden shadow-lg">
                    <img
                      src={URL.createObjectURL(files[0])}
                      alt="preview"
                      className="object-cover w-full h-full"
                    />
                    {!isGenerating && (
                      <button
                        onClick={removeFile}
                        className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-all hover:bg-black/80"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-zinc-500">Foto terpilih ✓</p>
                </div>
              )}
            </div>

            {/* ===== STEP 2: OPTIONS (show after upload) ===== */}
            {files.length > 0 && (
              <div className="mt-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* Background Color Selection */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-zinc-700">
                    <Palette className="h-4 w-4 text-orange-500" />
                    Warna Background
                  </div>
                  <div className="flex justify-center gap-3">
                    {BG_COLORS.map((color) => (
                      <button
                        key={color.value}
                        onClick={() => setSelectedBgColor(color.value)}
                        disabled={isGenerating}
                        className={cn(
                          "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all",
                          selectedBgColor === color.value
                            ? `${color.borderClass} border-solid shadow-md scale-105`
                            : "border-zinc-200 hover:border-zinc-300",
                          isGenerating && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <div
                          className={cn(
                            "w-10 h-10 rounded-full border-2 border-white shadow-sm",
                            color.bgClass,
                            color.value === "white" && "border-zinc-200"
                          )}
                        />
                        <span
                          className={cn(
                            "text-[11px] font-bold",
                            selectedBgColor === color.value ? "text-zinc-900" : "text-zinc-500"
                          )}
                        >
                          {color.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Photo Size Selection */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-bold text-zinc-700">
                    <Ruler className="h-4 w-4 text-orange-500" />
                    Ukuran Foto
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {PHOTO_SIZES.map((size) => (
                      <button
                        key={size.value}
                        onClick={() => setSelectedSize(size.value)}
                        disabled={isGenerating}
                        className={cn(
                          "p-3 rounded-xl border-2 transition-all text-center",
                          selectedSize === size.value
                            ? "border-orange-500 bg-orange-50 shadow-sm"
                            : "border-zinc-200 hover:border-zinc-300 bg-white",
                          isGenerating && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <span
                          className={cn(
                            "text-sm font-bold block",
                            selectedSize === size.value ? "text-orange-700" : "text-zinc-700"
                          )}
                        >
                          {size.label}
                        </span>
                        <span
                          className={cn(
                            "text-[10px] block mt-0.5",
                            selectedSize === size.value ? "text-orange-500" : "text-zinc-400"
                          )}
                        >
                          {size.desc}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Generate Button */}
                <Button
                  onClick={handleGeneratePhoto}
                  disabled={isGenerating}
                  className="w-full h-14 text-base font-bold rounded-xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg shadow-orange-500/25 transition-all hover:scale-[1.01]"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      <span className="flex flex-col items-start">
                        <span>Memproses dengan AI...</span>
                        <span className="text-[10px] font-normal opacity-80">
                          Mohon tunggu ±30–60 detik
                        </span>
                      </span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate Pas Foto Sekarang
                    </>
                  )}
                </Button>
              </div>
            )}
          </>
        ) : (
          /* ===== RESULT VIEW ===== */
          <div className="space-y-6 text-center py-4 animate-in fade-in zoom-in duration-300">
            {/* Success Banner */}
            <div className="bg-green-50 border border-green-200 text-green-700 px-5 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Pas Foto Berhasil Dibuat!
            </div>

            {/* Generated Image Preview - Pas Photo Ratio */}
            <div className="flex justify-center">
              <div
                className={cn(
                  "relative aspect-[3/4] w-[240px] rounded-lg overflow-hidden shadow-2xl border-4",
                  selectedBgColor === "blue" && "border-blue-600",
                  selectedBgColor === "red" && "border-red-600",
                  selectedBgColor === "white" && "border-zinc-300"
                )}
              >
                <img
                  src={generatedImageUrl}
                  alt="Generated Pas Foto"
                  className="object-cover w-full h-full"
                />
              </div>
            </div>

            {/* Metadata badges */}
            <div className="flex justify-center gap-2">
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
                {BG_COLORS.find((b) => b.value === selectedBgColor)?.name}
              </span>
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200">
                {PHOTO_SIZES.find((s) => s.value === selectedSize)?.label}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center pt-2">
              <Button
                onClick={handleDownload}
                className="flex-1 max-w-[180px] h-12 font-bold bg-green-600 hover:bg-green-700"
              >
                <Download className="w-4 h-4 mr-2" /> Download
              </Button>
              <Button
                variant="outline"
                onClick={handleNewPhoto}
                className="flex-1 max-w-[180px] h-12 font-bold"
              >
                Buat Baru
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
