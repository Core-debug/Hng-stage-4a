'use strict'

/**
 * Clean and Fetch summary from AI Provider
 * @param {string} text - The raw page content
 * @param {string} apiKey - The user's API key passed from popup
 */
const fetchUrl = async (text, apiKey) => {
    console.log("Attempting request to Groq...");

    if (!text) {
        return "No text found to summarize.";
    }

    try {
        const url = 'https://api.groq.com/openai/v1/chat/completions';

        // CLEAN THE TEXT: Remove extra spaces, tabs, and newlines
        const cleanText = text
            .replace(/[\t\r\n]+/g, ' ')
            .replace(/\s{2,}/g, ' ')
            .trim();

        // TRUNCATE: Staying within model context limits
        const truncatedText = cleanText.substring(0, 6000);

        const payload = {
            model: 'llama-3.3-70b-versatile',
            messages: [
                {
                    role: 'system',
                    // Updated prompt to meet "Bullet-point summary" and "Key insights" requirement
                    content: 'Summarize the provided text in 3 concise bullet points. End with a single sentence labeled "Key Insight:".'
                },
                {
                    role: 'user',
                    content: `Please summarize this: ${truncatedText}`
                }
            ],
            temperature: 0.5,
            max_tokens: 500
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // FIX: Use the apiKey parameter, NOT a hardcoded string
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || `API Error: ${response.status}`);
        }

        return data.choices[0].message.content;

    } catch (error) {
        console.error(`Error during fetch: ${error.message}`);
        throw error;
    }
}

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'GET_SUMMARY') {
        const { text, url, apiKey } = message.data;

        // 1. Storage Requirement: Cache summaries per URL
        chrome.storage.local.get([url], (result) => {
            if (result[url]) {
                console.log("Returning cached summary for:", url);
                sendResponse({ success: true, summary: result[url] });
            } else {
                // 2. Security Requirement: Call AI using the key provided by the user
                fetchUrl(text, apiKey)
                    .then(summary => {
                        // Save to cache to prevent duplicate API calls
                        chrome.storage.local.set({ [url]: summary });
                        sendResponse({ success: true, summary });
                    })
                    .catch(err => {
                        sendResponse({ success: false, error: err.message });
                    });
            }
        });

        return true; // Keeps the message channel open for the async fetch
    }
});