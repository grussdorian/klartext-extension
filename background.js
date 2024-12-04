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
      fetch('http://localhost:7171/simplify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
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
          timestamp: new Date().toISOString()
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