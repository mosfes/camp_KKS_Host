"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  Phone,
  Pencil,
  Save,
  X,
  User,
  Heart,
  CalendarDays,
  MessageSquare,
  ChevronLeft,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface StudentProfile {
  students_id: number;
  prefix_name: string | null;
  firstname: string;
  lastname: string;
  email: string;
  birthday: string | null;
  food_allergy: string | null;
  chronic_disease: string | null;
  remark: string | null;
  tel: string | null;
  parents: {
    parents_id: number;
    firstname: string;
    lastname: string;
    tel: string;
  }[];
  classroom?: {
    grade_label?: string;
    class_name?: string;
    homeroom_teacher?: string;
  } | null;
}

interface FormData {
  chronic_disease: string;
  food_allergy: string;
  birthday: string;
  student_tel: string;
  parent_tel: string;
  remark: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const months = [
  { value: "01", label: "มกราคม" },
  { value: "02", label: "กุมภาพันธ์" },
  { value: "03", label: "มีนาคม" },
  { value: "04", label: "เมษายน" },
  { value: "05", label: "พฤษภาคม" },
  { value: "06", label: "มิถุนายน" },
  { value: "07", label: "กรกฎาคม" },
  { value: "08", label: "สิงหาคม" },
  { value: "09", label: "กันยายน" },
  { value: "10", label: "ตุลาคม" },
  { value: "11", label: "พฤศจิกายน" },
  { value: "12", label: "ธันวาคม" },
];

const formatBirthdayThai = (iso: string | null) => {
  if (!iso) return "ไม่ระบุ";
  const d = new Date(iso);
  const day = d.getDate();
  const month = months[d.getMonth()].label;
  const year = d.getFullYear() + 543;

  return `${day} ${month} ${year}`;
};

const displayVal = (v: string | null | undefined) =>
  v && v.trim() ? v : "ไม่ระบุ";

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="py-3 border-b border-gray-100 last:border-0">
    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
    <p className="text-sm font-medium text-gray-800">{value}</p>
  </div>
);

// ─── Field Input ─────────────────────────────────────────────────────────────
const FieldInput = ({
  label,
  value,
  onChange,
  placeholder,
  error,
  type = "text",
  icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  type?: string;
  icon?: React.ReactNode;
}) => (
  <div>
    <label className="block text-xs font-semibold text-gray-600 mb-1">
      {label}
    </label>
    <div className="relative">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
          {icon}
        </span>
      )}
      <input
        className={`w-full ${icon ? "pl-9" : "pl-3"} pr-3 py-2.5 rounded-xl border text-sm text-gray-700 outline-none transition-all
          ${
            error
              ? "border-red-400 bg-red-50 focus:ring-2 focus:ring-red-200"
              : "border-gray-200 bg-gray-50 focus:border-[#5d7c6f] focus:ring-2 focus:ring-[#5d7c6f]/20"
          }`}
        maxLength={type === "tel" ? 10 : undefined}
        placeholder={placeholder}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
    {error && (
      <p className="text-red-500 text-[10px] mt-1 flex items-center gap-1">
        <AlertCircle size={10} /> {error}
      </p>
    )}
  </div>
);

