/**
 * IMPROVED PDF PROXY ENDPOINT
 * 
 * This is a replacement for the PDF proxy endpoint in server.js (lines 627-764)
 * 
 * THE PROBLEM:
 * - Cloudinary stores PDFs with inconsistent naming (with/without .pdf extension)
 * - The old proxy only tried one or two URL variations
 * - This caused 404 errors when trying to load purchased books
 * 
 * THE SOLUTION:
 * - Try multiple URL variations systematically
 * - Handle both Cloudinary and non-Cloudinary URLs
 * - Better error messages and logging
 * 
 * TO INTEGRATE:
 * Replace lines 627-764 in server.js with the code below
 */

// PDF Proxy endpoint
app.get("/api/pdf-proxy", async (req, res) => {
    try {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({ error: "URL parameter is required" });
        }

        console.log(`🔍 [PDF PROXY] Fetching PDF from: ${url}`);

        // Check if this is a Cloudinary URL
        if (url.includes('cloudinary.com')) {
            const cloudName = process.env.CLOUDINARY_CLOUD_NAME;

            // Extract the public ID from the URL
            // Format: https://res.cloudinary.com/{cloud}/raw/upload/v{version}/{folder}/{id}.pdf
            // or: https://res.cloudinary.com/{cloud}/raw/upload/{folder}/{id}.pdf
            const match = url.match(/\/upload\/(?:v\d+\/)?(.+)$/);

            if (match && match[1]) {
                // Get the full path (folder/id or folder/id.pdf)
                let publicId = match[1];

                // Remove .pdf extension if present to get base public ID
                const basePublicId = publicId.replace(/\.(pdf|PDF)$/, '');

                console.log(`📝 [PDF PROXY] Original publicId: ${publicId}`);
                console.log(`📝 [PDF PROXY] Base publicId (without extension): ${basePublicId}`);

                // Array of URL strategies to try in order
                const urlsToTry = [
                    // Try 1: Direct URL without extension
                    `https://res.cloudinary.com/${cloudName}/raw/upload/${basePublicId}`,

                    // Try 2: Direct URL with .pdf extension
                    `https://res.cloudinary.com/${cloudName}/raw/upload/${basePublicId}.pdf`,

                    // Try 3: Original URL (in case user passed a working URL already)
                    url,
                ];

                const headers = {
                    'User-Agent': req.headers['user-agent'] || 'Acadmix-Backend'
                };

                let response = null;
                let successUrl = null;

                // Try each URL until one works
                for (const tryUrl of urlsToTry) {
                    console.log(`🔄 [PDF PROXY] Trying URL: ${tryUrl}`);

                    try {
                        response = await fetch(tryUrl, { headers });
                        console.log(`📊 [PDF PROXY] Response: ${response.status} ${response.statusText}`);

                        if (response.ok) {
                            successUrl = tryUrl;
                            console.log(`✅ [PDF PROXY] Success with URL: ${successUrl}`);
                            break;
                        }
                    } catch (err) {
                        console.warn(`⚠️ [PDF PROXY] Failed to fetch from ${tryUrl}:`, err.message);
                    }
                }

                if (!response || !response.ok) {
                    console.error(`❌ [PDF PROXY] All URL attempts failed`);
                    console.error(`   Original URL: ${url} `);
                    console.error(`   Base public ID: ${basePublicId}`);
                    console.error(`   Tried ${urlsToTry.length} variations`);

                    return res.status(404).json({
                        error: "PDF not found",
                        message: "Unable to locate the PDF file. The file may have been deleted or the URL is incorrect.",
                        publicId: basePublicId,
                        originalUrl: url
                    });
                }

                const contentType = response.headers.get('content-type');
                const contentLength = response.headers.get('content-length');

                console.log(`📦 [PDF PROXY] Content-Type: ${contentType}, Content-Length: ${contentLength}`);

                // Set PDF headers
                res.setHeader('Content-Type', contentType || 'application/pdf');
                if (contentLength) {
                    res.setHeader('Content-Length', contentLength);
                }
                res.setHeader('Content-Disposition', 'inline; filename="document.pdf"');
                res.setHeader('Cache-Control', 'private, max-age=3600'); // Cache for 1 hour

                // Stream the PDF
                response.body.pipe(res);

                console.log(`✅ [PDF PROXY] Successfully streaming PDF from: ${successUrl}`);
                return; // Exit early after successful response
            }
        }

        // Non-Cloudinary URL or fallback - try direct proxy
        console.log(`🌐 [PDF PROXY] Non-Cloudinary URL, using direct proxy`);

        const headers = {
            'User-Agent': req.headers['user-agent'] || 'Acadmix-Backend'
        };

        const response = await fetch(url, { headers });

        console.log(`📊 [PDF PROXY] Response status: ${response.status} ${response.statusText}`);

        if (!response.ok) {
            console.error(`❌ [PDF PROXY] Failed to fetch PDF: ${response.status} ${response.statusText}`);
            return res.status(response.status).json({
                error: "Failed to fetch PDF",
                status: response.status,
                statusText: response.statusText,
                url: url
            });
        }

        const contentType = response.headers.get('content-type');
        const contentLength = response.headers.get('content-length');

        console.log(`📦 [PDF PROXY] Content-Type: ${contentType}, Content-Length: ${contentLength}`);

        // Set PDF headers
        res.setHeader('Content-Type', contentType || 'application/pdf');
        if (contentLength) {
            res.setHeader('Content-Length', contentLength);
        }
        res.setHeader('Content-Disposition', 'inline; filename="document.pdf"');

        // Stream the PDF
        response.body.pipe(res);

        console.log(`✅ [PDF PROXY] Successfully streaming PDF`);
    } catch (error) {
        console.error(`❌ [PDF PROXY] Error:`, error);
        res.status(500).json({
            error: "Failed to proxy PDF",
            message: error.message
        });
    }
});
