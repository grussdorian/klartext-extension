document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('toggleSidebarBtn');
  const simplifyTextBtn = document.getElementById('simplifyTextBtn'); // New button
  const audienceSelect = document.getElementById('audienceSelect');

  // Load saved audience selection globally
  chrome.storage.local.get('globalAudience', (result) => {
    const savedAudience = result.globalAudience;
    if (savedAudience) {
      audienceSelect.value = savedAudience;
    }
  });

  // Save the selected audience when the dropdown value changes
  audienceSelect.addEventListener('change', () => {
    chrome.storage.local.set({ 'globalAudience': audienceSelect.value });
  });

  toggleBtn.addEventListener('click', () => {
    const selectedAudience = audienceSelect.value;
    // Save the selected audience globally
    chrome.storage.local.set({ 'globalAudience': selectedAudience });
    // Send message to current active tab to toggle sidebar with selected audience
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleSidebar', audience: selectedAudience });
    });
  });

  simplifyTextBtn.addEventListener('click', () => {
    const selectedAudience = audienceSelect.value;
    // Save the selected audience globally
    chrome.storage.local.set({ 'globalAudience': selectedAudience });
    // Send message to current active tab to simplify selected text with selected audience
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        func: () => window.getSelection().toString()
      }, (selection) => {
        if (selection[0].result) {
          // Show sidebar and loading indicator
          chrome.tabs.sendMessage(tabs[0].id, { action: 'showSidebarAndLoading' });
          // Send selected text to content script
          chrome.tabs.sendMessage(tabs[0].id, { action: 'simplifyText', text: selection[0].result, audience: selectedAudience });
        } else {
          alert('Please select some text to simplify.');
        }
      });
    });
  });
});