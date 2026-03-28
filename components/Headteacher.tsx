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
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useClerk } from "@clerk/nextjs";

export function HeadteacherNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const { signOut } = useClerk();

  const [teacher, setTeacher] = useState<{
    firstname: string;
    lastname: string;
    email: string;
    role: string;
    roles?: string[];
  } | null>(null);

  const [isNavigating, setIsNavigating] = useState(false);

  // ดึงข้อมูลครูจาก session cookie
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setTeacher(data); })
      .catch(() => { });
  }, []);

  const handleLogout = async () => {
    // clear cookie ของเรา + signOut จาก Clerk พร้อมกัน
    await fetch("/api/auth/logout", { method: "POST" });
    await signOut({ redirectUrl: "/" });
  };

  const displayName = teacher
    ? `${teacher.firstname} ${teacher.lastname}`
    : "...";
  const displayEmail = teacher?.email ?? "";
  const initials = teacher
    ? `${teacher.firstname[0]}${teacher.lastname[0]}`
    : "?";

  return (
    <>
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
            <span className="font-semibold text-sm">KKS Camp</span>
            <span className="text-xs text-gray-500">ระบบจัดการค่าย</span>
          </div>
        </NavbarBrand>

        {/* RIGHT */}
        <NavbarContent className="gap-3" justify="end">
          <NavbarItem>
            <Dropdown placement="bottom-end">
              <DropdownTrigger>
                <div className="flex items-center gap-2 cursor-pointer">
                  {(teacher?.roles ?? (teacher?.role ? [teacher.role] : [])).map((r) => (
                    <span
                      key={r}
                      className={`hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        r === "ADMIN"
                          ? "bg-[#f7f2fa] text-[#8e6ba8] border-[#e9dff2]"
                          : "bg-[#eff2f0] text-[#5d7c6f] border-[#dbe6e1]"
                      }`}
                    >
                      {r === "ADMIN" ? "ผู้ดูแลระบบ" : r === "HEADTEACHER" ? "ครูหัวหน้าค่าย" : r === "TEACHER" ? "ครูประจำชั้น" : r}
                    </span>
                  ))}
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

                {(teacher?.roles?.includes("ADMIN") || teacher?.role === "ADMIN") ? (
                  <>
                    {!pathname.startsWith("/admin_add_user") ? (
                      <DropdownItem
                        key="admin_dashboard"
                        startContent={<Settings size={16} />}
                        onClick={() => {
                          setIsNavigating(true);
                          router.push("/admin_add_user");
                        }}
                      >
                        หน้าหลักผู้ดูแลระบบ
                      </DropdownItem>
                    ) : null}
                    {!pathname.startsWith("/headteacher") ? (
                      <DropdownItem
                        key="headteacher_dashboard"
                        startContent={<GraduationCap size={16} />}
                        onClick={() => {
                          setIsNavigating(true);
                          router.push("/headteacher/dashboard");
                        }}
                      >
                        เข้าสู่โหมดครู
                      </DropdownItem>
                    ) : null}
                  </>
                ) : (
                  !pathname.startsWith("/headteacher") ? (
                    <DropdownItem
                      key="settings"
                      startContent={<Settings size={16} />}
                      onClick={() => {
                        setIsNavigating(true);
                        router.push("/headteacher/dashboard");
                      }}
                    >
                      หน้าหลัก
                    </DropdownItem>
                  ) : null
                )}

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
          </NavbarItem>
        </NavbarContent>
      </Navbar>

      {/* Loading Overlay for Navigation */}
      {isNavigating && (
        <div className="fixed inset-0 z-[9999] bg-white/50 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-3 bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
            <div className="w-10 h-10 border-4 border-[#5d7c6f] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#5d7c6f] font-medium text-sm">กำลังสลับโหมด...</p>
          </div>
        </div>
      )}
    </>
  );
}
