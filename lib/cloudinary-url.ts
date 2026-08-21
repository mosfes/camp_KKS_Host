/**
 * แปลง Cloudinary URL เป็น thumbnail โดยเพิ่ม transformation ตรงกลาง URL
 * - ไม่สร้างไฟล์ใหม่ใน storage (on-the-fly transformation)
 * - URL เดิม (ต้นฉบับ) ยังใช้งานได้ปกติสำหรับ lightbox/download
 *
 * @param url     Cloudinary secure_url ต้นฉบับ
 * @param width   ความกว้างสูงสุด (default 600px)
 */
export function toThumbnail(url: string, width = 600): string {
  if (!url || !url.includes("res.cloudinary.com")) return url;

  return url.replace("/upload/", `/upload/w_${width},q_auto,f_auto/`);
}
