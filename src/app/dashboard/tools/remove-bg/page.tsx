"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    UploadCloud,
    Scissors,
    Download,
    RefreshCw,
    ChevronLeft,
    Image as ImageIcon,
    Palette,
    Sparkles,
    Pipette,
    Check
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { CompareSlider } from "@/components/tools/compare-slider";
import { cn } from "@/lib/utils";

// Preset Colors
const PRESET_COLORS = [
    { name: "Transparent", value: "transparent", class: "bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-zinc-50 border-zinc-200" },
    { name: "White", value: "#ffffff", class: "bg-white border-zinc-200" },
    { name: "Red", value: "#dc2626", class: "bg-red-600 border-transparent" },
    { name: "Blue", value: "#2563eb", class: "bg-blue-600 border-transparent" },
];

export default function RemoveBgPage() {
    const [image, setImage] = useState<string | null>(null);
    const [processed, setProcessed] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Background State
    const [bgColor, setBgColor] = useState(PRESET_COLORS[0].value); // Default transparent
    const [customColor, setCustomColor] = useState("#000000");

    // Loading State
    const [loadingText, setLoadingText] = useState("Mengupload Gambar...");

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    const processFile = (file: File) => {
        setImage(URL.createObjectURL(file));
        setProcessed(null);
        setBgColor("transparent");
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processFile(e.dataTransfer.files[0]);
        }
    };

    const handleProcess = async () => {
        if (!image) return;
        setLoading(true);
        setProcessed(null);

        // Generic Loading Steps
        const steps = ["Mengupload Gambar...", "Menganalisis Objek...", "Menghapus Background...", "Finishing..."];
        let stepIndex = 0;
        setLoadingText(steps[0]);

        const interval = setInterval(() => {
            stepIndex++;
            if (stepIndex < steps.length) {
                setLoadingText(steps[stepIndex]);
            }
        }, 1500);

        try {
            const response = await fetch(image);
            const blob = await response.blob();

            const formData = new FormData();
            formData.append("image", blob, "input.png");

            const apiResponse = await fetch("/api/py/remove-bg", {
                method: "POST",
                body: formData,
            });

            if (!apiResponse.ok) {
                const errorData = await apiResponse.json();
                throw new Error(errorData.details || "Failed to process image");
            }

            const resultBlob = await apiResponse.blob();
            const resultUrl = URL.createObjectURL(resultBlob);
            setProcessed(resultUrl);
        } catch (error: any) {
            console.error("Error processing image:", error);
            alert(`Gagal memproses gambar: ${error.message}`);
        } finally {
            clearInterval(interval);
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!processed) return;

        if (bgColor === "transparent") {
            const link = document.createElement("a");
            link.href = processed;
            link.download = `removed-bg-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const img = new window.Image();

            img.crossOrigin = "anonymous";

            img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;

                if (ctx) {
                    ctx.fillStyle = bgColor;
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.drawImage(img, 0, 0);

                    const format = "image/jpeg";
                    const ext = "jpg";

                    const link = document.createElement("a");
                    link.href = canvas.toDataURL(format, 0.95);
                    link.download = `removed-bg-edited-${Date.now()}.${ext}`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                }
            };
            img.src = processed;
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 px-4 md:px-8">
            {/* Header / Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-zinc-500">
                <Link href="/dashboard/tools" className="hover:text-zinc-900 transition flex items-center gap-1">
                    <ChevronLeft className="w-4 h-4" /> Tools
                </Link>
                <span>/</span>
                <span className="text-zinc-900 font-medium">Remove Background</span>
            </div>

            {/* Title Section */}
            <div className="text-center space-y-4 mb-10">
                <div className="inline-flex items-center justify-center p-3 bg-blue-50 rounded-2xl mb-2 text-blue-600 ring-1 ring-blue-100">
                    <Scissors className="w-8 h-8 transform -rotate-12" />
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900">
                    AI Background Remover
                </h1>
                <p className="text-lg text-zinc-500 max-w-2xl mx-auto leading-relaxed">
                    Hapus background foto secara instan dengan presisi tinggi menggunakan teknologi AI.
                    Gratis dan tanpa watermark.
                </p>
            </div>

            {/* Main Interactive Area - Unified Container Grid */}
            <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-stretch h-auto lg:h-[650px]">

                {/* LEFT: Input / Upload Zone */}
                <div className="flex flex-col h-full bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden relative">
                    <div className="border-b border-zinc-100 p-4 flex justify-between items-center bg-zinc-50/50">
                        <h3 className="font-semibold text-zinc-700 flex items-center gap-2">
                            <UploadCloud className="w-4 h-4" /> Input Image
                        </h3>
                        {image && !loading && (
                            <button
                                onClick={() => { setImage(null); setProcessed(null); }}
                                className="text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-full transition-colors"
                            >
                                Hapus / Reset
                            </button>
                        )}
                    </div>

                    <div className="flex-1 relative flex flex-col">
                        <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={cn(
                                "flex-1 relative group cursor-pointer transition-all duration-300 ease-in-out border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center overflow-hidden m-6",
                                isDragging ? "border-blue-500 bg-blue-50/30 scale-[0.99]" : "border-zinc-200 hover:border-blue-300 hover:bg-zinc-50",
                                image ? "border-transparent p-0 bg-zinc-900 m-0 rounded-none border-0" : "p-8"
                            )}
                        >
                            {!image ? (
                                <>
                                    <input
                                        type="file"
                                        className="absolute inset-0 opacity-0 z-20 cursor-pointer"
                                        onChange={handleFileChange}
                                        accept="image/png, image/jpeg, image/jpg"
                                    />
                                    <div className="space-y-4 pointer-events-none relative z-10">
                                        <div className={cn(
                                            "w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto text-blue-600 ring-4 ring-blue-50 transition-transform duration-500",
                                            isDragging ? "scale-110 rotate-12" : "group-hover:scale-105"
                                        )}>
                                            <UploadCloud className="w-10 h-10" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-lg font-bold text-zinc-900">Upload Gambar</h3>
                                            <p className="text-sm text-zinc-500">Drag & drop atau klik untuk browse</p>
                                        </div>
                                        <div className="text-xs text-zinc-400 bg-zinc-100 px-3 py-1 rounded-full inline-block">
                                            Max 5MB (JPG/PNG)
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="relative w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-zinc-100 flex flex-col">
                                    {/* Original Image Preview - Flexible Height to fill available space */}
                                    <div className="relative flex-1 w-full min-h-0">
                                        <Image src={image} alt="Preview" fill className="object-contain p-8" />
                                    </div>

                                    {/* Action Button Area - Fixed Footer in the input box */}
                                    {!loading && !processed && (
                                        <div className="p-6 bg-white border-t border-zinc-100 flex justify-center flex-shrink-0 z-20 relative shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                                            <Button
                                                onClick={handleProcess}
                                                className="w-full max-w-sm h-12 text-base font-bold shadow-lg shadow-blue-600/20 bg-blue-600 hover:bg-blue-700 hover:scale-[1.02] transition-all rounded-xl"
                                            >
                                                <Sparkles className="w-5 h-5 mr-2" /> Hapus Background
                                            </Button>
                                        </div>
                                    )}

                                    {/* Interactive Change Image Input even when loaded (if not processing) */}
                                    {!loading && (
                                        <div className="absolute top-4 right-4 z-10">
                                            <label className="cursor-pointer bg-white/90 hover:bg-white text-zinc-700 text-xs px-3 py-1.5 rounded-full shadow-sm border border-zinc-200 transition-colors flex items-center gap-1 font-medium">
                                                <RefreshCw className="w-3 h-3" /> Ganti Foto
                                                <input
                                                    type="file"
                                                    className="hidden"
                                                    onChange={handleFileChange}
                                                    accept="image/png, image/jpeg, image/jpg"
                                                />
                                            </label>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Status Bar / Loading Indicator - Absolute Overlay */}
                    {loading && (
                        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 transition-all">
                            <div className="relative w-20 h-20 mb-6">
                                <div className="absolute inset-0 border-4 border-zinc-100 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-t-blue-600 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
                                <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-blue-600 animate-pulse" />
                            </div>
                            <h3 className="text-xl font-bold text-zinc-900 animate-pulse mb-2">{loadingText}</h3>
                            <div className="h-2 w-64 bg-zinc-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-600 rounded-full animate-progress-indeterminate"></div>
                            </div>
                            <p className="text-zinc-500 mt-4 text-sm max-w-xs text-center">AI sedang bekerja pixel demi pixel...</p>
                        </div>
                    )}
                </div>

                {/* RIGHT: Result / Editor Zone */}
                <div className="flex flex-col h-full bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
                    <div className="border-b border-zinc-100 p-4 flex justify-between items-center bg-zinc-50/50">
                        <h3 className="font-semibold text-zinc-700 flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" /> Hasil Editor
                        </h3>
                        {/* Download Button (Top Right Quick Action) - Only show if processed */}
                        {processed && !loading && (
                            <Button
                                onClick={handleDownload}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white font-bold h-8 text-xs px-4 rounded-full shadow-green-600/20 shadow-lg"
                            >
                                <Download className="w-3 h-3 mr-1.5" /> Download HD
                            </Button>
                        )}
                    </div>

                    <div className="flex-1 relative flex flex-col bg-zinc-50/50 p-6">
                        {/* Main Canvas Area */}
                        <div className="flex-1 relative rounded-2xl overflow-hidden shadow-sm border border-zinc-200 bg-white min-h-[400px]">
                            {processed ? (
                                <div
                                    className="relative w-full h-full transition-colors duration-300"
                                    style={{ background: bgColor === 'transparent' ? "url('https://www.transparenttextures.com/patterns/cubes.png')" : bgColor }}
                                >
                                    {bgColor === 'transparent' ? (
                                        <CompareSlider original={image!} processed={processed} className="w-full h-full border-none rounded-none" />
                                    ) : (
                                        <div className="relative w-full h-full">
                                            <Image src={processed} alt="Result" fill className="object-contain" />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                // Empty State Right
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-zinc-400">
                                    <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
                                        <Sparkles className="w-8 h-8 text-zinc-300" />
                                    </div>
                                    <p className="text-sm font-medium">Hasil akan muncul di sini</p>
                                </div>
                            )}

                            {loading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-30">
                                    <div className="text-center space-y-2">
                                        <Sparkles className="w-8 h-8 text-blue-400 animate-pulse mx-auto" />
                                        <p className="text-zinc-500 font-medium text-sm">Sedang Memproses...</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Mini Editor Toolbar (Bottom aligned) - Only show if processed AND not loading */}
                        {processed && !loading && (
                            <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-bold text-zinc-700 flex items-center gap-2">
                                        <Palette className="w-4 h-4" /> Ganti Background
                                    </h4>
                                    {bgColor !== 'transparent' && (
                                        <button onClick={() => setBgColor('transparent')} className="text-xs text-zinc-500 hover:text-blue-600 underline">
                                            Reset
                                        </button>
                                    )}
                                </div>

                                <div className="flex items-center gap-3">
                                    {/* Presets */}
                                    {PRESET_COLORS.map((color) => (
                                        <button
                                            key={color.value}
                                            onClick={() => setBgColor(color.value)}
                                            className={cn(
                                                "w-10 h-10 rounded-full border-2 transition-all duration-200 relative",
                                                bgColor === color.value ? "border-blue-600 scale-110 shadow-md ring-2 ring-blue-100" : "border-gray-200 hover:scale-105",
                                                color.class
                                            )}
                                            title={color.name}
                                        >
                                            {bgColor === color.value && color.value !== 'transparent' && color.value !== '#ffffff' && <Check className="w-4 h-4 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
                                            {bgColor === color.value && color.value === '#ffffff' && <Check className="w-4 h-4 text-zinc-900 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />}
                                        </button>
                                    ))}

                                    <div className="w-px h-8 bg-zinc-200 mx-1"></div>

                                    {/* Native Color Picker Trigger */}
                                    <div className="relative group">
                                        <button
                                            className={cn(
                                                "w-10 h-10 rounded-full border-2 border-zinc-200 flex items-center justify-center transition-all bg-gradient-to-tr from-pink-500 via-red-500 to-yellow-500 hover:opacity-90",
                                                !PRESET_COLORS.some(c => c.value === bgColor) ? "border-blue-600 scale-110 ring-2 ring-blue-100" : ""
                                            )}
                                        >
                                            <Pipette className="w-4 h-4 text-white" />
                                        </button>
                                        <input
                                            type="color"
                                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                            value={customColor}
                                            onChange={(e) => {
                                                setCustomColor(e.target.value);
                                                setBgColor(e.target.value);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Animations */}
            <style jsx global>{`
                @keyframes progress-indeterminate {
                    0% { margin-left: -50%; width: 50%; }
                    100% { margin-left: 100%; width: 50%; }
                }
                .animate-progress-indeterminate {
                    animation: progress-indeterminate 1.5s infinite linear;
                }
            `}</style>
        </div>
    );
}
