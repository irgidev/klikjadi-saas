import { redirect } from "next/navigation";

// Tools page di-redirect ke dashboard karena fokus utama sekarang adalah Pas Foto
export default function ToolsPage() {
  redirect("/dashboard");
}
