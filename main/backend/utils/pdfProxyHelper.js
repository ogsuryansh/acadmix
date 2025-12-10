// Improved PDF Proxy endpoint
// This endpoint handles fetching PDFs from Cloudinary and other sources
// It tries multiple URL variations to ensure PDFs can be accessed reliably

const express = require('express');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// Helper function to try multiple Cloudinary URL variations
async function tryCloudinaryUrls(cloudName, publicId, headers) {
    // Array of URL strategies to try in order
    const urlsToTry = [
        // Try 1: Direct URL without extension
        `https://res.cloudinary.com/${cloudName}/raw/upload/${publicId}`,

        // Try 2: Direct URL with .pdf extension
        `https://res.cloudinary.com/${cloudName}/raw/upload/${publicId}.pdf`,
    ];

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
                return { response, successUrl };
            }
        } catch (err) {
            console.warn(`⚠️ [PDF PROXY] Failed to fetch from ${tryUrl}:`, err.message);
        }
    }

    return { response: null, successUrl: null };
}

module.exports = { tryCloudinaryUrls };
