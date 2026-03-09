document.addEventListener('DOMContentLoaded', () => {
  const providerSelect = document.getElementById('provider');
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const statusDiv = document.getElementById('status');

  // Load existing settings
  chrome.storage.sync.get(['aiProvider', 'apiKey'], (res) => {
    if (res.aiProvider) providerSelect.value = res.aiProvider;
    if (res.apiKey) apiKeyInput.value = res.apiKey;
  });

  saveBtn.addEventListener('click', () => {
    chrome.storage.sync.set({
      aiProvider: providerSelect.value,
      apiKey: apiKeyInput.value
    }, () => {
      statusDiv.style.display = 'block';
      setTimeout(() => statusDiv.style.display = 'none', 2000);
    });
  });
});
