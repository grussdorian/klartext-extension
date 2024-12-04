class SimplificationSidebar {
  constructor() {
    this.sidebarElement = null;
    this.simplifications = [];
    this.initializeSidebar();
    this.loadSimplifications();
    this.setupMessageListener();
  }

  initializeSidebar() {
    this.sidebarElement = document.createElement('div');
    this.sidebarElement.id = 'text-simplifier-sidebar';
    this.sidebarElement.classList.add('hidden');
    document.body.appendChild(this.sidebarElement);
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'apiResponse') {
        this.addSimplification(message);
      } else if (message.action === 'toggleSidebar') {
        this.toggleSidebar();
      }
    });
  }

  addSimplification(data) {
    const simplification = {
      originalText: data.originalText,
      simplifiedText: data.simplifiedText,
      url: data.url,
      timestamp: data.timestamp
    };

    this.simplifications.push(simplification);
    this.saveSimplifications();
    this.renderSidebar();

    // Show sidebar automatically
    this.showSidebar();
  }

  renderSidebar() {
    if (!this.sidebarElement) return;

    this.sidebarElement.innerHTML = this.simplifications.length 
      ? this.simplifications.map((item, index) => `
          <div class="simplification-card">
            <button class="delete-button" data-index="${index}">&times;</button>
            <div class="original-text">${item.originalText}</div>
            <div class="simplified-text">${item.simplifiedText}</div>
            <div class="metadata">
              <span>${new URL(item.url).hostname}</span>
              <span>${new Date(item.timestamp).toLocaleString()}</span>
            </div>
          </div>
        `).join('')
      : '<div class="placeholder">No simplifications yet</div>';

    this.attachDeleteHandlers();
  }

  attachDeleteHandlers() {
    const deleteButtons = this.sidebarElement.querySelectorAll('.delete-button');
    deleteButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const index = e.target.dataset.index;
        this.simplifications.splice(index, 1);
        this.saveSimplifications();
        this.renderSidebar();
      });
    });
  }

  loadSimplifications() {
    const saved = localStorage.getItem('textSimplifications');
    this.simplifications = saved ? JSON.parse(saved) : [];
    this.renderSidebar();
  }

  saveSimplifications() {
    localStorage.setItem('textSimplifications', JSON.stringify(this.simplifications));
  }

  toggleSidebar() {
    this.sidebarElement.classList.toggle('hidden');
  }

  showSidebar() {
    this.sidebarElement.classList.remove('hidden');
  }
}

// Initialize sidebar on page load
const sidebar = new SimplificationSidebar();

// Listen for text simplification request
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'simplifyText') {
    // Forward request to background script
    chrome.runtime.sendMessage({
      action: 'apiRequest',
      text: message.text,
      audience: message.audience
    });
  }
});