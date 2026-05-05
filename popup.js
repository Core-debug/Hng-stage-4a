'use strict';

const displayer = document.getElementById('summaryResult');
const summarizeBtn = document.getElementById('summarizeBtn');
const errorBox = document.getElementById('errorMessage');
const readingTimeBox = document.getElementById('readingTime');
const spinner = document.getElementById('spinner');
const apiKeyInput = document.getElementById('apiKeyInput');
const titleDisplay = document.getElementById('pageTitle');

// Load saved key
chrome.storage.local.get(['groq_key'], (res) => {
    if (res.groq_key) apiKeyInput.value = res.groq_key;
});

// Load tab title
chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab) titleDisplay.textContent = tab.title;
});

// 🔥 SAFE MESSAGE WRAPPER (important fix)
function sendMessageSafe(tabId, message) {
    return new Promise((resolve) => {
        chrome.tabs.sendMessage(tabId, message, (response) => {
            if (chrome.runtime.lastError) {
                resolve({ ok: false, error: chrome.runtime.lastError.message });
            } else {
                resolve({ ok: true, data: response });
            }
        });
    });
}

summarizeBtn.addEventListener('click', async () => {
    const key = apiKeyInput.value.trim();

    if (!key) {
        errorBox.textContent = "Please enter an API Key first.";
        errorBox.classList.remove("hidden");
        return;
    }

    chrome.storage.local.set({ groq_key: key });


    displayer.textContent = "Extracting content...";
    errorBox.classList.add("hidden");
    summarizeBtn.disabled = true;
    spinner.classList.remove("hidden");

    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        // ❌ invalid page guard
        const invalidPage =
            !tab ||
            !tab.url ||
            tab.url.startsWith("chrome://") ||
            tab.url.startsWith("edge://");

        if (invalidPage) {
            summarizeBtn.disabled = false;
            spinner.classList.add("hidden");

            errorBox.textContent = "This page cannot be summarized.";
            errorBox.classList.remove("hidden");
            return;
        }

        console.log("📨 Requesting page content...");

        // 🔥 SAFE CALL (no Chrome error spam)
        const result = await sendMessageSafe(tab.id, {
            action: 'GET_PAGE_TEXT'
        });

        if (!result.ok || !result.data?.text) {
            summarizeBtn.disabled = false;
            spinner.classList.add("hidden");

            errorBox.textContent = "Could not extract page content. Refresh and try again.";
            errorBox.classList.remove("hidden");
            return;
        }

        displayer.textContent = "AI is thinking...";

        // AI request
        chrome.runtime.sendMessage({
            type: 'GET_SUMMARY',
            data: {
                text: result.data.text,
                url: tab.url,
                apiKey: key
            }
        }, (apiResponse) => {

            summarizeBtn.disabled = false;
            spinner.classList.add("hidden");

            if (apiResponse?.success) {
                displayer.textContent = apiResponse.summary;

                const words = apiResponse.summary.split(/\s+/).length;
                readingTimeBox.textContent =
                    `Est. reading time: ${Math.ceil(words / 200)} min`;
            } else {
                errorBox.textContent = apiResponse?.error || "Summary failed.";
                errorBox.classList.remove("hidden");
            }
        });

    } catch (err) {
        summarizeBtn.disabled = false;
        spinner.classList.add("hidden");

        errorBox.textContent = err.message;
        errorBox.classList.remove("hidden");
    }
});

document.getElementById('resetBtn').addEventListener('click', () => {
    displayer.textContent = "";
    readingTimeBox.textContent = "";
    errorBox.classList.add("hidden");
});