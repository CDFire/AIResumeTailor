document.addEventListener('DOMContentLoaded', function () {
    const statusMessageDiv = document.getElementById('statusMessage');
    const resultsContainerDiv = document.getElementById('resultsContainer');
    const tailoredResumeTextarea = document.getElementById('tailoredResume');
    const coverLetterTextarea = document.getElementById('coverLetter');
    const copyButtons = document.querySelectorAll('.copy-button');

    function updatePopupUI(state) {
        if (!state) { // Should not happen if background sends initial state
            showStatus("Initializing...", false); // Default initial message
            return;
        }

        switch (state.type) {
            case "SHOW_LOADING":
                showStatus(state.message || "Processing... Please wait.", false);
                break;
            case "SHOW_RESULTS":
                if (state.payload) {
                    showResults(state.payload.tailoredResume, state.payload.coverLetter);
                } else { // Should not happen if payload is guaranteed
                    showStatus("Received results but no data.", true);
                }
                break;
            case "SHOW_RESULTS_ERROR":
                showStatus(state.message || "An unspecified error occurred.", true);
                break;
            case "INITIAL":
                showStatus(state.message || "Right-click selected job description to start.", false);
                resultsContainerDiv.classList.add('hidden');
                statusMessageDiv.classList.remove('hidden');
                statusMessageDiv.className = ''; // Reset to default style, no 'loading' or 'error' class
                break;
            default:
                console.warn("Popup received unknown state type:", state.type, state);
                showStatus("Unexpected state. Check console.", true); // Fallback
                break;
        }
    }

    function showStatus(message, isError = false) {
        statusMessageDiv.textContent = message;
        statusMessageDiv.className = isError ? 'error' : 'loading'; // Apply error or loading style
        if (!isError && message === "Processing... Please wait.") { // Only apply loading class if it's loading
             statusMessageDiv.className = 'loading';
        } else if (!isError) { // For initial message, no special class
            statusMessageDiv.className = '';
        }
        resultsContainerDiv.classList.add('hidden');
        statusMessageDiv.classList.remove('hidden');
    }

    function showResults(resume, coverLetter) {
        tailoredResumeTextarea.value = resume;
        coverLetterTextarea.value = coverLetter;
        resultsContainerDiv.classList.remove('hidden');
        statusMessageDiv.classList.add('hidden');
    }

    // Listen for direct messages from background
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        updatePopupUI(request);
        return true; // For async response if needed by other handlers
    });

    // When popup opens, ask background for current state
    chrome.runtime.sendMessage({ type: "GET_LAST_KNOWN_STATE" }, (response) => {
        if (chrome.runtime.lastError) {
            console.error("Error getting last state:", chrome.runtime.lastError.message);
            updatePopupUI({ type: "SHOW_RESULTS_ERROR", message: "Could not connect to background. Ensure extension is enabled." });
        } else if (response) {
            updatePopupUI(response);
        } else {
            console.warn("No response or undefined response for GET_LAST_KNOWN_STATE.");
            updatePopupUI({ type: "INITIAL", message: "Ready. Right-click a job description." }); // Default initial state
        }
    });

    copyButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const textarea = document.getElementById(targetId);
            textarea.select();
            try {
                document.execCommand('copy');
                const originalText = this.textContent;
                this.textContent = 'Copied!';
                setTimeout(() => { this.textContent = originalText; }, 1500);
            } catch (err) {
                console.error('Failed to copy text using execCommand: ', err);
            }
        });
    });
});