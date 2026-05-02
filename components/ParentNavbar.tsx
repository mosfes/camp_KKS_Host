"use client";
import { Navbar, NavbarBrand, NavbarContent, NavbarItem } from "@heroui/navbar";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Avatar } from "@heroui/avatar";
import { Users, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ParentStudent {
  students_id: number;
  prefix_name: string | null;
  firstname: string;
  lastname: string;
}

export function ParentNavbar() {
  const router = useRouter();
  const [student, setStudent] = useState<ParentStudent | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    fetch("/api/auth/parent/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.student) setStudent(data.student);
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await fetch("/api/auth/parent/logout", { method: "POST" });
    router.push("/");
  };

  const displayName = student
    ? `${student.prefix_name ?? ""}${student.firstname} ${student.lastname}`
    : "...";
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
          <Users size={20} />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="font-semibold text-sm">KKS Camp</span>
          <span className="text-xs text-gray-500">ระบบผู้ปกครอง</span>
        </div>
      </NavbarBrand>

      {/* RIGHT */}
      <NavbarContent className="gap-3" justify="end">
        <NavbarItem>
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <div className="flex items-center gap-2 cursor-pointer">
                {student && (
                  <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#e8f0ee] text-[#3d6357] border border-[#b8d0c8]">
                    ผู้ปกครอง
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

            <DropdownMenu aria-label="Parent Actions" variant="flat">
              <DropdownItem key="profile" className="h-14 gap-2">
                <div>
                  <p className="font-semibold">{displayName}</p>
                  <p className="text-xs text-gray-500">
                    รหัสนักเรียน: {student?.students_id ?? "-"}
                  </p>
                </div>
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
