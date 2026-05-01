import type { ReactNode } from "react";
import { AppNavbar } from "@/components/StudentNavbar";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F5F1E8]">
      <AppNavbar />
      <main>{children}</main>
    </div>
  );
}
