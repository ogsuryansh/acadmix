import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Maximize2,
  Minimize2,
  Eye,
  EyeOff
} from 'lucide-react';
import './AdvancedPDFViewer.css';

const AdvancedPDFViewer = ({ pdfUrl, title, onClose }) => {
  // States
  const [pdfDocument, setPdfDocument] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRendering, setIsRendering] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [sessionTimeout, setSessionTimeout] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [fitToWidth, setFitToWidth] = useState(false);
  const [nightMode, setNightMode] = useState(false);

  // Refs
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const renderTaskRef = useRef(null);
  const touchStartRef = useRef({ x: 0, y: 0, distance: 0 });
  const sessionTimeoutRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  // Security: Session timeout (30 minutes)
  useEffect(() => {
    sessionTimeoutRef.current = setTimeout(() => {
      setSessionTimeout(true);
    }, 30 * 60 * 1000);

    return () => {
      if (sessionTimeoutRef.current) {
        clearTimeout(sessionTimeoutRef.current);
      }
    };
  }, []);

  // Security: Prevent right-click, drag, select, and keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Prevent common shortcuts for saving, printing, viewing source, etc.
      if (
        (e.ctrlKey && (e.key === 's' || e.key === 'p' || e.key === 'u' || e.key === 'c')) ||
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C'))
      ) {
        e.preventDefault();
        return false;
      }
      
      // PDF navigation shortcuts
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        goToPreviousPage();
      } else if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        e.preventDefault();
        goToNextPage();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        zoomIn();
      } else if (e.key === '-') {
        e.preventDefault();
        zoomOut();
      } else if (e.key === '0') {
        e.preventDefault();
        resetZoom();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    const handleContextMenu = (e) => e.preventDefault();
    const handleDragStart = (e) => e.preventDefault();

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('dragstart', handleDragStart);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('dragstart', handleDragStart);
    };
  }, [currentPage, totalPages]);

  // Auto-hide controls in fullscreen
  useEffect(() => {
    if (isFullscreen) {
      const resetTimeout = () => {
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
        setShowControls(true);
        controlsTimeoutRef.current = setTimeout(() => {
          setShowControls(false);
        }, 3000);
      };

      const handleMouseMove = () => resetTimeout();
      const handleTouchStart = () => resetTimeout();

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('touchstart', handleTouchStart);
      
      resetTimeout();

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('touchstart', handleTouchStart);
        if (controlsTimeoutRef.current) {
          clearTimeout(controlsTimeoutRef.current);
        }
      };
    } else {
      setShowControls(true);
    }
  }, [isFullscreen]);

  // Load PDF.js and PDF document
  useEffect(() => {
    let isMounted = true;

    const loadPDF = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('📚 Loading PDF:', pdfUrl);

        // Check if this is a placeholder URL
        if (pdfUrl.includes('via.placeholder.com') || pdfUrl.includes('placeholder')) {
          throw new Error('PDF not available - this appears to be a placeholder. The actual PDF may not have been uploaded successfully.');
        }

        // Load PDF.js if not already loaded
        if (!window.pdfjsLib) {
          console.log('📥 Loading PDF.js library...');
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
          document.head.appendChild(script);
          
          await new Promise((resolve, reject) => {
            script.onload = resolve;
            script.onerror = reject;
          });
          
          window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }

        console.log('✅ PDF.js library loaded');

        // Fetch PDF through proxy with auth
        console.log('🌐 Fetching PDF from proxy...');
        const authToken = localStorage.getItem('token') || localStorage.getItem('adminToken');
        
        // Use the same dynamic API base URL logic as the rest of the application
        const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
          (isDevelopment ? 'http://localhost:5000/api' : 'https://api.acadmix.shop/api');
        
        let response;
        
        if (authToken) {
          // Try authenticated proxy first
          response = await fetch(`${API_BASE_URL}/pdf-proxy?url=${encodeURIComponent(pdfUrl)}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Accept': 'application/pdf'
            }
          });
        }
        
        // If no token or authenticated request failed, try free PDF endpoint
        if (!authToken || !response?.ok) {
          console.log('🆓 Trying free PDF endpoint...');
          response = await fetch(`${API_BASE_URL}/free-pdf-proxy?url=${encodeURIComponent(pdfUrl)}`);
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        console.log('📦 PDF data loaded:', arrayBuffer.byteLength, 'bytes');

        if (!isMounted) return;

        // Load PDF document
        const pdf = await window.pdfjsLib.getDocument({
          data: arrayBuffer,
          cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
          cMapPacked: true,
        }).promise;

        if (!isMounted) return;

        console.log('✅ PDF loaded successfully, pages:', pdf.numPages);
        setPdfDocument(pdf);
        setTotalPages(pdf.numPages);
        setLoading(false);

        // Auto-fit to width on mobile
        if (window.innerWidth < 768) {
          setFitToWidth(false);
          setScale(1.0);
        }

      } catch (err) {
        console.error('❌ Error loading PDF:', err);
        if (isMounted) {
          setError(`Failed to load PDF: ${err.message}`);
          setLoading(false);
        }
      }
    };

    loadPDF();

    return () => {
      isMounted = false;
    };
  }, [pdfUrl, retryCount]);

  // Render current page
  useEffect(() => {
    if (!pdfDocument || !canvasRef.current) return;

    let isMounted = true;

    const renderPage = async () => {
      try {
        setIsRendering(true);
        
        // Cancel any existing render task
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
          renderTaskRef.current = null;
        }

        const page = await pdfDocument.getPage(currentPage);
        if (!isMounted || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        let finalScale = scale;
        if (fitToWidth && containerRef.current) {
          const container = containerRef.current;
          const containerRect = container.getBoundingClientRect();
          
          const headerHeight = 80;
          const controlsHeight = 60;
          const footerHeight = 50;
          const padding = 20;
          const buffer = 10;
          
          const availableWidth = containerRect.width - padding - buffer;
          const availableHeight = containerRect.height - headerHeight - controlsHeight - footerHeight - padding - buffer;
          
          const viewport = page.getViewport({ scale: 1, rotation: 0 });
          const scaleX = availableWidth / viewport.width;
          const scaleY = availableHeight / viewport.height;
          
          finalScale = Math.min(scaleX, scaleY, 1.5);
          
          if (finalScale < 1.0) {
            finalScale = Math.min(scaleX, 1.0);
          }
        }

        const viewport = page.getViewport({ scale: finalScale, rotation: 0 }); // Assuming rotation is 0 for now
        
        const devicePixelRatio = window.devicePixelRatio || 1;
        const isMobile = window.innerWidth < 768;
        const mobileScaleFactor = isMobile ? 2 : 1;
        
        canvas.height = viewport.height * devicePixelRatio * mobileScaleFactor;
        canvas.width = viewport.width * devicePixelRatio * mobileScaleFactor;
        
        canvas.style.height = viewport.height + 'px';
        canvas.style.width = viewport.width + 'px';
        
        context.scale(devicePixelRatio * mobileScaleFactor, devicePixelRatio * mobileScaleFactor);
        
        if (nightMode) {
          context.fillStyle = '#1a1a1a';
          context.fillRect(0, 0, viewport.width, viewport.height);
          context.filter = 'invert(1) hue-rotate(180deg)';
        } else {
          context.clearRect(0, 0, viewport.width, viewport.height);
          context.filter = 'none';
        }

        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
          enableWebGL: false,
          renderInteractiveForms: true
        };

        renderTaskRef.current = page.render(renderContext);
        await renderTaskRef.current.promise;
        
        if (isMounted) {
          renderTaskRef.current = null;
          setIsRendering(false);
        }

      } catch (err) {
        if (err.name !== 'RenderingCancelledException' && isMounted) {
          console.error('❌ Render error:', err);
          setError(`Failed to render page: ${err.message}`);
        }
        if (isMounted) setIsRendering(false);
      }
    };

    renderPage();

    return () => {
      isMounted = false;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, [pdfDocument, currentPage, scale, fitToWidth, nightMode]);

  // Touch handling for pinch-to-zoom
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      touchStartRef.current = { distance };
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) +
        Math.pow(touch2.clientY - touch1.clientY, 2)
      );
      
      const scaleChange = distance / touchStartRef.current.distance;
      const newScale = Math.max(0.5, Math.min(5, scale * scaleChange));
      
      if (Math.abs(scaleChange - 1) > 0.1) {
        setScale(newScale);
        setFitToWidth(false);
        touchStartRef.current.distance = distance;
      }
    }
  }, [scale]);

  // Navigation functions
  const goToPreviousPage = useCallback(() => {
    if (currentPage > 1 && !isFlipping) {
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(prev => prev - 1);
        setIsFlipping(false);
      }, 150);
    }
  }, [currentPage, isFlipping]);

  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages && !isFlipping) {
      setIsFlipping(true);
      setTimeout(() => {
        setCurrentPage(prev => prev + 1);
        setIsFlipping(false);
      }, 150);
    }
  }, [currentPage, totalPages, isFlipping]);

  const goToPage = useCallback((page) => {
    const pageNum = Math.max(1, Math.min(totalPages, page));
    if (pageNum !== currentPage) {
      setCurrentPage(pageNum);
    }
  }, [currentPage, totalPages]);

  // Zoom functions
  const zoomIn = useCallback(() => {
    setScale(prev => Math.min(5, prev * 1.25));
    setFitToWidth(false);
  }, []);

  const zoomOut = useCallback(() => {
    setScale(prev => Math.max(0.5, prev / 1.25));
    setFitToWidth(false);
  }, []);

  const resetZoom = useCallback(() => {
    setScale(1.2);
    setFitToWidth(false);
  }, []);

  const toggleFitToWidth = useCallback(() => {
    setFitToWidth(prev => !prev);
  }, []);

  // Fullscreen functions
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  // Handle fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 text-center max-w-sm mx-4 shadow-2xl">
          <div className="relative mb-6">
            <div className="w-16 h-16 mx-auto border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-blue-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <h3 className="text-xl font-semibold mb-2 text-gray-800">Loading PDF...</h3>
          <p className="text-gray-600 mb-4">Please wait while we prepare your document</p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
          </div>
        </div>
      </div>
    );
  }

  // Session timeout
  if (sessionTimeout) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 text-center max-w-sm mx-4 shadow-2xl">
          <div className="text-red-500 text-6xl mb-4">🔒</div>
          <h3 className="text-xl font-semibold mb-2">Session Expired</h3>
          <p className="text-gray-600 mb-6">Your viewing session has expired for security reasons.</p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Close Viewer
          </button>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 text-center max-w-md mx-4 shadow-2xl">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold mb-2">Error Loading PDF</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setError(null);
                setRetryCount(prev => prev + 1);
                setLoading(true);
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Retry ({retryCount + 1})
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`fixed inset-0 bg-black flex flex-col z-50 pdf-viewer-container ${nightMode ? 'night-mode' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onContextMenu={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
    >
      <div className={`bg-white border-b border-gray-200 px-4 py-2 sm:py-3 flex items-center justify-between transition-transform duration-300 ${
        isFullscreen && !showControls ? '-translate-y-full' : 'translate-y-0'
      }`}>
        <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
          <h2 className="text-base sm:text-lg font-semibold text-gray-800 truncate">
            {title || 'PDF Document'}
          </h2>
          <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap">
            Page {currentPage} of {totalPages}
          </span>
        </div>
        
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={() => setNightMode(!nightMode)}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
            title={nightMode ? "Light Mode" : "Dark Mode"}
          >
            {nightMode ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
          
          <button
            onClick={toggleFullscreen}
            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
            title={isFullscreen ? "Exit Fullscreen (F)" : "Fullscreen (F)"}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          
          <button
            onClick={onClose}
            className="p-2 text-gray-600 hover:text-red-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Close (ESC)"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className={`bg-white border-b border-gray-200 px-4 py-2 transition-transform duration-300 ${
        isFullscreen && !showControls ? '-translate-y-full' : 'translate-y-0'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={goToPreviousPage}
              disabled={currentPage <= 1 || isFlipping}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Previous Page (← or Page Up)"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="flex items-center space-x-2">
              <input
                type="number"
                min="1"
                max={totalPages}
                value={currentPage}
                onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
                className="hidden sm:block w-8 sm:w-12 px-1 py-1 border border-gray-300 rounded text-center text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="text-xs sm:text-sm text-gray-500">{currentPage} / {totalPages}</span>
            </div>
            
            <button
              onClick={goToNextPage}
              disabled={currentPage >= totalPages || isFlipping}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Next Page (→ or Page Down)"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={zoomOut}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Zoom Out (-)"
            >
              <ZoomOut size={20} />
            </button>
            
            <span className="text-sm text-gray-600 min-w-[50px] sm:min-w-[60px] text-center font-medium">
              {fitToWidth ? 'Fit' : Math.round(scale * 100) + '%'}
            </span>
            
            <button
              onClick={zoomIn}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Zoom In (+)"
            >
              <ZoomIn size={20} />
            </button>
            
            <div className="w-px h-6 bg-gray-300"></div>
            
            <button
              onClick={toggleFitToWidth}
              className={`px-2 sm:px-3 py-1 text-xs font-medium rounded transition-colors ${
                fitToWidth 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Fit to Screen"
            >
              FIT
            </button>
            
            <button
              onClick={resetZoom}
              className="px-2 sm:px-3 py-1 text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 rounded transition-colors"
              title="Reset Zoom (0)"
            >
              100%
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-gray-100 relative">
        <div className="min-h-full flex items-center justify-center p-2 sm:p-4" style={{ minWidth: 'fit-content' }}>
          <div className={`relative transition-all duration-150 ease-in-out ${
            isFlipping ? 'transform scale-95 opacity-50' : 'transform scale-100 opacity-100'
          }`} style={{ 
            minWidth: 'fit-content', 
            minHeight: 'fit-content',
            alignSelf: 'center'
          }}>
            <canvas
              ref={canvasRef}
              className="shadow-xl border border-gray-300 bg-white rounded-lg pdf-canvas"
              style={{
                display: 'block',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none',
                maxWidth: 'none',
                height: 'auto',
                minWidth: 'fit-content'
              }}
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
            />
            
            {isRendering && (
              <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                  <span className="text-sm text-gray-700 font-medium">Rendering page...</span>
                </div>
              </div>
            )}
            
            <div className="absolute inset-0 pointer-events-none select-none">
              <div className="absolute top-4 right-4 text-xs text-gray-400 opacity-30 font-mono">
                SECURE VIEWER
              </div>
              <div className="absolute bottom-4 left-4 text-xs text-gray-400 opacity-30 font-mono">
                {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`bg-white border-t border-gray-200 px-4 py-2 transition-transform duration-300 ${
        isFullscreen && !showControls ? 'translate-y-full' : 'translate-y-0'
      }`}>
        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
          <div className="hidden sm:block">
            Use arrow keys to navigate • +/- to zoom • F for fullscreen • ESC to close
          </div>
          <div className="sm:hidden">
            Pinch to zoom • Tap for controls
          </div>
          <div className="font-medium">
            {fitToWidth ? 'Fit to Screen' : Math.round((scale) * 100) + '%'} • Page {currentPage} of {totalPages}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedPDFViewer;