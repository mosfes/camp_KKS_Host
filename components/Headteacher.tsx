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

export function HeadteacherNavbar() {
  const router = useRouter();
  const { signOut } = useClerk();

  const [teacher, setTeacher] = useState<{
    firstname: string;
    lastname: string;
    email: string;
    role: string;
    roles?: string[];
  } | null>(null);

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
          <span className="font-semibold text-sm">EduCamp</span>
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
                    className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#e8f0ee] text-[#3d6357] border border-[#b8d0c8]"
                  >
                    {r === "HEADTEACHER" ? "หัวหน้าค่าย" : r === "TEACHER" ? "ครู" : r === "ADMIN" ? "ผู้ดูแลระบบ" : r}
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
                  <DropdownItem
                    key="admin_dashboard"
                    startContent={<Settings size={16} />}
                    onClick={() => router.push("/admin_add_user")}
                  >
                    หน้าหลักผู้ดูแลระบบ
                  </DropdownItem>
                  <DropdownItem
                    key="headteacher_dashboard"
                    startContent={<GraduationCap size={16} />}
                    onClick={() => router.push("/headteacher/dashboard")}
                  >
                    เข้าสู่โหมดหัวหน้าค่าย
                  </DropdownItem>
                </>
              ) : (
                <DropdownItem
                  key="settings"
                  startContent={<Settings size={16} />}
                  onClick={() => router.push("/headteacher/dashboard")}
                >
                  หน้าหลัก
                </DropdownItem>
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
  );
}
