import { SignedIn, SignedOut, SignIn, UserButton } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";

import { prisma } from "@/lib/db";
import AutoLogout from "@/components/AutoLogout";

// export default function LoginPage() {
//   return <Login />;
// }

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
      // เช็ค Role ว่าเป็น Admin หรือ ครูทั่วไป
      if (teacher.role === "ADMIN") {
        redirect("/admin_add_user");
      } else {
        redirect("/headteacher/dashboard");
      }
    }

    const student = await prisma.students.findFirst({
      where: { email: email },
    });

    if (student) {
      redirect("/student/dashboard");
    }

    return <AutoLogout email={email} />;
  }

  return (
    <main className="">
      <SignedOut>
        <div className="flex min-h-screen items-center justify-center">
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
                // logoBox: {
                //   padding: '20px',
                // }
              },
            }}
            routing="hash"
          />
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
