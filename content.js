// Function to highlight the sentence
function highlightSentence(sentence, element) {
  const span = document.createElement('span');
  span.style.textDecoration = 'underline';
  span.style.textDecorationColor = '#d3bce3';
  span.style.textDecorationThickness = '3px'; // Thicker underline
  span.style.transition = 'text-decoration 0.3s ease-in-out, text-shadow 0.3s ease-in-out';
  span.style.textShadow = '0 0 5px #d3bce3'; // Glow effect
  span.textContent = sentence;

  element.innerHTML = element.innerHTML.replace(sentence, span.outerHTML);
}

// Function to remove the highlight
function removeHighlight() {
  document.querySelectorAll('span').forEach(span => {
    span.style.textDecoration = 'none';
    span.style.textShadow = 'none'; // Remove glow effect
  });
}

// Function to find the sentence where the cursor is located
function getSentence(element, x, y) {
  const range = document.caretRangeFromPoint(x, y);
  if (!range) return null;

  const textNode = range.startContainer;
  if (textNode.nodeType !== Node.TEXT_NODE) return null;

  const textContent = textNode.textContent;
  const offset = range.startOffset;

  const start = textContent.lastIndexOf('.', offset - 1) + 1;
  const end = textContent.indexOf('.', offset) + 1 || textContent.length;

  return textContent.slice(start, end).trim();
}

// Function to debounce the hover effect
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

// Event listener for mouse hover
document.addEventListener('mousemove', debounce((event) => {
  const target = event.target;
  if (target.isContentEditable || ['INPUT', 'TEXTAREA', 'IMG', 'VIDEO', 'AUDIO'].includes(target.tagName)) {
    return;
  }
  const sentence = getSentence(target, event.clientX, event.clientY);
  if (sentence) {
    removeHighlight();
    highlightSentence(sentence, target);
  }
}, 500));

// Event listener for mouse out
document.addEventListener('mouseout', (event) => {
  if (!event.relatedTarget || !event.relatedTarget.closest('span')) {
    removeHighlight();
  }
});

// Event listener for click
document.addEventListener('click', (event) => {
  const target = event.target;
  if (target.isContentEditable || ['INPUT', 'TEXTAREA', 'IMG', 'VIDEO', 'AUDIO'].includes(target.tagName)) {
    return;
  }
  const sentence = getSentence(target, event.clientX, event.clientY);
  if (sentence) {
    console.log(`sending sentence to service worker: ${sentence}`);
    const audience = 'General Public';
    chrome.runtime.sendMessage({ text: sentence, audience }, (response) => {
      console.log('Response from service worker:', response);
    });
  }
});