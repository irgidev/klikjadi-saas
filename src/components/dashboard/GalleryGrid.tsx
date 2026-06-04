"use client";

import { useState, useCallback } from "react";
import {
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  ImageOff,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PasFoto {
  id: string;
  url: string;
  title: string;
  bgColor: string;
  photoSize: string;
  createdAt: string;
}

interface GalleryGridProps {
  photos?: PasFoto[];
}

// Color badge styling
const bgStyles: Record<string, string> = {
  blue: "bg-blue-100 text-blue-700 border-blue-200",
  red: "bg-red-100 text-red-700 border-red-200",
  white: "bg-zinc-100 text-zinc-700 border-zinc-200",
};

const bgLabels: Record<string, string> = {
  blue: "Biru",
  red: "Merah",
  white: "Putih",
};

/**
 * SafeImage — native <img> dengan loading & error state.
 * Menggunakan <img> biasa (bukan next/image) agar SEMUA URL eksternal
 * (Meshy CDN, redirect, subdomain apapun) tetap bisa render tanpa
 * diblokir oleh Next.js image optimizer.
 */
function SafeImage({
  src,
  alt,
  className,
  onLoad,
}: {
  src: string;
  alt: string;
  className?: string;
  onLoad?: () => void;
}) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  return (
    <>
      {/* Spinner saat loading */}
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-100">
          <Loader2 className="w-6 h-6 text-zinc-300 animate-spin" />
        </div>
      )}
      {/* Fallback kalau error */}
      {status === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-100 gap-2">
          <ImageOff className="w-8 h-8 text-zinc-300" />
          <span className="text-[10px] text-zinc-400">Gagal memuat</span>
        </div>
      )}
      {/* Native <img> — works with ANY external URL */}
      <img
        src={src}
        alt={alt}
        className={className}
        style={{ opacity: status === "loaded" ? 1 : 0, transition: "opacity 0.3s" }}
        onLoad={() => {
          setStatus("loaded");
          onLoad?.();
        }}
        onError={() => setStatus("error")}
        // Prevent drag
        draggable={false}
        decoding="async"
      />
    </>
  );
}

export function GalleryGrid({ photos = [] }: GalleryGridProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);

  if (photos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mb-4 border border-zinc-200">
          <Download className="w-8 h-8 text-zinc-300" />
        </div>
        <p className="text-sm text-zinc-500">Belum ada pas foto yang tersimpan.</p>
      </div>
    );
  }

  const handleDownload = useCallback((url: string, title: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `pas-foto-${title.replace(/\s+/g, '-')}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  return (
    <div className="space-y-6">
      {/* Photo Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo, i) => (
          <div
            key={photo.id}
            className="relative group cursor-pointer break-inside-avoid"
            onClick={() => setSelectedPhoto(i)}
          >
            <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-zinc-100 border border-zinc-200">
              <SafeImage
                src={photo.url}
                alt={photo.title}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Overlay on Hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors duration-300 pointer-events-none" />

              {/* Color Badge */}
              <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border backdrop-blur-sm ${bgStyles[photo.bgColor] || "bg-gray-100 text-gray-700 border-gray-200"}`}>
                  {bgLabels[photo.bgColor] || photo.bgColor}
                </span>
              </div>

              {/* Size Badge */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/50 text-white backdrop-blur-sm">
                  {photo.photoSize}
                </span>
              </div>

              {/* Download Button */}
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-1 group-hover:translate-y-0 duration-300 z-10">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 rounded-full bg-white/90 hover:bg-white text-zinc-900 shadow-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(photo.url, photo.title);
                  }}
                >
                  <Download className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Title below image */}
            <p className="text-xs text-zinc-500 mt-2 truncate px-1">{photo.title}</p>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 z-20"
            onClick={() => setSelectedPhoto(null)}
          >
            <X className="w-8 h-8" />
          </button>

          <div
            className="relative w-full max-w-4xl h-[80vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute left-2 md:-left-12 p-2 text-white/50 hover:text-white transition disabled:opacity-20 z-20"
              disabled={selectedPhoto === 0}
              onClick={() =>
                setSelectedPhoto((prev) =>
                  prev !== null && prev > 0 ? prev - 1 : prev
                )
              }
            >
              <ChevronLeft className="w-10 h-10" />
            </button>

            <div className="relative w-auto h-full aspect-[3/4] bg-zinc-800 rounded-lg overflow-hidden shadow-2xl">
              <SafeImage
                src={photos[selectedPhoto]?.url || ""}
                alt={photos[selectedPhoto]?.title || ""}
                className="absolute inset-0 w-full h-full object-contain"
              />
            </div>

            <button
              className="absolute right-2 md:-right-12 p-2 text-white/50 hover:text-white transition disabled:opacity-20 z-20"
              disabled={selectedPhoto === photos.length - 1}
              onClick={() =>
                setSelectedPhoto((prev) =>
                  prev !== null && prev < photos.length - 1
                    ? prev + 1
                    : prev
                )
              }
            >
              <ChevronRight className="w-10 h-10" />
            </button>

            {/* Action Bar */}
            <div className="absolute -bottom-16 left-0 right-0 flex justify-center gap-4 z-20">
              <Button
                className="rounded-full px-6 bg-white text-black hover:bg-zinc-200"
                onClick={() => handleDownload(photos[selectedPhoto].url, photos[selectedPhoto].title)}
              >
                <Download className="w-4 h-4 mr-2" /> Download HD
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
