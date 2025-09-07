// Gestione tab
function openTab(tabName, el) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(tabName).classList.add('active');
  el.classList.add('active');
}

// Mostra anteprima cornice
function previewFrame(input, imgId) {
  const preview = document.getElementById(imgId);
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = e => preview.src = e.target.result;
    reader.readAsDataURL(input.files[0]);
  } else {
    preview.src = "assets/cornice.png";
  }
}

// Recupera cornice (file o default)
async function getFrameBytes(frameInputId) {
  const frameFile = document.getElementById(frameInputId)?.files[0];
  if (frameFile) {
    return await frameFile.arrayBuffer();
  } else {
    const res = await fetch("assets/cornice.png");
    return await res.arrayBuffer();
  }
}

// Singola locandina
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

// Genera griglia NxN
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
  const page = pdfDoc.addPage([9843, 13780]);

  // Cornice scelta o default
  const frameBytes = await getFrameBytes(frameId);
  const frameImg = await pdfDoc.embedPng(frameBytes);
  page.drawImage(frameImg, { x: 0, y: 0, width: 9843, height: 13780 });

  // Area utile
  const totalW = 6890;
  const totalH = 9843;
  const startX = (9843 - totalW) / 2;
  const startY = (13780 - totalH) / 2;
  const cellW = totalW / n;
  const cellH = totalH / n;

  for (let i = 0; i < images.length; i++) {
    const row = Math.floor(i / n);
    const col = i % n;
    const img = images[i];
    const bytes = await img.arrayBuffer();
    const ext = img.name.split(".").pop().toLowerCase();
    let embedded;
    if (ext === "png" || ext === "webp" || ext === "gif") {
      embedded = await pdfDoc.embedPng(bytes);
    } else {
      embedded = await pdfDoc.embedJpg(bytes);
    }
    page.drawImage(embedded, {
      x: startX + col * cellW,
      y: startY + (n - row - 1) * cellH,
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

// Utility per singola immagine
async function imageToPDF(imageFiles, frameInputId, filename) {
  const { PDFDocument } = PDFLib;
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([9843, 13780]);

  const frameBytes = await getFrameBytes(frameInputId);
  const frameImg = await pdfDoc.embedPng(frameBytes);
  page.drawImage(frameImg, { x: 0, y: 0, width: 9843, height: 13780 });

  for (let img of imageFiles) {
    const bytes = await img.arrayBuffer();
    const ext = img.name.split(".").pop().toLowerCase();
    let embedded;
    if (ext === "png" || ext === "webp" || ext === "gif") {
      embedded = await pdfDoc.embedPng(bytes);
    } else {
      embedded = await pdfDoc.embedJpg(bytes);
    }
    page.drawImage(embedded, {
      x: (9843 - 6890) / 2,
      y: (13780 - 9843) / 2,
      width: 6890,
      height: 9843
    });
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}
