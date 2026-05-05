'use strict';
console.log("✅ Content script loaded");
// Utility: remove unwanted elements
function removeNoise(root) {
    const selectors = [
        'script', 'style', 'noscript',
        'header', 'footer', 'nav', 'aside',
        '[role="navigation"]',
        '[aria-hidden="true"]',
        '.ads', '.ad', '.advert', '.banner',
        '.cookie', '.popup', '.modal',
        '.sidebar', '.menu', '.nav',
        '.footer', '.header',
        'button', 'input', 'form'
    ];

    selectors.forEach(sel => {
        root.querySelectorAll(sel).forEach(el => el.remove());
    });
}

// Utility: score nodes by text density
function scoreNode(node) {
    const text = node.innerText || '';
    const textLength = text.trim().length;

    const linkTextLength = Array.from(node.querySelectorAll('a'))
        .map(a => a.innerText.length)
        .reduce((a, b) => a + b, 0);

    const linkDensity = linkTextLength / (textLength || 1);

    return textLength * (1 - linkDensity);
}

// Find best candidate (main content)
function findMainContent(root) {
    const candidates = root.querySelectorAll('article, main, section, div');

    let bestNode = null;
    let bestScore = 0;

    candidates.forEach(node => {
        const score = scoreNode(node);

        if (score > bestScore && node.innerText.trim().length > 200) {
            bestScore = score;
            bestNode = node;
        }
    });

    return bestNode || document.body;
}

// Clean extracted text
function cleanText(text) {
    return text
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .trim();
}

// Main extraction function
function extractContent() {
    const clone = document.body.cloneNode(true);

    // Step 1: remove junk
    removeNoise(clone);

    // Step 2: find best content block
    const main = findMainContent(clone);
    // Step 3: extract text
    let text = main.innerText || '';

    text = cleanText(text);

    // Step 4: truncate (protect token usage)
    return text.slice(0, 8000);
}

// Listen for popup request
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("📩 Message received:", request);
    if (request.action === "GET_PAGE_TEXT") {
        try {
            const text = extractContent();

            if (!text || text.length < 100) {
                console.log("📤 Sending response");
                sendResponse({ text: "Content too short or not readable." });
            } else {
                sendResponse({ text });
            }
        } catch (err) {
            console.error("Extraction error:", err);
            sendResponse({ text: "Failed to extract content." });
        }
    }
});