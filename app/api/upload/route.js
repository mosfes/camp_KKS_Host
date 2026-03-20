import { NextResponse } from "next/server";
import cloudinary from "@/config/cloudinary";

export async function POST(request) {
  try {
    const data = await request.formData();
    const file = data.get("file");

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Construct data URI
    const fileUri = `data:${file.type};base64,${buffer.toString("base64")}`;

    // Upload directly using base64 string
    const result = await cloudinary.uploader.upload(fileUri, {
      folder: "camp-uploads",
      transformation: [
        { width: 1200, height: 1200, crop: "limit" },
        { quality: "auto" },
        { fetch_format: "auto" }
      ]
    });

    return NextResponse.json(
      { url: result.secure_url, public_id: result.public_id },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error uploading file to Cloudinary:", error);
    return NextResponse.json(
      { error: "Error uploading file" },
      { status: 500 }
    );
  }
}
