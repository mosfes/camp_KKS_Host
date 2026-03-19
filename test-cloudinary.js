const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: '.env' });

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

async function main() {
  console.log("Cloud Name:", process.env.CLOUD_NAME);
  try {
    const result = await cloudinary.uploader.upload('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', {
      folder: "camp-uploads"
    });
    console.log("Upload Success:", result.secure_url);
  } catch (err) {
    console.error("Upload Error:", err);
  }
}

main();
