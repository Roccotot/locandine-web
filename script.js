// Gestione tab
function openTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(tabName).classList.add('active');
  event.target.classList.add('active');
}

// Carica immagine come base64
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Converti immagine base64 → PDF con pdf-lib
async function imageToPDF(frameFile, imageFiles, filename) {
  const { PDFDocument } = PDFLib;
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([9843, 13780]);

  // Cornice
  let frameBytes;
  if (frameFile) {
    frameBytes = await frameFile.arrayBuffer();
  } else {
    const res = await fetch("assets/AAAcornice.png");
    frameBytes = await res.arrayBuffer();
  }
  const frameImg = await pdfDoc.embedPng(frameBytes);
  page.drawImage(frameImg, { x: 0, y: 0, width: 9843, height: 13780 });

  // Immagini
  for (let img of imageFiles) {
    const bytes = await img.arrayBuffer();
    const ext = img.name.split(".").pop().toLowerCase();
    let embedded;
    if (ext === "png") {
      embedded = await pdfDoc.embedPng(bytes);
    } else {
      embedded = await pdfDoc.embedJpg(bytes);
    }
    // Ridimensiona e centra (per singola)
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

// Singola
async function generateSingle() {
  const frameFile = document.getElementById("frameSingle").files[0];
  const images = [...document.getElementById("imagesSingle").files];
  if (images.length === 0) {
    alert("Carica almeno un'immagine!");
    return;
  }
  for (let img of images) {
    await imageToPDF(frameFile, [img], img.name.replace(/\.[^/.]+$/, "") + ".pdf");
  }
}

// Griglia 4×4
async function generateGrid() {
  const frameFile = document.getElementById("frameGrid").files[0];
  let images = [...document.getElementById("imagesGrid").files];
  if (images.length < 4) {
    alert("Carica almeno 4 immagini!");
    return;
  }
  images = images.sort((a, b) => a.name.localeCompare(b.name)).slice(0, 4);

  const { PDFDocument } = PDFLib;
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([9843, 13780]);

  // Cornice
  let frameBytes;
  if (frameFile) {
    frameBytes = await frameFile.arrayBuffer();
  } else {
    const res = await fetch("assets/AAAcornice.png");
    frameBytes = await res.arrayBuffer();
  }
  const frameImg = await pdfDoc.embedPng(frameBytes);
  page.drawImage(frameImg, { x: 0, y: 0, width: 9843, height: 13780 });

  // Posizioni (2x2)
  const positions = [
    [ (9843-6890)/2, (13780-9843)/2 + 4920 ],
    [ (9843-6890)/2 + 3450, (13780-9843)/2 + 4920 ],
    [ (9843-6890)/2, (13780-9843)/2 ],
    [ (9843-6890)/2 + 3450, (13780-9843)/2 ]
  ];

  for (let i=0; i<images.length; i++) {
    const img = images[i];
    const bytes = await img.arrayBuffer();
    const ext = img.name.split(".").pop().toLowerCase();
    let embedded;
    if (ext === "png") {
      embedded = await pdfDoc.embedPng(bytes);
    } else {
      embedded = await pdfDoc.embedJpg(bytes);
    }
    page.drawImage(embedded, {
      x: positions[i][0],
      y: positions[i][1],
      width: 3400,
      height: 4900
    });
  }

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "griglia4.pdf";
  link.click();
}
