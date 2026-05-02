import type { ReactNode } from "react";

import { HeadteacherNavbar } from "@/components/Headteacher";
import { StatusModalProvider } from "@/components/StatusModalProvider";

export default function TeacherProfileLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <StatusModalProvider>
      <div className="min-h-screen bg-[#f5f5f0]">
        <HeadteacherNavbar />
        <main>{children}</main>
      </div>
    </StatusModalProvider>
  );
}
