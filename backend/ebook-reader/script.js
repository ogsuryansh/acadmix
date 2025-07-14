pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.14.305/pdf.worker.min.js';

let pdfDoc = null,
    pageNum = 1,
    pageIsRendering = false,
    pageNumIsPending = null,
    scale = 1.5,
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
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderCtx = {
      canvasContext: ctx,
      viewport: viewport
    };

    page.render(renderCtx).promise.then(() => {
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
  scale += 0.2;
  queueRenderPage(pageNum);
}

function zoomOut() {
  scale = Math.max(0.2, scale - 0.2);
  queueRenderPage(pageNum);
}

// ✅ Dynamic PDF loading based on bookId
const urlParams = new URLSearchParams(window.location.search);
const bookId = urlParams.get("id");

fetch(`https://acadmix-opal.vercel.app/api/book/${bookId}/secure-pdf`)
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


// 👇 Mobile pinch zoom remains unchanged
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

    if (Math.abs(difference) > 20) {
      if (difference > 0) {
        scale += 0.1;
      } else {
        scale = Math.max(0.2, scale - 0.1);
      }
      queueRenderPage(pageNum);
      initialDistance = currentDistance;
    }
  }
}, { passive: true });

pdfContainer.addEventListener('touchend', () => {
  initialDistance = null;
});
