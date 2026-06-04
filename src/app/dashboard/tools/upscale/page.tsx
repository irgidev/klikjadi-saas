"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    UploadCloud,
    ScanFace,
    Download,
    RefreshCw,
    ChevronLeft,
    Zap,
    Sparkles,
    Maximize,
    AlertCircle
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { CompareSlider } from "@/components/tools/compare-slider";
import { cn } from "@/lib/utils";

export default function UpscalePage() {
    const [image, setImage] = useState<string | null>(null);
    const [processed, setProcessed] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Loading State
    const [loadingText, setLoadingText] = useState("Mengupload Gambar...");
    const [progress, setProgress] = useState(0);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            processFile(e.target.files[0]);
        }
    };

    const processFile = (file: File) => {
        if (file.size > 5 * 1024 * 1024) {
            setError("Ukuran file maksimal 5MB");
            return;
        }
        setError(null);
        setImage(URL.createObjectURL(file));
        setProcessed(null);
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
        setError(null);
        setProgress(0);

        // Realistic Loading Simulation for Upscaling
        const steps = [
            "Mengupload Gambar...",
            "Menganalisis Detail...",
            "Enhancing Resolution (4x)...",
            "Refining Textures...",
            "Finalizing Check..."
        ];

        let stepIndex = 0;
        setLoadingText(steps[0]);

        // Simulate progress bar as upscaling takes time
        const interval = setInterval(() => {
            setProgress((prev) => {
                const increase = Math.random() * 5;
                const newProgress = Math.min(prev + increase, 95); // Cap at 95% until done

                // Update text based on progress thresholds
                if (newProgress > 20 && stepIndex === 0) { stepIndex = 1; setLoadingText(steps[1]); }
                if (newProgress > 40 && stepIndex === 1) { stepIndex = 2; setLoadingText(steps[2]); }
                if (newProgress > 70 && stepIndex === 2) { stepIndex = 3; setLoadingText(steps[3]); }
                if (newProgress > 90 && stepIndex === 3) { stepIndex = 4; setLoadingText(steps[4]); }

                return newProgress;
            });
        }, 500);

        try {
            const response = await fetch(image);
            const blob = await response.blob();

            const formData = new FormData();
            formData.append("image", blob, "input.png");

            // Added timeout logic manually since fetch doesn't support it directly
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 90000); // 90s timeout for CPU processing

            // Use Next.js API Route (HuggingFace Inference — serverless compatible)
            const API_URL = "/api/upscale";

            const apiResponse = await fetch(API_URL, {
                method: "POST",
                body: formData,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!apiResponse.ok) {
                const errorData = await apiResponse.json().catch(() => ({}));
                // Handle 503 specifically
                if (apiResponse.status === 503) {
                    throw new Error("Model sedang loading (Cold Start). Silakan coba lagi dalam 30 detik.");
                }
                throw new Error(errorData.details || errorData.error || "Gagal melakukan upscale");
            }

            const resultBlob = await apiResponse.blob();
            const resultUrl = URL.createObjectURL(resultBlob);

            setProgress(100);
            setProcessed(resultUrl);
        } catch (err: any) {
            console.error("Upscale Error:", err);
            if (err.name === 'AbortError') {
                setError("Proses timeout (lebih dari 60 detik). Server mungkin sedang sibuk.");
            } else {
                setError(err.message || "Terjadi kesalahan saat memproses gambar.");
            }
        } finally {
            clearInterval(interval);
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (!processed) return;
        const link = document.createElement("a");
        link.href = processed;
        link.download = `upscaled-4k-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20 px-4 md:px-8">
            {/* Header / Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-zinc-500">
                <Link href="/dashboard/tools" className="hover:text-zinc-900 transition flex items-center gap-1">
                    <ChevronLeft className="w-4 h-4" /> Tools
                </Link>
                <span>/</span>
                <span className="text-zinc-900 font-medium">Image Upscaler</span>
            </div>

            {/* Title Section */}
            <div className="text-center space-y-4 mb-10">
                <div className="inline-flex items-center justify-center p-3 bg-purple-50 rounded-2xl mb-2 text-purple-600 ring-1 ring-purple-100">
                    <Maximize className="w-8 h-8" />
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900">
                    AI 4K Image Upscaler
                </h1>
                <p className="text-lg text-zinc-500 max-w-2xl mx-auto leading-relaxed">
                    Ubah foto buram menjadi tajam dan jernih hingga resolusi 4K.
                    Cocok untuk foto lama atau hasil crop.
                </p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="max-w-xl mx-auto mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-semibold text-sm">Gagal Upscale</h4>
                        <p className="text-sm opacity-90">{error}</p>
                    </div>
                </div>
            )}

            {/* Main Interactive Area - Unified Container Grid */}
            <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 items-stretch h-auto lg:h-[600px]">

                {/* LEFT: Input / Upload Zone */}
                <div className="flex flex-col h-full bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden relative">
                    <div className="border-b border-zinc-100 p-4 flex justify-between items-center bg-zinc-50/50">
                        <h3 className="font-semibold text-zinc-700 flex items-center gap-2">
                            <UploadCloud className="w-4 h-4" /> Input Image
                        </h3>
                        {image && !loading && (
                            <button
                                onClick={() => { setImage(null); setProcessed(null); setError(null); }}
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
                                isDragging ? "border-purple-500 bg-purple-50/30 scale-[0.99]" : "border-zinc-200 hover:border-purple-300 hover:bg-zinc-50",
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
                                            "w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto text-purple-600 ring-4 ring-purple-50 transition-transform duration-500",
                                            isDragging ? "scale-110 -rotate-12" : "group-hover:scale-105"
                                        )}>
                                            <UploadCloud className="w-10 h-10" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-lg font-bold text-zinc-900">Upload Foto Low-Res</h3>
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
                                        <Image src={image} alt="Preview" fill className="object-contain p-8 blur-[2px] hover:blur-none transition-all duration-700" />
                                        <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium">
                                            Original (Low Res)
                                        </div>
                                    </div>

                                    {/* Action Button Area - Fixed Footer in the input box */}
                                    {!loading && !processed && (
                                        <div className="p-6 bg-white border-t border-zinc-100 flex justify-center flex-shrink-0 z-20 relative shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                                            <Button
                                                onClick={handleProcess}
                                                className="w-full max-w-sm h-12 text-base font-bold shadow-lg shadow-purple-600/20 bg-purple-600 hover:bg-purple-700 hover:scale-[1.02] transition-all rounded-xl"
                                            >
                                                <Zap className="w-5 h-5 mr-2" /> Upscale to 4K
                                            </Button>
                                        </div>
                                    )}

                                    {/* Interactive Change Image Input even when loaded (if not processing) */}
                                    {!loading && (
                                        <div className="absolute top-4 right-4 z-10">
                                            <label className="cursor-pointer bg-white/90 hover:bg-white text-zinc-700 text-xs px-3 py-1.5 rounded-full shadow-sm border border-zinc-200 transition-colors flex items-center gap-1 font-medium">
                                                <RefreshCw className="w-3 h-3" /> Ganti
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
                        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 transition-all text-center">
                            <div className="relative w-24 h-24 mb-6">
                                <div className="absolute inset-0 border-4 border-zinc-100 rounded-full"></div>
                                <div
                                    className="absolute inset-0 border-4 border-l-purple-600 border-t-purple-600 border-r-transparent border-b-transparent rounded-full animate-spin"
                                    style={{ animationDuration: '2s' }}
                                ></div>
                                <Zap className="absolute inset-0 m-auto w-10 h-10 text-purple-600 animate-pulse" />
                            </div>
                            <h3 className="text-xl font-bold text-zinc-900 animate-pulse mb-2">{loadingText}</h3>
                            <div className="h-2 w-64 bg-zinc-100 rounded-full overflow-hidden mb-2">
                                <div
                                    className="h-full bg-purple-600 rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                            <p className="text-zinc-500 text-sm">{Math.round(progress)}% Selesai</p>
                            <p className="text-zinc-400 mt-4 text-xs max-w-xs mx-auto">
                                Proses ini memakan waktu 10-20 detik karena menggunakan model AI Super Resolution yang berat.
                            </p>
                        </div>
                    )}
                </div>

                {/* RIGHT: Result / Editor Zone */}
                <div className="flex flex-col h-full bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
                    <div className="border-b border-zinc-100 p-4 flex justify-between items-center bg-zinc-50/50">
                        <h3 className="font-semibold text-zinc-700 flex items-center gap-2">
                            <ScanFace className="w-4 h-4" /> Hasil 4K
                        </h3>
                        {/* Download Button (Top Right Quick Action) - Only show if processed */}
                        {processed && !loading && (
                            <Button
                                onClick={handleDownload}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white font-bold h-8 text-xs px-4 rounded-full shadow-green-600/20 shadow-lg"
                            >
                                <Download className="w-3 h-3 mr-1.5" /> Download Ultra HD
                            </Button>
                        )}
                    </div>

                    <div className="flex-1 relative flex flex-col bg-zinc-50/50 p-6">
                        {/* Main Canvas Area */}
                        <div className="flex-1 relative rounded-2xl overflow-hidden shadow-sm border border-zinc-200 bg-white min-h-[400px]">
                            {processed ? (
                                <div className="relative w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-zinc-50">
                                    <CompareSlider
                                        original={image!}
                                        processed={processed}
                                        className="w-full h-full border-none rounded-none"
                                    />
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur text-white px-4 py-1.5 rounded-full text-xs font-bold pointer-events-none z-20">
                                        Geser untuk membandingkan
                                    </div>
                                </div>
                            ) : (
                                // Empty State Right
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center text-zinc-400">
                                    <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
                                        <Maximize className="w-8 h-8 text-zinc-300" />
                                    </div>
                                    <h3 className="font-medium text-zinc-600 mb-1">Hasil Belum Tersedia</h3>
                                    <p className="text-sm text-zinc-400 max-w-xs">Upload gambar di sebelah kiri dan klik tombol Upscale untuk melihat keajaiban AI.</p>
                                </div>
                            )}

                            {loading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-30">
                                    <div className="text-center space-y-2">
                                        <Sparkles className="w-8 h-8 text-purple-400 animate-pulse mx-auto" />
                                        <p className="text-zinc-500 font-medium text-sm">Menambahkan detail...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
