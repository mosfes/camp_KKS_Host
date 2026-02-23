import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isAdminRoute = createRouteMatcher(["/admin_add_user(.*)"]);
const isTeacherRoute = createRouteMatcher(["/headteacher(.*)"]);
const isStudentRoute = createRouteMatcher(["/student(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const authObject = await auth();

  if (
    !authObject.userId &&
    (isAdminRoute(req) || isTeacherRoute(req) || isStudentRoute(req))
  ) {
    await auth.protect();
  }

  if (authObject.userId) {
    let role: string | undefined = undefined;

    const teacherCookie = req.cookies.get("teacher_session")?.value;
    const studentCookie = req.cookies.get("student_session")?.value;

    if (teacherCookie) {
      try {
        const parsed = JSON.parse(teacherCookie);
        role = parsed.role?.toLowerCase() || "teacher";
      } catch (e) {
        console.error("Failed to parse teacher_session cookie", e);
      }
    } else if (studentCookie) {
      role = "student";
    }

    if (!role) {
      role = ((authObject.sessionClaims?.metadata as any)?.role as string | undefined)?.toLowerCase();
    }

    if (isAdminRoute(req) && role !== "admin") {
      if (role === "teacher") {
        return NextResponse.redirect(new URL("/headteacher/dashboard", req.url));
      } else {
        return NextResponse.redirect(new URL("/student/dashboard", req.url));
      }
    }

    if (isTeacherRoute(req) && role !== "admin" && role !== "teacher") {
      return NextResponse.redirect(new URL("/student/dashboard", req.url));
    }
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
