"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Download,
  Share2,
  X,
  ChevronLeft,
  ChevronRight,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Mock Data untuk Demo
const MOCK_PHOTOS = Array.from({ length: 12 }).map((_, i) => ({
  id: i,
  url: `https://picsum.photos/seed/${i + 123}/800/1000`, // Placeholder Image
  category: i % 3 === 0 ? "Formal" : i % 3 === 1 ? "Casual" : "Outdoor",
  status: "HD Ready",
}));

export function GalleryGrid() {
  const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
  const [filter, setFilter] = useState("All");

  const filteredPhotos =
    filter === "All"
      ? MOCK_PHOTOS
      : MOCK_PHOTOS.filter((p) => p.category === filter);

  const handleDownload = (url: string) => {
    // Simulasi download
    const link = document.createElement("a");
    link.href = url;
    link.download = "klikjadi-photo.jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {["All", "Formal", "Casual", "Outdoor"].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              filter === cat
                ? "bg-zinc-900 text-white shadow-md"
                : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Photo Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredPhotos.map((photo, i) => (
          <div
            key={photo.id}
            className="relative group cursor-pointer break-inside-avoid"
            onClick={() => setSelectedPhoto(i)}
          >
            <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-zinc-100 border border-zinc-200">
              <Image
                src={photo.url}
                alt={`Photo ${photo.id}`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Overlay on Hover */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />

              {/* Badge */}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Badge
                  variant="secondary"
                  className="bg-white/90 text-zinc-900 text-[10px] font-bold backdrop-blur-sm"
                >
                  {photo.category}
                </Badge>
              </div>

              {/* Quick Actions */}
              <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                <Button
                  size="icon"
                  variant="secondary"
                  className="h-8 w-8 rounded-full bg-white/90 hover:bg-white text-zinc-900 shadow-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(photo.url);
                  }}
                >
                  <Download className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
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
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2"
            onClick={() => setSelectedPhoto(null)}
          >
            <X className="w-8 h-8" />
          </button>

          <div
            className="relative w-full max-w-4xl h-[80vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Navigation */}
            <button
              className="absolute left-2 md:-left-12 p-2 text-white/50 hover:text-white transition disabled:opacity-20"
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
              <Image
                src={filteredPhotos[selectedPhoto]?.url || ""}
                alt="Selected"
                fill
                className="object-contain"
                priority
              />
            </div>

            <button
              className="absolute right-2 md:-right-12 p-2 text-white/50 hover:text-white transition disabled:opacity-20"
              disabled={selectedPhoto === filteredPhotos.length - 1}
              onClick={() =>
                setSelectedPhoto((prev) =>
                  prev !== null && prev < filteredPhotos.length - 1
                    ? prev + 1
                    : prev
                )
              }
            >
              <ChevronRight className="w-10 h-10" />
            </button>

            {/* Action Bar (Bottom) */}
            <div className="absolute -bottom-16 left-0 right-0 flex justify-center gap-4">
              <Button
                className="rounded-full px-6 bg-white text-black hover:bg-zinc-200"
                onClick={() =>
                  handleDownload(filteredPhotos[selectedPhoto]?.url)
                }
              >
                <Download className="w-4 h-4 mr-2" /> Download HD
              </Button>
              <Button
                variant="outline"
                className="rounded-full border-white/20 text-white hover:bg-white/10"
              >
                <Share2 className="w-4 h-4 mr-2" /> Share
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
