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
    // Send selected text to content script
    chrome.tabs.sendMessage(tab.id, {
      action: 'simplifyText',
      text: info.selectionText,
      audience: 'general public'
    });
  }
});

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message.text && message.audience) {
//     fetch('http://localhost:7171/simplify', {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json'
//       },
//       body: JSON.stringify({ text: message.text, audience: message.audience })
//     })
//     .then(response => response.json())
//     .then(data => sendResponse(data))
//     .catch(error => {
//       console.error('Error:', error);
//       sendResponse({ error: 'Failed to simplify text' });
//     });

//     return true; // Indicates that the response will be sent asynchronously
//   }
// });

// chrome.action.onClicked.addListener((tab) => {
//   chrome.tabs.sendMessage(tab.id, { action: "toggleSidebar" });
// });

// Listen for API response from content script and send to content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'apiRequest') {
    // Make API request to simplification service
    fetch('http://localhost:7171/simplify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: message.text,
        audience: message.audience
      })
    })
    .then(response => response.json())
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
      chrome.tabs.sendMessage(sender.tab.id, {
        action: 'apiError',
        error: error.toString()
      });
    });
  }
});