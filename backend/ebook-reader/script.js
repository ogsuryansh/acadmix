pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.14.305/pdf.worker.min.js";

let pdfDoc = null,
  pageNum = 1,
  pageIsRendering = false,
  pageNumIsPending = null,
  scale = window.innerWidth < 600 ? 2.2 : 1.5,
  minScale = 0.5,
  maxScale = 6,
  zoomStep = window.innerWidth < 600 ? 0.4 : 0.2,
  canvas = document.getElementById("pdf-render"),
  ctx = canvas.getContext("2d");

function renderPage(num, withEffect = false) {
  const canvas = document.getElementById("pdf-render");
  const container = document.getElementById("pdf-container");
  const frame = document.querySelector(".pdf-frame");

  canvas.classList.remove("fade-in");
  canvas.classList.add("fade-out");
  if (withEffect) {
    frame.classList.add("turning");
    setTimeout(() => frame.classList.remove("turning"), 500);
  }

  pageIsRendering = true;

  pdfDoc.getPage(num).then((page) => {
    const viewport = page.getViewport({ scale });

    // Always render at the requested scale
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    page
      .render({
        canvasContext: ctx,
        viewport: viewport,
      })
      .promise.then(() => {
        pageIsRendering = false;
        if (pageNumIsPending !== null) {
          renderPage(pageNumIsPending, true);
          pageNumIsPending = null;
        }
        setTimeout(() => {
          canvas.classList.remove("fade-out");
          canvas.classList.add("fade-in");
          // Center horizontally if zoomed in
          if (canvas.width > container.clientWidth) {
            container.scrollLeft = (canvas.width - container.clientWidth) / 2;
          }
        }, 50);
      });

    document.getElementById("page_num").textContent = num;
  });
}

function queueRenderPage(num, withEffect = false) {
  if (pageIsRendering) {
    pageNumIsPending = num;
  } else {
    renderPage(num, withEffect);
  }
}

function prevPage() {
  if (pageNum <= 1) return;
  pageNum--;
  queueRenderPage(pageNum, true);
}

function nextPage() {
  if (pageNum >= pdfDoc.numPages) return;
  pageNum++;
  queueRenderPage(pageNum, true);
}

function zoomIn() {
  scale = Math.min(maxScale, scale + zoomStep);
  queueRenderPage(pageNum);
}

function zoomOut() {
  scale = Math.max(minScale, scale - zoomStep);
  queueRenderPage(pageNum);
}

function fitToWidth() {
  pdfDoc.getPage(pageNum).then((page) => {
    const unscaledViewport = page.getViewport({ scale: 1 });
    // Set scale so that the PDF fits the viewport width
    scale = (window.innerWidth - 32) / unscaledViewport.width; // 32 for padding
    scale = Math.max(minScale, Math.min(maxScale, scale));
    queueRenderPage(pageNum);
  });
}

// Attach event listeners to toolbar buttons
document.addEventListener("DOMContentLoaded", function () {
  document.querySelector(".btn-prev").addEventListener("click", prevPage);
  document.querySelector(".btn-next").addEventListener("click", nextPage);
  document.querySelector(".btn-zoom-in").addEventListener("click", zoomIn);
  document.querySelector(".btn-zoom-out").addEventListener("click", zoomOut);
  document
    .querySelector(".btn-fit-width")
    .addEventListener("click", fitToWidth);
});

// ✅ Dynamic PDF loading based on bookId
const urlParams = new URLSearchParams(window.location.search);
const bookId = urlParams.get("id");

// Use dynamic API base URL logic
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE_URL = isDevelopment ? 'http://localhost:5000/api' : 'https://api.acadmix.shop/api';

fetch(`${API_BASE_URL}/book/${bookId}/secure-pdf`)
  .then((res) => res.json())
  .then((data) => {
    if (!data.url) {
      alert("PDF not found");
      return;
    }

    pdfjsLib.getDocument(data.url).promise.then((pdfDoc_) => {
      pdfDoc = pdfDoc_;
      document.getElementById("page_count").textContent = pdfDoc.numPages;

      // --- Fit to width on first load ---
      pdfDoc.getPage(pageNum).then((page) => {
        const unscaledViewport = page.getViewport({ scale: 1 });
        // 32 is for padding (adjust if needed)
        scale = (window.innerWidth - 32) / unscaledViewport.width;
        // Clamp scale to min/max
        scale = Math.max(minScale, Math.min(maxScale, scale));
        renderPage(pageNum);
      });
    });
  })
  .catch((err) => {
    console.error("Error fetching PDF:", err);
    alert("Something went wrong while loading the PDF.");
  });
// 👇 Improved Mobile Pinch Zoom
let initialDistance = null;

function getDistance(touches) {
  const [touch1, touch2] = touches;
  const dx = touch2.clientX - touch1.clientX;
  const dy = touch2.clientY - touch1.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

const pdfContainer = document.getElementById("pdf-container");

pdfContainer.addEventListener(
  "touchstart",
  (e) => {
    if (e.touches.length === 2) {
      initialDistance = getDistance(e.touches);
    }
  },
  { passive: true }
);

pdfContainer.addEventListener(
  "touchmove",
  (e) => {
    if (e.touches.length === 2 && initialDistance !== null) {
      const currentDistance = getDistance(e.touches);
      const difference = currentDistance - initialDistance;

      // Make pinch zoom more sensitive and allow continuous zooming
      if (Math.abs(difference) > 10) {
        if (difference > 0) {
          scale = Math.min(maxScale, scale + zoomStep * 0.7);
        } else {
          scale = Math.max(minScale, scale - zoomStep * 0.7);
        }
        queueRenderPage(pageNum);
        initialDistance = currentDistance;
      }
    }
  },
  { passive: true }
);

pdfContainer.addEventListener("touchend", () => {
  initialDistance = null;
});
