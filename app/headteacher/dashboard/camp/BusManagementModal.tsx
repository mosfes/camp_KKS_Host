"use client";

import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Select,
  SelectItem,
} from "@heroui/react";
import { Button } from "@heroui/button";
import {
  ArrowLeft,
  AlertTriangle,
  Bus,
  Check,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Pencil,
  Plus,
  Search,
  Save,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useStatusModal } from "@/components/StatusModalProvider";
import {
  BUS_LAYOUT_TEMPLATES,
  getBusLayoutTemplate,
} from "@/lib/camp-bus-layout-templates";

type Classroom = {
  classroomId: number;
  grade: string;
  roomName: string;
  teacherName: string;
  studentCount: number;
  busId: number | null;
};

type BusStatusEvent = {
  eventType: "BOARD" | "ALIGHT";
  happenedAt: string;
  tripNumber: number;
  actorType: "TEACHER" | "STUDENT";
  actorName: string;
};

type Assignment = {
  assignmentId: number;
  studentEnrollmentId: number;
  studentId: number;
  studentName: string;
  positionId: number | null;
  positionLabel: string | null;
  floorNumber: number | null;
  status: "OFF_BUS" | "ON_BUS";
  lastBoardedAt: string | null;
  lastStatusEvent: BusStatusEvent | null;
  isRegistered: boolean;
};

type Position = {
  positionId: number;
  rowNumber: number;
  seatIndex: number;
  label: string;
  assignmentId: number | null;
};

type RowCountValue = number | "";
type StudentStatusFilter = "all" | "registered" | "unregistered";
type BusStudentStatusFilter = "all" | "on" | "off";

type SavingAction = "create" | "save" | "update" | "delete" | "status";

type Bus = {
  busId: number;
  name: string;
  registrationPlate: string;
  floorCount: number;
  layoutTemplateId: string | null;
  status: "PARKED" | "TRAVELING";
  lastParkedAt: string | null;
  lastDepartedAt: string | null;
  classroomId: number;
  classroom: {
    classroomId: number;
    grade: string;
    roomName: string;
    teacherName: string;
  };
  floors: {
    floorId: number;
    floorNumber: number;
    rowCount: number;
    positions: Position[];
  }[];
  assignments: Assignment[];
  checkedInCount: number;
  assignedCount: number;
  unassignedSeatCount: number;
};

type LiveBusStatus = {
  busId: number;
  status: "PARKED" | "TRAVELING";
  checkedInCount: number;
  assignmentStatuses: {
    assignmentId: number;
    status: "OFF_BUS" | "ON_BUS";
    lastBoardedAt: string | null;
    lastStatusEvent: BusStatusEvent | null;
  }[];
};

interface BusManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  campId: number;
  campName?: string;
  pageMode?: boolean;
}

function gradeLabel(grade: string) {
  return grade?.startsWith("Level_")
    ? `ม.${grade.replace("Level_", "")}`
    : grade;
}

function formatEventAt(value: string | null) {
  if (!value) return "ยังไม่มีข้อมูล";

  return new Date(value).toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  });
}

function statusEventLabel(event: BusStatusEvent | null) {
  if (!event) return "ยังไม่มีประวัติการกด";

  const actor =
    event.actorType === "TEACHER"
      ? `ครู ${event.actorName} เป็นผู้กด`
      : "นักเรียนกดเอง";

  return `รอบที่ ${event.tripNumber} · ${actor} · ${formatEventAt(event.happenedAt)}`;
}

function floorLabel(floorNumber: number, floorCount: number) {
  if (floorCount <= 1) return "";
  if (floorNumber === 1) return "ชั้นล่าง";
  if (floorNumber === 2) return "ชั้นบน";

  return `ชั้น ${floorNumber}`;
}

function floorSuffix(floorNumber: number | null, floorCount: number) {
  if (!floorNumber) return "";

  const label = floorLabel(floorNumber, floorCount);

  return label ? ` · ${label}` : "";
}

function rowCountLabel(floorNumber: number, floorCount: number) {
  const label = floorLabel(floorNumber, floorCount);

  return label ? `จำนวนแถว ${label}` : "จำนวนแถว";
}

function seatGridColumnClass(seatIndex: number) {
  return ["col-start-1", "col-start-2", "col-start-4", "col-start-5"][
    seatIndex
  ];
}

