// Costanti
const DEFAULT_FRAME_PATH = "assets/AAAcornice.png";

// Gestione tab
function openTab(tabName, el) {
  document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.getElementById(tabName).classList.add("active");
  el.classList.add("active");
}

// Imposta le anteprime alla cornice di default all'avvio
document.addEventListener("DOMContentLoaded", () => {
  [
    "previewFrameSingle",
    "previewFrameGrid2x2",
    "previewFrameGrid3x3",
    "previewFrameGrid4x4",
    "previewFrameGrid5x5"
  ].forEach(id => {
    const img = document.getElementById(id);
    if (img) img.src = DEFAULT_FRAME_PATH;
  });
});

// Anteprima cornice
function previewFrame(input, imgId) {
  const preview = document.getElementById(imgId);
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = e => (preview.src = e.target.result);
    reader.readAsDataURL(input.files[0]);
  } else {
    preview.src = DEFAULT_FRAME_PATH;
  }
}

// ---- Utility conversione immagini ----

// Converte qualsiasi file immagine in PNG bytes via canvas
async function fileToPngBytes(file) {
  // tenta createImageBitmap (più veloce)
  try {
    const bmp = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = bmp.width;
    canvas.height = bmp.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bmp, 0, 0);
    const blob = await new Promise(res => canvas.toBlob(res, "image/png"));
    return await blob.arrayBuffer();
  } catch {
    // fallback con Image()
    const url = URL.createObjectURL(file);
    const img = await new Promise((resolve, reject) => {
      const im = new Image();
      im.onload = () => resolve(im);
      im.onerror = reject;
      im.src = url;
    });
    URL.revokeObjectURL(url);
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const blob = await new Promise(res => canvas.toBlob(res, "image/png"));
    return await blob.arrayBuffer();
  }
}

// Prepara un file per pdf-lib: restituisce {type:'png'|'jpg', bytes:ArrayBuffer}
async function prepareFileForPdf(file) {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  if (ext === "jpg" || ext === "jpeg") {
    return { type: "jpg", bytes: await file.arrayBuffer() };
  }
  if (ext === "png") {
    return { type: "png", bytes: await file.arrayBuffer() };
  }
  // altri formati (webp, gif, ecc.) -> converte a PNG
  return { type: "png", bytes: await fileToPngBytes(file) };
}

// Recupera cornice (file scelto o default AAAcornice)
async function getFrameForPdf(frameInputId) {
  const file = document.getElementById(frameInputId)?.files?.[0];
  if (file) return await prepareFileForPdf(file);
  // default: AAAcornice.png
  const resp = await fetch(DEFAULT_FRAME_PATH);
  const bytes = await resp.arrayBuffer();
  return { type: "png", bytes };
}

// ---- Generazione PDF ----

// Singola
async function generateSingle() {
  const images = [...document.getElementById("imagesSingle").files];
  if (images.length === 0) {
    alert("Carica almeno un'immagine!");
    return;
  }
  for (let img of images) {
    await imageToPDF([img], "frameSingle", img.name.replace(/\.[^/.]+$/, "") + ".pdf");
  }
}

// Griglia NxN
async function generateGrid(n) {
  const inputId =
    n === 2 ? "imagesGrid2x2" :
    n === 3 ? "imagesGrid3x3" :
    n === 4 ? "imagesGrid4x4" :
              "imagesGrid5x5";

  const frameId =
    n === 2 ? "frameGrid2x2" :
    n === 3 ? "frameGrid3x3" :
    n === 4 ? "frameGrid4x4" :
              "frameGrid5x5";

  let images = [...document.getElementById(inputId).files];
  const needed = n * n;
  if (images.length < needed) {
    alert(`Carica almeno ${needed} immagini!`);
    return;
  }

  images = images.sort((a, b) => a.name.localeCompare(b.name)).slice(0, needed);

  const { PDFDocument } = PDFLib;
  const pdfDoc = await PDFDocument.create();
  pdfDoc.addPage([9843, 13780]); // una sola pagina
  const page = pdfDoc.getPage(0);

  // Cornice (user o default)
  const frame = await getFrameForPdf(frameId);
  const frameImg = frame.type === "png"
    ? await pdfDoc.embedPng(frame.bytes)
    : await pdfDoc.embedJpg(frame.bytes);
  page.drawImage(frameImg, { x: 0, y: 0, width: 9843, height: 13780 });

  // Area utile centrale (70x100 cm @ 250 DPI)
  const totalW = 6890, totalH = 9843;
  const startX = (9843 - totalW) / 2;
  const startY = (13780 - totalH) / 2;
  const cellW = totalW / n, cellH = totalH / n;

  // Inserisci immagini
  for (let i = 0; i < images.length; i++) {
    const row = Math.floor(i / n);
    const col = i % n;

    const prepared = await prepareFileForPdf(images[i]);
    const embedded = prepared.type === "png"
      ? await pdfDoc.embedPng(prepared.bytes)
      : await pdfDoc.embedJpg(prepared.bytes);

    page.drawImage(embedded, {
      x: startX + col * cellW,
      y: startY + (n - row - 1) * cellH, // PDF ha origine in basso
      width: cellW,
      height: cellH
    });
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `griglia${n}x${n}.pdf`;
  link.click();
}

// Singola util
async function imageToPDF(imageFiles, frameInputId, filename) {
  const { PDFDocument } = PDFLib;
  const pdfDoc = await PDFDocument.create();
  pdfDoc.addPage([9843, 13780]);
  const page = pdfDoc.getPage(0);

  // Cornice (user o default)
  const frame = await getFrameForPdf(frameInputId);
  const frameImg = frame.type === "png"
    ? await pdfDoc.embedPng(frame.bytes)
    : await pdfDoc.embedJpg(frame.bytes);
  page.drawImage(frameImg, { x: 0, y: 0, width: 9843, height: 13780 });

  // Inserisci immagini (centro 70x100)
  const w = 6890, h = 9843;
  const x = (9843 - w) / 2;
  const y = (13780 - h) / 2;

  for (let file of imageFiles) {
    const prepared = await prepareFileForPdf(file);
    const embedded = prepared.type === "png"
      ? await pdfDoc.embedPng(prepared.bytes)
      : await pdfDoc.embedJpg(prepared.bytes);

    page.drawImage(embedded, { x, y, width: w, height: h });
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}
