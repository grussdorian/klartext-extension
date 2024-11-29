document.getElementById('clickMe').addEventListener('click', () => {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.text) {
      document.getElementById('result').innerText = message.text;
    }
  });
});
