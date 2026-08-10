import { v2 as cloudinary } from "cloudinary";

// Cloudinary integrations usually provide CLOUDINARY_URL, while local .env
// files often use the three individual variables. Only pass values that are
// actually present so undefined values cannot overwrite CLOUDINARY_URL.
const cloudName =
  process.env.CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.API_KEY || process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.API_SECRET || process.env.CLOUDINARY_API_SECRET;

cloudinary.config({
  ...(cloudName ? { cloud_name: cloudName } : {}),
  ...(apiKey ? { api_key: apiKey } : {}),
  ...(apiSecret ? { api_secret: apiSecret } : {}),
});

export function isCloudinaryConfigured() {
  const config = cloudinary.config();

  return Boolean(config.cloud_name && config.api_key && config.api_secret);
}

export default cloudinary;
