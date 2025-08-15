import { useState, useEffect } from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCw, Fullscreen, Minimize2 } from 'lucide-react';

const PDFViewer = ({ pdfUrl, onClose, title }) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [proxyUrl, setProxyUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch PDF data with authentication and create blob URL
  useEffect(() => {
    const fetchPDF = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (pdfUrl && pdfUrl.includes('res.cloudinary.com')) {
          // Use proxy for Cloudinary PDFs with direct fetch to avoid axios interceptor logout
          const token = localStorage.getItem('token');
          let response;
          
          // Use the same dynamic API base URL logic as the rest of the application
          const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
            (isDevelopment ? 'http://localhost:5000/api' : 'https://api.acadmix.shop/api');
          
          if (token) {
            // Try authenticated proxy first
            response = await fetch(`${API_BASE_URL}/pdf-proxy?url=${encodeURIComponent(pdfUrl)}`, {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
          }
          
          // If no token or authenticated request failed, try free PDF endpoint
          if (!token || !response?.ok) {
            console.log('🆓 Trying free PDF endpoint...');
            response = await fetch(`${API_BASE_URL}/free-pdf-proxy?url=${encodeURIComponent(pdfUrl)}`);
          }
          
          if (!response.ok) {
            if (response.status === 401) {
              setError('Authentication failed. Please login again.');
            } else {
              const errorData = await response.json().catch(() => ({}));
              setError(errorData.error || `Failed to load PDF (${response.status})`);
            }
            return;
          }
          
          const blob = await response.blob();
          const blobUrl = URL.createObjectURL(blob);
          setProxyUrl(blobUrl);
        } else {
          // For non-Cloudinary PDFs, try direct access
          setProxyUrl(pdfUrl);
        }
      } catch (err) {
        console.error('PDF fetch error:', err);
        setError('Failed to load PDF. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPDF();

    // Cleanup blob URL on unmount
    return () => {
      if (proxyUrl && proxyUrl.startsWith('blob:')) {
        URL.revokeObjectURL(proxyUrl);
      }
    };
  }, [pdfUrl]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = title || 'document.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {title || 'PDF Viewer'}
          </h2>
          
          <div className="flex items-center space-x-2">
            {/* Zoom Controls */}
            <button
              onClick={handleZoomOut}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            
            <span className="text-sm text-gray-600 dark:text-gray-400 min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            
            <button
              onClick={handleZoomIn}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            
            {/* Rotate */}
            <button
              onClick={handleRotate}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              title="Rotate"
            >
              <RotateCw className="h-4 w-4" />
            </button>
            
            {/* Fullscreen */}
            <button
              onClick={handleFullscreen}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Fullscreen className="h-4 w-4" />}
            </button>
            
            {/* Download */}
            <button
              onClick={handleDownload}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </button>
            
            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {/* PDF Content */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-700">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">
                  Loading PDF...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-700">
              <div className="text-center">
                <p className="text-red-600 dark:text-red-400 mb-4">
                  {error}
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <button
                    onClick={() => {
                      setError(null);
                      setLoading(true);
                      // Trigger the useEffect again by changing the key
                      const fetchPDF = async () => {
                        try {
                          setLoading(true);
                          setError(null);
                          
                          if (pdfUrl && pdfUrl.includes('res.cloudinary.com')) {
                            const token = localStorage.getItem('token');
                            let response;
                            
                            // Use the same dynamic API base URL logic as the rest of the application
                            const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
                            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
                              (isDevelopment ? 'http://localhost:5000/api' : 'https://api.acadmix.shop/api');
                            
                            if (token) {
                              response = await fetch(`${API_BASE_URL}/pdf-proxy?url=${encodeURIComponent(pdfUrl)}`, {
                                headers: {
                                  'Authorization': `Bearer ${token}`
                                }
                              });
                            }
                            
                            if (!token || !response?.ok) {
                              console.log('🆓 Trying free PDF endpoint...');
                              response = await fetch(`${API_BASE_URL}/free-pdf-proxy?url=${encodeURIComponent(pdfUrl)}`);
                            }
                            
                            if (!response.ok) {
                              if (response.status === 401) {
                                setError('Authentication failed. Please login again.');
                              } else {
                                const errorData = await response.json().catch(() => ({}));
                                setError(errorData.error || `Failed to load PDF (${response.status})`);
                              }
                              return;
                            }
                            
                            const blob = await response.blob();
                            const blobUrl = URL.createObjectURL(blob);
                            setProxyUrl(blobUrl);
                          } else {
                            setProxyUrl(pdfUrl);
                          }
                        } catch (err) {
                          console.error('PDF fetch error:', err);
                          setError('Failed to load PDF. Please try again.');
                        } finally {
                          setLoading(false);
                        }
                      };
                      fetchPDF();
                    }}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Retry
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        console.log('Testing PDF URL:', pdfUrl);
                        const response = await fetch(`/api/test-pdf-url?url=${encodeURIComponent(pdfUrl)}`);
                        const data = await response.json();
                        console.log('URL test result:', data);
                        if (data.success) {
                          setError(`URL is accessible (${data.status}). Content-Type: ${data.contentType}`);
                        } else {
                          setError(`URL test failed: ${data.error} (${data.status})`);
                        }
                      } catch (err) {
                        console.error('URL test error:', err);
                        setError('URL test failed');
                      }
                    }}
                    className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    Test URL
                  </button>
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Open PDF in New Tab
                  </a>
                </div>
              </div>
            </div>
          ) : proxyUrl ? (
            <object
              data={proxyUrl}
              type="application/pdf"
              className="w-full h-full"
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
                transition: 'transform 0.2s ease-in-out'
              }}
            >
              <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-700">
                <div className="text-center">
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    PDF cannot be displayed. 
                  </p>
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Open PDF in New Tab
                  </a>
                </div>
              </div>
            </object>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-700">
              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  No PDF available
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PDFViewer; 