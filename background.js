chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "myExtensionMenu",
    title: "Simplify with Klartext",
    contexts: ["selection"]  // Can specify specific contexts like "image", "link", etc.
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.selectionText) {
    // Show sidebar and loading indicator
    chrome.tabs.sendMessage(tab.id, {
      action: 'showSidebarAndLoading'
    });
    // Send selected text to content script
    chrome.tabs.sendMessage(tab.id, {
      action: 'simplifyText',
      text: info.selectionText,
      audience: 'general public' // Default audience
    });
  }
});

// Listen for API response from content script and send to content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'apiRequest') {
    // Retrieve the saved global audience
    chrome.storage.local.get('globalAudience', (result) => {
      const savedAudience = result.globalAudience || 'general public';
      
      // Make API request to simplification service
      // fetch('http://localhost:7171/simplify', {
      fetch('https://simplifymytext.org:7171/simplify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'token': 'e7980e01a70dbe30f19d98d17595d3ff71bb9b88b3afd2c4ba3948bf61d5a295'
        },
        body: JSON.stringify({
          text: message.text,
          audience: savedAudience // Use the saved audience
        })
      })
      .then(response => {
        if (!response.ok) {
          // Handle non-200 responses
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        // Send simplified text back to content script
        chrome.tabs.sendMessage(sender.tab.id, {
          action: 'apiResponse',
          originalText: message.text,
          simplifiedText: data.simplifiedText,
          url: sender.tab.url,
          timestamp: new Date().toISOString(),
          audience: savedAudience // Include audience
        });
      })
      .catch(error => {
        console.error('Simplification API Error:', error);
        // Send detailed error message back to content script
        chrome.tabs.sendMessage(sender.tab.id, {
          action: 'apiError',
          error: error.toString()
        });
      });
    });
  }
});