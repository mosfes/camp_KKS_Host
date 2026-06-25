const { PDFDocument } = require("pdf-lib");
const fontkit = require("@pdf-lib/fontkit");
const fs = require("fs");

async function run() {
  try {
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);
    const fontBytes = fs.readFileSync("public/fonts/THSarabunNew.ttf");
    const customFont = await pdfDoc.embedFont(fontBytes);
    console.log("Font loaded successfully!");
  } catch (e) {
    console.error(e);
  }
}
run();