// ─── Section Card ─────────────────────────────────────────────────────────────
const SectionCard = ({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) => (
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

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function StudentProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState("");
  const [fieldError, setFieldError] = useState<Record<string, string>>({});

  const [form, setForm] = useState<FormData>({
    chronic_disease: "",
    food_allergy: "",
    birthday: "",
    student_tel: "",
    parent_tel: "",
    remark: "",
  });

  // Birthday parts state
  const [bday, setBday] = useState({ day: "", month: "", year: "" });

  const currentYear = new Date().getFullYear();
  const days = Array.from({ length: 31 }, (_, i) =>
    (i + 1).toString().padStart(2, "0"),
  );
  const years = Array.from({ length: 30 }, (_, i) =>
    (currentYear - (i + 5)).toString(),
  );

  useEffect(() => {
    fetch("/api/student/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: StudentProfile | null) => {
        if (data) {
          setProfile(data);
          const parentTel = data.parents?.[0]?.tel ?? "";
          const birthdayISO = data.birthday ? data.birthday.split("T")[0] : "";
          const parts = birthdayISO ? birthdayISO.split("-") : ["", "", ""];

          setBday({
            year: parts[0] ?? "",
            month: parts[1] ?? "",
            day: parts[2] ?? "",
          });
          setForm({
            chronic_disease: data.chronic_disease ?? "",
            food_allergy: data.food_allergy ?? "",
            birthday: birthdayISO,
            student_tel: data.tel ?? "",
            parent_tel: parentTel,
            remark: data.remark ?? "",
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateBirthday = (type: "day" | "month" | "year", value: string) => {
    const next = { ...bday, [type]: value };

    setBday(next);
    if (next.year && next.month && next.day) {
      setForm((f) => ({
        ...f,
        birthday: `${next.year}-${next.month}-${next.day}`,
      }));
    } else {
      setForm((f) => ({ ...f, birthday: "" }));
    }
  };

  const validate = () => {
    const errors: Record<string, string> = {};

    if (!form.chronic_disease.trim())
      errors.chronic_disease = "กรุณากรอกข้อมูลโรคประจำตัว";
    if (!form.food_allergy.trim())
      errors.food_allergy = "กรุณากรอกข้อมูลการแพ้อาหาร/ยา";
    if (!form.birthday) errors.birthday = "กรุณาเลือกวันเกิดให้ครบถ้วน";
    if (
      form.student_tel.trim() &&
      form.student_tel.replace(/\D/g, "").length !== 10
    )
      errors.student_tel = "เบอร์โทรต้องเป็น 10 หลัก";
    if (
      form.parent_tel.trim() &&
      form.parent_tel.replace(/\D/g, "").length !== 10
    )
      errors.parent_tel = "เบอร์โทรต้องเป็น 10 หลัก";

    return errors;
  };

  const handleSave = async () => {
    setApiError("");
    const errors = validate();

    setFieldError(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      const res = await fetch("/api/student/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();

      if (!res.ok) {
        setApiError(data.error ?? "เกิดข้อผิดพลาด");

        return;
      }

      setSuccess(true);
      // Refresh profile data
      const refreshed = await fetch("/api/student/profile").then((r) =>
        r.ok ? r.json() : null,
      );

      if (refreshed) setProfile(refreshed);
      setTimeout(() => {
        setSuccess(false);
        setEditing(false);
      }, 1500);
    } catch {
      setApiError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (!profile) return;
    const parentTel = profile.parents?.[0]?.tel ?? "";
    const birthdayISO = profile.birthday ? profile.birthday.split("T")[0] : "";
    const parts = birthdayISO ? birthdayISO.split("-") : ["", "", ""];

    setBday({
      year: parts[0] ?? "",
      month: parts[1] ?? "",
      day: parts[2] ?? "",
    });
    setForm({
      chronic_disease: profile.chronic_disease ?? "",
      food_allergy: profile.food_allergy ?? "",
      birthday: birthdayISO,
      student_tel: profile.tel ?? "",
      parent_tel: parentTel,
      remark: profile.remark ?? "",
    });
    setFieldError({});
    setApiError("");
    setEditing(false);
  };

  if (loading)
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-[#5d7c6f] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );

  if (!profile)
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <p className="text-gray-400">ไม่พบข้อมูลโปรไฟล์</p>
      </div>
    );

  const displayName = `${profile.prefix_name ?? ""}${profile.firstname} ${profile.lastname}`;
  const initials = `${profile.firstname[0]}${profile.lastname[0]}`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <button
          className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
          onClick={() => router.push("/student/dashboard")}
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
            <p className="text-xs opacity-70 mt-0.5">
              รหัสนักเรียน: {profile.students_id}
            </p>
          </div>
        </div>
        <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/5" />
        <div className="absolute -right-2 -bottom-10 w-24 h-24 rounded-full bg-white/5" />
      </div>

      {/* ── Success Banner ── */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 flex items-center gap-3 text-green-700">
          <CheckCircle2 size={18} />
          <span className="text-sm font-medium">บันทึกข้อมูลสำเร็จแล้ว!</span>
        </div>
      )}

      {/* ── Error Banner ── */}
      {apiError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-center gap-3 text-red-600">
          <AlertCircle size={18} />
          <span className="text-sm">{apiError}</span>
        </div>
      )}

      {/* ── Personal Info ── */}
      <SectionCard icon={<User size={16} />} title="ข้อมูลส่วนตัว">
        {profile.classroom && (
          <div className="flex flex-wrap gap-2 mb-3">
            {profile.classroom.grade_label && (
              <span className="text-xs bg-[#5d7c6f]/10 text-[#3d6357] px-2.5 py-1 rounded-full font-medium">
                ชั้น {profile.classroom.grade_label}
              </span>
            )}
            {profile.classroom.class_name && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                ห้อง {profile.classroom.class_name}
              </span>
            )}
            {profile.classroom.homeroom_teacher && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium">
                ครู{profile.classroom.homeroom_teacher}
              </span>
            )}
          </div>
        )}
        <InfoRow label="ชื่อ-นามสกุล" value={displayName} />
        <InfoRow label="อีเมล" value={profile.email} />
        <InfoRow label="วันเกิด" value={formatBirthdayThai(profile.birthday)} />
      </SectionCard>

      {/* ── Medical Info ── */}
      <SectionCard icon={<Heart size={16} />} title="ข้อมูลสุขภาพ">
        {editing ? (
          <div className="space-y-3">
            <FieldInput
              error={fieldError.chronic_disease}
              label="โรคประจำตัว *"
              placeholder="เช่น ไม่มี, หอบหืด"
              value={form.chronic_disease}
              onChange={(v) => setForm((f) => ({ ...f, chronic_disease: v }))}
            />
            <FieldInput
              error={fieldError.food_allergy}
              label="การแพ้อาหาร/ยา *"
              placeholder="เช่น ไม่มี, อาหารทะเล"
              value={form.food_allergy}
              onChange={(v) => setForm((f) => ({ ...f, food_allergy: v }))}
            />
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                วัน/เดือน/ปีเกิด *
              </label>
              <div className="grid grid-cols-3 gap-2">
                <select
                  className="px-2 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 outline-none focus:border-[#5d7c6f]"
                  value={bday.day}
                  onChange={(e) => updateBirthday("day", e.target.value)}
                >
                  <option value="">วันที่</option>
                  {days.map((d) => (
                    <option key={d} value={d}>
                      {parseInt(d)}
                    </option>
                  ))}
                </select>
                <select
                  className="px-2 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 outline-none focus:border-[#5d7c6f]"
                  value={bday.month}
                  onChange={(e) => updateBirthday("month", e.target.value)}
                >
                  <option value="">เดือน</option>
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <select
                  className="px-2 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 outline-none focus:border-[#5d7c6f]"
                  value={bday.year}
                  onChange={(e) => updateBirthday("year", e.target.value)}
                >
                  <option value="">ปี (พ.ศ.)</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {parseInt(y) + 543}
                    </option>
                  ))}
                </select>
              </div>
              {fieldError.birthday && (
                <p className="text-red-500 text-[10px] mt-1 flex items-center gap-1">
                  <AlertCircle size={10} /> {fieldError.birthday}
                </p>
              )}
            </div>
          </div>
        ) : (
          <>
            <InfoRow
              label="โรคประจำตัว"
              value={displayVal(profile.chronic_disease)}
            />
            <InfoRow
              label="การแพ้อาหาร/ยา"
              value={displayVal(profile.food_allergy)}
            />
          </>
        )}
      </SectionCard>

      {/* ── Contact Info ── */}
      <SectionCard icon={<Phone size={16} />} title="ข้อมูลติดต่อ">
        {editing ? (
          <div className="space-y-3">
            <FieldInput
              error={fieldError.student_tel}
              icon={<Phone size={14} />}
              label="เบอร์โทรศัพท์นักเรียน"
              placeholder="0xxxxxxxxx"
              type="tel"
              value={form.student_tel}
              onChange={(v) => setForm((f) => ({ ...f, student_tel: v }))}
            />
            <FieldInput
              error={fieldError.parent_tel}
              icon={<Phone size={14} />}
              label="เบอร์โทรศัพท์ผู้ปกครอง"
              placeholder="0xxxxxxxxx"
              type="tel"
              value={form.parent_tel}
              onChange={(v) => setForm((f) => ({ ...f, parent_tel: v }))}
            />
          </div>
        ) : (
          <>
            <InfoRow label="เบอร์โทรนักเรียน" value={displayVal(profile.tel)} />
            <InfoRow
              label="เบอร์โทรผู้ปกครอง"
              value={
                profile.parents?.[0]?.tel ? profile.parents[0].tel : "ไม่ระบุ"
              }
            />
          </>
        )}
      </SectionCard>

      {/* ── Remark ── */}
      <SectionCard icon={<MessageSquare size={16} />} title="หมายเหตุเพิ่มเติม">
        {editing ? (
          <textarea
            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 outline-none transition-all focus:border-[#5d7c6f] focus:ring-2 focus:ring-[#5d7c6f]/20 resize-none"
            placeholder="ข้อมูลอื่นที่ต้องการแจ้งครู..."
            rows={3}
            value={form.remark}
            onChange={(e) => setForm((f) => ({ ...f, remark: e.target.value }))}
          />
        ) : (
          <p className="text-sm text-gray-700">{displayVal(profile.remark)}</p>
        )}
      </SectionCard>

      {/* ── Birthday in view mode ── */}
      {!editing && (
        <SectionCard icon={<CalendarDays size={16} />} title="วันเกิด">
          <InfoRow
            label="วัน/เดือน/ปีเกิด"
            value={formatBirthdayThai(profile.birthday)}
          />
        </SectionCard>
      )}

      {/* ── Action Buttons ── */}
      <div className="pb-6">
        {editing ? (
          <div className="flex gap-3">
            <button
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border border-gray-200 bg-white text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
              disabled={saving}
              onClick={handleCancelEdit}
            >
              <X size={16} /> ยกเลิก
            </button>
            <button
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#5d7c6f] text-white font-semibold text-sm hover:bg-[#4a6659] transition-colors disabled:opacity-60 shadow-md"
              disabled={saving}
              onClick={handleSave}
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{" "}
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <Save size={16} /> บันทึกข้อมูล
                </>
              )}
            </button>
          </div>
        ) : (
          <button
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#5d7c6f] text-white font-semibold text-sm hover:bg-[#4a6659] transition-colors shadow-md"
            onClick={() => setEditing(true)}
          >
            <Pencil size={16} /> แก้ไขข้อมูล
          </button>
        )}
      </div>
    </div>
  );
}
