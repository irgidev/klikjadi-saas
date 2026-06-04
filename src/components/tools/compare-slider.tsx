"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { ChevronsLeftRight } from "lucide-react";

interface CompareSliderProps {
    original: string;
    processed: string;
    className?: string;
}

export function CompareSlider({ original, processed, className = "" }: CompareSliderProps) {
    const [position, setPosition] = useState(50);
    const [isResizing, setIsResizing] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMove = useCallback(
        (clientX: number) => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            const x = clientX - rect.left;
            const percent = (x / rect.width) * 100;
            setPosition(Math.min(100, Math.max(0, percent)));
        },
        []
    );

    const handleMouseDown = () => setIsResizing(true);
    const handleTouchStart = () => setIsResizing(true);

    useEffect(() => {
        const handleMouseUp = () => setIsResizing(false);
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            handleMove(e.clientX);
        };
        const handleTouchMove = (e: TouchEvent) => {
            if (!isResizing) return;
            handleMove(e.touches[0].clientX);
        };

        window.addEventListener("mouseup", handleMouseUp);
        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("touchend", handleMouseUp);
        window.addEventListener("touchmove", handleTouchMove);

        return () => {
            window.removeEventListener("mouseup", handleMouseUp);
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("touchend", handleMouseUp);
            window.removeEventListener("touchmove", handleTouchMove);
        };
    }, [isResizing, handleMove]);

    return (
        <div
            ref={containerRef}
            className={`relative w-full aspect-square md:aspect-[4/3] select-none group overflow-hidden rounded-xl border border-zinc-200 shadow-sm ${className}`}
        >
            {/* Background Image (Processed - Full) */}
            <div className="absolute inset-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-zinc-50">
                <Image
                    src={processed}
                    alt="Processed"
                    fill
                    className="object-contain pointer-events-none"
                />
            </div>

            {/* Foreground Image (Original - Clipped) */}
            <div
                className="absolute inset-0 w-full h-full bg-zinc-100/50 backdrop-blur-[1px]"
                style={{ clipPath: `polygon(0 0, ${position}% 0, ${position}% 100%, 0 100%)` }}
            >
                <Image
                    src={original}
                    alt="Original"
                    fill
                    className="object-contain pointer-events-none"
                />
                {/* Label Original */}
                <div className="absolute top-4 left-4 bg-black/50 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur-sm">
                    ASLI
                </div>
            </div>

            {/* Label Processed */}
            <div className="absolute top-4 right-4 bg-blue-600/80 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur-sm z-10">
                HASIL AI
            </div>

            {/* Slider Handle */}
            <div
                className="absolute inset-y-0 w-1 bg-white cursor-ew-resize z-20 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
                style={{ left: `${position}%` }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
            >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-zinc-600 hover:scale-110 transition-transform">
                    <ChevronsLeftRight className="w-4 h-4" />
                </div>
            </div>
        </div>
    );
}
