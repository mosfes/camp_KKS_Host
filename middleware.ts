import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isAdminRoute = createRouteMatcher(["/admin_add_user(.*)"]);
const isTeacherRoute = createRouteMatcher(["/headteacher(.*)"]);
const isStudentRoute = createRouteMatcher(["/student(.*)"]);

const isProtectedApiRoute = createRouteMatcher([
  "/api/teachers(.*)",
  "/api/students(.*)",
  "/api/surveys(.*)",
  "/api/upload(.*)",
  "/api/classrooms(.*)",
  "/api/vulgar-words(.*)",
  "/api/camps(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const authObject = await auth();

  if (
    !authObject.userId &&
    (isAdminRoute(req) || isTeacherRoute(req) || isStudentRoute(req))
  ) {
    await auth.protect();
  }

  let role: string | undefined = undefined;

  const teacherCookie = req.cookies.get("teacher_session")?.value;
  const studentCookie = req.cookies.get("student_session")?.value;
  const parentCookie = req.cookies.get("parent_session")?.value;

  if (teacherCookie) {
    try {
      const { jwtVerify } = await import("jose");
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload } = await jwtVerify(teacherCookie, secret);

      role = (payload.role as string)?.toLowerCase() || "teacher";
    } catch (e) {
      console.error("Failed to verify teacher_session cookie", e);
    }
  } else if (studentCookie) {
    try {
      const { jwtVerify } = await import("jose");
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);

      await jwtVerify(studentCookie, secret);
      role = "student";
    } catch (e) {
      console.error("Failed to verify student_session cookie", e);
    }
  } else if (parentCookie) {
    try {
      const { jwtVerify } = await import("jose");
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);

      await jwtVerify(parentCookie, secret);
      role = "parent";
    } catch (e) {
      console.error("Failed to verify parent_session cookie", e);
    }
  }

  if (!role && authObject.userId) {
    role = (
      (authObject.sessionClaims?.metadata as any)?.role as string | undefined
    )?.toLowerCase();
  }

  // Helper: ตรวจสอบว่า role นี้เป็น "ครู" หรือไม่ (รองรับทุก role ของครู)
  const isTeacherRole = (r: string | undefined) =>
    r === "admin" ||
    r === "teacher" ||
    r === "camp_leader" ||
    r === "head_teacher" ||
    r === "headteacher";

  // API Route Protection — อนุญาตเฉพาะ role ที่เป็นครู
  if (isProtectedApiRoute(req)) {
    if (!isTeacherRole(role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  if (authObject.userId) {
    if (isAdminRoute(req) && role !== "admin") {
      if (isTeacherRole(role)) {
        return NextResponse.redirect(
          new URL("/headteacher/dashboard", req.url),
        );
      } else {
        return NextResponse.redirect(new URL("/student/dashboard", req.url));
      }
    }

    // อนุญาตทุก role ของครูให้เข้า /headteacher ได้
    if (isTeacherRoute(req) && !isTeacherRole(role)) {
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
