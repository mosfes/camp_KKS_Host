"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle, CheckCircle2, Phone, Pencil, Save, X,
  User, ChevronLeft, Mail,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
const displayVal = (v) => (v && v.trim() ? v : "ไม่ระบุ");

const roleLabel = (role) => {
  if (role === "ADMIN") return "ผู้ดูแลระบบ";
  if (role === "CAMP_LEADER") return "หัวหน้าค่าย";
  return "ครูประจำชั้น";
};

const roleBadgeClass = (role) =>
  role === "ADMIN"
    ? "bg-[#f7f2fa] text-[#8e6ba8] border border-[#e9dff2]"
    : "bg-[#eff2f0] text-[#5d7c6f] border border-[#dbe6e1]";

function InfoRow({ label, value }) {
  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-800">{value}</p>
    </div>
  );
}

function FieldInput({ label, value, onChange, placeholder, error, icon }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1">{label}</label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">{icon}</span>
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full ${icon ? "pl-9" : "pl-3"} pr-3 py-2.5 rounded-xl border text-sm text-gray-700 outline-none transition-all
            ${error
              ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200"
              : "border-gray-200 bg-gray-50 focus:border-[#5d7c6f] focus:ring-2 focus:ring-[#5d7c6f]/20"
            }`}
        />
      </div>
      {error && (
        <p className="text-red-500 text-[10px] mt-1 flex items-center gap-1">
          <AlertCircle size={10} /> {error}
        </p>
      )}
    </div>
  );
}

function SectionCard({ icon, title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-full bg-[#5d7c6f]/10 flex items-center justify-center text-[#5d7c6f]">
          {icon}
        </div>
        <h3 className="font-semibold text-gray-800">{title}</h3>
      </div>
      {children}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState("");
  const [fieldError, setFieldError] = useState({});

  const [form, setForm] = useState({
    prefix_name: "",
    firstname: "",
    lastname: "",
    tel: "",
  });

  useEffect(() => {
    fetch("/api/teacher/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setProfile(data);
          setForm({
            prefix_name: data.prefix_name ?? "",
            firstname: data.firstname,
            lastname: data.lastname,
            tel: data.tel ?? "",
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const validate = () => {
    const errors = {};
    if (!form.firstname.trim()) errors.firstname = "กรุณากรอกชื่อ";
    if (!form.lastname.trim()) errors.lastname = "กรุณากรอกนามสกุล";
    if (form.tel.trim() && form.tel.replace(/\D/g, "").length !== 10)
      errors.tel = "เบอร์โทรต้องเป็น 10 หลัก";
    return errors;
  };

  const handleSave = async () => {
    setApiError("");
    const errors = validate();
    setFieldError(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      const res = await fetch("/api/teacher/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setApiError(data.error ?? "เกิดข้อผิดพลาด"); return; }

      setSuccess(true);
      const refreshed = await fetch("/api/teacher/profile").then((r) => r.ok ? r.json() : null);
      if (refreshed) setProfile(refreshed);
      setTimeout(() => { setSuccess(false); setEditing(false); }, 1500);
    } catch {
      setApiError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (!profile) return;
    setForm({
      prefix_name: profile.prefix_name ?? "",
      firstname: profile.firstname,
      lastname: profile.lastname,
      tel: profile.tel ?? "",
    });
    setFieldError({});
    setApiError("");
    setEditing(false);
  };

  if (loading) return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#5d7c6f] border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 text-sm">กำลังโหลดข้อมูล...</p>
      </div>
    </div>
  );

  if (!profile) return (
    <div className="min-h-[80vh] flex items-center justify-center">
      <p className="text-gray-400">ไม่พบข้อมูลโปรไฟล์</p>
    </div>
  );

  const displayName = `${profile.prefix_name ?? ""}${profile.firstname} ${profile.lastname}`;
  const initials = `${profile.firstname[0]}${profile.lastname[0]}`;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/admin_add_user")}
          className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="font-bold text-gray-800 text-lg">โปรไฟล์ของฉัน</h1>
          <p className="text-xs text-gray-400">จัดการข้อมูลส่วนตัว</p>
        </div>
      </div>

      {/* ── Avatar Card ── */}
      <div className="bg-[#5d7c6f] rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold select-none">
            {initials}
          </div>
          <div>
            <p className="font-bold text-lg">{displayName}</p>
            <p className="text-sm opacity-80">{profile.email}</p>
            <div className="mt-1.5">
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium opacity-90 ${roleBadgeClass(profile.role)}`}>
                {roleLabel(profile.role)}
              </span>
            </div>
          </div>
        </div>
        <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/5" />
        <div className="absolute -right-2 -bottom-10 w-24 h-24 rounded-full bg-white/5" />
      </div>

      {/* ── Banners ── */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 flex items-center gap-3 text-green-700">
          <CheckCircle2 size={18} />
          <span className="text-sm font-medium">บันทึกข้อมูลสำเร็จแล้ว!</span>
        </div>
      )}
      {apiError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-center gap-3 text-red-600">
          <AlertCircle size={18} />
          <span className="text-sm">{apiError}</span>
        </div>
      )}

      {/* ── Personal Info ── */}
      <SectionCard icon={<User size={16} />} title="ข้อมูลส่วนตัว">
        {editing ? (
          <div className="space-y-3">
            <FieldInput
              label="คำนำหน้า"
              value={form.prefix_name}
              onChange={(v) => setForm((f) => ({ ...f, prefix_name: v }))}
              placeholder="เช่น นาย, นาง, นางสาว, ครู"
            />
            <FieldInput
              label="ชื่อ *"
              value={form.firstname}
              onChange={(v) => setForm((f) => ({ ...f, firstname: v }))}
              placeholder="ชื่อจริง"
              error={fieldError.firstname}
            />
            <FieldInput
              label="นามสกุล *"
              value={form.lastname}
              onChange={(v) => setForm((f) => ({ ...f, lastname: v }))}
              placeholder="นามสกุล"
              error={fieldError.lastname}
            />
          </div>
        ) : (
          <>
            <InfoRow label="คำนำหน้า" value={displayVal(profile.prefix_name)} />
            <InfoRow label="ชื่อ" value={profile.firstname} />
            <InfoRow label="นามสกุล" value={profile.lastname} />
          </>
        )}
      </SectionCard>

      {/* ── Contact Info ── */}
      <SectionCard icon={<Phone size={16} />} title="ข้อมูลติดต่อ">
        {editing ? (
          <FieldInput
            label="เบอร์โทรศัพท์"
            value={form.tel}
            onChange={(v) => setForm((f) => ({ ...f, tel: v }))}
            placeholder="0xxxxxxxxx"
            error={fieldError.tel}
            icon={<Phone size={14} />}
          />
        ) : (
          <InfoRow label="เบอร์โทรศัพท์" value={displayVal(profile.tel)} />
        )}
      </SectionCard>

      {/* ── Account Info (read-only) ── */}
      <SectionCard icon={<Mail size={16} />} title="ข้อมูลบัญชี">
        <InfoRow label="อีเมล" value={profile.email} />
        <div className="py-3 border-b border-gray-100">
          <p className="text-xs text-gray-400 mb-1">สิทธิ์การใช้งาน</p>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${roleBadgeClass(profile.role)}`}>
            {roleLabel(profile.role)}
          </span>
        </div>
        <div className="py-3">
          <p className="text-xs text-gray-400 mb-0.5">รหัสครู</p>
          <p className="text-sm font-medium text-gray-800">{profile.teachers_id}</p>
        </div>
      </SectionCard>

      {/* ── Action Buttons ── */}
      <div className="pb-6 max-w-2xl mx-auto w-full">
        {editing ? (
          <div className="flex gap-3">
            <button
              onClick={handleCancelEdit}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-gray-200 bg-white text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <X size={16} /> ยกเลิก
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#5d7c6f] text-white font-semibold text-sm hover:bg-[#4a6659] transition-colors disabled:opacity-60 shadow-md"
            >
              {saving ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> กำลังบันทึก...</>
              ) : (
                <><Save size={16} /> บันทึกข้อมูล</>
              )}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#5d7c6f] text-white font-semibold text-sm hover:bg-[#4a6659] transition-colors shadow-md"
          >
            <Pencil size={16} /> แก้ไขข้อมูล
          </button>
        )}
      </div>
    </div>
  );
}
