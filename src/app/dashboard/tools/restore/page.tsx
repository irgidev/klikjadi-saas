import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Wand2 } from "lucide-react";

export default function RestorePage() {
    return (
        <div className="max-w-4xl mx-auto py-20 text-center space-y-6">
            <div className="flex justify-center mb-6">
                <div className="w-24 h-24 bg-orange-50 rounded-3xl flex items-center justify-center animate-pulse">
                    <Wand2 className="w-12 h-12 text-orange-400" />
                </div>
            </div>

            <h1 className="text-4xl font-black text-zinc-900">Restorasi Wajah Segera Hadir!</h1>
            <p className="text-zinc-500 max-w-md mx-auto">
                Fitur ini sedang dalam tahap pengembangan akhir. Kami sedang melatih AI agar bisa memperbaiki foto nenek moyangmu dengan sempurna.
            </p>

            <div className="pt-4">
                <Link href="/dashboard/tools">
                    <Button variant="outline">
                        <ChevronLeft className="w-4 h-4 mr-2" /> Kembali ke Tools
                    </Button>
                </Link>
            </div>
        </div>
    );
}