function BusManagementSkeleton() {
  return (
    <div className="animate-pulse space-y-4" aria-label="กำลังโหลดข้อมูลรถ">
      <div className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm md:flex-row md:items-center">
        <div className="flex flex-1 gap-2 overflow-hidden">
          <div className="h-12 w-28 shrink-0 rounded-xl bg-gray-200" />
          <div className="h-12 w-28 shrink-0 rounded-xl bg-gray-100" />
          <div className="h-12 w-28 shrink-0 rounded-xl bg-gray-100" />
        </div>
        <div className="h-9 w-24 self-end rounded-lg bg-gray-200 md:self-auto" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="col-span-2 h-32 rounded-2xl bg-white shadow-sm sm:col-span-2" />
        <div className="h-32 rounded-2xl bg-white shadow-sm" />
        <div className="h-32 rounded-2xl bg-white shadow-sm" />
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="mb-5 flex items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div className="space-y-2">
            <div className="h-5 w-36 rounded bg-gray-200" />
            <div className="h-3 w-56 rounded bg-gray-100" />
          </div>
          <div className="h-8 w-24 rounded-lg bg-gray-100" />
        </div>
        <div className="mx-auto max-w-xl rounded-[2rem] border-4 border-gray-100 bg-gray-50 p-4 sm:p-6">
          <div className="mb-5 h-9 rounded-xl bg-gray-200" />
          <div className="space-y-2">
            {Array.from({ length: 6 }, (_, rowIndex) => (
              <div
                key={rowIndex}
                className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_0.35fr_minmax(0,1fr)_minmax(0,1fr)] gap-1.5"
              >
                {Array.from({ length: 4 }, (_, seatIndex) => (
                  <div
                    key={seatIndex}
                    className={`h-16 rounded-xl bg-white ${
                      seatIndex === 2 ? "col-start-4" : ""
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

type FloorCountRadioGroupProps = {
  name: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

function FloorCountRadioGroup({
  name,
  value,
  disabled = false,
  onChange,
}: FloorCountRadioGroupProps) {
  const options = [
    { value: "1", label: "ชั้นเดียว" },
    { value: "2", label: "สองชั้น" },
  ];

  return (
    <div
      aria-label="จำนวนชั้น"
      className="mt-2 grid grid-cols-2 gap-3"
      role="radiogroup"
    >
      {options.map((option) => {
        const isSelected = value === option.value;

        return (
          <label
            key={option.value}
            className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 transition ${
              disabled
                ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                : isSelected
                  ? "border-[#6b857a] bg-[#edf5f0] text-[#365f4f] shadow-sm"
                  : "border-gray-200 bg-white text-gray-700 hover:border-[#9ab4a7] hover:bg-[#f8fbf9]"
            }`}
          >
            <input
              checked={isSelected}
              className="sr-only"
              disabled={disabled}
              name={name}
              type="radio"
              value={option.value}
              onChange={() => onChange(option.value)}
            />
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                isSelected ? "border-[#6b857a]" : "border-gray-300 bg-white"
              }`}
            >
              {isSelected && (
                <span className="h-2.5 w-2.5 rounded-full bg-[#6b857a]" />
              )}
            </span>
            <span className="text-sm font-medium">{option.label}</span>
          </label>
        );
      })}
    </div>
  );
}

export default function BusManagementModal({
  isOpen,
  onClose,
  campId,
  campName,
  pageMode = false,
}: BusManagementModalProps) {
  const { showError, showSuccess } = useStatusModal();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [selectedBusId, setSelectedBusId] = useState<number | null>(null);
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [draftAssignments, setDraftAssignments] = useState<
    Record<number, number | null>
  >({});
  const [selectedPositionId, setSelectedPositionId] = useState<number | null>(
    null,
  );
  const [studentSearch, setStudentSearch] = useState("");
  const [studentStatusFilter, setStudentStatusFilter] =
    useState<StudentStatusFilter>("registered");
  const [busStudentSearch, setBusStudentSearch] = useState("");
  const [busStudentStatusFilter, setBusStudentStatusFilter] =
    useState<BusStudentStatusFilter>("all");
  const [loading, setLoading] = useState(false);
  const [savingAction, setSavingAction] = useState<SavingAction | null>(null);
  const [changingAssignmentId, setChangingAssignmentId] = useState<
    number | null
  >(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showEditBus, setShowEditBus] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showUnassignedConfirm, setShowUnassignedConfirm] = useState(false);
  const [pendingBusStatus, setPendingBusStatus] = useState<
    "PARKED" | "TRAVELING" | null
  >(null);
  const [parkClearPassengers, setParkClearPassengers] = useState<
    boolean | null
  >(null);
  const [createForm, setCreateForm] = useState({
    classroomId: "",
    name: "",
    layoutTemplateId: "custom",
    floorCount: "1",
    rowCounts: [10] as RowCountValue[],
  });
  const [editBusForm, setEditBusForm] = useState({
    name: "",
    floorCount: "1",
    rowCounts: [10] as RowCountValue[],
  });

  const selectedBus = useMemo(
    () => buses.find((bus) => bus.busId === selectedBusId) || null,
    [buses, selectedBusId],
  );
  const hasLiveBoardingStarted = Boolean(selectedBus?.checkedInCount);
  const needsFastLiveRefresh =
    hasLiveBoardingStarted && selectedBus?.status === "PARKED";
  const selectedBusLayoutVersion = useMemo(
    () =>
      selectedBus
        ? JSON.stringify({
            busId: selectedBus.busId,
            name: selectedBus.name,
            floorCount: selectedBus.floorCount,
            layoutTemplateId: selectedBus.layoutTemplateId,
            floors: selectedBus.floors.map((floor) => ({
              floorId: floor.floorId,
              floorNumber: floor.floorNumber,
              rowCount: floor.rowCount,
              positionIds: floor.positions.map(
                (position) => position.positionId,
              ),
            })),
            assignments: selectedBus.assignments.map((assignment) => ({
              assignmentId: assignment.assignmentId,
              positionId: assignment.positionId,
            })),
          })
        : "",
    [selectedBus],
  );
  const hasMultipleFloors = selectedBus ? selectedBus.floorCount > 1 : false;
  const selectedLayoutTemplate = getBusLayoutTemplate(
    selectedBus?.layoutTemplateId,
  );

  const currentFloor = selectedBus?.floors.find(
    (floor) => floor.floorNumber === selectedFloor,
  );

  const assignmentById = useMemo(() => {
    if (!selectedBus) return new Map<number, Assignment>();

    return new Map(
      selectedBus.assignments.map((assignment) => [
        assignment.assignmentId,
        assignment,
      ]),
    );
  }, [selectedBus]);

  const assignedCount = Object.values(draftAssignments).filter(
    (positionId) => positionId !== null,
  ).length;
  const hasAssignedSeat = assignedCount > 0;

  const unassignedStudents = selectedBus?.assignments.filter(
    (assignment) => draftAssignments[assignment.assignmentId] === null,
  );

  const fetchBuses = async (preferredBusId?: number | null) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/camps/${campId}/buses`, {
        cache: "no-store",
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "โหลดข้อมูลรถไม่สำเร็จ");

      setClassrooms(data.classrooms || []);
      setBuses(data.buses || []);

      const nextBusId =
        preferredBusId !== undefined
          ? (preferredBusId ?? data.buses?.[0]?.busId)
          : (selectedBusId ?? data.buses?.[0]?.busId);

      setSelectedBusId(nextBusId || null);
      setShowCreate(!nextBusId);
    } catch (error: any) {
      showError(
        "โหลดข้อมูลไม่สำเร็จ",
        error.message || "ไม่สามารถโหลดข้อมูลรถได้",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !campId) return;
    void fetchBuses();
  }, [isOpen, campId]);

  useEffect(() => {
    if (
      !isOpen ||
      !campId ||
      !selectedBusId ||
      showCreate ||
      showEditBus ||
      savingAction !== null
    ) {
      return;
    }

    let active = true;
    let requestInFlight = false;
    const refreshIntervalMs = needsFastLiveRefresh ? 5000 : 10000;

    const refreshLiveStatus = async () => {
      if (
        !active ||
        requestInFlight ||
        document.visibilityState !== "visible"
      ) {
        return;
      }

      requestInFlight = true;

      try {
        const response = await fetch(
          `/api/camps/${campId}/buses/${selectedBusId}/live-status`,
          { cache: "no-store" },
        );

        if (!response.ok) return;

        const liveStatus = (await response.json()) as LiveBusStatus;

        if (!active) return;

        const assignmentStatuses = new Map(
          liveStatus.assignmentStatuses.map((assignment) => [
            assignment.assignmentId,
            assignment,
          ]),
        );

        setBuses((current) => {
          let hasChanges = false;
          const next = current.map((bus) => {
            if (bus.busId !== liveStatus.busId) return bus;

            let assignmentsChanged = false;
            const assignments = bus.assignments.map((assignment) => {
              const liveAssignment = assignmentStatuses.get(
                assignment.assignmentId,
              );

              if (!liveAssignment) return assignment;

              const status: Assignment["status"] = liveAssignment.status;
              const lastBoardedAt = liveAssignment.lastBoardedAt;
              const lastStatusEvent = liveAssignment.lastStatusEvent;

              if (
                assignment.status === status &&
                assignment.lastBoardedAt === lastBoardedAt &&
                JSON.stringify(assignment.lastStatusEvent) ===
                  JSON.stringify(lastStatusEvent)
              ) {
                return assignment;
              }

              assignmentsChanged = true;

              return {
                ...assignment,
                status,
                lastBoardedAt,
                lastStatusEvent,
              };
            });

            if (
              !assignmentsChanged &&
              bus.status === liveStatus.status &&
              bus.checkedInCount === liveStatus.checkedInCount
            ) {
              return bus;
            }

            hasChanges = true;

            return {
              ...bus,
              status: liveStatus.status,
              checkedInCount: liveStatus.checkedInCount,
              assignments,
            };
          });

          return hasChanges ? next : current;
        });
      } catch {
        // A later polling cycle will retry without interrupting the teacher.
      } finally {
        requestInFlight = false;
      }
    };

    const refreshTimer = window.setInterval(
      () => void refreshLiveStatus(),
      refreshIntervalMs,
    );
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshLiveStatus();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      active = false;
      window.clearInterval(refreshTimer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [
    campId,
    isOpen,
    savingAction,
    selectedBusId,
    needsFastLiveRefresh,
    showCreate,
    showEditBus,
  ]);

  useEffect(() => {
    if (!selectedBus) {
      setDraftAssignments({});

      return;
    }

    setDraftAssignments(
      Object.fromEntries(
        selectedBus.assignments.map((assignment) => [
          assignment.assignmentId,
          assignment.positionId,
        ]),
      ),
    );
    setSelectedFloor(selectedBus.floorCount === 2 ? 2 : 1);
    setSelectedPositionId(null);
    setEditBusForm({
      name: selectedBus.name,
      floorCount: String(selectedBus.floorCount),
      rowCounts: selectedBus.floors
        .slice()
        .sort((a, b) => a.floorNumber - b.floorNumber)
        .map((floor) => floor.rowCount),
    });
  }, [selectedBusLayoutVersion]);

  const handleCreate = async () => {
    const layoutTemplate = getBusLayoutTemplate(createForm.layoutTemplateId);
    const floorCount =
      layoutTemplate?.floors.length || Number(createForm.floorCount);
    const rowCountValues = layoutTemplate
      ? layoutTemplate.floors.map((floor) => floor.rowCount)
      : createForm.rowCounts.slice(0, floorCount);

    if (
      rowCountValues.length !== floorCount ||
      rowCountValues.some((value) => value === "" || Number(value) < 1)
    ) {
      return;
    }

    const rowCounts = rowCountValues.map(Number);

    if (!createForm.classroomId || !createForm.name.trim()) {
      showError("ข้อมูลไม่ครบ", "กรุณากรอกห้องเรียนและชื่อรถ");

      return;
    }

    try {
      setSavingAction("create");
      const response = await fetch(`/api/camps/${campId}/buses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classroomId: Number(createForm.classroomId),
          name: createForm.name,
          registrationPlate: "",
          floorCount,
          rowCounts,
          layoutTemplateId: layoutTemplate?.id,
        }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "สร้างรถไม่สำเร็จ");

      showSuccess("สร้างรถสำเร็จ", "ระบบสร้างผังตำแหน่งและรายชื่อนักเรียนแล้ว");
      setShowCreate(false);
      setCreateForm({
        classroomId: "",
        name: "",
        layoutTemplateId: "custom",
        floorCount: "1",
        rowCounts: [10],
      });
      await fetchBuses(data.busId);
    } catch (error: any) {
      showError("สร้างรถไม่สำเร็จ", error.message || "กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSavingAction(null);
    }
  };

  const handleUpdateBus = async () => {
    if (!selectedBus) return;

    const floorCount = Number(editBusForm.floorCount);
    const rowCountValues = editBusForm.rowCounts.slice(0, floorCount);

    if (
      rowCountValues.length !== floorCount ||
      rowCountValues.some((value) => value === "" || Number(value) < 1)
    ) {
      return;
    }

    const rowCounts = rowCountValues.map(Number);

    if (!editBusForm.name.trim()) {
      showError("ข้อมูลไม่ครบ", "กรุณากรอกชื่อรถ");

      return;
    }

    if (rowCounts.length !== floorCount) {
      showError("ข้อมูลไม่ถูกต้อง", "จำนวนแถวต้องตรงกับจำนวนชั้นของรถ");

      return;
    }

    try {
      setSavingAction("update");
      const response = await fetch(
        "/api/camps/" + campId + "/buses/" + selectedBus.busId,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: editBusForm.name,
            registrationPlate: selectedBus.registrationPlate || "",
            floorCount,
            rowCounts,
            layoutTemplateId: selectedLayoutTemplate?.id,
          }),
        },
      );
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "แก้ไขข้อมูลรถไม่สำเร็จ");

      setShowEditBus(false);
      showSuccess("บันทึกแล้ว", data.message || "อัปเดตข้อมูลรถเรียบร้อยแล้ว");
      await fetchBuses(selectedBus.busId);
    } catch (error: any) {
      showError(
        "แก้ไขข้อมูลรถไม่สำเร็จ",
        error.message || "กรุณาลองใหม่อีกครั้ง",
      );
    } finally {
      setSavingAction(null);
    }
  };

  const handleDeleteBus = async () => {
    if (!selectedBus) return;

    try {
      setSavingAction("delete");
      const response = await fetch(
        "/api/camps/" + campId + "/buses/" + selectedBus.busId,
        { method: "DELETE" },
      );
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || "ลบรถไม่สำเร็จ");

      setShowDeleteConfirm(false);
      setShowEditBus(false);
      setSelectedPositionId(null);
      await fetchBuses(null);
      showSuccess("ลบรถแล้ว", data.message || "ลบรถเรียบร้อยแล้ว");
    } catch (error: any) {
      showError("ลบรถไม่สำเร็จ", error.message || "กรุณาลองใหม่อีกครั้ง");
    } finally {
      setSavingAction(null);
    }
  };

  const setStudentAtPosition = (
    positionId: number,
    assignmentId: number | null,
  ) => {
    setDraftAssignments((current) => {
      const next = { ...current };

      Object.keys(next).forEach((key) => {
        const id = Number(key);

        if (next[id] === positionId || id === assignmentId) next[id] = null;
      });

      if (assignmentId !== null) next[assignmentId] = positionId;

      return next;
    });
  };

  const saveLayout = async (
    showMessage = true,
    action: SavingAction = "save",
  ) => {
    if (!selectedBus) return false;

    if (!hasAssignedSeat) {
      showError(
        "ยังจัดที่นั่งไม่ครบ",
        "กรุณาจัดที่นั่งให้นักเรียนอย่างน้อย 1 คนก่อนบันทึกผัง",
      );

      return false;
    }

    try {
      setSavingAction(action);
      const response = await fetch(
        `/api/camps/${campId}/buses/${selectedBus.busId}/layout`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            assignments: selectedBus.assignments.map((assignment) => ({
              assignmentId: assignment.assignmentId,
              positionId: draftAssignments[assignment.assignmentId] ?? null,
            })),
          }),
        },
      );
      const responseText = await response.text();
      let data: { error?: string; initialBoardingApplied?: boolean } = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = { error: responseText || "เซิร์ฟเวอร์ตอบกลับไม่ถูกต้อง" };
      }

      if (!response.ok) throw new Error(data.error || "บันทึกผังไม่สำเร็จ");

      if (showMessage) {
        showSuccess(
          "บันทึกแล้ว",
          data.initialBoardingApplied
            ? "บันทึกผังและเช็คชื่อขึ้นรถให้นักเรียนที่จัดที่นั่งแล้ว"
            : "อัปเดตผังที่นั่งเรียบร้อยแล้ว",
        );
      }
      await fetchBuses(selectedBus.busId);

      return true;
    } catch (error: any) {
      showError("บันทึกผังไม่สำเร็จ", error.message || "กรุณาลองใหม่อีกครั้ง");

      return false;
    } finally {
      setSavingAction(null);
    }
  };

  const requestSaveLayout = () => {
    if (unassignedStudents && unassignedStudents.length > 0) {
      setShowUnassignedConfirm(true);

      return;
    }

    void saveLayout();
  };

  const requestBusStatusChange = () => {
    if (!selectedBus) return;

    const nextStatus = selectedBus.status === "PARKED" ? "TRAVELING" : "PARKED";

    setPendingBusStatus(nextStatus);
    setParkClearPassengers(nextStatus === "PARKED" ? null : true);
  };

  const changeBusStatus = async (clearPassengers = true) => {
    if (!selectedBus || !pendingBusStatus) return;

    try {
      setSavingAction("status");
      const response = await fetch(
        `/api/camps/${campId}/buses/${selectedBus.busId}/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: pendingBusStatus,
            clearPassengers,
          }),
        },
      );
      const data = await response.json();

      if (!response.ok)
        throw new Error(data.error || "เปลี่ยนสถานะรถไม่สำเร็จ");

      showSuccess("อัปเดตสถานะรถแล้ว", data.message);
      setPendingBusStatus(null);
      setParkClearPassengers(null);
      await fetchBuses(selectedBus.busId);
    } catch (error: any) {
      showError(
        "เปลี่ยนสถานะรถไม่สำเร็จ",
        error.message || "กรุณาลองใหม่อีกครั้ง",
      );
    } finally {
      setSavingAction(null);
    }
  };

  const changeStudentBusStatus = async (assignment: Assignment) => {
    if (!selectedBus || changingAssignmentId !== null) return;

    const action = assignment.status === "ON_BUS" ? "alight" : "board";

    try {
      setChangingAssignmentId(assignment.assignmentId);
      const response = await fetch(
        `/api/camps/${campId}/buses/${selectedBus.busId}/${action}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assignmentId: assignment.assignmentId }),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "เปลี่ยนสถานะนักเรียนไม่สำเร็จ");
      }

      showSuccess(
        assignment.status === "ON_BUS"
          ? "บันทึกการลงรถแล้ว"
          : "บันทึกการขึ้นรถแล้ว",
        `${assignment.studentName} · บันทึกว่าครูเป็นผู้กดในรอบนี้แล้ว`,
      );
      await fetchBuses(selectedBus.busId);
    } catch (error: any) {
      showError(
        "เปลี่ยนสถานะนักเรียนไม่สำเร็จ",
        error.message || "กรุณาลองใหม่อีกครั้ง",
      );
    } finally {
      setChangingAssignmentId(null);
    }
  };

  const availableClassrooms = classrooms.filter(
    (classroom) => !classroom.busId,
  );
  const activePositionAssignmentId = selectedPositionId
    ? Object.entries(draftAssignments).find(
        ([, positionId]) => positionId === selectedPositionId,
      )?.[0]
    : undefined;
  const selectedPosition = selectedPositionId
    ? currentFloor?.positions.find(
        (position) => position.positionId === selectedPositionId,
      )
    : null;
  const orderedPositions = useMemo(
    () =>
      selectedBus
        ? selectedBus.floors
            .slice()
            .sort((a, b) => a.floorNumber - b.floorNumber)
            .flatMap((floor) =>
              floor.positions
                .slice()
                .sort(
                  (a, b) =>
                    a.rowNumber - b.rowNumber || a.seatIndex - b.seatIndex,
                )
                .map((position) => ({
                  ...position,
                  floorNumber: floor.floorNumber,
                })),
            )
        : [],
    [selectedBus],
  );
  const selectedPositionIndex = selectedPositionId
    ? orderedPositions.findIndex(
        (position) => position.positionId === selectedPositionId,
      )
    : -1;

  const activeAssignment = activePositionAssignmentId
    ? assignmentById.get(Number(activePositionAssignmentId)) || null
    : null;
  const seatedAssignmentIds = useMemo(
    () =>
      new Set(
        Object.entries(draftAssignments)
          .filter(
            ([, positionId]) => positionId !== null && positionId !== undefined,
          )
          .map(([assignmentId]) => Number(assignmentId)),
      ),
    [draftAssignments],
  );
  const studentCounts = useMemo(() => {
    const assignments = selectedBus?.assignments || [];

    return {
      all: assignments.length,
      registered: assignments.filter((assignment) => assignment.isRegistered)
        .length,
      unregistered: assignments.filter((assignment) => !assignment.isRegistered)
        .length,
    };
  }, [selectedBus]);
  const filteredAssignments = useMemo(() => {
    const query = studentSearch.trim().toLocaleLowerCase();

    return (selectedBus?.assignments || []).filter((assignment) => {
      const matchesStatus =
        Boolean(query) ||
        studentStatusFilter === "all" ||
        (studentStatusFilter === "registered"
          ? assignment.isRegistered
          : !assignment.isRegistered);
      const matchesSearch =
        !query ||
        assignment.studentName.toLocaleLowerCase().includes(query) ||
        String(assignment.studentId).includes(query);
      const isAlreadySeated = seatedAssignmentIds.has(assignment.assignmentId);

      return (
        matchesStatus && matchesSearch && (!isAlreadySeated || Boolean(query))
      );
    });
  }, [seatedAssignmentIds, selectedBus, studentSearch, studentStatusFilter]);

  const busStudentCounts = useMemo(() => {
    const assignments = selectedBus?.assignments || [];

    return {
      all: assignments.length,
      on: assignments.filter((assignment) => assignment.status === "ON_BUS")
        .length,
      off: assignments.filter((assignment) => assignment.status === "OFF_BUS")
        .length,
    };
  }, [selectedBus]);

  const seatedNotBoardedAssignments = useMemo(
    () =>
      (selectedBus?.assignments || []).filter(
        (assignment) =>
          assignment.positionId !== null && assignment.status !== "ON_BUS",
      ),
    [selectedBus],
  );
  const unseatedAssignments = useMemo(
    () =>
      (selectedBus?.assignments || []).filter(
        (assignment) => assignment.positionId === null,
      ),
    [selectedBus],
  );

  const filteredBusAssignments = useMemo(() => {
    const query = busStudentSearch.trim().toLocaleLowerCase();

    return (selectedBus?.assignments || []).filter((assignment) => {
      const matchesStatus =
        busStudentStatusFilter === "all" ||
        (busStudentStatusFilter === "on"
          ? assignment.status === "ON_BUS"
          : assignment.status === "OFF_BUS");
      const matchesSearch =
        !query ||
        assignment.studentName.toLocaleLowerCase().includes(query) ||
        String(assignment.studentId).includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [busStudentSearch, busStudentStatusFilter, selectedBus]);

  useEffect(() => {
    setStudentSearch("");
    setStudentStatusFilter("registered");
  }, [selectedPositionId]);

  useEffect(() => {
    setBusStudentSearch("");
    setBusStudentStatusFilter("all");
  }, [selectedBusId]);

  const moveToSeat = (direction: -1 | 1) => {
    if (selectedPositionIndex < 0) return;

    const nextPosition = orderedPositions[selectedPositionIndex + direction];

    if (!nextPosition) return;

    setSelectedFloor(nextPosition.floorNumber);
    setSelectedPositionId(nextPosition.positionId);
  };

  return (
    <Modal
      backdrop="blur"
      classNames={{
        base: pageMode
          ? "!m-0 !h-full !min-h-0 !max-h-none w-full !max-w-none rounded-none bg-[#f5f5f2] shadow-none"
          : "bg-white rounded-2xl shadow-xl max-h-[92vh]",
        backdrop: pageMode ? "hidden" : "bg-black/60 backdrop-blur-sm",
        wrapper: pageMode ? "camp-page-modal items-start p-0" : undefined,
      }}
      hideCloseButton={pageMode}
      isDismissable={!pageMode}
      isOpen={isOpen}
      scrollBehavior="inside"
      size="5xl"
      onOpenChange={onClose}
    >
      <ModalContent
        className={
          pageMode
            ? "bus-checkin-theme !m-0 !h-full !min-h-0 !max-h-none !rounded-none !bg-[#f5f5f2] !shadow-none overflow-y-auto"
            : "bus-checkin-theme"
        }
      >
        <ModalHeader
          className={`relative flex flex-col gap-1 px-6 ${
            pageMode
              ? "mx-auto w-full max-w-7xl border-0 pb-8 pt-8 sm:px-8"
              : "border-b border-gray-100 p-6 pb-4"
          }`}
        >
          {pageMode && (
            <button
              className="mb-6 inline-flex w-fit items-center gap-1 text-[11px] font-medium text-gray-600 transition-colors hover:text-gray-900"
              type="button"
              onClick={onClose}
            >
              <ArrowLeft size={14} />
              กลับไปยังหน้าหลัก
            </button>
          )}

          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2 text-[#6b857a]">
              <Bus size={pageMode ? 20 : 24} />
              <h2
                className={`${
                  pageMode ? "text-lg leading-tight" : "text-xl"
                } truncate font-bold text-gray-900`}
              >
                เช็คชื่อขึ้นรถ
              </h2>
            </div>
            <Button
              className="shrink-0 bg-[#6b857a] px-3 text-sm font-semibold text-white"
              size="sm"
              startContent={
                showCreate ? <ArrowLeft size={15} /> : <Plus size={15} />
              }
              onPress={() => {
                setShowCreate((current) => !current);
                setSelectedBusId(null);
              }}
            >
              {showCreate ? "กลับไปรายการรถ" : "สร้างรถ"}
            </Button>
          </div>
          {campName && (
            <p className="text-sm font-normal text-gray-500">
              ค่าย: {campName}
            </p>
          )}
        </ModalHeader>

        <ModalBody
          className={
            pageMode
              ? "mx-auto block w-full max-w-7xl overflow-visible bg-[#f5f5f2] px-4 pb-10 pt-0 sm:px-8"
              : "bg-[#f5f5f2]/30 p-4 sm:p-6"
          }
        >
          {loading && buses.length === 0 ? (
            <BusManagementSkeleton />
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  เลือกรถที่ต้องการจัดการ
                </p>
                <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
                  {buses.map((bus) => (
                    <button
                      key={bus.busId}
                      className={`whitespace-nowrap rounded-xl border px-3 py-2 text-left text-sm transition ${
                        selectedBusId === bus.busId
                          ? "border-[#6b857a] bg-[#6b857a] text-white"
                          : "border-gray-200 bg-gray-50 text-gray-700 hover:border-[#6b857a]"
                      }`}
                      onClick={() => {
                        setSelectedBusId(bus.busId);
                        setShowCreate(false);
                      }}
                    >
                      <span className="block font-medium">{bus.name}</span>
                    </button>
                  ))}
                  {buses.length === 0 && (
                    <p className="text-sm text-gray-500">ยังไม่มีรถในค่ายนี้</p>
                  )}
                </div>
              </div>

              {showCreate ? (
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-2">
                    <Plus className="text-[#6b857a]" size={20} />
                    <h3 className="font-bold text-gray-900">
                      สร้างรถสำหรับห้องเรียน
                    </h3>
                  </div>
                  {availableClassrooms.length === 0 ? (
                    <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                      ทุกห้องเรียนที่คุณดูแลมีรถแล้ว
                      หรือยังไม่มีห้องเรียนที่ลงทะเบียนในค่ายนี้
                    </p>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="text-sm font-semibold text-gray-700">
                        ห้องเรียน
                        <Select
                          aria-label="ห้องเรียน"
                          className="mt-1 w-full"
                          classNames={{
                            trigger:
                              "min-h-11 rounded-xl border border-gray-200 bg-white px-3 py-2.5 shadow-none",
                            value: "text-sm font-normal text-gray-800",
                            popoverContent:
                              "rounded-xl border border-gray-200 bg-white p-1 shadow-lg",
                          }}
                          placeholder="เลือกห้องเรียน"
                          selectedKeys={
                            createForm.classroomId
                              ? new Set([createForm.classroomId])
                              : new Set()
                          }
                          onSelectionChange={(keys) => {
                            const selectedValue = Array.from(keys)[0] || "";

                            setCreateForm((form) => ({
                              ...form,
                              classroomId: String(selectedValue),
                            }));
                          }}
                        >
                          {availableClassrooms.map((classroom) => (
                            <SelectItem
                              key={classroom.classroomId}
                              textValue={`${gradeLabel(classroom.grade)} ห้อง ${classroom.roomName}`}
                              className="rounded-lg text-sm text-gray-700 hover:bg-[#e2eee7] data-[selected=true]:bg-[#6b857a] data-[selected=true]:text-white"
                            >
                              {gradeLabel(classroom.grade)} ห้อง{" "}
                              {classroom.roomName} · {classroom.studentCount} คน
                            </SelectItem>
                          ))}
                        </Select>
                      </label>
                      <label className="text-sm font-semibold text-gray-700">
                        ชื่อรถ
                        <input
                          className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2.5 font-normal outline-none focus:border-[#6b857a]"
                          placeholder="เช่น คันที่1 ก123"
                          value={createForm.name}
                          onChange={(event) =>
                            setCreateForm((form) => ({
                              ...form,
                              name: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <div className="md:col-span-2">
                        <p className="text-sm font-semibold text-gray-700">
                          เทมเพลตผังรถ
                        </p>
                        <div className="mt-2 grid gap-3 sm:grid-cols-2">
                          <button
                            className={`rounded-2xl border p-4 text-left transition ${
                              createForm.layoutTemplateId === "custom"
                                ? "border-[#6b857a] bg-[#edf5f0] ring-2 ring-[#6b857a]/15"
                                : "border-gray-200 bg-white hover:border-[#9ab4a7]"
                            }`}
                            type="button"
                            onClick={() =>
                              setCreateForm((form) => ({
                                ...form,
                                layoutTemplateId: "custom",
                              }))
                            }
                          >
                            <span className="block text-sm font-bold text-gray-900">
                              ผังรถทั่วไป
                            </span>
                            <span className="mt-1 block text-xs font-normal text-gray-500">
                              กำหนดจำนวนชั้นและจำนวนแถวเอง
                            </span>
                          </button>
                          {BUS_LAYOUT_TEMPLATES.map((template) => (
                            <button
                              key={template.id}
                              className={`rounded-2xl border p-4 text-left transition ${
                                createForm.layoutTemplateId === template.id
                                  ? "border-[#6b857a] bg-[#edf5f0] ring-2 ring-[#6b857a]/15"
                                  : "border-gray-200 bg-white hover:border-[#9ab4a7]"
                              }`}
                              type="button"
                              onClick={() =>
                                setCreateForm((form) => ({
                                  ...form,
                                  name: form.name || template.defaultBusName,
                                  layoutTemplateId: template.id,
                                  floorCount: String(template.floors.length),
                                  rowCounts: template.floors.map(
                                    (floor) => floor.rowCount,
                                  ),
                                }))
                              }
                            >
                              <span className="flex items-center justify-between gap-2 text-sm font-bold text-gray-900">
                                {template.name}
                                <span className="rounded-full bg-[#dce9e1] px-2 py-0.5 text-[10px] font-semibold text-[#365f4f]">
                                  เจ้าประจำ
                                </span>
                              </span>
                              <span className="mt-1 block text-xs font-normal text-gray-500">
                                {template.description}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                      {createForm.layoutTemplateId === "custom" ? (
                        <>
                          <div className="text-sm font-semibold text-gray-700 md:col-span-2">
                            จำนวนชั้น
                            <FloorCountRadioGroup
                              name="create-floor-count"
                              value={createForm.floorCount}
                              onChange={(value) => {
                                const floorCount = Number(value);

                                setCreateForm((form) => ({
                                  ...form,
                                  floorCount: value,
                                  rowCounts:
                                    floorCount === 2
                                      ? [
                                          form.rowCounts[0] || 10,
                                          form.rowCounts[1] || 10,
                                        ]
                                      : [form.rowCounts[0] || 10],
                                }));
                              }}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-4 md:col-span-2">
                            {createForm.rowCounts
                              .map((rowCount, index) => ({ rowCount, index }))
                              .reverse()
                              .map(({ rowCount, index }) => (
                                <label
                                  key={index}
                                  className="text-sm font-semibold text-gray-700"
                                >
                                  {rowCountLabel(
                                    index + 1,
                                    Number(createForm.floorCount),
                                  )}
                                  <input
                                    className={[
                                      "mt-1 w-full rounded-xl border px-3 py-2.5 font-normal outline-none focus:border-[#6b857a]",
                                      rowCount === ""
                                        ? "border-red-400 bg-red-50"
                                        : "border-gray-200",
                                    ].join(" ")}
                                    inputMode="numeric"
                                    max={50}
                                    min={1}
                                    type="number"
                                    value={rowCount}
                                    onChange={(event) => {
                                      const value = event.target.value;

                                      setCreateForm((form) => ({
                                        ...form,
                                        rowCounts: form.rowCounts.map(
                                          (currentValue, rowIndex) =>
                                            rowIndex === index
                                              ? value === ""
                                                ? ""
                                                : Math.max(1, Number(value))
                                              : currentValue,
                                        ),
                                      }));
                                    }}
                                  />
                                  {rowCount === "" && (
                                    <span className="mt-1 block text-xs font-normal text-red-600">
                                      กรุณากรอกจำนวนแถว
                                    </span>
                                  )}
                                  <span className="mt-1 block text-xs font-normal text-gray-400">
                                    4 ที่นั่งต่อแถว
                                  </span>
                                </label>
                              ))}
                          </div>
                        </>
                      ) : (
                        <div className="rounded-xl border border-[#dce8e0] bg-[#f7faf8] px-4 py-3 text-xs leading-relaxed text-[#365f4f] md:col-span-2">
                          ระบบจะสร้างหมายเลขที่นั่ง 1–50 ตามผังจริงให้ทันที
                          พร้อมช่องว่างบริเวณบันได โซฟา โต๊ะกลาง และห้องน้ำ
                        </div>
                      )}
                      <div className="flex items-end justify-end gap-2 md:col-span-2">
                        {buses.length > 0 && (
                          <Button
                            variant="light"
                            onPress={() => setShowCreate(false)}
                          >
                            ยกเลิก
                          </Button>
                        )}
                        <Button
                          className="bg-[#6b857a] font-medium text-white"
                          isDisabled={savingAction !== null}
                          isLoading={savingAction === "create"}
                          onPress={handleCreate}
                        >
                          สร้างรถและผังตำแหน่ง
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : selectedBus ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div className="col-span-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:col-span-2">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-[#6b857a]">
                            <Bus size={20} />
                            <div className="min-w-0">
                              <p className="truncate font-bold text-gray-900">
                                {selectedBus.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                {gradeLabel(selectedBus.classroom.grade)} ห้อง{" "}
                                {selectedBus.classroom.roomName}
                              </p>
                            </div>
                          </div>
                          <p className="mt-2 text-xs text-gray-500">
                            ครูประจำชั้น:{" "}
                            {selectedBus.classroom.teacherName ||
                              "ไม่พบข้อมูลครู"}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 self-end sm:self-start">
                          <Button
                            className="bg-[#e2eee7] font-medium text-[#365f4f]"
                            isDisabled={savingAction !== null}
                            size="sm"
                            startContent={<Pencil size={15} />}
                            onPress={() => setShowEditBus(true)}
                          >
                            แก้ไขรถ
                          </Button>
                          <Button
                            className="bg-red-50 font-medium text-red-700"
                            isDisabled={savingAction !== null}
                            size="sm"
                            startContent={<Trash2 size={15} />}
                            onPress={() => setShowDeleteConfirm(true)}
                          >
                            ลบรถ
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                      <p className="text-xs text-gray-500">อยู่บนรถตอนนี้</p>
                      <p className="mt-1 text-2xl font-semibold text-[#6b857a]">
                        {selectedBus.checkedInCount} คน
                      </p>
                      <p className="mt-1 text-[11px] text-gray-400">
                        เช็คชื่อขึ้นรถแล้ว
                      </p>
                    </div>
                    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                      <p className="text-xs text-gray-500">สถานะรถ</p>
                      <p
                        className={`mt-1 font-bold ${selectedBus.status === "TRAVELING" ? "text-blue-600" : "text-green-600"}`}
                      >
                        {selectedBus.status === "TRAVELING"
                          ? "กำลังเดินทาง"
                          : "จอด"}
                      </p>
                    </div>
                  </div>

                  <div className="sticky top-0 z-10 -mx-1 rounded-2xl border border-[#d8e5de] bg-[#f7faf8]/95 p-3 shadow-sm backdrop-blur sm:static sm:mx-0">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${selectedBus.status === "TRAVELING" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"}`}
                        >
                          <Bus size={18} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-gray-900">
                            การดำเนินการรถ
                          </p>
                          <p className="truncate text-[11px] text-gray-500">
                            {selectedBus.status === "TRAVELING"
                              ? "กำลังเดินทาง"
                              : "รถจอดอยู่"}{" "}
                            · อยู่บนรถ {selectedBus.checkedInCount} คน
                          </p>
                        </div>
                      </div>
                      <Button
                        className={
                          selectedBus.status === "TRAVELING"
                            ? "min-h-11 min-w-[118px] shrink-0 bg-amber-100 px-3 text-xs font-medium text-amber-800"
                            : "min-h-11 min-w-[118px] shrink-0 bg-[#365f4f] px-3 text-xs font-medium text-white"
                        }
                        isDisabled={savingAction !== null || !hasAssignedSeat}
                        isLoading={savingAction === "status"}
                        size="sm"
                        onPress={requestBusStatusChange}
                      >
                        {selectedBus.status === "TRAVELING"
                          ? "รถถึงจุดแวะ"
                          : "เริ่มเดินทาง"}
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="flex items-center gap-2 font-bold text-gray-900">
                          <MapPin className="text-[#6b857a]" size={18} />
                          ผังตำแหน่งบนรถ
                        </h3>
                        <p className="mt-1 text-xs text-gray-500">
                          คลิกตำแหน่ง แล้วเลือกชื่อนักเรียนที่นั่งตรงนั้น
                        </p>
                        <p className="mt-1 text-[11px] text-gray-400">
                          {selectedLayoutTemplate
                            ? `ใช้เทมเพลต ${selectedLayoutTemplate.name} · หมายเลขที่นั่งตามผังจริง`
                            : "บันทึกผังครั้งแรก = อยู่บนรถแล้ว · A/D ติดหน้าต่าง · B/C ติดทางเดิน"}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
                          <span className="rounded-full bg-[#e8f2ed] px-2.5 py-1 font-semibold text-[#365f4f]">
                            จัดที่นั่งแล้ว {assignedCount} คน
                          </span>
                          {unassignedStudents?.length ? (
                            <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-700">
                              ยังไม่ได้จัด {unassignedStudents.length} คน
                            </span>
                          ) : (
                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-gray-500">
                              จัดที่นั่งครบแล้ว
                            </span>
                          )}
                        </div>
                      </div>
                      {selectedBus.floorCount > 1 && (
                        <div className="flex flex-wrap gap-2">
                          {selectedBus.floors
                            .slice()
                            .sort((a, b) => b.floorNumber - a.floorNumber)
                            .map((floor) => (
                              <button
                                key={floor.floorId}
                                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${selectedFloor === floor.floorNumber ? "bg-[#6b857a] text-white" : "bg-gray-100 text-gray-600"}`}
                                onClick={() =>
                                  setSelectedFloor(floor.floorNumber)
                                }
                              >
                                {floorLabel(
                                  floor.floorNumber,
                                  selectedBus.floorCount,
                                )}
                              </button>
                            ))}
                        </div>
                      )}
                    </div>

                    {currentFloor && (
                      <div className="mt-5 overflow-x-auto">
                        <div className="mx-auto min-w-[330px] max-w-xl rounded-[2rem] border-4 border-[#6b857a]/20 bg-[#f7faf8] p-4 sm:p-6">
                          <div className="mb-5 rounded-xl bg-[#dfeae3] py-2 text-center text-xs font-medium text-[#365f4f]">
                            ด้านหน้ารถ / คนขับ
                          </div>
                          <div className="space-y-2">
                            {Array.from(
                              { length: currentFloor.rowCount },
                              (_, rowIndex) => {
                                const rowPositions =
                                  currentFloor.positions.filter(
                                    (position) =>
                                      position.rowNumber === rowIndex + 1,
                                  );

                                return (
                                  <div
                                    key={rowIndex}
                                    className="grid grid-cols-[1fr_1fr_0.35fr_1fr_1fr] gap-1.5"
                                  >
                                    {rowPositions.map((position) => {
                                      const assignmentId = Object.entries(
                                        draftAssignments,
                                      ).find(
                                        ([, positionId]) =>
                                          positionId === position.positionId,
                                      )?.[0];
                                      const assignment = assignmentId
                                        ? assignmentById.get(
                                            Number(assignmentId),
                                          )
                                        : null;
                                      const seatStateClass = assignment
                                        ? assignment.status === "ON_BUS"
                                          ? "border-green-300 bg-green-50 text-green-800"
                                          : "border-gray-300 bg-gray-100 text-gray-600"
                                        : "border-gray-200 bg-white text-gray-600 hover:border-[#6b857a]";
                                      const isOnBus =
                                        assignment?.status === "ON_BUS";

                                      return (
                                        <button
                                          key={position.positionId}
                                          className={`min-h-16 min-w-0 overflow-hidden rounded-xl border p-1.5 text-center transition ${seatStateClass} ${selectedPositionId === position.positionId ? "border-[#365f4f] ring-2 ring-[#6b857a]/30" : ""} ${seatGridColumnClass(position.seatIndex)}`}
                                          disabled={savingAction !== null}
                                          title={
                                            assignment
                                              ? `${assignment.studentId} · ${assignment.studentName}`
                                              : `${position.label} ว่าง`
                                          }
                                          onClick={() =>
                                            setSelectedPositionId(
                                              position.positionId,
                                            )
                                          }
                                        >
                                          <span className="block text-[10px] font-semibold text-gray-700">
                                            {position.label}
                                          </span>
                                          {assignment ? (
                                            <>
                                              <span className="mt-1 block min-w-0 truncate text-[10px] font-medium">
                                                {assignment.studentName}
                                              </span>
                                              <span
                                                className={`mt-0.5 block text-[9px] font-semibold ${isOnBus ? "text-green-700" : "text-gray-500"}`}
                                              >
                                                {isOnBus
                                                  ? "อยู่บนรถ"
                                                  : "ไม่อยู่บนรถ"}
                                              </span>
                                            </>
                                          ) : (
                                            <span className="mt-2 block text-[11px] font-medium text-gray-600">
                                              ว่าง
                                            </span>
                                          )}
                                        </button>
                                      );
                                    })}
                                  </div>
                                );
                              },
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Save size={15} />
                        แก้ไขผังได้ตลอดเวลา
                        {!hasAssignedSeat
                          ? " · ต้องจัดที่นั่งอย่างน้อย 1 คนก่อนบันทึก"
                          : unassignedStudents?.length
                            ? ` · เหลือ ${unassignedStudents.length} คน รอยืนยันว่าไม่ร่วมเดินทาง`
                            : " · จัดที่นั่งครบแล้ว"}
                      </div>
                      <div className="flex justify-end gap-2 sm:ml-auto">
                        <Button
                          className="bg-[#365f4f] font-medium text-white"
                          isDisabled={savingAction !== null || !hasAssignedSeat}
                          isLoading={savingAction === "save"}
                          size="sm"
                          startContent={<Save size={15} />}
                          onPress={requestSaveLayout}
                        >
                          {selectedBus.lastDepartedAt === null
                            ? "บันทึกผังและเช็คชื่อเที่ยวแรก"
                            : "บันทึกผัง"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900">
                          รายชื่อนักเรียนบนรถ
                        </h3>
                        <p className="mt-1 text-xs text-gray-500">
                          อยู่บนรถ {busStudentCounts.on} · ไม่อยู่บนรถ{" "}
                          {busStudentCounts.off}
                          <span className="block">
                            กดปุ่มสถานะเพื่อยืนยันขึ้นหรือลงรถแทนนักเรียน
                          </span>
                        </p>
                      </div>
                      <div className="relative sm:w-64">
                        <Search
                          aria-hidden="true"
                          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                          size={16}
                        />
                        <input
                          aria-label="ค้นหารายชื่อนักเรียนบนรถ"
                          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#6b857a] focus:ring-2 focus:ring-[#6b857a]/15"
                          placeholder="ค้นหาชื่อนักเรียน"
                          value={busStudentSearch}
                          onChange={(event) =>
                            setBusStudentSearch(event.target.value)
                          }
                        />
                      </div>
                    </div>
                    <div
                      aria-label="กรองสถานะนักเรียนบนรถ"
                      className="mt-3 grid grid-cols-3 gap-1 rounded-xl bg-[#f4f7f5] p-1"
                      role="tablist"
                    >
                      {(
                        [
                          ["all", "ทั้งหมด", busStudentCounts.all],
                          ["on", "อยู่บนรถ", busStudentCounts.on],
                          ["off", "ไม่อยู่บนรถ", busStudentCounts.off],
                        ] as const
                      ).map(([value, label, count]) => (
                        <button
                          key={value}
                          aria-selected={busStudentStatusFilter === value}
                          className={
                            busStudentStatusFilter === value
                              ? "rounded-lg bg-white px-2 py-2 text-[11px] font-semibold text-[#365f4f] shadow-sm"
                              : "rounded-lg px-2 py-2 text-[11px] font-semibold text-gray-500"
                          }
                          role="tab"
                          type="button"
                          onClick={() => setBusStudentStatusFilter(value)}
                        >
                          {label} ({count})
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 max-h-64 space-y-1 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50 p-1.5">
                      {filteredBusAssignments.map((assignment) => (
                        <div
                          key={assignment.assignmentId}
                          className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2.5"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-800">
                              {assignment.studentName}
                            </p>
                            <p className="text-[11px] text-gray-400">
                              {assignment.studentId} ·{" "}
                              {assignment.positionLabel || "ยังไม่จัดที่นั่ง"}
                            </p>
                          </div>
                          <div className="flex min-w-0 flex-col items-end gap-1 text-right">
                            <Button
                              aria-label={`${assignment.studentName}: กดเปลี่ยนเป็น${assignment.status === "ON_BUS" ? "ไม่อยู่บนรถ" : "อยู่บนรถ"}`}
                              className={
                                assignment.status === "ON_BUS"
                                  ? "h-8 min-w-24 bg-green-100 px-3 text-[11px] font-semibold text-green-700"
                                  : "h-8 min-w-24 bg-gray-100 px-3 text-[11px] font-semibold text-gray-700"
                              }
                              isDisabled={
                                selectedBus.status === "TRAVELING" ||
                                changingAssignmentId !== null ||
                                (assignment.status === "OFF_BUS" &&
                                  assignment.positionId === null)
                              }
                              isLoading={
                                changingAssignmentId === assignment.assignmentId
                              }
                              size="sm"
                              variant="flat"
                              onPress={() =>
                                void changeStudentBusStatus(assignment)
                              }
                            >
                              {assignment.status === "ON_BUS"
                                ? "อยู่บนรถ"
                                : "ไม่อยู่บนรถ"}
                            </Button>
                            <p className="max-w-56 text-[9px] leading-snug text-gray-400">
                              {statusEventLabel(assignment.lastStatusEvent)}
                            </p>
                          </div>
                        </div>
                      ))}
                      {filteredBusAssignments.length === 0 && (
                        <p className="px-3 py-5 text-center text-xs text-gray-500">
                          ไม่พบรายชื่อนักเรียนตามเงื่อนไข
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-relaxed text-blue-800">
                    <div className="flex items-start gap-2">
                      <Users className="mt-0.5 shrink-0" size={16} />
                      <span>
                        การบันทึกผังครั้งแรกจะถือว่านักเรียนที่มีเบาะอยู่บนรถแล้ว
                        ในแต่ละรอบ ครูหรือนักเรียนกดยืนยันขึ้น–ลงรถได้
                        ระบบจะแสดงผู้กดและเวลาล่าสุดให้ตรวจสอบ
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white py-16 text-center">
                  <Bus className="mx-auto mb-3 text-gray-300" size={42} />
                  <p className="font-bold text-gray-700">
                    เลือกหรือสร้างรถเพื่อเริ่มจัดผัง
                  </p>
                </div>
              )}
            </div>
          )}
        </ModalBody>

        <Modal
          classNames={{
            wrapper: "z-[1200]",
            base: "z-[1200] rounded-3xl",
            backdrop: "z-[1190]",
            header: "border-b border-gray-100 px-5 py-4",
            body: "p-5",
            footer: "border-t border-gray-100 px-5 py-4",
          }}
          isOpen={showUnassignedConfirm}
          placement="center"
          size="sm"
          onOpenChange={setShowUnassignedConfirm}
        >
          <ModalContent>
            <ModalHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
                  <AlertTriangle size={20} />
                </div>
                <p className="text-lg font-bold text-gray-900">
                  ยืนยันรายชื่อที่ไม่ร่วมเดินทาง
                </p>
              </div>
            </ModalHeader>
            <ModalBody>
              <p className="text-sm leading-relaxed text-gray-700">
                นักเรียนต่อไปนี้ยังไม่ได้จัดเบาะ
                ระบบจะถือว่าไม่ร่วมเดินทางในเที่ยวนี้
              </p>
              <div className="mt-3 max-h-56 overflow-y-auto rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-900">
                {unassignedStudents?.map((assignment) => (
                  <p key={assignment.assignmentId}>{assignment.studentName}</p>
                ))}
              </div>
              <p className="mt-3 text-xs leading-relaxed text-gray-500">
                {selectedBus?.lastDepartedAt === null
                  ? "ผู้ที่จัดเบาะแล้วจะถูกเช็คชื่อว่าอยู่บนรถ ส่วนรายชื่อข้างต้นจะไม่ถูกนับรวมในเที่ยวนี้"
                  : "รายชื่อข้างต้นจะไม่ถูกนับรวมในเที่ยวนี้ ครูหรือนักเรียนสามารถกดยืนยันขึ้นรถในรอบนี้ได้"}
              </p>
            </ModalBody>
            <ModalFooter className="flex justify-end gap-2">
              <Button
                className="font-medium text-gray-600"
                isDisabled={savingAction !== null}
                variant="light"
                onPress={() => setShowUnassignedConfirm(false)}
              >
                กลับไปจัดเบาะ
              </Button>
              <Button
                className="bg-[#365f4f] font-medium text-white"
                isLoading={savingAction === "save"}
                onPress={() => {
                  setShowUnassignedConfirm(false);
                  void saveLayout();
                }}
              >
                ยืนยันและบันทึกผัง
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <Modal
          classNames={{
            wrapper: "z-[1100]",
            base: "z-[1100] max-h-[88vh] overflow-hidden rounded-3xl",
            backdrop: "z-[1090]",
            header: "border-b border-gray-100 bg-white px-5 py-4",
            body: "gap-4 bg-[#f7faf8] p-4",
            footer: "border-t border-gray-100 bg-white px-5 py-4",
          }}
          isOpen={selectedPositionId !== null}
          placement="center"
          scrollBehavior="inside"
          size="md"
          onOpenChange={(open) => {
            if (!open) setSelectedPositionId(null);
          }}
        >
          <ModalContent>
            <ModalHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#e2eee7] text-[#365f4f]">
                  <MapPin size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-base font-bold text-gray-900">
                    จัดที่นั่งนักเรียน
                  </p>
                  <p className="mt-1 text-sm font-semibold text-[#365f4f]">
                    {selectedPosition?.label || "ที่เลือก"}
                    {hasMultipleFloors
                      ? " · " +
                        floorLabel(selectedFloor, selectedBus?.floorCount || 1)
                      : ""}
                  </p>
                </div>
              </div>
            </ModalHeader>
            <ModalBody>
              {activeAssignment && (
                <div className="rounded-xl border border-[#dce8e0] bg-white px-3 py-2.5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-500">
                        นักเรียนประจำเบาะนี้
                      </p>
                      <p className="mt-0.5 break-words text-xs font-semibold text-gray-900">
                        {activeAssignment.studentId} ·{" "}
                        {activeAssignment.studentName}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${activeAssignment.status === "ON_BUS" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}
                    >
                      {activeAssignment.status === "ON_BUS"
                        ? "อยู่บนรถ"
                        : "ไม่อยู่บนรถ"}
                    </span>
                  </div>
                  <p className="mt-1 text-[10px] leading-relaxed text-gray-500">
                    {statusEventLabel(activeAssignment.lastStatusEvent)}
                  </p>
                  <Button
                    aria-label={`${activeAssignment.studentName}: กดเปลี่ยนเป็น${activeAssignment.status === "ON_BUS" ? "ไม่อยู่บนรถ" : "อยู่บนรถ"}`}
                    className={
                      activeAssignment.status === "ON_BUS"
                        ? "mt-3 w-full bg-gray-100 font-semibold text-gray-700"
                        : "mt-3 w-full bg-[#365f4f] font-semibold text-white"
                    }
                    isDisabled={
                      selectedBus?.status === "TRAVELING" ||
                      changingAssignmentId !== null
                    }
                    isLoading={
                      changingAssignmentId === activeAssignment.assignmentId
                    }
                    size="sm"
                    onPress={() =>
                      void changeStudentBusStatus(activeAssignment)
                    }
                  >
                    {selectedBus?.status === "TRAVELING"
                      ? "เปลี่ยนสถานะได้เมื่อรถจอด"
                      : activeAssignment.status === "ON_BUS"
                        ? "กดยืนยันว่าลงจากรถ"
                        : "กดยืนยันว่าขึ้นรถ"}
                  </Button>
                </div>
              )}

              <div className="rounded-2xl border border-[#dce8e0] bg-white p-3 shadow-sm">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      พรีวิวผังที่นั่ง
                    </p>
                  </div>
                  {hasMultipleFloors && (
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {selectedBus?.floors
                        .slice()
                        .sort((a, b) => b.floorNumber - a.floorNumber)
                        .map((floor) => (
                          <button
                            key={floor.floorId}
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                              selectedFloor === floor.floorNumber
                                ? "bg-[#365f4f] text-white"
                                : "bg-[#e2eee7] text-[#365f4f] hover:bg-[#cfe0d6]"
                            }`}
                            aria-pressed={selectedFloor === floor.floorNumber}
                            type="button"
                            onClick={() => setSelectedFloor(floor.floorNumber)}
                          >
                            {floorLabel(
                              floor.floorNumber,
                              selectedBus?.floorCount || 1,
                            )}
                          </button>
                        ))}
                    </div>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto rounded-xl bg-[#f7faf8] p-2">
                  {currentFloor ? (
                    <div className="space-y-1.5">
                      {Array.from(
                        { length: currentFloor.rowCount },
                        (_, rowIndex) => {
                          const rowPositions = currentFloor.positions.filter(
                            (position) => position.rowNumber === rowIndex + 1,
                          );

                          return (
                            <div
                              key={rowIndex}
                              className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_0.35fr_minmax(0,1fr)_minmax(0,1fr)] gap-1"
                            >
                              {rowPositions.map((position) => {
                                const assignmentId = Object.entries(
                                  draftAssignments,
                                ).find(
                                  ([, positionId]) =>
                                    positionId === position.positionId,
                                )?.[0];
                                const assignment = assignmentId
                                  ? assignmentById.get(Number(assignmentId))
                                  : null;
                                const isCurrent =
                                  selectedPositionId === position.positionId;
                                const seatStateClass = assignment
                                  ? assignment.status === "ON_BUS"
                                    ? "border-green-200 bg-green-50 text-green-800"
                                    : "border-gray-300 bg-gray-100 text-gray-600"
                                  : "border-gray-200 bg-white text-gray-600";

                                return (
                                  <button
                                    key={position.positionId}
                                    className={[
                                      "min-h-11 min-w-0 overflow-hidden rounded-lg border px-1 py-1 text-center transition",
                                      seatStateClass,
                                      isCurrent
                                        ? "border-[#365f4f] ring-2 ring-[#6b857a]/30 shadow-sm"
                                        : "",
                                      seatGridColumnClass(position.seatIndex),
                                    ].join(" ")}
                                    type="button"
                                    onClick={() =>
                                      setSelectedPositionId(position.positionId)
                                    }
                                  >
                                    <span className="block text-[10px] font-semibold">
                                      {position.label}
                                    </span>
                                    <span className="mt-0.5 block min-w-0 truncate text-[9px] font-normal">
                                      {assignment?.studentName || "ว่าง"}
                                    </span>
                                    {assignment && (
                                      <span className="mt-0.5 block text-[8px] font-semibold">
                                        {assignment.status === "ON_BUS"
                                          ? "อยู่บนรถ"
                                          : "ไม่อยู่บนรถ"}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          );
                        },
                      )}
                    </div>
                  ) : (
                    <p className="py-6 text-center text-xs text-gray-500">
                      ไม่พบผังที่นั่ง
                    </p>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-4 text-[11px] text-gray-500">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                    อยู่บนรถ
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-gray-300" />
                    ไม่อยู่บนรถ
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded border-2 border-[#365f4f]" />
                    เบาะที่เลือก
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-gray-800">
                      เลือกนักเรียนสำหรับเบาะนี้
                    </p>
                    <p className="mt-1 text-[11px] font-normal text-gray-500">
                      ค้นหาและเลือกชื่อเพื่อจัดหรือเปลี่ยนที่นั่ง
                    </p>
                  </div>
                  {activeAssignment && (
                    <span className="shrink-0 rounded-full bg-[#e2eee7] px-2 py-1 text-[10px] font-semibold text-[#365f4f]">
                      เลือกอยู่
                    </span>
                  )}
                </div>

                <div className="relative mt-3">
                  <Search
                    aria-hidden="true"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={16}
                  />
                  <input
                    aria-label="ค้นหานักเรียน"
                    className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm font-normal text-gray-800 outline-none transition placeholder:text-gray-400 focus:border-[#6b857a] focus:ring-2 focus:ring-[#6b857a]/15"
                    placeholder="ค้นหาชื่อหรือรหัสนักเรียน"
                    value={studentSearch}
                    onChange={(event) => setStudentSearch(event.target.value)}
                  />
                </div>

                {studentSearch.trim() ? (
                  <div className="mt-3 rounded-xl bg-[#e8f2ed] px-3 py-2 text-[11px] font-medium text-[#365f4f]">
                    กำลังค้นหาจากนักเรียนทั้งหมด ระบบจะข้ามตัวกรองสถานะ
                  </div>
                ) : (
                  <div
                    aria-label="กรองสถานะการลงทะเบียน"
                    className="mt-3 grid grid-cols-3 gap-1 rounded-xl bg-[#f4f7f5] p-1"
                    role="tablist"
                  >
                    {(
                      [
                        ["all", "ทั้งหมด", studentCounts.all],
                        [
                          "registered",
                          "ลงทะเบียนแล้ว",
                          studentCounts.registered,
                        ],
                        [
                          "unregistered",
                          "ยังไม่ลงทะเบียน",
                          studentCounts.unregistered,
                        ],
                      ] as const
                    ).map(([value, label, count]) => (
                      <button
                        key={value}
                        aria-selected={studentStatusFilter === value}
                        className={
                          studentStatusFilter === value
                            ? "rounded-lg bg-white px-2 py-2 text-[11px] font-semibold text-[#365f4f] shadow-sm"
                            : "rounded-lg px-2 py-2 text-[11px] font-semibold text-gray-500 transition hover:text-gray-700"
                        }
                        role="tab"
                        type="button"
                        onClick={() => setStudentStatusFilter(value)}
                      >
                        {label} ({count})
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-3 h-56 space-y-1 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50 p-1.5">
                  <button
                    className={
                      !activeAssignment
                        ? "flex h-10 min-h-10 w-full items-center justify-between rounded-lg bg-[#e2eee7] px-3 py-0 text-left text-xs font-semibold text-[#365f4f]"
                        : "flex h-10 min-h-10 w-full items-center justify-between rounded-lg px-3 py-0 text-left text-xs text-gray-600 transition hover:bg-white"
                    }
                    type="button"
                    onClick={() => {
                      if (selectedPositionId !== null)
                        setStudentAtPosition(selectedPositionId, null);
                    }}
                  >
                    <span>-- ว่าง --</span>
                    {!activeAssignment && <span>✓</span>}
                  </button>

                  {filteredAssignments.map((assignment) => {
                    const isAlreadySeated = seatedAssignmentIds.has(
                      assignment.assignmentId,
                    );

                    return (
                      <button
                        key={assignment.assignmentId}
                        disabled={isAlreadySeated}
                        className={
                          isAlreadySeated
                            ? "flex h-10 min-h-10 w-full cursor-not-allowed items-center gap-2 rounded-lg bg-gray-100 px-3 py-0 text-left text-gray-400"
                            : "flex h-10 min-h-10 w-full items-center gap-2 rounded-lg px-3 py-0 text-left text-gray-700 transition hover:bg-white"
                        }
                        type="button"
                        onClick={() => {
                          if (selectedPositionId !== null && !isAlreadySeated) {
                            setStudentAtPosition(
                              selectedPositionId,
                              assignment.assignmentId,
                            );
                          }
                        }}
                      >
                        <span className="min-w-0 flex-1 truncate text-xs font-medium">
                          {assignment.studentId} · {assignment.studentName}
                        </span>
                        {isAlreadySeated && (
                          <span className="shrink-0 text-[10px] font-semibold text-gray-500">
                            มีที่นั่งแล้ว
                          </span>
                        )}
                      </button>
                    );
                  })}

                  {filteredAssignments.length === 0 && (
                    <p className="px-3 py-5 text-center text-xs text-gray-500">
                      ไม่พบรายชื่อนักเรียนตามเงื่อนไข
                    </p>
                  )}
                </div>

                <p className="mt-2 text-[11px] font-normal text-gray-500">
                  นักเรียนที่ยังไม่ลงทะเบียนจะถูกผูกที่นั่งไว้ก่อนเท่านั้น
                  เมื่อลงทะเบียนแล้วจะกดขึ้นรถได้ทันที
                </p>
              </div>
            </ModalBody>
            <ModalFooter className="flex flex-col gap-2">
              <div className="flex w-full gap-2">
                <Button
                  className="flex-1 font-medium text-gray-700"
                  isDisabled={selectedPositionIndex <= 0}
                  startContent={<ChevronLeft size={16} />}
                  variant="flat"
                  onPress={() => moveToSeat(-1)}
                >
                  เบาะก่อนหน้า
                </Button>
                <Button
                  className="flex-1 bg-[#e2eee7] font-medium text-[#365f4f]"
                  endContent={<ChevronRight size={16} />}
                  isDisabled={
                    selectedPositionIndex < 0 ||
                    selectedPositionIndex >= orderedPositions.length - 1
                  }
                  onPress={() => moveToSeat(1)}
                >
                  เบาะถัดไป
                </Button>
              </div>
              <Button
                className="w-full bg-[#365f4f] font-semibold text-white"
                isDisabled={savingAction !== null || !hasAssignedSeat}
                isLoading={savingAction === "save"}
                startContent={<Save size={16} />}
                onPress={requestSaveLayout}
              >
                บันทึกผัง
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <Modal
          classNames={{
            base: "rounded-3xl",
            header: "border-b border-gray-100 px-5 py-4",
            body: "p-5",
            footer: "border-t border-gray-100 px-5 py-4",
          }}
          isOpen={pendingBusStatus !== null}
          placement="center"
          size="sm"
          onOpenChange={(open) => {
            if (!open && savingAction !== "status") {
              setPendingBusStatus(null);
              setParkClearPassengers(null);
            }
          }}
        >
          <ModalContent>
            <ModalHeader>
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                    pendingBusStatus === "TRAVELING"
                      ? "bg-[#e2eee7] text-[#365f4f]"
                      : "bg-[#e8f2ed] text-[#3d6357]"
                  }`}
                >
                  {pendingBusStatus === "TRAVELING" ? (
                    <Bus size={20} />
                  ) : (
                    <MapPin size={20} />
                  )}
                </div>
                <p className="text-lg font-bold text-gray-900">
                  {pendingBusStatus === "TRAVELING"
                    ? "ยืนยันเริ่มเดินทาง"
                    : "รถถึงจุดแวะแล้ว"}
                </p>
              </div>
            </ModalHeader>
            <ModalBody>
              {pendingBusStatus === "TRAVELING" ? (
                <div className="space-y-3 text-sm leading-relaxed text-gray-700">
                  <div>
                    <p className="font-semibold text-gray-900">
                      ตรวจสอบรายชื่อก่อนออกรถ
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      ระบบแยกนักเรียนที่มีเบาะแต่ยังไม่เช็คชื่อออกจากผู้ที่ยังไม่มีเบาะ
                    </p>
                  </div>

                  {seatedNotBoardedAssignments.length > 0 ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold">
                          ต้องตรวจสอบก่อนออกรถ · มีเบาะแต่ยังไม่เช็คชื่อ
                        </p>
                        <span className="shrink-0 rounded-full bg-amber-200 px-2 py-0.5 font-bold text-amber-900">
                          {seatedNotBoardedAssignments.length} คน
                        </span>
                      </div>
                      <div className="mt-2 max-h-32 space-y-0.5 overflow-y-auto border-t border-amber-200/70 pt-2">
                        {seatedNotBoardedAssignments.map((assignment) => (
                          <p key={assignment.assignmentId}>
                            <span className="font-semibold">
                              เบาะ {assignment.positionLabel || "ไม่ทราบ"}
                              {floorSuffix(
                                assignment.floorNumber,
                                selectedBus?.floorCount || 1,
                              )}
                            </span>{" "}
                            — {assignment.studentId} · {assignment.studentName}
                          </p>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2.5 text-xs text-green-800">
                      ไม่พบผู้ที่มีเบาะแล้วแต่ยังไม่เช็คชื่อขึ้นรถ
                    </div>
                  )}

                  {unseatedAssignments.length > 0 && (
                    <div className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs text-gray-600">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-gray-700">
                          ยังไม่มีเบาะ · อาจลา/ไม่ร่วมเดินทาง
                        </p>
                        <span className="shrink-0 rounded-full bg-gray-200 px-2 py-0.5 font-bold text-gray-600">
                          {unseatedAssignments.length} คน
                        </span>
                      </div>
                      <p className="mt-1 leading-relaxed">
                        กลุ่มนี้ยังไม่ถือว่าตกรถ
                        เพราะยังไม่ได้จัดให้ร่วมเดินทางในเที่ยวนี้
                      </p>
                      <details className="mt-2">
                        <summary className="cursor-pointer font-semibold text-gray-700">
                          ดูรายชื่อกลุ่มนี้
                        </summary>
                        <div className="mt-2 max-h-24 space-y-0.5 overflow-y-auto border-t border-gray-200 pt-2">
                          {unseatedAssignments.map((assignment) => (
                            <p key={assignment.assignmentId}>
                              {assignment.studentId} · {assignment.studentName}
                            </p>
                          ))}
                        </div>
                      </details>
                    </div>
                  )}

                  <p className="text-xs text-gray-500">
                    ตรวจสอบกลุ่มสีเหลืองแล้ว หากพร้อมเดินทางให้ยืนยันต่อได้
                  </p>
                </div>
              ) : (
                <div className="space-y-4 text-sm leading-relaxed text-gray-700">
                  <div>
                    <p className="font-semibold text-gray-900">
                      นักเรียนจะลงจากรถอย่างไร?
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      เลือก 1 วิธี แล้วกดยืนยันการจอดรถ
                    </p>
                  </div>

                  <div className="grid gap-3">
                    <button
                      aria-pressed={parkClearPassengers === false}
                      className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-[#5d7c6f]/30 ${
                        parkClearPassengers === false
                          ? "border-[#5d7c6f] bg-[#f1f7f4] ring-2 ring-[#5d7c6f]/15"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                      type="button"
                      onClick={() => setParkClearPassengers(false)}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#e8f2ed] text-[#3d6357]">
                        <UserCheck size={18} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2 font-semibold text-gray-900">
                          ให้นักเรียนกดยืนยันลงรถเอง
                          {parkClearPassengers === false && (
                            <Check
                              className="shrink-0 text-[#3d6357]"
                              size={18}
                            />
                          )}
                        </span>
                        <span className="mt-1 block text-xs leading-relaxed text-gray-500">
                          นักเรียนแต่ละคนกด “ลงจากรถแล้ว” หลังรถจอด
                        </span>
                      </span>
                    </button>

                    <button
                      aria-pressed={parkClearPassengers === true}
                      className={`flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-amber-400/30 ${
                        parkClearPassengers === true
                          ? "border-amber-400 bg-amber-50 ring-2 ring-amber-200/60"
                          : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                      type="button"
                      onClick={() => setParkClearPassengers(true)}
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                        <Users size={18} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2 font-semibold text-gray-900">
                          เปลี่ยนสถานะเป็นลงจากรถทุกคน
                          {parkClearPassengers === true && (
                            <Check
                              className="shrink-0 text-amber-700"
                              size={18}
                            />
                          )}
                        </span>
                        <span className="mt-1 block text-xs leading-relaxed text-gray-500">
                          เปลี่ยนนักเรียนที่อยู่บนรถเป็น “ลงจากรถแล้ว” ทันที
                        </span>
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </ModalBody>
            <ModalFooter className="flex flex-row items-center justify-end gap-2">
              <Button
                className="min-w-0 flex-1 font-medium text-gray-600 sm:flex-none"
                isDisabled={savingAction !== null}
                variant="light"
                onPress={() => {
                  setPendingBusStatus(null);
                  setParkClearPassengers(null);
                }}
              >
                ยกเลิก
              </Button>
              {pendingBusStatus === "TRAVELING" ? (
                <Button
                  className="min-w-0 flex-1 bg-[#365f4f] font-medium text-white sm:flex-none"
                  isLoading={savingAction === "status"}
                  onPress={() => void changeBusStatus()}
                >
                  ยืนยันเริ่มเดินทาง
                </Button>
              ) : (
                <Button
                  className="min-w-0 flex-1 bg-[#365f4f] font-semibold text-white sm:flex-none"
                  isDisabled={
                    savingAction !== null || parkClearPassengers === null
                  }
                  isLoading={savingAction === "status"}
                  onPress={() =>
                    void changeBusStatus(parkClearPassengers ?? false)
                  }
                >
                  ยืนยันการจอดรถ
                </Button>
              )}
            </ModalFooter>
          </ModalContent>
        </Modal>

        <Modal
          classNames={{
            base: "rounded-3xl",
            header: "border-b border-gray-100 px-5 py-4",
            body: "bg-[#f7faf8] p-5",
            footer: "border-t border-gray-100 px-5 py-4",
          }}
          isOpen={showEditBus}
          placement="center"
          size="md"
          onOpenChange={setShowEditBus}
        >
          <ModalContent>
            <ModalHeader>
              <div>
                <p className="text-lg font-bold text-gray-900">
                  แก้ไขข้อมูลรถและผัง
                </p>
                <p className="mt-1 text-xs font-normal text-gray-500">
                  {selectedLayoutTemplate
                    ? "แก้ไขชื่อรถได้ โดยระบบจะรักษาผังเทมเพลตเดิมไว้"
                    : "ปรับจำนวนชั้นและจำนวนแถว แล้วบันทึกได้ตลอดเวลา"}
                </p>
              </div>
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700">
                  ชื่อรถ
                  <input
                    className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 font-normal outline-none transition focus:border-[#6b857a] focus:ring-2 focus:ring-[#6b857a]/15"
                    value={editBusForm.name}
                    onChange={(event) =>
                      setEditBusForm((form) => ({
                        ...form,
                        name: event.target.value,
                      }))
                    }
                  />
                </label>
                {selectedLayoutTemplate ? (
                  <div className="rounded-2xl border border-[#cfe0d6] bg-[#edf5f0] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-[#365f4f]">
                          {selectedLayoutTemplate.name}
                        </p>
                        <p className="mt-1 text-xs text-[#587466]">
                          {selectedLayoutTemplate.description}
                        </p>
                      </div>
                      <Check className="shrink-0 text-[#6b857a]" size={20} />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="block text-sm font-semibold text-gray-700">
                      จำนวนชั้น
                      <FloorCountRadioGroup
                        disabled={savingAction !== null}
                        name="edit-floor-count"
                        value={editBusForm.floorCount}
                        onChange={(value) => {
                          const floorCount = Number(value);

                          setEditBusForm((form) => ({
                            ...form,
                            floorCount: value,
                            rowCounts:
                              floorCount === 2
                                ? [
                                    form.rowCounts[0] || 10,
                                    form.rowCounts[1] || 10,
                                  ]
                                : [form.rowCounts[0] || 10],
                          }));
                        }}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {editBusForm.rowCounts
                        .map((rowCount, index) => ({ rowCount, index }))
                        .reverse()
                        .map(({ rowCount, index }) => (
                          <label
                            key={index}
                            className="block text-sm font-semibold text-gray-700"
                          >
                            {rowCountLabel(
                              index + 1,
                              Number(editBusForm.floorCount),
                            )}
                            <input
                              className={[
                                "mt-1 w-full rounded-xl border bg-white px-3 py-2.5 font-normal outline-none transition focus:border-[#6b857a] focus:ring-2 focus:ring-[#6b857a]/15 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400",
                                rowCount === ""
                                  ? "border-red-400 bg-red-50"
                                  : "border-gray-200",
                              ].join(" ")}
                              disabled={savingAction !== null}
                              max={50}
                              min={1}
                              type="number"
                              value={rowCount}
                              onChange={(event) => {
                                const value = event.target.value;

                                setEditBusForm((form) => ({
                                  ...form,
                                  rowCounts: form.rowCounts.map(
                                    (currentValue, rowIndex) =>
                                      rowIndex === index
                                        ? value === ""
                                          ? ""
                                          : Math.max(1, Number(value))
                                        : currentValue,
                                  ),
                                }));
                              }}
                            />
                            {rowCount === "" && (
                              <span className="mt-1 block text-xs font-normal text-red-600">
                                กรุณากรอกจำนวนแถว
                              </span>
                            )}
                          </label>
                        ))}
                    </div>
                  </div>
                )}

                <div className="rounded-xl bg-blue-50 px-3 py-2.5 text-xs leading-relaxed text-blue-800">
                  สามารถกลับมาแก้ไขผังและกดบันทึกได้ตลอดเวลา
                </div>
              </div>
            </ModalBody>
            <ModalFooter className="flex justify-end gap-2">
              <Button
                className="font-medium text-gray-600"
                isDisabled={savingAction !== null}
                variant="light"
                onPress={() => setShowEditBus(false)}
              >
                ยกเลิก
              </Button>
              <Button
                className="bg-[#365f4f] font-medium text-white"
                isLoading={savingAction === "update"}
                onPress={() => void handleUpdateBus()}
              >
                บันทึกข้อมูลรถ
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <Modal
          classNames={{
            base: "rounded-3xl",
            header: "border-b border-gray-100 px-5 py-4",
            body: "p-5",
            footer: "border-t border-gray-100 px-5 py-4",
          }}
          isOpen={showDeleteConfirm}
          placement="center"
          size="sm"
          onOpenChange={setShowDeleteConfirm}
        >
          <ModalContent>
            <ModalHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                  <AlertTriangle size={20} />
                </div>
                <p className="text-lg font-bold text-gray-900">ยืนยันการลบรถ</p>
              </div>
            </ModalHeader>
            <ModalBody>
              <p className="text-sm leading-relaxed text-gray-700">
                ต้องการลบรถ{" "}
                <span className="font-bold text-gray-900">
                  {selectedBus?.name || "-"}
                </span>{" "}
                ใช่หรือไม่?
              </p>
              <p className="mt-2 rounded-xl bg-red-50 px-3 py-2.5 text-xs leading-relaxed text-red-700">
                การลบจะนำผังที่นั่งและการจัดนักเรียนออกจากรถคันนี้
                และไม่สามารถย้อนกลับได้
              </p>
            </ModalBody>
            <ModalFooter className="flex justify-end gap-2">
              <Button
                className="font-medium text-gray-600"
                isDisabled={savingAction !== null}
                variant="light"
                onPress={() => setShowDeleteConfirm(false)}
              >
                ยกเลิก
              </Button>
              <Button
                className="bg-red-600 font-medium text-white"
                isLoading={savingAction === "delete"}
                onPress={() => void handleDeleteBus()}
              >
                ยืนยันลบรถ
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </ModalContent>
    </Modal>
  );
}
