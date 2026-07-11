import {
  SignedIn,
  SignedOut,
  SignIn,
  UserButton,
  ClerkLoading,
  ClerkLoaded,
} from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import AutoLogout from "@/components/AutoLogout";
import LoadingSpinner from "@/components/LoadingSpinner";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    const user = await currentUser();
    const email = user?.emailAddresses[0]?.emailAddress;

    if (!email) {
      return <div>ไม่พบข้อมูลอีเมลในระบบ</div>;
    }

    const teacher = await prisma.teachers.findFirst({
      where: { email: email },
    });

    if (teacher) {
      if (teacher.role === "ADMIN") {
        redirect("/api/auth/sync-session?to=/headteacher/dashboard");
      } else {
        redirect("/api/auth/sync-session?to=/headteacher/dashboard");
      }
    }

    const student = await prisma.students.findFirst({
      where: { email: email },
    });

    if (student) {
      redirect("/api/auth/sync-session?to=/student/dashboard");
    }

    return <AutoLogout email={email} />;
  }

  return (
    <main className="">
      <SignedOut>
        <div className="flex min-h-screen items-center justify-center bg-[#f5f0e7]">
          <div className="flex flex-col items-center gap-4">
            <ClerkLoading>
              <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[400px] w-full max-w-[400px]">
                <LoadingSpinner className="mb-4" />
                <p className="text-gray-500 font-medium">
                  กำลังโหลดเข้าสู่ระบบ...
                </p>
              </div>
            </ClerkLoading>
            <ClerkLoaded>
              <SignIn
                appearance={{
                  elements: {
                    logoImage: {
                      width: "100px",
                      height: "auto",
                    },
                    socialButtonsBlockButton: "h-[40px] text-base",
                    formButtonPrimary: "!bg-sage hover:bg-blue-700 ",
                    footerAction: "!hidden",
                    footer: "!hidden",
                  },
                }}
                routing="hash"
              />
            </ClerkLoaded>
            {/* ปุ่มไปหน้าล็อคอินผู้ปกครอง */}
            {/* <Link
              className="w-full max-w-[400px] flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-[#a0b8af] bg-white text-[#5d7c6f] text-sm font-medium shadow-sm hover:bg-[#eaf1ee] hover:border-[#5d7c6f] transition-all"
              href="/login"
            >
              <Users size={18} />
              เข้าสู่ระบบสำหรับผู้ปกครอง
            </Link> */}
          </div>
        </div>
      </SignedOut>

      <SignedIn>
        <div className="p-5">
          <h1>ยินดีต้อนรับเข้าสู่ระบบ!</h1>
          <UserButton afterSignOutUrl="/" />
        </div>
      </SignedIn>
    </main>
  );
}
