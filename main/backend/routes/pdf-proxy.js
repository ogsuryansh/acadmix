const express = require('express');
const logger = require('../utils/logger');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// PDF Proxy endpoint with improved error handling
router.get('/', asyncHandler(async (req, res) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ success: false, error: "URL parameter is required" });
    }

    logger.debug('PDF proxy request', { url });

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => {
        controller.abort();
    }, 30000); // 30 second timeout

    try {
        const response = await fetch(url, {
            signal: controller.signal
        });

        clearTimeout(timeout);

        if (!response.ok) {
            logger.error('PDF fetch failed', {
                url,
                status: response.status,
                statusText: response.statusText
            });

            return res.status(response.status).json({
                success: false,
                error: "Failed to fetch PDF",
                status: response.status,
                statusText: response.statusText
            });
        }

        const contentType = response.headers.get('content-type');
        const contentLength = response.headers.get('content-length');

        // Validate content type
        if (contentType && !contentType.includes('pdf')) {
            logger.warn('Invalid content type for PDF', { url, contentType });
            return res.status(400).json({
                success: false,
                error: "URL does not point to a PDF file",
                contentType
            });
        }

        // Set PDF headers
        res.setHeader('Content-Type', contentType || 'application/pdf');
        if (contentLength) {
            res.setHeader('Content-Length', contentLength);
        }
        res.setHeader('Content-Disposition', 'inline; filename="document.pdf"');
        res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

        // Stream the PDF with error handling
        const stream = response.body;

        stream.on('error', (streamError) => {
            logger.error('PDF stream error', { error: streamError.message, url });
            if (!res.headersSent) {
                res.status(500).json({ success: false, error: "Failed to stream PDF" });
            }
        });

        req.on('close', () => {
            if (!stream.destroyed) {
                stream.destroy();
            }
        });

        stream.pipe(res);

        logger.debug('PDF streaming started successfully', { url });
    } catch (error) {
        clearTimeout(timeout);

        if (error.name === 'AbortError') {
            logger.error('PDF fetch timeout', { url });
            return res.status(504).json({
                success: false,
                error: "Request timeout while fetching PDF"
            });
        }

        logger.error('PDF proxy error', { error: error.message, url });

        if (!res.headersSent) {
            res.status(500).json({
                success: false,
                error: "Failed to proxy PDF",
                message: error.message
            });
        }
    }
}));

module.exports = router;
