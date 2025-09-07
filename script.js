// Gestione tab
function openTab(tabName, el) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(tabName).classList.add('active');
  el.classList.add('active');
}

// Anteprima cornice
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

// Recupera cornice (utente o default)
async function getFrameBytes(frameInputId) {
  const frameFile = document.getElementById(frameInputId)?.files[0];
  if (frameFile) {
    return { bytes: await frameFile.arrayBuffer(), ext: frameFile.name.split(".").pop().toLowerCase() };
  } else {
    const res = await fetch("assets/cornice.png");
    return { bytes: await res.arrayBuffer(), ext: "png" };
  }
}

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

// Griglie NxN
async function generateGrid(n) {
  const inputId = `imagesGrid${n}x${n}`;
  const frameId = `frameGrid${n}x${n}`;
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

  // Cornice
  const frame = await getFrameBytes(frameId);
  let frameImg;
  if (frame.ext === "png" || frame.ext === "webp" || frame.ext === "gif") {
    frameImg = await pdfDoc.embedPng(frame.bytes);
  } else {
    frameImg = await pdfDoc.embedJpg(frame.bytes);
  }
  page.drawImage(frameImg, { x: 0, y: 0, width: 9843, height: 13780 });

  // Area utile
  const totalW = 6890, totalH = 9843;
  const startX = (9843 - totalW) / 2;
  const startY = (13780 - totalH) / 2;
  const cellW = totalW / n, cellH = totalH / n;

  for (let i = 0; i < images.length; i++) {
    const row = Math.floor(i / n), col = i % n;
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

// Utility singola immagine
async function imageToPDF(imageFiles, frameInputId, filename) {
  const { PDFDocument } = PDFLib;
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([9843, 13780]);

  const frame = await getFrameBytes(frameInputId);
  let frameImg;
  if (frame.ext === "png" || frame.ext === "webp" || frame.ext === "gif") {
    frameImg = await pdfDoc.embedPng(frame.bytes);
  } else {
    frameImg = await pdfDoc.embedJpg(frame.bytes);
  }
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
