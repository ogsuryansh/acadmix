pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.14.305/pdf.worker.min.js';

let pdfDoc = null,
    pageNum = 1,
    pageIsRendering = false,
    pageNumIsPending = null,
    // Start with a higher scale on mobile for better readability
    scale = window.innerWidth < 600 ? 2.2 : 1.5,
    minScale = 0.5,
    maxScale = 5,
    zoomStep = window.innerWidth < 600 ? 0.3 : 0.2,
    canvas = document.getElementById('pdf-render'),
    ctx = canvas.getContext('2d');

function renderPage(num) {
  const canvas = document.getElementById('pdf-render');
  const container = document.getElementById('pdf-container');

  canvas.classList.remove('fade-in');
  canvas.classList.add('fade-out');

  pageIsRendering = true;

  pdfDoc.getPage(num).then(page => {
    const viewport = page.getViewport({ scale });

    // Responsive canvas width for mobile
    if (window.innerWidth < 600) {
      // Fit width to viewport, but allow zoom
      const desiredWidth = Math.min(viewport.width, window.innerWidth * 0.98 * scale);
      const ratio = desiredWidth / viewport.width;
      canvas.width = viewport.width * ratio;
      canvas.height = viewport.height * ratio;
      page.render({
        canvasContext: ctx,
        viewport: page.getViewport({ scale: scale * ratio })
      }).promise.then(() => {
        pageIsRendering = false;
        if (pageNumIsPending !== null) {
          renderPage(pageNumIsPending);
          pageNumIsPending = null;
        }
        setTimeout(() => {
          canvas.classList.remove('fade-out');
          canvas.classList.add('fade-in');
          container.scrollLeft = (canvas.width - container.clientWidth) / 2;
        }, 50);
      });
    } else {
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      page.render({
        canvasContext: ctx,
        viewport: viewport
      }).promise.then(() => {
        pageIsRendering = false;
        if (pageNumIsPending !== null) {
          renderPage(pageNumIsPending);
          pageNumIsPending = null;
        }
        setTimeout(() => {
          canvas.classList.remove('fade-out');
          canvas.classList.add('fade-in');
          container.scrollLeft = (canvas.width - container.clientWidth) / 2;
        }, 50);
      });
    }

    document.getElementById('page_num').textContent = num;
  });
}

function queueRenderPage(num) {
  if (pageIsRendering) {
    pageNumIsPending = num;
  } else {
    renderPage(num);
  }
}

function prevPage() {
  if (pageNum <= 1) return;
  pageNum--;
  queueRenderPage(pageNum);
}

function nextPage() {
  if (pageNum >= pdfDoc.numPages) return;
  pageNum++;
  queueRenderPage(pageNum);
}

function zoomIn() {
  scale = Math.min(maxScale, scale + zoomStep);
  queueRenderPage(pageNum);
}

function zoomOut() {
  scale = Math.max(minScale, scale - zoomStep);
  queueRenderPage(pageNum);
}

// Attach event listeners to toolbar buttons
document.addEventListener('DOMContentLoaded', function() {
  document.querySelector('.btn-prev').addEventListener('click', prevPage);
  document.querySelector('.btn-next').addEventListener('click', nextPage);
  document.querySelector('.btn-zoom-in').addEventListener('click', zoomIn);
  document.querySelector('.btn-zoom-out').addEventListener('click', zoomOut);
});

// ✅ Dynamic PDF loading based on bookId
const urlParams = new URLSearchParams(window.location.search);
const bookId = urlParams.get("id");

fetch(`https://api.acadmix.shop/api/book/${bookId}/secure-pdf`)
  .then(res => res.json())
  .then(data => {
    if (!data.url) {
      alert("PDF not found");
      return;
    }

    pdfjsLib.getDocument(data.url).promise.then(pdfDoc_ => {
      pdfDoc = pdfDoc_;
      document.getElementById('page_count').textContent = pdfDoc.numPages;
      renderPage(pageNum);
    });
  })
  .catch(err => {
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

const pdfContainer = document.getElementById('pdf-container');

pdfContainer.addEventListener('touchstart', (e) => {
  if (e.touches.length === 2) {
    initialDistance = getDistance(e.touches);
  }
}, { passive: true });

pdfContainer.addEventListener('touchmove', (e) => {
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
}, { passive: true });

pdfContainer.addEventListener('touchend', () => {
  initialDistance = null;
});