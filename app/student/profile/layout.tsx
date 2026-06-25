import type { ReactNode } from "react";

import { AppNavbar } from "@/components/StudentNavbar";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f5f5f2]">
      <AppNavbar />
      <main>{children}</main>
    </div>
  );
}
