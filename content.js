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
    
    // Restore saved width
    const savedWidth = localStorage.getItem('sidebarWidth');
    if (savedWidth) {
      this.sidebarElement.style.width = savedWidth;
    }

    // Create sidebar header with close button
    const sidebarHeader = document.createElement('div');
    sidebarHeader.classList.add('sidebar-header');
    
    const headerTitle = document.createElement('h2');
    headerTitle.classList.add('header-title');
    headerTitle.innerText = 'Klartext';

    const closeButton = document.createElement('button');
    closeButton.classList.add('sidebar-close-button');
    closeButton.innerHTML = '&times;';
    closeButton.addEventListener('click', () => this.hideSidebar());
    
    sidebarHeader.appendChild(headerTitle);
    sidebarHeader.appendChild(closeButton);

    // Create loading indicator
    this.loadingIndicator = document.createElement('div');
    this.loadingIndicator.classList.add('loading-indicator');
    this.loadingIndicator.innerHTML = `
      <div class="spinner">
        <div class="bounce1"></div>
        <div class="bounce2"></div>
        <div class="bounce3"></div>
      </div>
      <p>Simplifying text...</p>
    `;
    this.loadingIndicator.style.display = 'none';

    // Create content container for simplifications
    this.contentContainer = document.createElement('div');
    this.contentContainer.classList.add('sidebar-content');

    // Create resize handle
    this.resizeHandle = document.createElement('div');
    this.resizeHandle.classList.add('resize-handle');

    // Append elements
    this.sidebarElement.appendChild(sidebarHeader);
    this.sidebarElement.appendChild(this.loadingIndicator);
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
      // Save the new width
      localStorage.setItem('sidebarWidth', this.sidebarElement.style.width);
      document.removeEventListener('mousemove', resize);
      document.removeEventListener('mouseup', stopResize);
    };
  }

  showLoading() {
    if (this.sidebarElement.classList.contains('hidden')) {
      this.showSidebar();
    }
    const loadingCard = document.createElement('div');
    loadingCard.classList.add('simplification-card', 'loading-card');
    loadingCard.innerHTML = `
      <div class="spinner">
        <div class="bounce1"></div>
        <div class="bounce2"></div>
        <div class="bounce3"></div>
      </div>
      <p>Simplifying text...</p>
    `;
    this.contentContainer.insertBefore(loadingCard, this.contentContainer.firstChild);
  }

  hideLoading() {
    const loadingCard = this.contentContainer.querySelector('.loading-card');
    if (loadingCard) {
      loadingCard.remove();
    }
  }

  showError(errorMessage) {
    // Create error card
    const errorCard = document.createElement('div');
    errorCard.classList.add('simplification-card', 'error-card');
    
    // Create dismiss button
    const dismissButton = document.createElement('button');
    dismissButton.classList.add('delete-button');
    dismissButton.innerHTML = '&times;';
    dismissButton.addEventListener('click', () => {
      errorCard.remove();
    });

    // Set error content
    errorCard.innerHTML = `
      <div class="error-icon">⚠️</div>
      <div class="error-message">${this.escapeHTML(errorMessage)}</div>
    `;
    errorCard.insertBefore(dismissButton, errorCard.firstChild);

    // Append to content container
    this.contentContainer.insertBefore(errorCard, this.contentContainer.firstChild);
    
    // Ensure sidebar is visible
    this.showSidebar();
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'showSidebarAndLoading') {
        // Show sidebar and loading indicator
        this.showLoading();
      } else if (message.action === 'apiRequest') {
        // Show loading when request is sent
        this.showLoading();
      } else if (message.action === 'apiResponse') {
        // Hide loading and add simplification
        this.hideLoading();
        this.addSimplification(message);
      } else if (message.action === 'apiError') {
        // Show error message
        this.hideLoading();
        this.showError(message.error || 'Failed to simplify text');
      } else if (message.action === 'toggleSidebar') {
        this.toggleSidebar();
        // Save the selected audience
        this.selectedAudience = message.audience || 'general public';
      }
    });
  }

  addSimplification(data) {
    // Only save successful simplifications
    if (data.simplifiedText) {
      const simplification = {
        originalText: data.originalText,
        simplifiedText: data.simplifiedText,
        url: data.url,
        timestamp: data.timestamp
      };

      this.simplifications.push(simplification);
      this.saveSimplifications();
      this.renderSidebar();
    }
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
        `).reverse().join('') // Reverse the order to show new cards on top
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
    // Restore saved width
    const savedWidth = localStorage.getItem('sidebarWidth');
    if (savedWidth) {
      this.sidebarElement.style.width = savedWidth;
    }
  }
}

// Add CSS for centering and positioning
const style = document.createElement('style');
style.innerHTML = `
  .sidebar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .header-title {
    flex-grow: 1;
    text-align: center;
  }
  .sidebar-close-button {
    margin-left: auto;
  }
`;
document.head.appendChild(style);

// Initialize sidebar on page load
const sidebar = new SimplificationSidebar();

// Listen for text simplification request
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'simplifyText') {
    // Get the saved global audience
    const savedAudience = localStorage.getItem('globalAudience') || 'general public';
    // Forward request to background script
    chrome.runtime.sendMessage({
      action: 'apiRequest',
      text: message.text,
      audience: savedAudience
    });
  }
});