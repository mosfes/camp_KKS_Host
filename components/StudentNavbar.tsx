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

  const [student, setStudent] = useState<{
    students_id: number;
    firstname: string;
    lastname: string;
    email: string;
  } | null>(null);

  // ดึงข้อมูลนักเรียนจาก session cookie
  useEffect(() => {
    fetch("/api/auth/student/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (data) setStudent(data); })
      .catch(() => { });
  }, []);

  const handleLogout = async () => {
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
          <span className="font-semibold text-sm">EduCamp</span>
          <span className="text-xs text-gray-500">My Camps</span>
        </div>
      </NavbarBrand>

      {/* RIGHT */}
      <NavbarContent className="gap-3" justify="end">
        <NavbarItem>
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Avatar
                as="button"
                className="bg-[#5d7c6f] text-white transition-transform"
                name={initials}
                size="sm"
              />
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
                startContent={<Settings size={16} />}
                onClick={() => router.push("/student/profile")}
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
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
