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
import { SignOutButton } from "@clerk/nextjs";

export function HeadteacherNavbar() {
  const router = useRouter();

  // mock data (แทน DB / API)
  const studentData = {
    name: "Somchai",
    email: "somchai@student.com",
    avatarUrl: null,
  };

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
                className="bg-[#5d7c6f] text-white transition-transform"
                name={studentData.name}
                size="sm"
                src={studentData.avatarUrl || undefined}
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
              >
                <SignOutButton> ออกจากระบบ</SignOutButton>
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </NavbarItem>
      </NavbarContent>
    </Navbar>
  );
}
