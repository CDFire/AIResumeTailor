document.addEventListener('DOMContentLoaded', function () {
    const apiKeyInput = document.getElementById('apiKey');
    const userResumeInput = document.getElementById('userResume');
    const saveButton = document.getElementById('saveOptions');
    const statusDiv = document.getElementById('status');

    // Load saved options
    chrome.storage.local.get(['geminiApiKey', 'userResume'], function (items) {
        if (items.geminiApiKey) {
            apiKeyInput.value = items.geminiApiKey;
        }
        if (items.userResume) {
            userResumeInput.value = items.userResume;
        }
    });

    // Save options
    saveButton.addEventListener('click', function () {
        const apiKey = apiKeyInput.value.trim();
        const userResume = userResumeInput.value.trim();

        if (!apiKey || !userResume) {
            statusDiv.textContent = 'Error: Both API Key and Resume are required.';
            statusDiv.style.color = 'red';
            return;
        }

        chrome.storage.local.set({
            geminiApiKey: apiKey,
            userResume: userResume
        }, function () {
            statusDiv.textContent = 'Options saved successfully!';
            statusDiv.style.color = 'green';
            setTimeout(() => { statusDiv.textContent = ''; }, 3000);
        });
    });
});