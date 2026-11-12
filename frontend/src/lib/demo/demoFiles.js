/**
 * DEMO DATA ONLY — produces stand-in binaries for the QR and PDF endpoints
 * so the in-browser demo backend can mimic image/png and application/pdf responses.
 */
import { BarcodeFormat, QRCodeWriter } from "@zxing/library";

export async function demoQrPng(code) {
  const size = 320;
  const matrix = new QRCodeWriter().encode(
    code,
    BarcodeFormat.QR_CODE,
    size,
    size,
    new Map(),
  );
  const canvas = document.createElement("canvas");
  canvas.width = matrix.getWidth();
  canvas.height = matrix.getHeight();
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#0f1f3d";
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      if (matrix.get(x, y)) ctx.fillRect(x, y, 1, 1);
    }
  }
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("QR render failed"))),
      "image/png",
    ),
  );
}

const escapePdf = (s) =>
  s
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7e]/g, "-");

/** Minimal single-page text PDF (ASCII only). */
export function demoTicketPdf(title, lines) {
  const content = [
    "BT",
    "/F1 22 Tf",
    "64 770 Td",
    `(${escapePdf(title)}) Tj`,
    "/F1 12 Tf",
    ...lines.flatMap((l) => ["0 -26 Td", `(${escapePdf(l)}) Tj`]),
    "0 -40 Td",
    "/F1 9 Tf",
    "(Demo ticket generated in the browser - the live backend renders the real PDF.) Tj",
    "ET",
  ].join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [];
  objects.forEach((obj, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets
    .map((o) => `${String(o).padStart(10, "0")} 00000 n \n`)
    .join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}
