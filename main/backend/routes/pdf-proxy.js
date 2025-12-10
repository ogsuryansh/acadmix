const express = require('express');
const logger = require('../utils/logger');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// PDF Proxy endpoint with Cloudinary intelligent URL handling
router.get('/', asyncHandler(async (req, res) => {
    const { url } = req.query;

    if (!url) {
        logger.error('PDF proxy called without URL parameter');
        return res.status(400).json({ success: false, error: "URL parameter is required" });
    }

    logger.info('🔍 [PDF PROXY] Request received', { url });

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => {
        controller.abort();
    }, 30000); // 30 second timeout

    try {
        let response = null;
        let successUrl = null;

        // Check if this is a Cloudinary URL
        if (url.includes('cloudinary.com')) {
            const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

            logger.info('📦 [PDF PROXY] Detected Cloudinary URL', { cloudName });

            // Extract the public ID from the URL
            // Format: https://res.cloudinary.com/{cloud}/raw/upload/v{version}/{folder}/{id}.pdf
            const match = url.match(/\/upload\/(?:v\d+\/)?(.+)$/);

            if (match && match[1]) {
                let publicId = match[1];

                // Remove .pdf extension if present to get base public ID
                const basePublicId = publicId.replace(/\.(pdf|PDF)$/, '');

                logger.info('📝 [PDF PROXY] Extracted public ID', {
                    original: publicId,
                    base: basePublicId
                });

                // Array of URL strategies to try in order
                const urlsToTry = [
                    // Try 1: Direct URL without extension
                    `https://res.cloudinary.com/${cloudName}/raw/upload/${basePublicId}`,

                    // Try 2: Direct URL with .pdf extension
                    `https://res.cloudinary.com/${cloudName}/raw/upload/${basePublicId}.pdf`,

                    // Try 3: Original URL
                    url,
                ];

                // Try each URL until one works
                for (let i = 0; i < urlsToTry.length; i++) {
                    const tryUrl = urlsToTry[i];
                    logger.info(`🔄 [PDF PROXY] Attempt ${i + 1}/${urlsToTry.length}`, { url: tryUrl });

                    try {
                        response = await fetch(tryUrl, {
                            signal: controller.signal,
                            headers: {
                                'User-Agent': 'Acadmix-Backend'
                            }
                        });

                        logger.info(`📊 [PDF PROXY] Response from attempt ${i + 1}`, {
                            status: response.status,
                            statusText: response.statusText,
                            contentType: response.headers.get('content-type')
                        });

                        if (response.ok) {
                            successUrl = tryUrl;
                            logger.info(`✅ [PDF PROXY] Success with URL variation ${i + 1}`, { url: successUrl });
                            break;
                        }
                    } catch (err) {
                        logger.warn(`⚠️ [PDF PROXY] Attempt ${i + 1} failed`, {
                            url: tryUrl,
                            error: err.message
                        });
                    }
                }

                if (!response || !response.ok) {
                    logger.error('❌ [PDF PROXY] All Cloudinary URL attempts failed', {
                        publicId: basePublicId,
                        attemptedUrls: urlsToTry.length,
                        cloudName
                    });

                    clearTimeout(timeout);
                    return res.status(404).json({
                        success: false,
                        error: "PDF not found in Cloudinary",
                        message: "Unable to locate the PDF file. The file may have been deleted or moved.",
                        publicId: basePublicId,
                        debug: {
                            attemptedVariations: urlsToTry.length,
                            cloudName,
                            originalUrl: url
                        }
                    });
                }
            } else {
                logger.warn('⚠️ [PDF PROXY] Could not extract public ID from Cloudinary URL', { url });
                // Fall through to try original URL
            }
        }

        // If not Cloudinary or extraction failed, try original URL
        if (!response) {
            logger.info('🌐 [PDF PROXY] Using direct proxy (non-Cloudinary or fallback)');

            response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Acadmix-Backend'
                }
            });

            logger.info('📊 [PDF PROXY] Direct fetch response', {
                status: response.status,
                statusText: response.statusText
            });

            successUrl = url;
        }

        clearTimeout(timeout);

        if (!response.ok) {
            logger.error('❌ [PDF PROXY] Fetch failed', {
                url: successUrl || url,
                status: response.status,
                statusText: response.statusText
            });

            return res.status(response.status).json({
                success: false,
                error: "Failed to fetch PDF",
                status: response.status,
                statusText: response.statusText,
                url: successUrl || url
            });
        }

        const contentType = response.headers.get('content-type');
        const contentLength = response.headers.get('content-length');

        logger.info('📦 [PDF PROXY] PDF metadata', {
            contentType,
            contentLength,
            successUrl
        });

        // Set PDF headers
        res.setHeader('Content-Type', contentType || 'application/pdf');
        if (contentLength) {
            res.setHeader('Content-Length', contentLength);
        }
        res.setHeader('Content-Disposition', 'inline; filename="document.pdf"');
        res.setHeader('Cache-Control', 'private, max-age=3600'); // Cache for 1 hour

        // Stream the PDF with error handling
        const stream = response.body;

        stream.on('error', (streamError) => {
            logger.error('❌ [PDF PROXY] Stream error', {
                error: streamError.message,
                url: successUrl || url
            });
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

        logger.info('✅ [PDF PROXY] Streaming started successfully', {
            url: successUrl || url,
            contentLength
        });

    } catch (error) {
        clearTimeout(timeout);

        if (error.name === 'AbortError') {
            logger.error('❌ [PDF PROXY] Request timeout', { url });
            return res.status(504).json({
                success: false,
                error: "Request timeout while fetching PDF"
            });
        }

        logger.error('❌ [PDF PROXY] Unexpected error', {
            error: error.message,
            stack: error.stack,
            url
        });

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
