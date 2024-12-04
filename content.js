class SimplificationSidebar {
  constructor() {
    this.sidebarElement = null;
    this.resizeHandle = null;
    this.simplifications = [];
    this.initializeSidebar();
    this.loadSimplifications();
    this.setupMessageListener();
  }

  initializeSidebar() {
    this.sidebarElement = document.createElement('div');
    this.sidebarElement.id = 'text-simplifier-sidebar';
    this.sidebarElement.classList.add('hidden');
    // Create sidebar header with close button
    const sidebarHeader = document.createElement('div');
    sidebarHeader.classList.add('sidebar-header');
    
    const closeButton = document.createElement('button');
    closeButton.classList.add('sidebar-close-button');
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => this.hideSidebar());
    
    sidebarHeader.appendChild(closeButton);

    // Create content container for simplifications
    this.contentContainer = document.createElement('div');
    this.contentContainer.classList.add('sidebar-content');

    // Create resize handle
    this.resizeHandle = document.createElement('div');
    this.resizeHandle.classList.add('resize-handle');

    // Append elements
    this.sidebarElement.appendChild(sidebarHeader);
    this.sidebarElement.appendChild(this.contentContainer);
    this.sidebarElement.appendChild(this.resizeHandle);

    // Add event listeners for resizing
    this.setupResizing();
    document.body.appendChild(this.sidebarElement);
  }

  setupResizing() {
    let isResizing = false;
    let startX;

    this.resizeHandle.addEventListener('mousedown', (e) => {
      isResizing = true;
      startX = e.clientX;
      this.sidebarElement.classList.add('resizing');
      document.addEventListener('mousemove', resize);
      document.addEventListener('mouseup', stopResize);
    });

    const resize = (e) => {
      if (!isResizing) return;
      const dx = startX - e.clientX;
      const newWidth = this.sidebarElement.offsetWidth + dx;
      this.sidebarElement.style.width = `${newWidth}px`;
      startX = e.clientX;
    };

    const stopResize = () => {
      isResizing = false;
      this.sidebarElement.classList.remove('resizing');
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResize);
    };
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
    if (!this.contentContainer) return;

    this.contentContainer.innerHTML = this.simplifications.length 
      ? this.simplifications.map((item, index) => `
          <div class="simplification-card">
            <button class="delete-button" data-index="${index}">&times;</button>
            <div class="original-text">${this.escapeHTML(item.originalText)}</div>
            <div class="simplified-text">${this.escapeHTML(item.simplifiedText)}</div>
            <div class="metadata">
              <span>${new URL(item.url).hostname}</span>
              <span>${new Date(item.timestamp).toLocaleString()}</span>
            </div>
          </div>
        `).join('')
      : '<div class="placeholder">No simplifications yet</div>';

    this.attachDeleteHandlers();
  }

  // HTML escape to prevent XSS
  escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag));
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

  hideSidebar() {
    this.sidebarElement.classList.add('hidden');
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