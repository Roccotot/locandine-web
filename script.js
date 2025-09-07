const DEFAULT_FRAME_PATH = "assets/AAAcornice.png";
const AREA_W = 6890; // 70 cm
const AREA_H = 9843; // 100 cm
const RATIO = 34 / 50; // proporzione locandina (larghezza/altezza)

// ----------------- Utility -----------------
function openTab(tabName, el) {
  document.querySelectorAll(".tab-content").forEach(t => t.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.getElementById(tabName).classList.add("active");
  el.classList.add("active");
}

document.addEventListener("DOMContentLoaded", () => {
  [
    "previewFrameSingle",
    "previewFrameGrid2x2",
    "previewFrameGrid3x2",
    "previewFrameGrid3x3",
    "previewFrameGrid4x3",
    "previewFrameGrid4x4",
    "previewFrameGrid5x5"
  ].forEach(id => {
    const img = document.getElementById(id);
    if (img) img.src = DEFAULT_FRAME_PATH;
  });
});

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

async function getFrameImage(frameInputId) {
  const frameFile = document.getElementById(frameInputId)?.files[0];
  const frameImg = new Image();
  frameImg.src = frameFile ? URL.createObjectURL(frameFile) : DEFAULT_FRAME_PATH;
  await frameImg.decode();
  if (frameFile) URL.revokeObjectURL(frameImg.src);
  return frameImg;
}

// ----------------- Calcolo dimensioni -----------------
function calculateCellSize(cols, rows) {
  // GAP variabile per armonia
  let GAP = 60;
  if (cols === 2 && rows === 2) GAP = 80;
  else if (cols === 3 && rows <= 3) GAP = 60;
  else if (cols === 4) GAP = 50;
  else if (cols === 5) GAP = 40;

  // Tentativo da larghezza
  let cellW = (AREA_W - (cols - 1) * GAP) / cols;
  let cellH = cellW / RATIO;
  let totalH = cellH * rows + (rows - 1) * GAP;

  if (totalH > AREA_H) {
    // Troppo alto, ricalcolo da altezza
    cellH = (AREA_H - (rows - 1) * GAP) / rows;
    cellW = cellH * RATIO;
    totalH = AREA_H;
  }

  const totalW = cellW * cols + (cols - 1) * GAP;
  const offsetX = (AREA_W - totalW) / 2;
  const offsetY = (AREA_H - totalH) / 2;

  return { cellW, cellH, offsetX, offsetY, GAP };
}

// ----------------- PDF -----------------
async function generateSingle() {
  const images = [...document.getElementById("imagesSingle").files];
  if (!images.length) return alert("Carica almeno un'immagine!");
  for (let img of images)
    await imageToPDF([img], "frameSingle", img.name.replace(/\.[^/.]+$/, "") + ".pdf");
}

async function imageToPDF(imageFiles, frameInputId, filename) {
  const { PDFDocument } = PDFLib;
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([9843, 13780]);

  const frame = await fetch(DEFAULT_FRAME_PATH).then(r => r.arrayBuffer());
  const frameImg = await pdfDoc.embedPng(frame);
  page.drawImage(frameImg, { x: 0, y: 0, width: 9843, height: 13780 });

  const w = AREA_W, h = AREA_H;
  const offsetX = (9843 - AREA_W) / 2;
  const offsetY = (13780 - AREA_H) / 2;

  for (let file of imageFiles) {
    const bytes = await file.arrayBuffer();
    const embedded = await pdfDoc.embedJpg(bytes);
    page.drawImage(embedded, { x: offsetX, y: offsetY, width: w, height: h });
  }

  const blob = new Blob([await pdfDoc.save()], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

async function generateGrid(cols, rows) {
  const id = `imagesGrid${cols}x${rows}`;
  let images = [...document.getElementById(id).files];
  if (images.length < cols * rows)
    return alert(`Carica almeno ${cols * rows} immagini!`);
  images = images.sort((a, b) => a.name.localeCompare(b.name)).slice(0, cols * rows);

  const { PDFDocument } = PDFLib;
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([9843, 13780]);

  const frame = await fetch(DEFAULT_FRAME_PATH).then(r => r.arrayBuffer());
  const frameImg = await pdfDoc.embedPng(frame);
  page.drawImage(frameImg, { x: 0, y: 0, width: 9843, height: 13780 });

  const { cellW, cellH, offsetX, offsetY, GAP } = calculateCellSize(cols, rows);

  for (let i = 0; i < images.length; i++) {
    const r = Math.floor(i / cols), c = i % cols;
    const bytes = await images[i].arrayBuffer();
    const embedded = await pdfDoc.embedJpg(bytes);
    page.drawImage(embedded, {
      x: (9843 - AREA_W) / 2 + offsetX + c * (cellW + GAP),
      y: (13780 - AREA_H) / 2 + offsetY + (rows - r - 1) * (cellH + GAP),
      width: cellW,
      height: cellH
    });
  }

  const blob = new Blob([await pdfDoc.save()], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `griglia${cols}x${rows}.pdf`;
  link.click();
}

// ----------------- JPG -----------------
async function generateSingleJpg() {
  const images = [...document.getElementById("imagesSingle").files];
  if (!images.length) return alert("Carica almeno un'immagine!");
  for (let img of images)
    await imageToJPG([img], "frameSingle", img.name.replace(/\.[^/.]+$/, "") + ".jpg");
}

async function imageToJPG(imageFiles, frameInputId, filename) {
  const canvas = document.createElement("canvas");
  canvas.width = 9843;
  canvas.height = 13780;
  const ctx = canvas.getContext("2d");

  const frameImg = await getFrameImage(frameInputId);
  ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);

  const w = AREA_W, h = AREA_H;
  const offsetX = (9843 - AREA_W) / 2;
  const offsetY = (13780 - AREA_H) / 2;

  for (let file of imageFiles) {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.src = url;
    await img.decode();
    ctx.drawImage(img, offsetX, offsetY, w, h);
    URL.revokeObjectURL(url);
  }

  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/jpeg", 0.9);
  link.download = filename;
  link.click();
}

async function generateGridJpg(cols, rows) {
  const id = `imagesGrid${cols}x${rows}`;
  let images = [...document.getElementById(id).files];
  if (images.length < cols * rows)
    return alert(`Carica almeno ${cols * rows} immagini!`);
  images = images.sort((a, b) => a.name.localeCompare(b.name)).slice(0, cols * rows);

  const canvas = document.createElement("canvas");
  canvas.width = 9843;
  canvas.height = 13780;
  const ctx = canvas.getContext("2d");

  const frameImg = await getFrameImage(id.replace("images", "frame"));
  ctx.drawImage(frameImg, 0, 0, canvas.width, canvas.height);

  const { cellW, cellH, offsetX, offsetY, GAP } = calculateCellSize(cols, rows);

  for (let i = 0; i < images.length; i++) {
    const r = Math.floor(i / cols), c = i % cols;
    const url = URL.createObjectURL(images[i]);
    const img = new Image();
    img.src = url;
    await img.decode();
    ctx.drawImage(
      img,
      (9843 - AREA_W) / 2 + offsetX + c * (cellW + GAP),
      (13780 - AREA_H) / 2 + offsetY + (rows - r - 1) * (cellH + GAP),
      cellW, cellH
    );
    URL.revokeObjectURL(url);
  }

  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/jpeg", 0.9);
  link.download = `griglia${cols}x${rows}.jpg`;
  link.click();
}
