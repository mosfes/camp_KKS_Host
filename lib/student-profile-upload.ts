const MAX_PROFILE_UPLOAD_BYTES = 5 * 1024 * 1024;

interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  publicId: string;
  uploadPreset: string;
  transformation: string;
  overwrite: boolean;
  invalidate: boolean;
  signature: string;
}

interface ProfileUploadResponse {
  url: string;
  publicId: string;
  bytes: number;
  width: number | null;
  height: number | null;
  format: string | null;
}

async function readJson(response: Response) {
  return response.json().catch(() => ({}));
}

/**
 * Upload a student profile image directly from the browser to Cloudinary.
 * The app server only signs the request and validates the resulting asset.
 */
export async function uploadStudentProfileImage(
  file: File,
): Promise<ProfileUploadResponse> {
  if (file.size > MAX_PROFILE_UPLOAD_BYTES) {
    throw new Error("ขนาดไฟล์รูปโปรไฟล์ต้องไม่เกิน 5MB");
  }

  const signatureResponse = await fetch(
    "/api/student/profile/upload-signature",
    { method: "POST" },
  );
  const signatureData = (await readJson(
    signatureResponse,
  )) as Partial<UploadSignature> & {
    error?: string;
  };

  if (!signatureResponse.ok) {
    throw new Error(
      signatureData.error || "ไม่สามารถเตรียมการอัปโหลดรูปโปรไฟล์ได้",
    );
  }

  const requiredFields: (keyof UploadSignature)[] = [
    "cloudName",
    "apiKey",
    "timestamp",
    "folder",
    "publicId",
    "uploadPreset",
    "transformation",
    "signature",
  ];

  if (requiredFields.some((field) => !signatureData[field])) {
    throw new Error("ข้อมูลการอัปโหลดรูปโปรไฟล์ไม่ครบถ้วน");
  }

  const formData = new FormData();

  formData.append("file", file, file.name || "student-profile.jpg");
  formData.append("api_key", signatureData.apiKey!);
  formData.append("timestamp", String(signatureData.timestamp));
  formData.append("folder", signatureData.folder!);
  formData.append("public_id", signatureData.publicId!);
  formData.append("upload_preset", signatureData.uploadPreset!);
  formData.append("transformation", signatureData.transformation!);
  formData.append("overwrite", String(signatureData.overwrite));
  formData.append("invalidate", String(signatureData.invalidate));
  formData.append("signature", signatureData.signature!);

  const uploadResponse = await fetch(
    `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`,
    { method: "POST", body: formData },
  );
  const uploadData = await readJson(uploadResponse);

  if (!uploadResponse.ok || !uploadData?.secure_url || !uploadData?.public_id) {
    throw new Error(uploadData?.error?.message || "อัปโหลดรูปโปรไฟล์ไม่สำเร็จ");
  }

  // Verify the actual Cloudinary asset on the server before allowing the URL
  // to be saved in the student's profile.
  const commitResponse = await fetch("/api/student/profile/upload-commit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicId: uploadData.public_id }),
  });
  const commitData = await readJson(commitResponse);

  if (!commitResponse.ok || !commitData?.url) {
    throw new Error(commitData?.error || "รูปโปรไฟล์ไม่ผ่านการตรวจสอบขนาดไฟล์");
  }

  return commitData as ProfileUploadResponse;
}
