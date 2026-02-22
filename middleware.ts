import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// const isAdminRoute = createRouteMatcher(["/admin_add_user(.*)"]);
// const isHeadteacherRoute = createRouteMatcher(["/headteacher(.*)"]);
// const isStudentRoute = createRouteMatcher(["/student(.*)"]);

const isProtectedRoute = createRouteMatcher([
  "/student(.*)",
  "/headteacher(.*)",
  "/admin_add_user(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

// export default clerkMiddleware(async (auth, req) => {
//   const authObject = await auth();

//   // 1. ถ้ายังไม่ได้ล็อกอิน  บังคับไปหน้า SignIn
//   if (
//     !authObject.userId &&
//     (isAdminRoute(req) || isHeadteacherRoute(req) || isStudentRoute(req))
//   ) {
//     await authObject.protect();
//   }

//   // 2. ถ้าล็อกอินแล้ว ให้ตรวจสอบสิทธิ์
//   if (authObject.userId) {
//     const role = authObject.sessionClaims?.metadata?.role;

//     if (isAdminRoute(req) && role !== "admin") {
//       return NextResponse.redirect(new URL("/headteacher/dashboard", req.url)); 
//     }

//     if (isHeadteacherRoute(req) && role !== "admin" && role !== "headteacher") {
//       return NextResponse.redirect(new URL("/student/dashboard", req.url));
//     }
//   }
// });

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
