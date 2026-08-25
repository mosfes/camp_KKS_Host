"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Download, LayoutTemplate, Plus, Save, Trash2 } from "lucide-react";

import CampBreadcrumb from "../../CampBreadcrumb";

import { useStatusModal } from "@/components/StatusModalProvider";

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition focus:border-[#6b857a] focus:ring-2 focus:ring-[#6b857a]/15";
const labelClass = "mb-1.5 block text-sm font-medium text-gray-700";

function SkeletonBlock({ className }: { className: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-lg bg-gray-200 ${className}`}
    />
  );
}

function ProjectDocumentSkeleton() {
  return (
    <div className="min-h-screen bg-[#f5f5f2] pb-24">
      <main className="mx-auto max-w-6xl space-y-5 px-4 pb-24 pt-8">
        {/* Page Header Skeleton */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <SkeletonBlock className="h-5 w-5 rounded-md" />
              <SkeletonBlock className="h-6 w-64" />
            </div>
            <SkeletonBlock className="h-4 w-80 max-w-full" />
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <SkeletonBlock className="h-10 w-32 rounded-xl" />
            <SkeletonBlock className="h-10 w-44 rounded-xl" />
          </div>
        </div>

        {/* Template Box Skeleton */}
        <div className="rounded-2xl border border-[#cad8d2]/60 bg-[#f2f7f5]/70 p-5">
          <div className="mb-4 flex items-start gap-3">
            <SkeletonBlock className="h-10 w-10 rounded-xl" />
            <div className="flex-1 space-y-1.5">
              <SkeletonBlock className="h-5 w-44" />
              <SkeletonBlock className="h-3.5 w-80 max-w-full" />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SkeletonBlock className="h-10 w-full rounded-xl" />
            <SkeletonBlock className="h-10 w-full rounded-xl" />
            <SkeletonBlock className="h-10 w-full rounded-xl" />
            <SkeletonBlock className="h-10 w-full rounded-xl" />
          </div>
        </div>

        {/* Form Card 1 Skeleton: ข้อมูลส่วนหัว */}
        <div className="space-y-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
          <SkeletonBlock className="h-6 w-36" />
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <SkeletonBlock className="h-4 w-28" />
                <SkeletonBlock className="h-10 w-full rounded-xl" />
              </div>
            ))}
          </div>
        </div>

        {/* Form Card 2 Skeleton */}
        <div className="space-y-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-xs">
          <SkeletonBlock className="h-6 w-48" />
          <div className="space-y-2">
            <SkeletonBlock className="h-4 w-32" />
            <SkeletonBlock className="h-28 w-full rounded-xl" />
          </div>
        </div>
      </main>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}

function Section({
  number,
  title,
  children,
}: {
  number?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
      <h2 className="mb-5 text-lg font-semibold text-gray-900">
        {number ? `${number}. ` : ""}
        {title}
      </h2>
      {children}
    </section>
  );
}

function StringList({
  values,
  onChange,
  placeholder,
}: {
  values: string[];
  onChange: (value: string[]) => void;
  placeholder: string;
}) {
  return (
    <div className="space-y-3">
      {values.map((value, index) => (
        <div key={index} className="flex items-start gap-2">
          <span className="mt-2.5 w-8 shrink-0 text-sm text-gray-500">
            {index + 1}.
          </span>
          <textarea
            className={`${inputClass} min-h-20 resize-y`}
            placeholder={placeholder}
            value={value}
            onChange={(event) =>
              onChange(
                values.map((item, itemIndex) =>
                  itemIndex === index ? event.target.value : item,
                ),
              )
            }
          />
          <button
            aria-label="ลบรายการ"
            className="mt-1 rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
            disabled={values.length === 1}
            type="button"
            onClick={() =>
              onChange(values.filter((_, itemIndex) => itemIndex !== index))
            }
          >
            <Trash2 size={17} />
          </button>
        </div>
      ))}
      <button
        className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-[#5d7c6f] hover:bg-[#f0f4f2]"
        type="button"
        onClick={() => onChange([...values, ""])}
      >
        <Plus size={16} /> เพิ่มรายการ
      </button>
    </div>
  );
}

function ReferenceMultiSelect({
  title,
  options,
  value,
  onChange,
}: {
  title: string;
  options: any[];
  value: string;
  onChange: (value: string) => void;
}) {
  const lines = String(value || "")
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
  const knownLabels = new Set(options.map((option) => option.label));
  const selected = new Set(lines.filter((item) => knownLabels.has(item)));
  const customLines = lines.filter((item) => !knownLabels.has(item));

  const merge = (selectedValues: Set<string>, customValue: string) => {
    const orderedSelected = options
      .filter((option) => selectedValues.has(option.label))
      .map((option) => option.label);
    const custom = customValue
      .split("\n")
      .map((item) => item.trim())
      .filter(Boolean);

    onChange([...orderedSelected, ...custom].join("\n"));
  };

  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <h3 className="mb-3 text-sm font-medium text-gray-800">{title}</h3>
      {options.length ? (
        <div className="space-y-2">
          {options.map((option) => (
            <label
              key={option.document_reference_option_id}
              className="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-gray-50"
            >
              <input
                checked={selected.has(option.label)}
                className="mt-1 h-4 w-4 accent-[#5d7c6f]"
                type="checkbox"
                onChange={(event) => {
                  const next = new Set(selected);

                  if (event.target.checked) next.add(option.label);
                  else next.delete(option.label);
                  merge(next, customLines.join("\n"));
                }}
              />
              <span className="text-sm leading-6 text-gray-700">
                {option.label}
              </span>
            </label>
          ))}
        </div>
      ) : (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-700">
          แอดมินยังไม่ได้เพิ่มตัวเลือกในหมวดนี้
        </p>
      )}
      <label className="mt-4 block">
        <span className={labelClass}>อื่น ๆ (หนึ่งหัวข้อต่อหนึ่งบรรทัด)</span>
        <textarea
          className={`${inputClass} min-h-24 resize-y`}
          placeholder="กรอกหัวข้ออื่นเพิ่มเติม"
          value={customLines.join("\n")}
          onChange={(event) => merge(selected, event.target.value)}
        />
      </label>
      <p className="mt-2 text-xs text-gray-500">
        เลือกได้หลายรายการ และทุกบรรทัดจะแสดงในเอกสาร PDF
      </p>
    </div>
  );
}

function ResponsibleSelect({
  value,
  onChange,
  teachers,
  people,
  defaultCreator,
}: {
  value: string;
  onChange: (value: string) => void;
  teachers: any[];
  people: any[];
  defaultCreator: string;
}) {
  const teacherOptions = teachers
    .map((t) => `${t.prefix_name || ""}${t.firstname} ${t.lastname}`.trim())
    .filter(Boolean);

  const peopleOptions = people
    .map((p) => ({
      name: `${p.prefix_name || ""}${p.firstname} ${p.lastname}`.trim(),
      position: p.position || "",
    }))
    .filter((p) => Boolean(p.name));

  const allKnownNames = new Set([
    defaultCreator,
    ...teacherOptions,
    ...peopleOptions.map((p) => p.name),
  ]);
  const currentVal = value || "";
  const isUnknown = currentVal && !allKnownNames.has(currentVal);

  return (
    <select
      className={inputClass}
      value={currentVal}
      onChange={(event) => onChange(event.target.value)}
    >
      <option value="">เลือกผู้รับผิดชอบ</option>
      {defaultCreator && (
        <option className="font-semibold text-[#5d7c6f]" value={defaultCreator}>
          ★ {defaultCreator} (ผู้สร้างค่าย)
        </option>
      )}
      {isUnknown && <option value={currentVal}>{currentVal}</option>}
      {teacherOptions.length > 0 && (
        <optgroup label="—— ครู ——">
          {teacherOptions.map((name, index) => (
            <option key={`teacher-${index}`} value={name}>
              {name} (ครู)
            </option>
          ))}
        </optgroup>
      )}
      {peopleOptions.length > 0 && (
        <optgroup label="—— บุคลากรในเอกสาร ——">
          {peopleOptions.map((person, index) => (
            <option key={`person-${index}`} value={person.name}>
              {person.name} {person.position ? `(${person.position})` : ""}
            </option>
          ))}
        </optgroup>
      )}
    </select>
  );
}

export default function ProjectDocumentPage() {
  const params = useParams();
  const router = useRouter();
  const campId = String(params.id);
  const { showError, showSuccess, showConfirm, setIsLoading } =
    useStatusModal();
  const [document, setDocument] = useState<any>(null);
  const [people, setPeople] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [referenceOptions, setReferenceOptions] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [loading, setLoading] = useState(true);

  const loadTemplates = async () => {
    const response = await fetch("/api/project-document-templates");

    if (!response.ok) return [];
    const data = await response.json();

    setTemplates(data);

    return data;
  };

  useEffect(() => {
    Promise.all([
      fetch(`/api/camps/${campId}/project-document`).then(async (response) => {
        if (!response.ok)
          throw new Error(
            (await response.json()).error || "โหลดเอกสารไม่สำเร็จ",
          );

        return response.json();
      }),
      fetch("/api/document-personnel").then((response) =>
        response.ok ? response.json() : [],
      ),
      fetch("/api/project-document-templates").then((response) =>
        response.ok ? response.json() : [],
      ),
      fetch("/api/document-reference-options").then((response) =>
        response.ok ? response.json() : [],
      ),
      fetch("/api/teachers").then((response) =>
        response.ok ? response.json() : [],
      ),
    ])
      .then(
        ([
          documentData,
          personnelData,
          templateData,
          referenceOptionData,
          teachersData,
        ]) => {
          setDocument(documentData);
          setPeople(Array.isArray(personnelData) ? personnelData : []);
          setTemplates(Array.isArray(templateData) ? templateData : []);
          setReferenceOptions(
            Array.isArray(referenceOptionData) ? referenceOptionData : [],
          );
          setTeachers(
            Array.isArray(teachersData)
              ? teachersData
              : Array.isArray(teachersData?.data)
                ? teachersData.data
                : [],
          );
        },
      )
      .catch((error) => showError("ข้อผิดพลาด", error.message))
      .finally(() => setLoading(false));
  }, [campId]);

  const update = (key: string, value: any) =>
    setDocument((current: any) => ({ ...current, [key]: value }));

  const save = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/camps/${campId}/project-document`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(document),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "บันทึกเอกสารไม่สำเร็จ");
      setDocument(data);
      showSuccess("บันทึกแล้ว", "บันทึกข้อมูลเอกสารโครงการเรียบร้อยแล้ว");

      return true;
    } catch (error: any) {
      showError("บันทึกไม่สำเร็จ", error.message);

      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const download = async () => {
    if (!(await save())) return;
    window.location.href = `/api/camps/${campId}/project-document/pdf`;
  };

  const applyTemplate = () => {
    const template = templates.find(
      (item) =>
        item.project_document_template_id === Number(selectedTemplateId),
    );

    if (!template) {
      showError("ยังไม่ได้เลือกเทมเพลต", "กรุณาเลือกเทมเพลตที่ต้องการใช้");

      return;
    }

    const data = JSON.parse(JSON.stringify(template.template_data || {}));

    setDocument((current: any) => ({
      ...current,
      ...data,
      fiscal_year: current.fiscal_year,
      project_name: current.project_name,
      project_code: current.project_code,
      activity_name: current.activity_name,
      activity_order: current.activity_order,
      responsible_people: current.responsible_people,
      duration_text: current.duration_text,
      location_text: current.location_text,
    }));
    showSuccess(
      "ใช้เทมเพลตแล้ว",
      "เติมเนื้อหาจากเทมเพลตโดยคงข้อมูลเฉพาะของค่ายนี้ไว้",
    );
  };

  const saveTemplate = async () => {
    if (!templateName.trim()) {
      showError("ยังไม่ได้ตั้งชื่อ", "กรุณาระบุชื่อเทมเพลต");

      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/project-document-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateName,
          template_data: document,
        }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "บันทึกเทมเพลตไม่สำเร็จ");
      await loadTemplates();
      setSelectedTemplateId(String(data.project_document_template_id));
      showSuccess(
        "บันทึกเทมเพลตแล้ว",
        "ครั้งต่อไปสามารถเลือกเทมเพลตนี้ได้ทันที",
      );
    } catch (error: any) {
      showError("บันทึกไม่สำเร็จ", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTemplate = () => {
    const template = templates.find(
      (item) =>
        item.project_document_template_id === Number(selectedTemplateId),
    );

    if (!template) {
      showError("ยังไม่ได้เลือกเทมเพลต", "กรุณาเลือกเทมเพลตที่ต้องการลบ");

      return;
    }

    showConfirm(
      "ลบเทมเพลต",
      `ต้องการลบเทมเพลต “${template.name}” ใช่หรือไม่`,
      async () => {
        setIsLoading(true);
        try {
          const response = await fetch(
            `/api/project-document-templates/${template.project_document_template_id}`,
            { method: "DELETE" },
          );

          if (!response.ok) throw new Error();
          setSelectedTemplateId("");
          setTemplateName("");
          await loadTemplates();
          showSuccess("ลบแล้ว", "ลบเทมเพลตเรียบร้อยแล้ว");
        } catch {
          showError("ลบไม่สำเร็จ", "ไม่สามารถลบเทมเพลตได้");
        } finally {
          setIsLoading(false);
        }
      },
      "ลบเทมเพลต",
    );
  };

  if (loading || !document) {
    return <ProjectDocumentSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#f5f5f2] pb-24">
      <main className="mx-auto max-w-6xl space-y-5 px-4 pb-24 pt-8">
        <div className="space-y-6">
          <CampBreadcrumb campId={campId} currentPage="เอกสารข้อเสนอโครงการ" />

          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-center gap-2">
              <LayoutTemplate className="shrink-0 text-[#6b857a]" size={20} />
              <div>
                <h1 className="text-lg font-bold leading-tight text-gray-900">
                  เอกสารโครงการตามแผนปฏิบัติการ
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  กรอกข้อมูลและเลือกบุคลากรให้แต่ละช่องลงนามได้อย่างอิสระ
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 lg:justify-end">
              <button
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                type="button"
                onClick={save}
              >
                <Save size={17} /> บันทึกแบบร่าง
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-xl bg-[#5d7c6f] px-4 py-2 text-sm font-medium text-white hover:bg-[#4b685c]"
                type="button"
                onClick={download}
              >
                <Download size={17} /> บันทึกและดาวน์โหลด PDF
              </button>
            </div>
          </div>
        </div>

        <section className="rounded-2xl border border-[#cad8d2] bg-[#f2f7f5] p-5 shadow-sm">
          <div className="mb-4 flex items-start gap-3">
            <div className="rounded-xl bg-white p-2 text-[#5d7c6f] shadow-sm">
              <LayoutTemplate size={22} />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">
                เทมเพลตเอกสารส่วนตัว
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                ใช้เนื้อหาเดิมกับค่ายใหม่ โดยระบบจะไม่เปลี่ยนชื่อค่าย
                รหัสกิจกรรม วันที่ สถานที่ และผู้รับผิดชอบ
              </p>
            </div>
          </div>
          <div className="grid gap-3 lg:grid-cols-[2fr_auto_2fr_auto]">
            <select
              className={inputClass}
              value={selectedTemplateId}
              onChange={(event) => {
                setSelectedTemplateId(event.target.value);
                const selected = templates.find(
                  (item) =>
                    item.project_document_template_id ===
                    Number(event.target.value),
                );

                if (selected) setTemplateName(selected.name);
              }}
            >
              <option value="">เลือกเทมเพลตที่บันทึกไว้</option>
              {templates.map((template) => (
                <option
                  key={template.project_document_template_id}
                  value={template.project_document_template_id}
                >
                  {template.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                className="rounded-xl bg-[#5d7c6f] px-4 py-2 text-sm font-medium text-white hover:bg-[#4b685c]"
                type="button"
                onClick={applyTemplate}
              >
                ใช้เทมเพลต
              </button>
              <button
                aria-label="ลบเทมเพลต"
                className="rounded-xl border border-red-200 px-3 text-red-500 hover:bg-red-50"
                type="button"
                onClick={deleteTemplate}
              >
                <Trash2 size={17} />
              </button>
            </div>
            <input
              className={inputClass}
              placeholder="ตั้งชื่อเพื่อบันทึก เช่น โครงการวิทยาศาสตร์"
              value={templateName}
              onChange={(event) => setTemplateName(event.target.value)}
            />
            <button
              className="rounded-xl border border-[#5d7c6f] bg-white px-4 py-2 text-sm font-medium text-[#5d7c6f] hover:bg-[#edf4f1]"
              type="button"
              onClick={saveTemplate}
            >
              บันทึกข้อมูลปัจจุบันเป็นเทมเพลต
            </button>
          </div>
          {templates.length === 0 && (
            <p className="mt-3 text-xs text-gray-500">
              ยังไม่มีเทมเพลต
              กรอกเอกสารชุดแรกแล้วตั้งชื่อเพื่อบันทึกไว้ใช้ครั้งต่อไป
            </p>
          )}
        </section>

        <Section title="ข้อมูลส่วนหัว">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="ปีงบประมาณ (พ.ศ.)">
              <input
                className={inputClass}
                min="2500"
                type="number"
                value={document.fiscal_year}
                onChange={(event) =>
                  update("fiscal_year", Number(event.target.value))
                }
              />
            </Field>
            <Field label="รหัสโครงการ/กิจกรรม">
              <input
                className={inputClass}
                value={document.project_code || ""}
                onChange={(event) => update("project_code", event.target.value)}
              />
            </Field>
            <Field label="ชื่อโครงการ">
              <input
                className={inputClass}
                value={document.project_name}
                onChange={(event) => update("project_name", event.target.value)}
              />
            </Field>
            <Field label="ชื่อกิจกรรม">
              <input
                className={inputClass}
                value={document.activity_name || ""}
                onChange={(event) =>
                  update("activity_name", event.target.value)
                }
              />
            </Field>
            <Field label="ลำดับกิจกรรม">
              <input
                className={inputClass}
                value={document.activity_order || ""}
                onChange={(event) =>
                  update("activity_order", event.target.value)
                }
              />
            </Field>
            <Field label="ลักษณะโครงการ">
              <select
                className={inputClass}
                value={document.project_type}
                onChange={(event) => update("project_type", event.target.value)}
              >
                <option value="NEW">โครงการใหม่</option>
                <option value="CONTINUING">โครงการต่อเนื่อง</option>
              </select>
            </Field>
            <Field label="ผู้รับผิดชอบโครงการ">
              <ResponsibleSelect
                defaultCreator={document.creator_name || ""}
                people={people}
                teachers={teachers}
                value={document.responsible_people || ""}
                onChange={(val) => update("responsible_people", val)}
              />
            </Field>
            <Field label="กลุ่มงาน/กลุ่มสาระฯ/ระดับ">
              <input
                className={inputClass}
                value={document.department || ""}
                onChange={(event) => update("department", event.target.value)}
              />
            </Field>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <ReferenceMultiSelect
              options={referenceOptions.filter(
                (option) => option.category === "STANDARD",
              )}
              title="สนองมาตรฐานการศึกษา"
              value={document.standards || ""}
              onChange={(value) => update("standards", value)}
            />
            <ReferenceMultiSelect
              options={referenceOptions.filter(
                (option) => option.category === "STRATEGY",
              )}
              title="กลยุทธ์โรงเรียน"
              value={document.strategy || ""}
              onChange={(value) => update("strategy", value)}
            />
          </div>
        </Section>

        <Section number="1" title="หลักการและเหตุผล">
          <textarea
            className={`${inputClass} min-h-48 resize-y`}
            value={document.rationale || ""}
            onChange={(event) => update("rationale", event.target.value)}
          />
        </Section>
        <Section number="2" title="วัตถุประสงค์">
          <StringList
            placeholder="ระบุวัตถุประสงค์"
            values={document.objectives}
            onChange={(value) => update("objectives", value)}
          />
        </Section>
        <Section number="3" title="เป้าหมาย">
          <h3 className="mb-3 font-medium text-gray-800">3.1 เชิงปริมาณ</h3>
          <StringList
            placeholder="ระบุเป้าหมายเชิงปริมาณ"
            values={document.quantitative_targets}
            onChange={(value) => update("quantitative_targets", value)}
          />
          <h3 className="mb-3 mt-6 font-medium text-gray-800">
            3.2 เชิงคุณภาพ
          </h3>
          <StringList
            placeholder="ระบุเป้าหมายเชิงคุณภาพ"
            values={document.qualitative_targets}
            onChange={(value) => update("qualitative_targets", value)}
          />
        </Section>

        <Section number="4" title="วิธีดำเนินการ">
          <div className="space-y-4">
            {document.procedures.map((row: any, index: number) => (
              <div
                key={index}
                className="rounded-xl border border-gray-200 bg-gray-50 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-medium text-gray-700">
                    ขั้นตอนที่ {index + 1}
                  </span>
                  <button
                    className="text-gray-400 hover:text-red-500"
                    type="button"
                    onClick={() =>
                      update(
                        "procedures",
                        document.procedures.filter(
                          (_: any, rowIndex: number) => rowIndex !== index,
                        ),
                      )
                    }
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="ขั้นตอน (เช่น 1. วางแผน / Plan)">
                    <input
                      className={inputClass}
                      placeholder="ขั้นตอน เช่น 1. วางแผน (Plan)"
                      value={row.step}
                      onChange={(event) =>
                        update(
                          "procedures",
                          document.procedures.map(
                            (item: any, rowIndex: number) =>
                              rowIndex === index
                                ? { ...item, step: event.target.value }
                                : item,
                          ),
                        )
                      }
                    />
                  </Field>
                  <Field label="ระยะเวลา">
                    <input
                      className={inputClass}
                      placeholder="เช่น ต.ค. - พ.ย. 67"
                      value={row.period}
                      onChange={(event) =>
                        update(
                          "procedures",
                          document.procedures.map(
                            (item: any, rowIndex: number) =>
                              rowIndex === index
                                ? { ...item, period: event.target.value }
                                : item,
                          ),
                        )
                      }
                    />
                  </Field>
                  <div className="md:col-span-2">
                    <Field label="วิธีดำเนินการ (รายละเอียดกิจกรรม)">
                      <textarea
                        className={`${inputClass} min-h-24 resize-y`}
                        placeholder="รายละเอียดวิธีดำเนินการ"
                        value={row.method}
                        onChange={(event) =>
                          update(
                            "procedures",
                            document.procedures.map(
                              (item: any, rowIndex: number) =>
                                rowIndex === index
                                  ? { ...item, method: event.target.value }
                                  : item,
                            ),
                          )
                        }
                      />
                    </Field>
                  </div>
                  <Field label="งบประมาณ (บาท)">
                    <input
                      className={inputClass}
                      min="0"
                      placeholder="0"
                      type="number"
                      value={row.budget}
                      onChange={(event) =>
                        update(
                          "procedures",
                          document.procedures.map(
                            (item: any, rowIndex: number) =>
                              rowIndex === index
                                ? {
                                    ...item,
                                    budget: Number(event.target.value),
                                  }
                                : item,
                          ),
                        )
                      }
                    />
                  </Field>
                  <Field label="ผู้รับผิดชอบ">
                    <ResponsibleSelect
                      defaultCreator={document.creator_name || ""}
                      people={people}
                      teachers={teachers}
                      value={row.responsible || ""}
                      onChange={(val) =>
                        update(
                          "procedures",
                          document.procedures.map(
                            (item: any, rowIndex: number) =>
                              rowIndex === index
                                ? { ...item, responsible: val }
                                : item,
                          ),
                        )
                      }
                    />
                  </Field>
                </div>
              </div>
            ))}
            <button
              className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-[#5d7c6f] hover:bg-[#f0f4f2]"
              type="button"
              onClick={() =>
                update("procedures", [
                  ...document.procedures,
                  {
                    step: "",
                    method: "",
                    period: "",
                    budget: 0,
                    responsible: document.creator_name || "",
                  },
                ])
              }
            >
              <Plus size={16} /> เพิ่มขั้นตอน
            </button>
          </div>
        </Section>

        <Section number="5-7" title="ระยะเวลา สถานที่ และงบประมาณ">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="ระยะเวลาดำเนินการ">
              <input
                className={inputClass}
                value={document.duration_text || ""}
                onChange={(event) =>
                  update("duration_text", event.target.value)
                }
              />
            </Field>
            <Field label="สถานที่ดำเนินงาน">
              <input
                className={inputClass}
                value={document.location_text || ""}
                onChange={(event) =>
                  update("location_text", event.target.value)
                }
              />
            </Field>
            <Field label="งบประมาณรวม">
              <input
                className={inputClass}
                min="0"
                type="number"
                value={document.budget_total}
                onChange={(event) =>
                  update("budget_total", Number(event.target.value))
                }
              />
            </Field>
            <Field label="แหล่งงบประมาณ">
              <input
                className={inputClass}
                placeholder="เช่น เงินอุดหนุน"
                value={document.budget_source || ""}
                onChange={(event) =>
                  update("budget_source", event.target.value)
                }
              />
            </Field>
          </div>
          <h3 className="mb-3 mt-6 font-medium text-gray-800">
            รายการใช้งบประมาณ
          </h3>
          <div className="space-y-4">
            {document.budget_items.map((row: any, index: number) => (
              <div
                key={index}
                className="rounded-xl border border-gray-200 bg-gray-50 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-medium text-gray-700">
                    รายการที่ {index + 1}
                  </span>
                  <button
                    className="text-gray-400 hover:text-red-500"
                    type="button"
                    onClick={() =>
                      update(
                        "budget_items",
                        document.budget_items.filter(
                          (_: any, rowIndex: number) => rowIndex !== index,
                        ),
                      )
                    }
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-6">
                  <div className="md:col-span-2 lg:col-span-2">
                    <Field label="กิจกรรม/รายการ">
                      <input
                        className={inputClass}
                        placeholder="ชื่อกิจกรรมหรือรายการ"
                        value={row.description}
                        onChange={(event) =>
                          update(
                            "budget_items",
                            document.budget_items.map(
                              (item: any, rowIndex: number) =>
                                rowIndex === index
                                  ? { ...item, description: event.target.value }
                                  : item,
                            ),
                          )
                        }
                      />
                    </Field>
                  </div>
                  <Field label="ค่าตอบแทน (บาท)">
                    <input
                      className={inputClass}
                      min="0"
                      placeholder="0"
                      type="number"
                      value={row.compensation}
                      onChange={(event) =>
                        update(
                          "budget_items",
                          document.budget_items.map(
                            (item: any, rowIndex: number) =>
                              rowIndex === index
                                ? {
                                    ...item,
                                    compensation: Number(event.target.value),
                                  }
                                : item,
                          ),
                        )
                      }
                    />
                  </Field>
                  <Field label="ค่าใช้สอย (บาท)">
                    <input
                      className={inputClass}
                      min="0"
                      placeholder="0"
                      type="number"
                      value={row.expenses}
                      onChange={(event) =>
                        update(
                          "budget_items",
                          document.budget_items.map(
                            (item: any, rowIndex: number) =>
                              rowIndex === index
                                ? {
                                    ...item,
                                    expenses: Number(event.target.value),
                                  }
                                : item,
                          ),
                        )
                      }
                    />
                  </Field>
                  <Field label="ค่าวัสดุ (บาท)">
                    <input
                      className={inputClass}
                      min="0"
                      placeholder="0"
                      type="number"
                      value={row.materials}
                      onChange={(event) =>
                        update(
                          "budget_items",
                          document.budget_items.map(
                            (item: any, rowIndex: number) =>
                              rowIndex === index
                                ? {
                                    ...item,
                                    materials: Number(event.target.value),
                                  }
                                : item,
                          ),
                        )
                      }
                    />
                  </Field>
                  <Field label="ผู้รับผิดชอบ">
                    <ResponsibleSelect
                      defaultCreator={document.creator_name || ""}
                      people={people}
                      teachers={teachers}
                      value={row.responsible || ""}
                      onChange={(val) =>
                        update(
                          "budget_items",
                          document.budget_items.map(
                            (item: any, rowIndex: number) =>
                              rowIndex === index
                                ? { ...item, responsible: val }
                                : item,
                          ),
                        )
                      }
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
          <button
            className="mt-3 inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-[#5d7c6f] hover:bg-[#f0f4f2]"
            type="button"
            onClick={() =>
              update("budget_items", [
                ...document.budget_items,
                {
                  description: "",
                  compensation: 0,
                  expenses: 0,
                  materials: 0,
                  responsible: document.creator_name || "",
                },
              ])
            }
          >
            <Plus size={16} /> เพิ่มรายการงบประมาณ
          </button>
        </Section>

        <Section number="8" title="การวัดและประเมินผล">
          <div className="space-y-4">
            {document.evaluations.map((row: any, index: number) => (
              <div
                key={index}
                className="rounded-xl border border-gray-200 bg-gray-50 p-4"
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="font-medium text-gray-700">
                    ตัวชี้วัดที่ {index + 1}
                  </span>
                  <button
                    className="text-gray-400 hover:text-red-500"
                    type="button"
                    onClick={() =>
                      update(
                        "evaluations",
                        document.evaluations.filter(
                          (_: any, rowIndex: number) => rowIndex !== index,
                        ),
                      )
                    }
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <Field label="ตัวชี้วัดความสำเร็จ">
                      <textarea
                        className={`${inputClass} min-h-20 resize-y`}
                        placeholder="ระบุตัวชี้วัดความสำเร็จของโครงการ"
                        value={row.indicator}
                        onChange={(event) =>
                          update(
                            "evaluations",
                            document.evaluations.map(
                              (item: any, rowIndex: number) =>
                                rowIndex === index
                                  ? { ...item, indicator: event.target.value }
                                  : item,
                            ),
                          )
                        }
                      />
                    </Field>
                  </div>
                  <Field label="วิธีวัด">
                    <input
                      className={inputClass}
                      placeholder="เช่น การประเมิน, การสังเกต, ตรวจผลงาน"
                      value={row.method}
                      onChange={(event) =>
                        update(
                          "evaluations",
                          document.evaluations.map(
                            (item: any, rowIndex: number) =>
                              rowIndex === index
                                ? { ...item, method: event.target.value }
                                : item,
                          ),
                        )
                      }
                    />
                  </Field>
                  <Field label="เครื่องมือ">
                    <input
                      className={inputClass}
                      placeholder="เช่น แบบประเมินความพึงพอใจ, แบบสังเกต"
                      value={row.tool}
                      onChange={(event) =>
                        update(
                          "evaluations",
                          document.evaluations.map(
                            (item: any, rowIndex: number) =>
                              rowIndex === index
                                ? { ...item, tool: event.target.value }
                                : item,
                          ),
                        )
                      }
                    />
                  </Field>
                </div>
              </div>
            ))}
          </div>
          <button
            className="mt-3 inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-[#5d7c6f] hover:bg-[#f0f4f2]"
            type="button"
            onClick={() =>
              update("evaluations", [
                ...document.evaluations,
                { indicator: "", method: "", tool: "" },
              ])
            }
          >
            <Plus size={16} /> เพิ่มตัวชี้วัด
          </button>
        </Section>

        <Section number="9" title="ผลที่คาดว่าจะได้รับ">
          <StringList
            placeholder="ระบุผลที่คาดว่าจะได้รับ"
            values={document.expected_results}
            onChange={(value) => update("expected_results", value)}
          />
        </Section>

        <Section title="ช่องลงนาม">
          <p className="mb-4 text-sm text-gray-500">
            บทบาทเป็นข้อความของช่องในเอกสาร
            บุคลากรไม่ได้ถูกผูกกับบทบาทใดไว้ล่วงหน้า
          </p>
          <div className="space-y-3">
            {(document.signatories || []).map((row: any, index: number) => {
              const currentExists = people.some(
                (person) =>
                  person.document_personnel_id === Number(row.personnelId),
              );

              return (
                <div
                  key={index}
                  className="rounded-xl border border-gray-200 bg-gray-50 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="font-medium text-gray-700">
                      ลำดับที่ {index + 1}
                    </span>
                    <button
                      className="text-gray-400 hover:text-red-500"
                      type="button"
                      onClick={() =>
                        update(
                          "signatories",
                          document.signatories.filter(
                            (_: any, rowIndex: number) => rowIndex !== index,
                          ),
                        )
                      }
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="บทบาท/ข้อความใต้ช่องลงนาม">
                      <input
                        className={inputClass}
                        placeholder="บทบาท เช่น ผู้อนุมัติโครงการ หรือ ผู้เสนอโครงการ"
                        value={row.role}
                        onChange={(event) =>
                          update(
                            "signatories",
                            document.signatories.map(
                              (item: any, rowIndex: number) =>
                                rowIndex === index
                                  ? { ...item, role: event.target.value }
                                  : item,
                            ),
                          )
                        }
                      />
                    </Field>
                    <Field label="เลือกบุคลากร">
                      <select
                        className={inputClass}
                        value={row.personnelId || ""}
                        onChange={(event) =>
                          update(
                            "signatories",
                            document.signatories.map(
                              (item: any, rowIndex: number) =>
                                rowIndex === index
                                  ? {
                                      ...item,
                                      personnelId: Number(event.target.value),
                                    }
                                  : item,
                            ),
                          )
                        }
                      >
                        <option value="">เลือกบุคลากร</option>
                        {!currentExists && row.personnelId && (
                          <option value={row.personnelId}>
                            {row.prefixName || ""}
                            {row.firstname} {row.lastname} - {row.position}
                          </option>
                        )}
                        {people.map((person) => (
                          <option
                            key={person.document_personnel_id}
                            value={person.document_personnel_id}
                          >
                            {person.prefix_name || ""}
                            {person.firstname} {person.lastname} -{" "}
                            {person.position}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </div>
              );
            })}
          </div>
          <button
            className="mt-3 inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-[#5d7c6f] hover:bg-[#f0f4f2]"
            type="button"
            onClick={() =>
              update("signatories", [
                ...(document.signatories || []),
                { role: "", personnelId: "" },
              ])
            }
          >
            <Plus size={16} /> เพิ่มช่องลงนาม
          </button>
          {people.length === 0 && (
            <p className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-700">
              ยังไม่มีบุคลากรให้เลือก กรุณาให้ผู้ดูแลระบบเพิ่มในเมนู
              “บุคลากรในเอกสาร”
            </p>
          )}
        </Section>
      </main>
    </div>
  );
}
