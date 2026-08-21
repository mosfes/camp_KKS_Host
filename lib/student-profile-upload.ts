import imageCompression from "browser-image-compression";

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
 * Format any technical error into a user-friendly Thai message.
 */
export function getFriendlyUploadErrorMessage(error: any): string {
  if (!error) return "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ กรุณาลองใหม่อีกครั้ง";
  const msg = typeof error === "string" ? error : error.message || "";

  if (
    msg.includes("ChunkLoadError") ||
    msg.includes("Loading chunk") ||
    msg.includes("failed to fetch") ||
    msg.includes("NetworkError") ||
    msg.includes("การเชื่อมต่อ")
  ) {
    return "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่อีกครั้ง";
  }

  if (
    msg.includes("5MB") ||
    msg.includes("file size") ||
    msg.includes("too large")
  ) {
    return "ขนาดไฟล์รูปภาพใหญ่เกินกำหนด (ต้องไม่เกิน 5MB)";
  }

  if (msg.includes("format") || msg.includes("image") || msg.includes("type")) {
    return "ไฟล์รูปภาพไม่ถูกต้อง กรุณาเลือกไฟล์ JPG, PNG หรือ WEBP";
  }

  // If already in Thai and friendly
  if (/^[ก-๙]/.test(msg) && !msg.includes("http") && !msg.includes("chunk")) {
    return msg;
  }

  return "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ กรุณาลองใหม่อีกครั้ง";
}

/**
 * Safely compress image with progress callback. Falls back to original file if compression fails.
 */
export async function safeCompressImage(
  file: File,
  onProgress?: (percentage: number) => void,
): Promise<File> {
  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: 2,
      maxWidthOrHeight: 800,
      useWebWorker: true,
      fileType: "image/jpeg",
      onProgress: (p) => {
        onProgress?.(Math.round(p * 0.15));
      },
    });

    return compressed;
  } catch {
    // If compression fails for any reason, safely fall back to original file
    onProgress?.(15);

    return file;
  }
}

/**
 * Upload a student profile image directly from the browser to Cloudinary with progress tracking.
 * The app server only signs the request and validates the resulting asset.
 */
export async function uploadStudentProfileImage(
  inputFile: File,
  onProgress?: (percentage: number) => void,
): Promise<ProfileUploadResponse> {
  if (inputFile.size > MAX_PROFILE_UPLOAD_BYTES) {
    throw new Error("ขนาดไฟล์รูปภาพต้องไม่เกิน 5MB");
  }

  onProgress?.(5);

  // Compress image safely
  const file = await safeCompressImage(inputFile, onProgress);

  onProgress?.(15);

  let signatureResponse: Response;

  try {
    signatureResponse = await fetch("/api/student/profile/upload-signature", {
      method: "POST",
    });
  } catch {
    throw new Error("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์เพื่อเตรียมอัปโหลดได้");
  }

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

  onProgress?.(20);

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

  // Upload to Cloudinary with real-time XHR progress
  const uploadData: any = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`,
    );

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        // Map upload progress between 20% and 88%
        const percent = 20 + Math.round((event.loaded / event.total) * 68);

        onProgress?.(Math.min(percent, 88));
      }
    };

    xhr.onload = () => {
      try {
        const response = JSON.parse(xhr.responseText);

        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(response);
        } else {
          reject(
            new Error(response?.error?.message || "อัปโหลดรูปโปรไฟล์ไม่สำเร็จ"),
          );
        }
      } catch {
        reject(new Error("เซิร์ฟเวอร์ตอบกลับไม่ถูกต้อง"));
      }
    };

    xhr.onerror = () => {
      reject(new Error("การเชื่อมต่อเพื่ออัปโหลดรูปล้มเหลว"));
    };

    xhr.send(formData);
  });

  if (!uploadData?.secure_url || !uploadData?.public_id) {
    throw new Error(uploadData?.error?.message || "อัปโหลดรูปโปรไฟล์ไม่สำเร็จ");
  }

  onProgress?.(90);

  // Verify the actual Cloudinary asset on the server before allowing the URL
  // to be saved in the student's profile.
  let commitResponse: Response;

  try {
    commitResponse = await fetch("/api/student/profile/upload-commit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicId: uploadData.public_id }),
    });
  } catch {
    throw new Error("ไม่สามารถยืนยันการบันทึกรูปโปรไฟล์ได้");
  }

  const commitData = await readJson(commitResponse);

  if (!commitResponse.ok || !commitData?.url) {
    throw new Error(
      commitData?.error || "รูปโปรไฟล์ไม่ผ่านการตรวจสอบความถูกต้อง",
    );
  }

  onProgress?.(100);

  return commitData as ProfileUploadResponse;
}
