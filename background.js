// Define the Gemini model to be used for content generation. Verify availability in Google AI Studio.
const GEMINI_MODEL_NAME = "gemini-2.5-flash-preview-04-17   ";

/**
 * Calls the Google Gemini API to generate content based on the provided prompt.
 * @param {string} apiKey - The API key for authenticating with the Gemini service.
 * @param {string} promptText - The text prompt to send for content generation.
 * @returns {Promise<string>} - The generated text returned by the Gemini API.
 * @throws {Error} - Throws if the API request fails or returns an unexpected structure.
 */
async function callGeminiAPI(apiKey, promptText) {
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL_NAME}:generateContent?key=${apiKey}`;
    const requestBody = {
        contents: [{ parts: [{ text: promptText }] }],
        // Optional safety and generation settings can be added here if required:
        // safetySettings: [ /* ... */ ],
        // generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorBody = await response.json();
            console.error('Gemini API returned an error:', errorBody);
            throw new Error(`API request failed (status ${response.status}): ${errorBody.error?.message || response.statusText}`);
        }

        const data = await response.json();

        // Validate and extract the generated text from the API response.
        if (
            data.candidates?.length > 0 &&
            data.candidates[0].content?.parts?.length > 0 &&
            typeof data.candidates[0].content.parts[0].text === 'string'
        ) {
            return data.candidates[0].content.parts[0].text;
        }

        // Handle cases where the prompt is blocked by safety filters.
        if (data.promptFeedback?.blockReason) {
            const reason = data.promptFeedback.blockReason;
            const ratings = data.promptFeedback.safetyRatings?.
                map(r => `${r.category}(${r.probability})`).join(', ') || 'N/A';
            console.error(`Prompt blocked: ${reason}. Safety ratings: ${ratings}`);
            throw new Error(`AI prompt blocked for reason: ${reason}`);
        }

        // Handle unfinished or non-stop completion reasons.
        if (data.candidates?.[0]?.finishReason && data.candidates[0].finishReason !== 'STOP') {
            const finishReason = data.candidates[0].finishReason;
            console.error(`Generation halted: ${finishReason}`, data.candidates[0]);
            throw new Error(`AI generation interrupted: ${finishReason}`);
        }

        // Fallback for any unexpected response structure.
        console.error('Unexpected API response format:', data);
        throw new Error('Unable to extract valid content from Gemini response.');

    } catch (err) {
        console.error('Error invoking Gemini API:', err.message);
        throw err;
    }
}

/**
 * Listener for extension installation or update events.
 * Sets up the context menu entry and initializes state.
 */
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: 'aiJobHelper',
        title: 'AI: Tailor Resume & Draft Cover Letter',
        contexts: ['selection']
    });

    // Initialize the application state upon installation.
    lastKnownState = {
        type: 'INITIAL',
        message: 'Right-click a job description to begin.'
    };

    console.log('AI Job Helper extension installed and context menu created.');
});

// Maintains the most recent state of the application for the popup UI.
let lastKnownState = {
    type: 'INITIAL',
    message: 'Right-click a job description to begin.'
};

/**
 * Handles context menu clicks to process selected job descriptions.
 */
chrome.contextMenus.onClicked.addListener(async (info) => {
    if (info.menuItemId !== 'aiJobHelper') return;

    const selection = info.selectionText?.trim();
    if (!selection) {
        lastKnownState = {
            type: 'SHOW_RESULTS_ERROR',
            message: 'No text was selected. Please highlight a job description and try again.'
        };
        chrome.runtime.sendMessage(lastKnownState).catch(handleSendMessageError);
        return;
    }

    // Notify the UI that processing has started.
    lastKnownState = { type: 'SHOW_LOADING', message: 'Generating tailored content...' };
    chrome.runtime.sendMessage(lastKnownState).catch(handleSendMessageError);

    // Retrieve API key and base resume from local storage.
    chrome.storage.local.get(['geminiApiKey', 'userResume'], async (items) => {
        if (chrome.runtime.lastError) {
            console.error('Error reading extension settings:', chrome.runtime.lastError.message);
            lastKnownState = {
                type: 'SHOW_RESULTS_ERROR',
                message: 'Unable to access settings. Please check your configuration.'
            };
            chrome.runtime.sendMessage(lastKnownState).catch(handleSendMessageError);
            return;
        }

        if (!items.geminiApiKey || !items.userResume) {
            lastKnownState = {
                type: 'SHOW_RESULTS_ERROR',
                message: 'API key or resume not configured. Opening settings now.'
            };
            chrome.runtime.sendMessage(lastKnownState).catch(handleSendMessageError);
            chrome.runtime.openOptionsPage();
            return;
        }

        const apiKey = items.geminiApiKey;
        const baseResume = items.userResume;

        // Construct prompts for resume tailoring and cover letter drafting.
        const resumePrompt = `...`; // Omitted for brevity
        const coverLetterPrompt = `...`;

        try {
            const tailoredResume = await callGeminiAPI(apiKey, resumePrompt);
            const coverLetter = await callGeminiAPI(apiKey, coverLetterPrompt);

            lastKnownState = {
                type: 'SHOW_RESULTS',
                payload: { tailoredResume, coverLetter }
            };
            chrome.runtime.sendMessage(lastKnownState).catch(handleSendMessageError);

        } catch (err) {
            console.error('Processing pipeline error:', err.message);
            lastKnownState = {
                type: 'SHOW_RESULTS_ERROR',
                message: `An error occurred: ${err.message}`
            };
            chrome.runtime.sendMessage(lastKnownState).catch(handleSendMessageError);
        }
    });
});

/**
 * Responds to messages from the popup, providing the last known state.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'GET_LAST_KNOWN_STATE') {
        try {
            sendResponse(lastKnownState);
        } catch (e) {
            console.warn('Failed to respond to GET_LAST_KNOWN_STATE:', e.message);
        }
        return true; // Keeps the message channel open for asynchronous responses.
    }
});

/**
 * Logs or suppresses errors when sending messages to the popup.
 * @param {Error} error - The error encountered when sending a message.
 */
function handleSendMessageError(error) {
    if (error.message.includes('Receiving end does not exist')) {
        // The popup may not be open; no action required.
        return;
    }
    console.error('Error sending message to popup:', error.message);
}

// Entry point log to confirm background script has loaded.
console.log('AI Job Helper background script is active.');