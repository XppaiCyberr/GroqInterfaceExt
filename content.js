// Helper function to estimate token count (very rough approximation)
function estimateTokenCount(text) {
  // A very simple estimation - roughly 4 chars per token on average
  return Math.ceil(text.length / 4);
}document.addEventListener('DOMContentLoaded', function() {
initGroqExtension();
});

// Initialize immediately if document is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
initGroqExtension();
}

function initGroqExtension() {
// Create toggle button
const toggleButton = document.createElement('div');
toggleButton.className = 'groq-toggle-button';
toggleButton.innerHTML = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="16"></line>
    <line x1="8" y1="12" x2="16" y2="12"></line>
  </svg>
`;
document.body.appendChild(toggleButton);

// Create panel container
const panelContainer = document.createElement('div');
panelContainer.className = 'groq-panel-container hidden';

// Set default size
panelContainer.style.width = '450px';
panelContainer.style.height = '650px';

// Add resize handle elements
const resizeHandles = `
  <div class="groq-resize-handle groq-resize-e" title="Drag to resize width"></div>
  <div class="groq-resize-handle groq-resize-se" title="Drag to resize"></div>
  <div class="groq-resize-handle groq-resize-s" title="Drag to resize height"></div>
  <div class="groq-resize-handle groq-resize-w" title="Drag to resize width"></div>
  <div class="groq-resize-handle groq-resize-sw" title="Drag to resize"></div>
  <div class="groq-resize-handle groq-resize-n" title="Drag to resize height"></div>
  <div class="groq-resize-handle groq-resize-ne" title="Drag to resize"></div>
  <div class="groq-resize-handle groq-resize-nw" title="Drag to resize"></div>
`;

// Create panel content
panelContainer.innerHTML = `
  <div class="groq-panel">
    <div class="groq-header">
      <div class="groq-title">GROQ API INTERFACE</div>
      <div class="groq-window-controls">
        <button class="groq-btn groq-minimize-btn" title="Minimize">_</button>
        <button class="groq-btn groq-maximize-btn" title="Maximize">□</button>
        <button class="groq-btn groq-close-btn" title="Close">×</button>
      </div>
    </div>
    <div class="groq-tabs">
      <div class="groq-tab active" data-tab="chat">Chat</div>
      <div class="groq-tab" data-tab="settings">Settings</div>
    </div>
    <div class="groq-content">
      <div class="groq-tab-content active" id="chat-content">
        <div class="groq-chat-container">
          <div class="groq-chat-messages" id="groq-messages"></div>
          <div class="groq-model-info"></div>
          <div class="groq-input-container">
            <select class="groq-model-select">
              <option value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile</option>
              <option value="llama-3.3-70b-specdec">Llama 3.3 70B SpecDec</option>
              <option value="deepseek-r1-distill-llama-70b">DeepSeek R1 Distill Llama 70B</option>
              <option value="llama3-70b-8192">Llama 3 70B (8K)</option>
              <option value="mixtral-8x7b-32768">Mixtral 8x7B (32K)</option>
              <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant</option>
              <option value="llama3-8b-8192">Llama 3 8B (8K)</option>
              <option value="llama-3.2-1b-preview">Llama 3.2 1B Preview</option>
              <option value="llama-3.2-3b-preview">Llama 3.2 3B Preview</option>
              <option value="llama-guard-3-8b">Llama Guard 3 8B</option>
              <option value="gemma2-9b-it">Gemma 2 9B IT</option>
            </select>
            <textarea class="groq-chat-input" placeholder="Enter your message..."></textarea>
            <button class="groq-send-btn">Send</button>
          </div>
          <div class="groq-status-bar">Ready to chat</div>
        </div>
      </div>
      <div class="groq-tab-content" id="settings-content">
        <div class="groq-settings-container">
          <div class="groq-setting">
            <label for="groq-api-key">API Key</label>
            <div class="groq-input-wrapper">
              <input type="password" id="groq-api-key" placeholder="Enter your Groq API key">
              <button class="groq-toggle-visibility" id="toggle-api-visibility">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="eye-icon">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </button>
            </div>
          </div>
          <div class="groq-setting">
            <label for="groq-system-message">System Message</label>
            <textarea id="groq-system-message" placeholder="Set custom instructions for the AI..." rows="4"></textarea>
            <div class="groq-system-templates">
              <p class="groq-template-label">Quick templates:</p>
              <div class="groq-template-chips">
                <button class="groq-template-chip" data-template="You are an advanced AI assistant, highly knowledgeable in a wide range of topics, including programming, databases, APIs, web development, blockchain, AI/ML, automation, gaming, and general problem-solving. Your goal is to provide clear, concise, and accurate responses tailored to the user's needs.

General Guidelines:
Be Accurate & Up-to-Date: Always provide the most relevant and correct information. Use external sources if necessary.
Be Adaptive & Context-Aware: Maintain conversation history to provide continuity and understand the user ongoing projects.
Be Concise Yet Informative: Provide detailed explanations without unnecessary fluff.
Be Actionable & Practical: Offer working code examples, clear explanations, and direct solutions whenever possible.

Technical Abilities:
Coding & Debugging: Support multiple programming languages (e.g., JavaScript, Python, PHP, Solidity, SQL). Write efficient and optimized code.
Web Development: Assist with front-end (HTML, CSS, Tailwind, React) and back-end (Node.js, PHP, databases).
Blockchain & Smart Contracts: Handle Solidity, Ethereum, Base Sepolia, OnchainKit, and contract deployment/debugging.
API Integration: Work with RESTful APIs, cURL requests, WebSockets, and third-party integrations.
Automation & Scripting: Write shell scripts, bots, and automation scripts for various tasks.
Data Management: Design and optimize databases for scalability and efficiency.
Response Formatting:

For Code: Always format code snippets properly and explain them when necessary.
For Explanations: Use bullet points, examples, and clear steps to improve readability.
For Troubleshooting: Identify the issue, suggest fixes, and provide debugging steps.
For Design & UI/UX: Offer modern, clean, and user-friendly suggestions with a focus on accessibility.

User Preferences & Projects:
Keep track of ongoing projects to provide relevant suggestions.
Assist with sorting and manipulating HTML elements, wallet connections, smart contract deployments, database designs, game mechanics, real-time updates, weather data integration, and more.
Stay efficient, insightful, and always ready to assist!">All In One</button>
                <button class="groq-template-chip" data-template="You are a helpful AI assistant specialized in programming.">Programmer</button>
                <button class="groq-template-chip" data-template="You are a concise assistant. Provide short, direct answers.">Concise</button>
                <button class="groq-template-chip" data-template="You are a creative writer who responds with vivid descriptions and storytelling.">Creative</button>
              </div>
            </div>
          </div>
          <div class="groq-setting">
            <label for="groq-temperature">Temperature <span class="groq-setting-info">Controls randomness</span></label>
            <div class="groq-slider-container">
              <input type="range" id="groq-temperature" min="0" max="1" step="0.05" value="0.7">
              <span class="groq-temp-value">0.7</span>
            </div>
            <div class="groq-slider-labels">
              <span>Precise</span>
              <span>Creative</span>
            </div>
          </div>
          <div class="groq-setting">
            <label for="groq-max-tokens">Max Tokens <span class="groq-setting-info">Response length limit</span></label>
            <input type="number" id="groq-max-tokens" min="1" max="8192" value="8192">
          </div>
          <div class="groq-setting">
            <label>Default Model</label>
            <select id="groq-default-model" class="groq-settings-select">
              <option value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile</option>
              <option value="llama-3.3-70b-specdec">Llama 3.3 70B SpecDec</option>
              <option value="deepseek-r1-distill-llama-70b">DeepSeek R1 Distill Llama 70B</option>
              <option value="llama3-70b-8192">Llama 3 70B (8K)</option>
              <option value="mixtral-8x7b-32768">Mixtral 8x7B (32K)</option>
              <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant</option>
              <option value="llama3-8b-8192">Llama 3 8B (8K)</option>
              <option value="llama-3.2-1b-preview">Llama 3.2 1B Preview</option>
              <option value="llama-3.2-3b-preview">Llama 3.2 3B Preview</option>
              <option value="llama-guard-3-8b">Llama Guard 3 8B</option>
              <option value="gemma2-9b-it">Gemma 2 9B IT</option>
            </select>
          </div>

          
          <div class="groq-settings-actions">
            <button class="groq-save-settings-btn">💾 Save All Settings</button>
          </div>
        </div>
      </div>
    </div>
  </div>
`;

document.body.appendChild(panelContainer);

// Add resize handles after panel is created
panelContainer.insertAdjacentHTML('beforeend', resizeHandles);

// Make panel resizable
initResizable(panelContainer);

// Toggle panel visibility when button is clicked
toggleButton.addEventListener('click', function() {
  panelContainer.classList.toggle('hidden');
  toggleButton.classList.toggle('active');
});

// Close panel when close button is clicked
const closeBtn = document.querySelector('.groq-close-btn');
closeBtn.addEventListener('click', function() {
  panelContainer.classList.add('hidden');
  toggleButton.classList.remove('active');
});

// Maximize/restore panel
const maximizeBtn = document.querySelector('.groq-maximize-btn');
maximizeBtn.addEventListener('click', function() {
  if (panelContainer.classList.contains('groq-maximized')) {
    // Restore to previous size
    chrome.storage.local.get(['groqPanelWidth', 'groqPanelHeight', 'groqPanelLeft', 'groqPanelTop'], function(result) {
      if (result.groqPanelWidth) {
        panelContainer.style.width = result.groqPanelWidth + 'px';
        panelContainer.style.height = result.groqPanelHeight + 'px';
        panelContainer.style.left = result.groqPanelLeft + 'px';
        panelContainer.style.top = result.groqPanelTop + 'px';
      }
    });
    panelContainer.classList.remove('groq-maximized');
    this.textContent = '□';
    this.title = 'Maximize';
  } else {
    // Save current dimensions before maximizing
    const width = panelContainer.style.width;
    const height = panelContainer.style.height;
    const left = panelContainer.style.left;
    const top = panelContainer.style.top;
    
    // Maximize
    panelContainer.classList.add('groq-maximized');
    this.textContent = '❐';
    this.title = 'Restore';
  }
});

// Minimize panel
const minimizeBtn = document.querySelector('.groq-minimize-btn');
minimizeBtn.addEventListener('click', function() {
  panelContainer.classList.add('hidden');
  toggleButton.classList.remove('active');
});

// Tab switching
const tabs = document.querySelectorAll('.groq-tab');
tabs.forEach(tab => {
  tab.addEventListener('click', function() {
    const tabName = this.getAttribute('data-tab');
    
    // Remove active class from all tabs and content
    document.querySelectorAll('.groq-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.groq-tab-content').forEach(c => c.classList.remove('active'));
    
    // Add active class to current tab and content
    this.classList.add('active');
    document.getElementById(tabName + '-content').classList.add('active');
  });
});

// Load settings from storage
chrome.storage.sync.get([
  'groqApiKey', 
  'groqSystemMessage', 
  'groqTemperature', 
  'groqMaxTokens',
  'groqDefaultModel'
], function(result) {
  if (result.groqApiKey) {
    document.getElementById('groq-api-key').value = result.groqApiKey;
  }
  if (result.groqSystemMessage) {
    document.getElementById('groq-system-message').value = result.groqSystemMessage;
  }
  if (result.groqTemperature) {
    const tempSlider = document.getElementById('groq-temperature');
    tempSlider.value = result.groqTemperature;
    document.querySelector('.groq-temp-value').textContent = result.groqTemperature;
  }
  if (result.groqMaxTokens) {
    document.getElementById('groq-max-tokens').value = result.groqMaxTokens;
  }
  if (result.groqDefaultModel) {
    document.getElementById('groq-default-model').value = result.groqDefaultModel;
    document.querySelector('.groq-model-select').value = result.groqDefaultModel;
  }
  
  // Always set theme to dark
  setTheme('dark');
});

// Toggle API key visibility
const toggleApiVisibility = document.getElementById('toggle-api-visibility');
toggleApiVisibility.addEventListener('click', function() {
  const apiKeyInput = document.getElementById('groq-api-key');
  if (apiKeyInput.type === 'password') {
    apiKeyInput.type = 'text';
    this.querySelector('.eye-icon').classList.add('visible');
  } else {
    apiKeyInput.type = 'password';
    this.querySelector('.eye-icon').classList.remove('visible');
  }
});

// System message template chips
const templateChips = document.querySelectorAll('.groq-template-chip');
templateChips.forEach(chip => {
  chip.addEventListener('click', function() {
    const template = this.getAttribute('data-template');
    document.getElementById('groq-system-message').value = template;
    
    // Visual feedback
    templateChips.forEach(c => c.classList.remove('active'));
    this.classList.add('active');
    setTimeout(() => {
      this.classList.remove('active');
    }, 500);
  });
});

// Set default dark theme
function setTheme(theme) {
  const panelContainer = document.querySelector('.groq-panel-container');
  panelContainer.className = panelContainer.className.replace(/theme-\w+/g, '');
  panelContainer.classList.add(`theme-dark`);
}

// Save all settings
const saveSettingsBtn = document.querySelector('.groq-save-settings-btn');
saveSettingsBtn.addEventListener('click', function() {
  // Get all settings values
  const apiKey = document.getElementById('groq-api-key').value;
  const systemMessage = document.getElementById('groq-system-message').value;
  const temperature = document.getElementById('groq-temperature').value;
  const maxTokens = document.getElementById('groq-max-tokens').value;
  const defaultModel = document.getElementById('groq-default-model').value;
  
  // Show loading state
  this.classList.add('loading');
  this.textContent = 'Saving...';
  
  // Save to storage
  chrome.storage.sync.set({
    groqApiKey: apiKey,
    groqSystemMessage: systemMessage,
    groqTemperature: temperature,
    groqMaxTokens: maxTokens,
    groqDefaultModel: defaultModel
  }, function() {
    // Reset button state
    saveSettingsBtn.classList.remove('loading');
    saveSettingsBtn.innerHTML = '💾 Save All Settings';
    
    // Show success notification
    showNotification('All settings saved successfully!', 'success');
    
    // Update the chat model dropdown to match default
    document.querySelector('.groq-model-select').value = defaultModel;
  });
});

// Update temperature value display
const tempSlider = document.getElementById('groq-temperature');
const tempValue = document.querySelector('.groq-temp-value');
tempSlider.addEventListener('input', function() {
  tempValue.textContent = this.value;
});

// Handle sending messages
const sendBtn = document.querySelector('.groq-send-btn');
const chatInput = document.querySelector('.groq-chat-input');
const messagesContainer = document.getElementById('groq-messages');
const modelSelect = document.querySelector('.groq-model-select');
const modelInfo = document.querySelector('.groq-model-info');
const statusBar = document.querySelector('.groq-status-bar');

sendBtn.addEventListener('click', sendMessage);
chatInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

function sendMessage() {
  const userMessage = chatInput.value.trim();
  if (!userMessage) return;

  const apiKey = document.getElementById('groq-api-key').value;
  if (!apiKey) {
    addMessage('system', 'Please add your API key in the Settings tab.');
    return;
  }

  // Start sending animation
  sendBtn.classList.add('sending');
  sendBtn.innerHTML = '<span class="sending-spinner"></span>';

  // Add user message to chat
  addMessage('user', userMessage);
  chatInput.value = '';

  // Get system message from settings
  let systemMessage = document.getElementById('groq-system-message').value.trim();
  
  // Prepare the messages array with system message (if available)
  const messages = [];
  
  // Add system message first if exists
  if (systemMessage) {
    messages.push({
      role: 'system',
      content: systemMessage
    });
  }
  
  // Add conversation history
  Array.from(document.querySelectorAll('.groq-message')).forEach(msg => {
    if (msg.classList.contains('system-message')) return; // Skip system messages
    
    const role = msg.classList.contains('user-message') ? 'user' : 'assistant';
    messages.push({
      role: role,
      content: msg.querySelector('.groq-message-text').textContent
    });
  });

  // Add thinking message
  const thinkingId = Date.now();
  addMessage('assistant', '<div class="groq-thinking">Thinking<span class="dot-1">.</span><span class="dot-2">.</span><span class="dot-3">.</span></div>', thinkingId);

  // Call the Groq API
  const model = modelSelect.value;
  
  // Get values from settings if available, or use defaults
  chrome.storage.sync.get(['groqTemperature', 'groqMaxTokens'], function(result) {
    const temperature = result.groqTemperature ? parseFloat(result.groqTemperature) : parseFloat(document.getElementById('groq-temperature').value);
    const maxTokens = result.groqMaxTokens ? parseInt(result.groqMaxTokens) : parseInt(document.getElementById('groq-max-tokens').value);
    
    callGroqAPI(apiKey, messages, model, temperature, maxTokens, thinkingId);
  });
}

function addMessage(role, content, id = null) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `groq-message ${role}-message`;
  if (id) messageDiv.id = `msg-${id}`;
  
  const avatar = role === 'user' ? '👤' : (role === 'system' ? '⚠️' : '🤖');
  
  messageDiv.innerHTML = `
    <div class="groq-message-avatar">${avatar}</div>
    <div class="groq-message-content">
      <div class="groq-message-text">${content}</div>
    </div>
  `;
  
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  return messageDiv;
}

async function callGroqAPI(apiKey, messages, model, temperature, maxTokens, thinkingId) {
  const url = "https://api.groq.com/openai/v1/chat/completions";
  
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      messages: messages,
      model: model,
      temperature: temperature,
      max_tokens: maxTokens,
      stream: true
    })
  };

  try {
    // Update model info display
    updateModelInfo(model);
    
    // Show model & parameters in bottom status
    const statusText = `${getModelDisplayName(model)} · Temp: ${temperature} · Max: ${maxTokens}`;
    updateStatusBar(statusText);
    
    const startTime = Date.now();
    const response = await fetch(url, requestOptions);
    
    // Reset send button
    sendBtn.classList.remove('sending');
    sendBtn.innerHTML = 'Send';
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API request failed: ${errorData.error?.message || response.statusText}`);
    }
    
    if (!response.body) {
      throw new Error("ReadableStream not supported in this browser");
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    
    // Remove thinking message
    const thinkingMsg = document.getElementById(`msg-${thinkingId}`);
    if (thinkingMsg) {
      messagesContainer.removeChild(thinkingMsg);
    }
    
    let responseContent = '';
    let totalTokens = 0;
    let isFirstChunk = true;
    const responseMsg = addMessage('assistant', '');
    const responseMsgText = responseMsg.querySelector('.groq-message-text');
    
    // Add metadata container to the message
    const metadataContainer = document.createElement('div');
    metadataContainer.className = 'groq-message-metadata';
    responseMsg.querySelector('.groq-message-content').appendChild(metadataContainer);
    
    // Function to process stream
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) {
        // Calculate response time
        const responseTime = ((Date.now() - startTime) / 1000).toFixed(2);
        
        // Update metadata
        metadataContainer.innerHTML = `
          <div class="groq-message-info">
            <span class="groq-model-badge">${getModelDisplayName(model)}</span>
            <span class="groq-time-badge" title="Response time">${responseTime}s</span>
            <span class="groq-token-badge" title="Approximate token count">${estimateTokenCount(responseContent)} tokens</span>
          </div>
        `;
        
        // Show copy button on hover
        const copyBtn = document.createElement('button');
        copyBtn.className = 'groq-copy-btn';
        copyBtn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
        `;
        responseMsg.appendChild(copyBtn);
        
        copyBtn.addEventListener('click', function() {
          navigator.clipboard.writeText(responseContent).then(() => {
            this.classList.add('copied');
            this.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 6L9 17l-5-5"></path>
              </svg>
            `;
            setTimeout(() => {
              this.classList.remove('copied');
              this.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              `;
            }, 2000);
          });
        });
        
        // Update status bar with completion info
        updateStatusBar(`Complete · ${responseTime}s · ~${estimateTokenCount(responseContent)} tokens`);
        
        break;
      }
      
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n').filter(line => line.trim() !== '');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.substring(6);
          
          if (data === '[DONE]') {
            continue;
          }
          
          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content || '';
            
            // First chunk received indicator
            if (isFirstChunk && content) {
              isFirstChunk = false;
              // Update status to show first token time
              const firstTokenTime = ((Date.now() - startTime) / 1000).toFixed(2);
              updateStatusBar(`First token: ${firstTokenTime}s · ${getModelDisplayName(model)}`);
            }
            
            if (content) {
              totalTokens++;
              responseContent += content;
              responseMsgText.innerHTML = formatMessage(responseContent);
              messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
          } catch (error) {
            console.error("Error parsing JSON:", error);
          }
        }
      }
    }
  } catch (error) {
    console.error("Error:", error);
    
    // Reset send button
    sendBtn.classList.remove('sending');
    sendBtn.innerHTML = 'Send';
    
    // Remove thinking message
    const thinkingMsg = document.getElementById(`msg-${thinkingId}`);
    if (thinkingMsg) {
      messagesContainer.removeChild(thinkingMsg);
    }
    
    addMessage('system', `Error: ${error.message}`);
    updateStatusBar(`Error: API request failed`);
    showNotification(`API Error: ${error.message}`, 'error');
  }
}

// Helper function to get friendly model display name
function getModelDisplayName(model) {
  const modelMap = {
    'llama-3.3-70b-versatile': 'Llama 3.3 70B',
    'llama-3.3-70b-specdec': 'Llama 3.3 70B SpecDec',
    'deepseek-r1-distill-llama-70b': 'DeepSeek R1 70B',
    'llama3-70b-8192': 'Llama 3 70B',
    'mixtral-8x7b-32768': 'Mixtral 8x7B',
    'llama-3.1-8b-instant': 'Llama 3.1 8B',
    'llama3-8b-8192': 'Llama 3 8B',
    'llama-3.2-1b-preview': 'Llama 3.2 1B',
    'llama-3.2-3b-preview': 'Llama 3.2 3B',
    'llama-guard-3-8b': 'Llama Guard 3',
    'gemma2-9b-it': 'Gemma 2 9B'
  };
  
  return modelMap[model] || model;
}

// Update model info in the panel
function updateModelInfo(model) {
  modelInfo.innerHTML = `
    <div class="groq-model-badge">
      <span class="groq-model-name">${getModelDisplayName(model)}</span>
    </div>
  `;
}

// Update status bar with text
function updateStatusBar(text) {
  statusBar.textContent = text;
}

// Format message with better code highlighting
function formatMessage(text) {
  // Convert markdown-style code blocks to HTML with better styling
  let formatted = text
    // Format code blocks with language
    .replace(/```([a-z]*)\n([\s\S]*?)```/g, '<div class="groq-code-block"><div class="groq-code-header">$1</div><pre><code>$2</code></pre></div>')
    // Format code blocks without language specification
    .replace(/```\n([\s\S]*?)```/g, '<div class="groq-code-block"><pre><code>$1</code></pre></div>')
    // Format inline code
    .replace(/`([^`]+)`/g, '<code class="groq-inline-code">$1</code>')
    // Convert line breaks to <br>
    .replace(/\n/g, '<br>');
  
  return formatted;
}

// Show notification
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `groq-notification groq-notification-${type}`;
  
  // Add icon based on notification type
  let icon = '';
  if (type === 'success') {
    icon = '<span class="groq-notification-icon">✓</span>';
  } else if (type === 'error') {
    icon = '<span class="groq-notification-icon">❌</span>';
  } else if (type === 'info') {
    icon = '<span class="groq-notification-icon">ℹ️</span>';
  }
  
  notification.innerHTML = `${icon} ${message}`;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// Initialize resizable functionality
function initResizable(element) {
  const minWidth = 300;
  const minHeight = 400;
  let isResizing = false;
  let currentHandle = null;
  let startX, startY, startWidth, startHeight, startLeft, startTop;
  
  // Get all resize handles
  const handles = element.querySelectorAll('.groq-resize-handle');
  
  // Add event listeners to each handle
  handles.forEach(handle => {
    handle.addEventListener('mousedown', startResize);
  });
  
  // Start resize
  function startResize(e) {
    e.preventDefault();
    isResizing = true;
    currentHandle = e.target;
    
    // Store initial dimensions and position
    startX = e.clientX;
    startY = e.clientY;
    startWidth = parseInt(document.defaultView.getComputedStyle(element).width, 10);
    startHeight = parseInt(document.defaultView.getComputedStyle(element).height, 10);
    startLeft = parseInt(document.defaultView.getComputedStyle(element).left, 10);
    startTop = parseInt(document.defaultView.getComputedStyle(element).top, 10);
    
    // Add event listeners for resize
    document.addEventListener('mousemove', resize);
    document.addEventListener('mouseup', stopResize);
    
    // Add resizing class to panel
    element.classList.add('groq-resizing');
  }
  
  // Resize
  function resize(e) {
    if (!isResizing) return;
    
    let newWidth = startWidth;
    let newHeight = startHeight;
    let newLeft = startLeft;
    let newTop = startTop;
    
    // Determine which handle is being used and resize accordingly
    const handleClasses = currentHandle.className;
    
    // East/West resize (right/left edge)
    if (handleClasses.includes('groq-resize-e')) {
      newWidth = startWidth + e.clientX - startX;
    } else if (handleClasses.includes('groq-resize-w')) {
      newWidth = startWidth - (e.clientX - startX);
      if (newWidth >= minWidth) {
        newLeft = startLeft + (e.clientX - startX);
      }
    }
    
    // North/South resize (top/bottom edge)
    if (handleClasses.includes('groq-resize-s')) {
      newHeight = startHeight + e.clientY - startY;
    } else if (handleClasses.includes('groq-resize-n')) {
      newHeight = startHeight - (e.clientY - startY);
      if (newHeight >= minHeight) {
        newTop = startTop + (e.clientY - startY);
      }
    }
    
    // Apply constraints
    newWidth = Math.max(minWidth, newWidth);
    newHeight = Math.max(minHeight, newHeight);
    
    // Apply new dimensions and position
    element.style.width = newWidth + 'px';
    element.style.height = newHeight + 'px';
    element.style.left = newLeft + 'px';
    element.style.top = newTop + 'px';
    
    // Store dimensions in local storage for persistence
    chrome.storage.local.set({
      groqPanelWidth: newWidth,
      groqPanelHeight: newHeight,
      groqPanelLeft: newLeft,
      groqPanelTop: newTop
    });
  }
  
  // Stop resize
  function stopResize() {
    isResizing = false;
    document.removeEventListener('mousemove', resize);
    document.removeEventListener('mouseup', stopResize);
    
    // Remove resizing class
    element.classList.remove('groq-resizing');
  }
  
  // Load saved dimensions if they exist
  chrome.storage.local.get(['groqPanelWidth', 'groqPanelHeight', 'groqPanelLeft', 'groqPanelTop'], function(result) {
    if (result.groqPanelWidth) {
      element.style.width = result.groqPanelWidth + 'px';
    }
    if (result.groqPanelHeight) {
      element.style.height = result.groqPanelHeight + 'px';
    }
    if (result.groqPanelLeft) {
      element.style.left = result.groqPanelLeft + 'px';
    }
    if (result.groqPanelTop) {
      element.style.top = result.groqPanelTop + 'px';
    }
  });
  
  // Make panel draggable by header
  const header = element.querySelector('.groq-header');
  header.addEventListener('mousedown', startDrag);
  
  function startDrag(e) {
    if (e.target.classList.contains('groq-close-btn')) return;
    
    e.preventDefault();
    
    startX = e.clientX;
    startY = e.clientY;
    startLeft = parseInt(document.defaultView.getComputedStyle(element).left, 10);
    startTop = parseInt(document.defaultView.getComputedStyle(element).top, 10);
    
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', stopDrag);
    
    element.classList.add('groq-dragging');
    header.style.cursor = 'grabbing';
  }
  
  function drag(e) {
    const newLeft = startLeft + (e.clientX - startX);
    const newTop = startTop + (e.clientY - startY);
    
    element.style.left = newLeft + 'px';
    element.style.top = newTop + 'px';
    
    chrome.storage.local.set({
      groqPanelLeft: newLeft,
      groqPanelTop: newTop
    });
  }
  
  function stopDrag() {
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', stopDrag);
    
    element.classList.remove('groq-dragging');
    header.style.cursor = 'grab';
  }
  
  // Make header look draggable
  header.style.cursor = 'grab';
}
}
