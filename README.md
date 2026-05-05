AI Page Summarizer 🚀
A high-performance Chrome Extension that extracts the "meat" of any webpage and generates a concise, 3-bullet point summary using Llama 3.3 70B on Groq.

📺 Demo
https://drive.google.com/file/d/12HUlIgkaAIsvR4O8swl7Vy4DUbxN59aY/view?usp=sharing

🛠 Setup Instructions
Clone the Repo:

Bash
git clone https://github.com/your-username/your-repo-name.git
Install Dependencies (Optional):
If you wish to modify the styles, run:

Bash
npm install
npx tailwindcss -i ./input.css -o ./style.css
Load in Chrome:

Open Chrome and go to chrome://extensions.

Enable Developer Mode (toggle in the top-right).

Click Load unpacked and select the project folder.

Configure API Key:

Get an API key from the Groq Console.

Click the extension icon, paste your key, and start summarizing.

🏗 Architecture Explanation
The extension is built using Manifest V3 to ensure security and performance:

Content Script (content.js): Uses a scoring algorithm to identify the "main" content of a page. It clones the DOM, removes noise (ads, nav, footers), and calculates text density to find the most relevant article text.

Background Service Worker (background.js): Handles all API communication. This keeps the API key logic out of the webpage context and allows for asynchronous fetch calls without CORS issues.

Popup (popup.js / popup.html): A clean UI built with Tailwind CSS. It manages user input, triggers the extraction process, and displays the final summary.

Storage API: Utilized for two purposes:

Persisting the user's API key.

Caching: Summaries are cached by URL to prevent redundant API calls and save tokens.

🤖 AI Integration
Model: llama-3.3-70b-versatile via Groq.

Prompting: I implemented a strict system prompt to ensure the output always follows a 3-bullet format with a "Key Insight" finish.

Optimization: Text is cleaned (removing excessive whitespace) and truncated to 6,000 characters before sending to the LLM. This balances context retention with token efficiency.

🔒 Security Decisions
API Key Safety: The key is stored in chrome.storage.local (never hardcoded) and is only handled by the background service worker, keeping it isolated from the website's JavaScript environment.

Content Security Policy (CSP): To comply with MV3, I removed all remote CDNs (like Tailwind's CDN) and bundled all styles locally in style.css.

Minimal Permissions: The extension only requests activeTab and scripting to ensure it only accesses data when the user explicitly interacts with it.

⚖️ Trade-offs
Custom Scoring vs. Readability.js: I wrote a custom scoreNode function instead of using a library like Mozilla's Readability. While less "perfect" on extremely messy sites, it keeps the extension lightweight and has zero external dependencies.

Local Caching: I chose chrome.storage.local for caching. The trade-off is that if a page's content changes (like a live news feed), the extension might show an older summary unless the user clears the cache.

Truncation: Truncating at 6,000 characters saves cost and speed but may miss details in massive 50-page documents.
