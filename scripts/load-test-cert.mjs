/**
 * load-test-cert.mjs
 * ทดสอบ concurrent certificate download
 * 
 * วิธีใช้:
 *   node scripts/load-test-cert.mjs [concurrency] [campId]
 * 
 * ตัวอย่าง:
 *   node scripts/load-test-cert.mjs 10 60001
 */

import { SignJWT } from "jose";
import { PrismaClient } from "@prisma/client";

// ===== CONFIG =====
const BASE_URL = "http://localhost:3000";
const JWT_SECRET = "8f4a2b9d6c1e3f7a5d0b2c8e4f1a9d3b6c7e2f5a8d0b1c4e9f3a6d2b5c7e1f4";
const CONCURRENCY = parseInt(process.argv[2] ?? "10"); // จำนวน concurrent requests
const CAMP_ID = parseInt(process.argv[3] ?? "60001");
const FORMAT = "pdf"; // pdf หรือ png

// ===== SETUP =====
const prisma = new PrismaClient();
const secret = new TextEncoder().encode(JWT_SECRET);

// สร้าง JWT token สำหรับนักเรียน
async function makeToken(student) {
  return await new SignJWT({
    students_id: student.students_id,
    firstname: student.firstname,
    lastname: student.lastname,
    email: student.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1h")
    .sign(secret);
}

// เรียก API 1 ครั้ง
async function downloadCert(student, token, index) {
  const start = Date.now();
  try {
    const res = await fetch(
      `${BASE_URL}/api/camps/${CAMP_ID}/certificate?format=${FORMAT}&download=true`,
      {
        headers: {
          Cookie: `student_session=${token}`,
        },
      }
    );
    const elapsed = Date.now() - start;

    if (res.ok) {
      const certNo = res.headers.get("X-Certificate-No") ?? "N/A";
      const overflow = res.headers.get("X-Certificate-Overflow");
      const size = parseInt(res.headers.get("content-length") ?? "0");
      // drain body
      await res.arrayBuffer();
      return {
        success: true,
        student_id: student.students_id,
        name: `${student.firstname} ${student.lastname}`,
        cert_no: certNo,
        overflow: overflow ? `+${overflow}` : null,
        elapsed_ms: elapsed,
        size_kb: Math.round(size / 1024),
        index,
      };
    } else {
      const body = await res.json().catch(() => ({}));
      return {
        success: false,
        student_id: student.students_id,
        name: `${student.firstname} ${student.lastname}`,
        status: res.status,
        error: body.error ?? res.statusText,
        elapsed_ms: elapsed,
        index,
      };
    }
  } catch (err) {
    return {
      success: false,
      student_id: student.students_id,
      name: `${student.firstname} ${student.lastname}`,
      error: err.message,
      elapsed_ms: Date.now() - start,
      index,
    };
  }
}

// ===== MAIN =====
async function main() {
  console.log("=".repeat(60));
  console.log(`🎓 Certificate Load Test`);
  console.log(`   Camp ID    : ${CAMP_ID}`);
  console.log(`   Concurrency: ${CONCURRENCY} requests`);
  console.log(`   Format     : ${FORMAT}`);
  console.log(`   Server     : ${BASE_URL}`);
  console.log("=".repeat(60));

  // ตรวจสอบ camp
  const camp = await prisma.camp.findUnique({
    where: { camp_id: CAMP_ID },
    select: {
      name: true,
      img_certificate_url: true,
      cert_show_number: true,
      cert_number_start: true,
      cert_number_end: true,
    },
  });
  if (!camp) {
    console.error(`❌ ไม่พบ camp_id = ${CAMP_ID}`);
    process.exit(1);
  }
  if (!camp.img_certificate_url) {
    console.error(`❌ ค่าย "${camp.name}" ไม่มี template เกียรติบัตร`);
    process.exit(1);
  }
  console.log(`\n📋 ค่าย: "${camp.name}"`);
  console.log(
    `   cert_show_number: ${camp.cert_show_number}, start: ${camp.cert_number_start}`
  );

  // ดึงนักเรียนที่ลงทะเบียนในค่ายนี้
  const enrollments = await prisma.student_enrollment.findMany({
    where: { camp_camp_id: CAMP_ID },
    include: {
      student: { select: { students_id: true, firstname: true, lastname: true, email: true } },
      certificate: { select: { certificate_no: true } },
    },
  });

  if (enrollments.length === 0) {
    console.error(`❌ ไม่มีนักเรียนในค่ายนี้`);
    process.exit(1);
  }

  // ลบ cert เดิมออกก่อนเพื่อทดสอบ race condition
  const hasCerts = enrollments.filter((e) => e.certificate.length > 0);
  if (hasCerts.length > 0) {
    console.log(`\n🗑️  ลบ cert เก่า ${hasCerts.length} รายการก่อนทดสอบ...`);
    await prisma.certificate.deleteMany({
      where: {
        student_enrollment: { camp_camp_id: CAMP_ID },
      },
    });
    console.log(`   ✅ ลบสำเร็จ`);
  }

  // ถ้านักเรียนน้อยกว่า CONCURRENCY ให้วนซ้ำ
  const students = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    students.push(enrollments[i % enrollments.length].student);
  }
  console.log(
    `\n👥 นักเรียนที่จะทดสอบ: ${enrollments.length} คน (วนซ้ำเพื่อให้ครบ ${CONCURRENCY} requests)`
  );

  // สร้าง tokens
  console.log(`\n🔑 สร้าง JWT tokens...`);
  const tokens = await Promise.all(students.map((s) => makeToken(s)));

  // ยิง concurrent requests
  console.log(
    `\n🚀 ยิง ${CONCURRENCY} requests พร้อมกัน...\n`
  );
  const overallStart = Date.now();
  const results = await Promise.all(
    students.map((student, i) => downloadCert(student, tokens[i], i + 1))
  );
  const overallElapsed = Date.now() - overallStart;

  // แสดงผล
  console.log("─".repeat(60));
  console.log(`📊 ผลลัพธ์:`);
  console.log("─".repeat(60));

  const successes = results.filter((r) => r.success);
  const failures = results.filter((r) => !r.success);
  const certNos = successes.map((r) => r.cert_no).filter((n) => n !== "N/A");
  const uniqueCertNos = new Set(certNos);
  const elapsedTimes = successes.map((r) => r.elapsed_ms);
  const avgMs = elapsedTimes.length
    ? Math.round(elapsedTimes.reduce((a, b) => a + b, 0) / elapsedTimes.length)
    : 0;
  const maxMs = elapsedTimes.length ? Math.max(...elapsedTimes) : 0;
  const minMs = elapsedTimes.length ? Math.min(...elapsedTimes) : 0;

  // แสดงผลแต่ละ request
  for (const r of results.sort((a, b) => a.index - b.index)) {
    if (r.success) {
      const overflow = r.overflow ? ` ⚠️  OVERFLOW ${r.overflow}` : "";
      console.log(
        `  [${String(r.index).padStart(2)}] ✅ ${r.name.padEnd(25)} cert#${r.cert_no}  ${r.elapsed_ms}ms  ${r.size_kb}KB${overflow}`
      );
    } else {
      console.log(
        `  [${String(r.index).padStart(2)}] ❌ ${r.name.padEnd(25)} HTTP ${r.status ?? "ERR"}: ${r.error}  ${r.elapsed_ms}ms`
      );
    }
  }

  console.log("─".repeat(60));
  console.log(`\n📈 สรุป:`);
  console.log(`   สำเร็จ     : ${successes.length}/${results.length}`);
  console.log(`   ล้มเหลว    : ${failures.length}/${results.length}`);
  console.log(`   เวลารวม    : ${overallElapsed}ms`);
  console.log(`   เวลาเฉลี่ย : ${avgMs}ms / request`);
  console.log(`   เร็วสุด    : ${minMs}ms`);
  console.log(`   ช้าสุด     : ${maxMs}ms`);

  if (camp.cert_show_number) {
    console.log(`\n🔢 ตรวจสอบเลขที่เกียรติบัตร:`);
    console.log(
      `   cert_no ที่ออก: [${[...uniqueCertNos].sort().join(", ")}]`
    );
    if (certNos.length !== uniqueCertNos.size) {
      console.log(
        `   🔴 พบเลขซ้ำ! ${certNos.length} ใบ แต่มีเลขไม่ซ้ำกันแค่ ${uniqueCertNos.size} เลข`
      );
    } else if (certNos.length > 0) {
      console.log(
        `   🟢 ไม่มีเลขซ้ำ! ทุกใบได้เลขต่างกัน (${uniqueCertNos.size} เลข)`
      );
    }
  }

  // ตรวจสอบ DB จริง
  console.log(`\n🗄️  ตรวจสอบใน DB:`);
  const certsInDb = await prisma.certificate.findMany({
    where: { student_enrollment: { camp_camp_id: CAMP_ID } },
    select: {
      certificate_no: true,
      student_enrollment: {
        select: {
          student: { select: { firstname: true } },
        },
      },
    },
    orderBy: { certificate_no: "asc" },
  });

  const dbNos = certsInDb.map((c) => c.certificate_no);
  const uniqueDbNos = new Set(dbNos);
  console.log(`   จำนวน records ใน DB: ${certsInDb.length}`);
  console.log(`   เลขที่ไม่ซ้ำใน DB  : ${uniqueDbNos.size}`);

  if (dbNos.length !== uniqueDbNos.size) {
    console.log(`   🔴 มีเลข DUPLICATE ใน DB!`);
    const seen = new Set();
    for (const no of dbNos) {
      if (seen.has(no)) {
        console.log(`      ซ้ำ: cert_no = ${no}`);
      }
      seen.add(no);
    }
  } else {
    console.log(`   🟢 ไม่มีเลข DUPLICATE ใน DB เลย`);
  }

  await prisma.$disconnect();
  console.log("\n" + "=".repeat(60));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
