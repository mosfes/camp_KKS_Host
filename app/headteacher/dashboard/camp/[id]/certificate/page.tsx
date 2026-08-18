"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import EditCertificateModal from "../../EditCertificateModal";

export default function CertificatePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const campId = Number(params.id);
  const [camp, setCamp] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/camps/${campId}?view=certificate`)
      .then((response) => (response.ok ? response.json() : null))
      .then(setCamp);
  }, [campId]);

  if (!camp) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f5f2]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#6b857a] border-t-transparent" />
      </div>
    );
  }

  return (
    <EditCertificateModal
      campData={camp}
      isOpen
      pageMode
      onClose={() => router.push("/headteacher/dashboard")}
      onSuccess={() => undefined}
    />
  );
}
