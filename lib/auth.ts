// @ts-nocheck
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

/**
 * อ่าน teacher session จาก HttpOnly cookie
 * @returns {{ teachers_id, firstname, lastname, email, role } | null}
 */
export async function getTeacherFromRequest() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("teacher_session");

    if (!session?.value) return null;

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(session.value, secret);

    return payload;
  } catch {
    return null;
  }
}

/**
 * Helper: ตอบ 401 ถ้าไม่มี teacher session
 */
export async function requireTeacher() {
  const teacher = await getTeacherFromRequest();

  if (!teacher)
    return {
      teacher: null,
      error: Response.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 }),
    };

  return { teacher, error: null };
}

/**
 * อ่าน student session จาก HttpOnly cookie
 * @returns {{ students_id, firstname, lastname, email } | null}
 */
export async function getStudentFromRequest() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get("student_session");

    if (!session?.value) return null;

    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(session.value, secret);

    return payload;
  } catch {
    return null;
  }
}

/**
 * Helper: ตอบ 401 ถ้าไม่มี student session
 */
export async function requireStudent() {
  const student = await getStudentFromRequest();

  if (!student)
    return {
      student: null,
      error: Response.json({ error: "กรุณาเข้าสู่ระบบก่อน" }, { status: 401 }),
    };

  return { student, error: null };
}
