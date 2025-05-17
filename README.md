# AI Resume Tailor Chrome Extension

*Tailor your resume and draft cover letters instantly using Google’s Gemini AI.*

## Overview
AI Resume Tailor is a Chrome extension that streamlines the job application process by automatically customizing your resume and drafting a professional cover letter based on any selected job description text. Powered by Google’s Gemini API, this tool highlights relevant skills and experiences to maximize your chances of standing out.

## Features
- **Context‑Menu Integration**: Right‑click any job listing or description to generate tailored documents.
- **Resume Tailoring**: AI‑driven reordering and emphasis of your existing resume content.
- **Cover Letter Drafting**: Generates a concise, persuasive cover letter customized to the position.
- **Real‑time Feedback**: Displays progress and results instantly in a popup.

## Installation
1. **Clone the repository**:
   ```bash
   git clone https://github.com/CDFire/AIResumeTailor.git
   cd AIResumeTailor
   ```
2. **Load into Chrome**:
   - Open `chrome://extensions/` in your browser.
   - Enable **Developer mode** (toggle in top right).
   - Click **Load unpacked** and select the `AIResumeTailor` directory.

## Configuration
1. Click the extension icon → **Options**.
2. Enter your **Google Gemini API Key**.
3. Paste your **base resume** text.

Ensure you click **Save** before closing the options page.

## Usage
1. Navigate to any job posting or description.
2. Highlight the job requirements or entire description.
3. Right‑click and select **AI: Tailor Resume & Draft Cover Letter**.
4. Wait for the popup to show your tailored resume and cover letter.
5. Copy the generated documents into your application materials.

## Architecture
```
Chrome Context Menu → background.js → callGeminiAPI() → Gemini AI → Popup Display
```  
- **background.js**: Handles menu events, API calls, state management.
- **popup.js**: Renders loading state and final documents.
- **options.html/js**: Stores API key and resume in `chrome.storage.local`.
- **manifest.json**: Declares permissions, scripts, and UI components.
