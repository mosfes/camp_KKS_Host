import type { ReactNode } from "react";

import { AppNavbar } from "@/components/StudentNavbar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      <AppNavbar />
      <main>{children}</main>
    </div>
  );
}
