"use client";

import { useClerk } from "@clerk/nextjs";
import { useEffect, useState } from "react";

export default function AutoLogout({ email }: { email: string }) {
  const { signOut } = useClerk();
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((prev) => prev - 1), 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (countdown === 0) {
      signOut({ redirectUrl: "/" });
    }
  }, [countdown]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #f5f0e7 0%, #e8f0ec 100%)",
        fontFamily: "'Sarabun', 'Inter', sans-serif",
        padding: "24px",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "24px",
          padding: "48px 40px",
          maxWidth: "460px",
          width: "100%",
          boxShadow:
            "0 20px 60px rgba(93,124,111,0.15), 0 4px 16px rgba(0,0,0,0.06)",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative top bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, #5d7c6f, #8fad9f, #5d7c6f)",
          }}
        />

        {/* Countdown icon */}
        <div
          style={{
            width: "88px",
            height: "88px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #eaf1ee, #dae7e1)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            boxShadow: "0 4px 20px rgba(93,124,111,0.25)",
            border: "3px solid #b7cec5",
          }}
        >
          <span
            style={{
              fontSize: "32px",
              fontWeight: "800",
              color: "#3d5a50",
              lineHeight: 1,
            }}
          >
            {countdown}
          </span>
          <span
            style={{
              fontSize: "10px",
              color: "#5d7c6f",
              fontWeight: "600",
              marginTop: "2px",
            }}
          >
            วินาที
          </span>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: "22px",
            fontWeight: "700",
            color: "#2d3a35",
            margin: "0 0 8px",
            letterSpacing: "-0.3px",
          }}
        >
          ไม่พบบัญชีในระบบ
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "15px",
            color: "#6b7f76",
            margin: "0 0 24px",
            lineHeight: 1.6,
          }}
        >
          อีเมลนี้ยังไม่ได้ลงทะเบียนในระบบ
        </p>

        {/* Email badge */}
        <div
          style={{
            background: "#f5f8f6",
            border: "1px solid #d4e3dc",
            borderRadius: "12px",
            padding: "12px 20px",
            marginBottom: "28px",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            maxWidth: "100%",
          }}
        >
          <span style={{ fontSize: "16px" }}>📧</span>
          <span
            style={{
              fontSize: "14px",
              color: "#3d5a50",
              fontWeight: "500",
              wordBreak: "break-all",
            }}
          >
            {email}
          </span>
        </div>

        {/* Logout hint */}
        <p style={{ fontSize: "13px", color: "#9ab0a6", marginBottom: "24px" }}>
          ระบบจะออกจากระบบอัตโนมัติเมื่อนับถอยหลังครบ
        </p>

        {/* Manual sign-out button */}
        <button
          style={{
            width: "100%",
            padding: "13px",
            background: "linear-gradient(135deg, #5d7c6f, #4a6b5e)",
            color: "white",
            border: "none",
            borderRadius: "12px",
            fontSize: "15px",
            fontWeight: "600",
            cursor: "pointer",
            transition: "transform 0.15s, box-shadow 0.15s",
            boxShadow: "0 4px 14px rgba(93,124,111,0.35)",
            letterSpacing: "0.2px",
          }}
          onClick={() => signOut({ redirectUrl: "/" })}
          onMouseEnter={(e) => {
            (e.target as HTMLButtonElement).style.transform =
              "translateY(-1px)";
            (e.target as HTMLButtonElement).style.boxShadow =
              "0 6px 20px rgba(93,124,111,0.45)";
          }}
          onMouseLeave={(e) => {
            (e.target as HTMLButtonElement).style.transform = "translateY(0)";
            (e.target as HTMLButtonElement).style.boxShadow =
              "0 4px 14px rgba(93,124,111,0.35)";
          }}
        >
          ออกจากระบบทันที
        </button>
      </div>
    </div>
  );
}
