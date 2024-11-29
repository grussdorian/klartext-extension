document.getElementById('save').addEventListener('click', () => {
  const setting = document.getElementById('setting').value;
  chrome.storage.sync.set({ setting: setting }, () => {
    alert('Setting saved!');
  });
});
