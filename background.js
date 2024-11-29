chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "myExtensionMenu",
    title: "Simplify with Klartext",
    contexts: ["all"]  // Can specify specific contexts like "image", "link", etc.
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "myExtensionMenu") {
    // Handle menu item click
    console.log("Context menu option clicked");
    // Add your custom logic here
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.text && message.audience) {
    fetch('http://localhost:7171/simplify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: message.text, audience: message.audience })
    })
    .then(response => response.json())
    .then(data => sendResponse(data))
    .catch(error => {
      console.error('Error:', error);
      sendResponse({ error: 'Failed to simplify text' });
    });

    return true; // Indicates that the response will be sent asynchronously
  }
});