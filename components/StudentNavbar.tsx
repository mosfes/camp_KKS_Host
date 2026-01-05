
"use client"; 
import {
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from "@heroui/navbar";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { GraduationCap, Home, LogOut, Settings } from "lucide-react";
import { useRouter } from "next/navigation";

export function AppNavbar() {
  const router = useRouter();

  // mock data (แทน DB / API)
  const studentData = {
    name: "Somchai",
    email: "somchai@student.com",
    avatarUrl: null,
  };

  return (
    <Navbar
      maxWidth="full"
      height="64px"
      className="bg-white border-b border-gray-200"
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
      <NavbarContent justify="end" className="gap-3">

        {/* 
        <NavbarItem>
          <Button isIconOnly variant="light" aria-label="Home">
            <Home size={18} />
          </Button>
        </NavbarItem>
        */}

        {/* PROFILE DROPDOWN */}
        <NavbarItem>
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Avatar
                as="button"
                src={studentData.avatarUrl || undefined}
                name={studentData.name}
                size="sm"
                className="bg-[#5d7c6f] text-white transition-transform"
              />
            </DropdownTrigger>

            <DropdownMenu aria-label="Profile Actions" variant="flat">
              <DropdownItem key="profile" className="h-14 gap-2">
                <div>
                  <p className="font-semibold">{studentData.name}</p>
                  <p className="text-xs text-gray-500">{studentData.email}</p>
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
                onClick={() => {
                  // authService.logout();
                  router.push("/login");
                }}
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