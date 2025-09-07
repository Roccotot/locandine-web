const DEFAULT_FRAME_PATH = "assets/AAAcornice.png";

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

// ----------------- PDF -----------------
async function generateSingle() {
  const images = [...document.getElementById("imagesSingle").files];
  if (!images.length) return alert("Carica almeno un'immagine!");
  for (let img of images) await imageToPDF([img], "frameSingle", img.name.replace(/\.[^/.]+$/, "") + ".pdf");
}

async function imageToPDF(imageFiles, frameInputId, filename) {
  const { PDFDocument } = PDFLib;
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([9843, 13780]);

  const frame = await fetch(DEFAULT_FRAME_PATH).then(r=>r.arrayBuffer());
  const frameImg = await pdfDoc.embedPng(frame);
  page.drawImage(frameImg,{x:0,y:0,width:9843,height:13780});

  const w=6890,h=9843,x=(9843-w)/2,y=(13780-h)/2;
  for(let file of imageFiles){
    const bytes=await file.arrayBuffer();
    const embedded=await pdfDoc.embedJpg(bytes);
    page.drawImage(embedded,{x,y,width:w,height:h});
  }
  const blob=new Blob([await pdfDoc.save()],{type:"application/pdf"});
  const link=document.createElement("a");link.href=URL.createObjectURL(blob);link.download=filename;link.click();
}

async function generateGrid(cols,rows) {
  const id=`imagesGrid${cols}x${rows}`;
  const frameId=`frameGrid${cols}x${rows}`;
  let images=[...document.getElementById(id).files];
  if(images.length<cols*rows) return alert(`Carica almeno ${cols*rows} immagini!`);
  images=images.sort((a,b)=>a.name.localeCompare(b.name)).slice(0,cols*rows);

  const {PDFDocument}=PDFLib;
  const pdfDoc=await PDFDocument.create();
  const page=pdfDoc.addPage([9843,13780]);

  const frame=await fetch(DEFAULT_FRAME_PATH).then(r=>r.arrayBuffer());
  const frameImg=await pdfDoc.embedPng(frame);
  page.drawImage(frameImg,{x:0,y:0,width:9843,height:13780});

  const totalW=6890,totalH=9843;
  const startX=(9843-totalW)/2,startY=(13780-totalH)/2;
  let SPACING=80;if(cols===2&&rows===2)SPACING=150;else if(cols===3&&rows===3)SPACING=100;else if(cols===4&&rows===4)SPACING=70;else if(cols===5&&rows===5)SPACING=40;
  const cellW=(totalW-(cols-1)*SPACING)/cols,cellH=(totalH-(rows-1)*SPACING)/rows;

  for(let i=0;i<images.length;i++){
    const r=Math.floor(i/cols),c=i%cols;
    const bytes=await images[i].arrayBuffer();
    const embedded=await pdfDoc.embedJpg(bytes);
    page.drawImage(embedded,{x:startX+c*(cellW+SPACING),y:startY+(rows-r-1)*(cellH+SPACING),width:cellW,height:cellH});
  }
  const blob=new Blob([await pdfDoc.save()],{type:"application/pdf"});
  const link=document.createElement("a");link.href=URL.createObjectURL(blob);link.download=`griglia${cols}x${rows}.pdf`;link.click();
}

// ----------------- JPG -----------------
async function generateSingleJpg() {
  const images=[...document.getElementById("imagesSingle").files];
  if(!images.length)return alert("Carica almeno un'immagine!");
  for(let img of images) await imageToJPG([img],"frameSingle",img.name.replace(/\.[^/.]+$/, "")+".jpg");
}

async function imageToJPG(imageFiles, frameInputId, filename) {
  const canvas=document.createElement("canvas");canvas.width=9843;canvas.height=13780;const ctx=canvas.getContext("2d");
  const frameImg=await getFrameImage(frameInputId);ctx.drawImage(frameImg,0,0,canvas.width,canvas.height);
  const w=6890,h=9843,x=(9843-w)/2,y=(13780-h)/2;
  for(let file of imageFiles){const url=URL.createObjectURL(file);const img=new Image();img.src=url;await img.decode();ctx.drawImage(img,x,y,w,h);URL.revokeObjectURL(url);}
  const link=document.createElement("a");link.href=canvas.toDataURL("image/jpeg",0.9);link.download=filename;link.click();
}

async function generateGridJpg(cols,rows) {
  const id=`imagesGrid${cols}x${rows}`,frameId=`frameGrid${cols}x${rows}`;
  let images=[...document.getElementById(id).files];
  if(images.length<cols*rows) return alert(`Carica almeno ${cols*rows} immagini!`);
  images=images.sort((a,b)=>a.name.localeCompare(b.name)).slice(0,cols*rows);

  const canvas=document.createElement("canvas");canvas.width=9843;canvas.height=13780;const ctx=canvas.getContext("2d");
  const frameImg=await getFrameImage(frameId);ctx.drawImage(frameImg,0,0,canvas.width,canvas.height);

  const totalW=6890,totalH=9843,startX=(9843-totalW)/2,startY=(13780-totalH)/2;
  let SPACING=80;if(cols===2&&rows===2)SPACING=150;else if(cols===3&&rows===3)SPACING=100;else if(cols===4&&rows===4)SPACING=70;else if(cols===5&&rows===5)SPACING=40;
  const cellW=(totalW-(cols-1)*SPACING)/cols,cellH=(totalH-(rows-1)*SPACING)/rows;

  for(let i=0;i<images.length;i++){const r=Math.floor(i/cols),c=i%cols;const url=URL.createObjectURL(images[i]);const img=new Image();img.src=url;await img.decode();ctx.drawImage(img,startX+c*(cellW+SPACING),startY+(rows-r-1)*(cellH+SPACING),cellW,cellH);URL.revokeObjectURL(url);}
  const link=document.createElement("a");link.href=canvas.toDataURL("image/jpeg",0.9);link.download=`griglia${cols}x${rows}.jpg`;link.click();
}
