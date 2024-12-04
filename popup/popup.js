document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('toggleSidebarBtn');

  toggleBtn.addEventListener('click', () => {
    // Send message to current active tab to toggle sidebar
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleSidebar' });
    });
  });
});