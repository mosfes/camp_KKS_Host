"use client";
import { Navbar, NavbarBrand, NavbarContent, NavbarItem } from "@heroui/navbar";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Avatar } from "@heroui/avatar";
import { GraduationCap, LogOut, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useClerk } from "@clerk/nextjs";

export function AppNavbar() {
  const router = useRouter();
  const { signOut } = useClerk();
  const [navigating, setNavigating] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const [student, setStudent] = useState<{
    students_id: number;
    firstname: string;
    lastname: string;
    email: string;
  } | null>(null);

  const [mounted, setMounted] = useState(false);

  // ดึงข้อมูลนักเรียนจาก session cookie
  useEffect(() => {
    setMounted(true);
    fetch("/api/auth/student/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setStudent(data);
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await fetch("/api/auth/student/logout", { method: "POST" });
    await signOut({ redirectUrl: "/" });
  };

  const displayName = student
    ? `${student.firstname} ${student.lastname}`
    : "...";
  const displayEmail = student?.email ?? "";
  const initials = student
    ? `${student.firstname[0]}${student.lastname[0]}`
    : "?";

  return (
    <Navbar
      className="bg-white border-b border-gray-200"
      height="64px"
      maxWidth="full"
    >
      {/* LEFT */}
      <NavbarBrand className="gap-3">
        <div className="w-10 h-10 rounded-full bg-[#5d7c6f] flex items-center justify-center text-white">
          <GraduationCap size={20} />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-bold text-sm text-black">KKS Camp</span>
          <span className="text-xs text-gray-700 font-medium">ค่ายของฉัน</span>
        </div>
      </NavbarBrand>

      {/* RIGHT */}
      <NavbarContent className="gap-3" justify="end">
        <NavbarItem>
          {mounted ? (
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <div
                  suppressHydrationWarning
                  className="flex items-center gap-2 cursor-pointer"
                >
                  {student && (
                    <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#e8f0ee] text-[#3d6357] border border-[#b8d0c8]">
                      นักเรียน
                    </span>
                  )}
                  <Avatar
                    as="button"
                    className="bg-[#5d7c6f] text-white transition-transform"
                    name={initials}
                    size="sm"
                  />
                </div>
              </DropdownTrigger>

              <DropdownMenu aria-label="Profile Actions" variant="flat">
                <DropdownItem key="profile" className="h-14 gap-2">
                  <div>
                    <p className="font-semibold">{displayName}</p>
                    <p className="text-xs text-gray-500">{displayEmail}</p>
                  </div>
                </DropdownItem>

                <DropdownItem
                  key="settings"
                  startContent={
                    navigating ? (
                      <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Settings size={16} />
                    )
                  }
                  onClick={() => {
                    if (navigating) return;
                    setNavigating(true);
                    router.push("/student/profile");
                  }}
                >
                  ตั้งค่าโปรไฟล์
                </DropdownItem>

                <DropdownItem
                  key="logout"
                  color="danger"
                  startContent={<LogOut size={16} />}
                  onClick={handleLogout}
                >
                  ออกจากระบบ
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          ) : (
            <div className="flex items-center gap-2">
              <Avatar className="bg-gray-200" size="sm" />
            </div>
          )}
        </NavbarItem>
      </NavbarContent>
      {/* Loading Overlay for Logout */}
      {isLoggingOut && (
        <div className="fixed inset-0 z-[9999] bg-white/50 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="w-10 h-10 border-4 border-[#5d7c6f] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#5d7c6f] font-medium text-sm">
              กำลังออกจากระบบ...
            </p>
          </div>
        </div>
      )}
    </Navbar>
  );
}
