// Helper function to estimate token count (very rough approximation)
function estimateTokenCount(text) {
  // A more accurate estimation - roughly 4 chars per token on average
  // This varies by model and content, but works as a general estimate
  return Math.ceil(text.length / 4);
}

// Global variables for conversation management
let currentConversationId = 'default-' + Date.now();
let conversations = {};
let isAutoSaveEnabled = true;
let currentTheme = 'dark';
let usageStats = {
  totalPromptTokens: 0,
  totalResponseTokens: 0,
  conversations: {}
};

// Load prism.js for syntax highlighting - dynamically imported
function loadPrismJs() {
  return new Promise((resolve, reject) => {
    // Only load if not already loaded
    if (window.Prism) {
      resolve(window.Prism);
      return;
    }

    const prismCss = document.createElement('link');
    prismCss.rel = 'stylesheet';
    prismCss.href = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css';
    document.head.appendChild(prismCss);

    const prismScript = document.createElement('script');
    prismScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js';
    prismScript.onload = () => {
      // Load additional languages
      const languageScript = document.createElement('script');
      languageScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-python.min.js';
      languageScript.onload = () => resolve(window.Prism);
      document.head.appendChild(languageScript);
    };
    prismScript.onerror = reject;
    document.head.appendChild(prismScript);
  });
}

document.addEventListener('DOMContentLoaded', function() {
  initGroqExtension();
});

// Initialize immediately if document is already loaded
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  initGroqExtension();
}

function initGroqExtension() {
  // Load saved usage stats
  chrome.storage.local.get(['groqUsageStats'], function(result) {
    if (result.groqUsageStats) {
      usageStats = result.groqUsageStats;
    }
  });

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

  // Create panel content with enhanced UI
  panelContainer.innerHTML = `
    <div class="groq-panel">
      <div class="groq-header">
        <div class="groq-title-area">
          <div class="groq-title">GROQ API INTERFACE</div>
          <div class="groq-conversation-controls">
            <button class="groq-btn groq-new-chat-btn" title="New Chat">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
            </button>
            <div class="groq-conversation-dropdown">
              <button class="groq-btn groq-conversation-menu-btn" title="Conversation Menu">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="1"></circle>
                  <circle cx="12" cy="5" r="1"></circle>
                  <circle cx="12" cy="19" r="1"></circle>
                </svg>
              </button>
              <div class="groq-dropdown-content">
                <button class="groq-dropdown-item groq-save-conversation-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                    <polyline points="17 21 17 13 7 13 7 21"></polyline>
                    <polyline points="7 3 7 8 15 8"></polyline>
                  </svg>
                  Save Conversation
                </button>
                <button class="groq-dropdown-item groq-load-conversation-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                  Load Conversation
                </button>
                <button class="groq-dropdown-item groq-export-conversation-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Export Conversation
                </button>
                <div class="groq-dropdown-submenu">
                  <button class="groq-dropdown-item">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Export Format
                  </button>
                  <div class="groq-dropdown-subcontent">
                    <button class="groq-dropdown-item groq-export-txt-btn">Text (.txt)</button>
                    <button class="groq-dropdown-item groq-export-md-btn">Markdown (.md)</button>
                    <button class="groq-dropdown-item groq-export-json-btn">JSON (.json)</button>
                    <button class="groq-dropdown-item groq-export-html-btn">HTML (.html)</button>
                  </div>
                </div>
                <button class="groq-dropdown-item groq-clear-conversation-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                  </svg>
                  Clear Conversation
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="groq-window-controls">
          <button class="groq-btn groq-minimize-btn" title="Minimize">_</button>
          <button class="groq-btn groq-maximize-btn" title="Maximize">□</button>
          <button class="groq-btn groq-close-btn" title="Close">×</button>
        </div>
      </div>
      <div class="groq-tabs">
        <div class="groq-tab active" data-tab="chat">Chat</div>
        <div class="groq-tab" data-tab="settings">Settings</div>
        <div class="groq-tab" data-tab="usage">Usage</div>
        <div class="groq-tab" data-tab="templates">Templates</div>
      </div>
      <div class="groq-content">
        <div class="groq-tab-content active" id="chat-content">
          <div class="groq-chat-container">
            <div class="groq-chat-messages" id="groq-messages"></div>
            <div class="groq-model-info"></div>
            <div class="groq-context-tools">
              <button class="groq-context-btn" title="Use page context">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                Use Page Context
              </button>
              <button class="groq-selected-text-btn" title="Use selected text">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                </svg>
                Use Selection
              </button>
              <div class="groq-template-dropdown">
                <button class="groq-template-btn" title="Insert template">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                    <line x1="8" y1="16" x2="16" y2="16"></line>
                    <line x1="8" y1="8" x2="10" y2="8"></line>
                  </svg>
                  Templates
                </button>
                <div class="groq-template-dropdown-content"></div>
              </div>
            </div>
            <div class="groq-input-container">
              <div class="groq-model-toolbar">
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
                <div class="groq-parameter-dropdown">
                  <button class="groq-parameter-btn" title="Adjust parameters">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                  </button>
                  <div class="groq-parameter-content">
                    <div class="groq-quick-parameter">
                      <label>Temperature: <span class="groq-temp-display">0.7</span></label>
                      <input type="range" class="groq-quick-temp" min="0" max="1" step="0.05" value="0.7">
                    </div>
                    <div class="groq-quick-parameter">
                      <label>Max Tokens: <span class="groq-tokens-display">8192</span></label>
                      <input type="range" class="groq-quick-tokens" min="100" max="32768" step="100" value="8192">
                    </div>
                    <div class="groq-advanced-params-toggle">
                      <button class="groq-toggle-advanced">Advanced Parameters</button>
                      <div class="groq-advanced-params">
                        <div class="groq-quick-parameter">
                          <label>Top P: <span class="groq-top-p-display">1.0</span></label>
                          <input type="range" class="groq-quick-top-p" min="0" max="1" step="0.05" value="1.0">
                        </div>
                        <div class="groq-quick-parameter">
                          <label>Frequency Penalty: <span class="groq-freq-display">0.0</span></label>
                          <input type="range" class="groq-quick-freq" min="0" max="2" step="0.1" value="0.0">
                        </div>
                        <div class="groq-quick-parameter">
                          <label>Presence Penalty: <span class="groq-pres-display">0.0</span></label>
                          <input type="range" class="groq-quick-pres" min="0" max="2" step="0.1" value="0.0">
                        </div>
                      </div>
                    </div>
                    <button class="groq-save-preset-btn">Save as Preset</button>
                    <div class="groq-parameter-presets">
                      <label>Presets:</label>
                      <select class="groq-preset-select">
                        <option value="default">Default</option>
                        <option value="creative">Creative</option>
                        <option value="precise">Precise</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <textarea class="groq-chat-input" placeholder="Enter your message... (Ctrl+Enter to send)"></textarea>
              <div class="groq-input-actions">
                <button class="groq-send-btn">Send</button>
                <div class="groq-keyboard-shortcut-hint">Ctrl+Enter</div>
              </div>
            </div>
            <div class="groq-status-bar">
              <span class="groq-status-text">Ready to chat</span>
              <span class="groq-session-usage">Session: 0 tokens</span>
            </div>
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
              <label for="groq-theme-select">Theme</label>
              <select id="groq-theme-select" class="groq-settings-select">
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="synthwave">Synthwave</option>
                <option value="midnight">Midnight</option>
                <option value="custom">Custom...</option>
              </select>
              <div class="groq-custom-theme" style="display: none;">
                <div class="groq-color-picker">
                  <label>Background Color</label>
                  <input type="color" id="groq-bg-color" value="#0f1419">
                </div>
                <div class="groq-color-picker">
                  <label>Text Color</label>
                  <input type="color" id="groq-text-color" value="#edf2f7">
                </div>
                <div class="groq-color-picker">
                  <label>Accent Color</label>
                  <input type="color" id="groq-accent-color" value="#5566ff">
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
              <input type="number" id="groq-max-tokens" min="1" max="32768" value="8192">
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
            <div class="groq-setting">
              <label>Advanced Parameters</label>
              <div class="groq-advanced-params-container">
                <div class="groq-advanced-param">
                  <label for="groq-top-p">Top P <span class="groq-setting-info">Nucleus sampling</span></label>
                  <input type="range" id="groq-top-p" min="0" max="1" step="0.05" value="1">
                  <span class="groq-param-value">1.0</span>
                </div>
                <div class="groq-advanced-param">
                  <label for="groq-frequency-penalty">Frequency Penalty <span class="groq-setting-info">Reduces repetition</span></label>
                  <input type="range" id="groq-frequency-penalty" min="0" max="2" step="0.1" value="0">
                  <span class="groq-param-value">0.0</span>
                </div>
                <div class="groq-advanced-param">
                  <label for="groq-presence-penalty">Presence Penalty <span class="groq-setting-info">Encourages new topics</span></label>
                  <input type="range" id="groq-presence-penalty" min="0" max="2" step="0.1" value="0">
                  <span class="groq-param-value">0.0</span>
                </div>
              </div>
            </div>
            <div class="groq-setting">
              <label>Conversation Settings</label>
              <div class="groq-checkbox-setting">
                <input type="checkbox" id="groq-auto-save" checked>
                <label for="groq-auto-save">Auto-save conversations</label>
              </div>
              <div class="groq-checkbox-setting">
                <input type="checkbox" id="groq-keyboard-shortcuts" checked>
                <label for="groq-keyboard-shortcuts">Enable keyboard shortcuts</label>
              </div>
            </div>
            
            <div class="groq-settings-actions">
              <button class="groq-save-settings-btn">💾 Save All Settings</button>
            </div>
          </div>
        </div>
        
        <!-- Usage Tab Content -->
        <div class="groq-tab-content" id="usage-content">
          <div class="groq-usage-container">
            <div class="groq-usage-summary">
              <div class="groq-usage-stat">
                <div class="groq-usage-label">Total Tokens Used</div>
                <div class="groq-usage-value" id="groq-total-tokens">0</div>
              </div>
              <div class="groq-usage-stat">
                <div class="groq-usage-label">Input Tokens</div>
                <div class="groq-usage-value" id="groq-input-tokens">0</div>
              </div>
              <div class="groq-usage-stat">
                <div class="groq-usage-label">Output Tokens</div>
                <div class="groq-usage-value" id="groq-output-tokens">0</div>
              </div>
              <div class="groq-usage-stat">
                <div class="groq-usage-label">Total Conversations</div>
                <div class="groq-usage-value" id="groq-total-convos">0</div>
              </div>
            </div>
            
            <div class="groq-usage-chart-container">
              <canvas id="groq-usage-chart" height="200"></canvas>
            </div>
            
            <div class="groq-usage-history">
              <h3>Recent Conversations</h3>
              <div class="groq-usage-table-container">
                <table class="groq-usage-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Name</th>
                      <th>Messages</th>
                      <th>Tokens</th>
                    </tr>
                  </thead>
                  <tbody id="groq-usage-table-body">
                    <!-- Usage data will be inserted here -->
                  </tbody>
                </table>
              </div>
            </div>
            
            <div class="groq-usage-actions">
              <button class="groq-reset-stats-btn">Reset Statistics</button>
              <button class="groq-export-stats-btn">Export Statistics</button>
            </div>
          </div>
        </div>
        
        <!-- Templates Tab Content -->
        <div class="groq-tab-content" id="templates-content">
          <div class="groq-templates-container">
            <div class="groq-templates-list-container">
              <div class="groq-templates-header">
                <h3>Prompt Templates</h3>
                <button class="groq-add-template-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                  </svg>
                  New Template
                </button>
              </div>
              <div class="groq-templates-list" id="groq-templates-list">
                <!-- Template items will be inserted here -->
              </div>
            </div>
            
            <div class="groq-template-editor">
              <div class="groq-template-form">
                <div class="groq-template-field">
                  <label for="groq-template-name">Template Name</label>
                  <input type="text" id="groq-template-name" placeholder="E.g., Code Review, Summarize Text...">
                </div>
                <div class="groq-template-field">
                  <label for="groq-template-content">Template Content</label>
                  <textarea id="groq-template-content" placeholder="Write your template here. Use {{variable}} for placeholders."></textarea>
                </div>
                <div class="groq-template-field">
                  <label>Variables (automatically detected)</label>
                  <div class="groq-template-variables" id="groq-template-variables">
                    <!-- Variables will be inserted here -->
                  </div>
                </div>
                <div class="groq-template-actions">
                  <button class="groq-save-template-btn">Save Template</button>
                  <button class="groq-delete-template-btn">Delete</button>
                </div>
              </div>
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

  // Load usage chart.js library
  loadChartJs();

  // Initialize default templates
  initDefaultTemplates();

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
      
      // Update chart in usage tab if it's active
      if (tabName === 'usage') {
        updateUsageDisplay();
      }
    });
  });

  // Load settings from storage
  chrome.storage.sync.get([
    'groqApiKey', 
    'groqSystemMessage', 
    'groqTemperature', 
    'groqMaxTokens',
    'groqDefaultModel', 
    'groqTheme',
    'groqCustomColors',
    'groqTopP',
    'groqFrequencyPenalty',
    'groqPresencePenalty',
    'groqAutoSave',
    'groqKeyboardShortcuts',
    'groqParameterPresets'
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
      document.querySelector('.groq-quick-temp').value = result.groqTemperature;
      document.querySelector('.groq-temp-display').textContent = result.groqTemperature;
    }
    if (result.groqMaxTokens) {
      document.getElementById('groq-max-tokens').value = result.groqMaxTokens;
      document.querySelector('.groq-quick-tokens').value = result.groqMaxTokens;
      document.querySelector('.groq-tokens-display').textContent = result.groqMaxTokens;
    }
    if (result.groqDefaultModel) {
      document.getElementById('groq-default-model').value = result.groqDefaultModel;
      document.querySelector('.groq-model-select').value = result.groqDefaultModel;
    }
    if (result.groqTopP) {
      document.getElementById('groq-top-p').value = result.groqTopP;
      document.querySelector('.groq-quick-top-p').value = result.groqTopP;
      document.querySelector('.groq-top-p-display').textContent = result.groqTopP;
    }
    if (result.groqFrequencyPenalty) {
      document.getElementById('groq-frequency-penalty').value = result.groqFrequencyPenalty;
      document.querySelector('.groq-quick-freq').value = result.groqFrequencyPenalty;
      document.querySelector('.groq-freq-display').textContent = result.groqFrequencyPenalty;
    }
    if (result.groqPresencePenalty) {
      document.getElementById('groq-presence-penalty').value = result.groqPresencePenalty;
      document.querySelector('.groq-quick-pres').value = result.groqPresencePenalty;
      document.querySelector('.groq-pres-display').textContent = result.groqPresencePenalty;
    }
    
    // Set theme
    if (result.groqTheme) {
      currentTheme = result.groqTheme;
      document.getElementById('groq-theme-select').value = result.groqTheme;
      if (result.groqTheme === 'custom' && result.groqCustomColors) {
        document.querySelector('.groq-custom-theme').style.display = 'block';
        document.getElementById('groq-bg-color').value = result.groqCustomColors.background || '#0f1419';
        document.getElementById('groq-text-color').value = result.groqCustomColors.text || '#edf2f7';
        document.getElementById('groq-accent-color').value = result.groqCustomColors.accent || '#5566ff';
      }
    }
    
    // Set checkboxes
    if (result.groqAutoSave !== undefined) {
      document.getElementById('groq-auto-save').checked = result.groqAutoSave;
      isAutoSaveEnabled = result.groqAutoSave;
    }
    if (result.groqKeyboardShortcuts !== undefined) {
      document.getElementById('groq-keyboard-shortcuts').checked = result.groqKeyboardShortcuts;
    }
    
    // Load parameter presets if available
    if (result.groqParameterPresets) {
      // Implementation for parameter presets handled separately
    }
    
    // Always apply theme
    setTheme(currentTheme, result.groqCustomColors);
    
    // Load saved conversations
    loadSavedConversations();
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

  // Theme selection
  const themeSelect = document.getElementById('groq-theme-select');
  themeSelect.addEventListener('change', function() {
    const selectedTheme = this.value;
    currentTheme = selectedTheme;
    
    // Toggle custom theme controls
    if (selectedTheme === 'custom') {
      document.querySelector('.groq-custom-theme').style.display = 'block';
      
      // Get custom colors
      const bgColor = document.getElementById('groq-bg-color').value;
      const textColor = document.getElementById('groq-text-color').value;
      const accentColor = document.getElementById('groq-accent-color').value;
      
      setTheme(selectedTheme, {
        background: bgColor,
        text: textColor,
        accent: accentColor
      });
    } else {
      document.querySelector('.groq-custom-theme').style.display = 'none';
      setTheme(selectedTheme);
    }
  });

  // Custom color changes
  const colorInputs = document.querySelectorAll('.groq-color-picker input');
  colorInputs.forEach(input => {
    input.addEventListener('change', function() {
      const bgColor = document.getElementById('groq-bg-color').value;
      const textColor = document.getElementById('groq-text-color').value;
      const accentColor = document.getElementById('groq-accent-color').value;
      
      setTheme('custom', {
        background: bgColor,
        text: textColor,
        accent: accentColor
      });
    });
  });

  // Set theme function
  function setTheme(theme, customColors = null) {
    const panelContainer = document.querySelector('.groq-panel-container');
    panelContainer.className = panelContainer.className.replace(/theme-\w+/g, '');
    panelContainer.classList.add(`theme-${theme}`);
    
    if (theme === 'custom' && customColors) {
      panelContainer.style.setProperty('--bg-color', customColors.background);
      panelContainer.style.setProperty('--text-color', customColors.text);
      panelContainer.style.setProperty('--accent-color', customColors.accent);
    } else {
      // Reset any inline styles
      panelContainer.style.removeProperty('--bg-color');
      panelContainer.style.removeProperty('--text-color');
      panelContainer.style.removeProperty('--accent-color');
    }
    
    // Save theme preference
    chrome.storage.sync.set({
      groqTheme: theme,
      groqCustomColors: customColors
    });
  }

  // Update temperature value display
  const tempSlider = document.getElementById('groq-temperature');
  const tempValue = document.querySelector('.groq-temp-value');
  tempSlider.addEventListener('input', function() {
    tempValue.textContent = this.value;
    // Also update quick settings
    document.querySelector('.groq-quick-temp').value = this.value;
    document.querySelector('.groq-temp-display').textContent = this.value;
  });
  
  // Parameter sliders in quick settings
  const quickTempSlider = document.querySelector('.groq-quick-temp');
  quickTempSlider.addEventListener('input', function() {
    document.querySelector('.groq-temp-display').textContent = this.value;
    document.getElementById('groq-temperature').value = this.value;
    document.querySelector('.groq-temp-value').textContent = this.value;
  });
  
  const quickTokensSlider = document.querySelector('.groq-quick-tokens');
  quickTokensSlider.addEventListener('input', function() {
    document.querySelector('.groq-tokens-display').textContent = this.value;
    document.getElementById('groq-max-tokens').value = this.value;
  });
  
  // Advanced parameters
  const quickTopPSlider = document.querySelector('.groq-quick-top-p');
  quickTopPSlider.addEventListener('input', function() {
    document.querySelector('.groq-top-p-display').textContent = this.value;
    document.getElementById('groq-top-p').value = this.value;
  });
  
  const quickFreqSlider = document.querySelector('.groq-quick-freq');
  quickFreqSlider.addEventListener('input', function() {
    document.querySelector('.groq-freq-display').textContent = this.value;
    document.getElementById('groq-frequency-penalty').value = this.value;
  });
  
  const quickPresSlider = document.querySelector('.groq-quick-pres');
  quickPresSlider.addEventListener('input', function() {
    document.querySelector('.groq-pres-display').textContent = this.value;
    document.getElementById('groq-presence-penalty').value = this.value;
  });
  
  // Toggle advanced parameters
  const toggleAdvancedBtn = document.querySelector('.groq-toggle-advanced');
  toggleAdvancedBtn.addEventListener('click', function() {
    const advancedParams = document.querySelector('.groq-advanced-params');
    if (advancedParams.style.display === 'block') {
      advancedParams.style.display = 'none';
      this.textContent = 'Advanced Parameters';
    } else {
      advancedParams.style.display = 'block';
      this.textContent = 'Hide Advanced Parameters';
    }
  });

  // Conversation management
  const newChatBtn = document.querySelector('.groq-new-chat-btn');
  newChatBtn.addEventListener('click', function() {
    // Confirm if there are messages
    const messageCount = document.querySelectorAll('.groq-message').length;
    if (messageCount > 0) {
      if (confirm('Start a new conversation? Current messages will be cleared.')) {
        clearChat();
        currentConversationId = 'new-' + Date.now();
        showNotification('New conversation started', 'info');
      }
    } else {
      currentConversationId = 'new-' + Date.now();
    }
  });
  
  // Save conversation button
  const saveConvoBtn = document.querySelector('.groq-save-conversation-btn');
  saveConvoBtn.addEventListener('click', function() {
    saveCurrentConversation(true);
  });
  
  // Load conversation button
  const loadConvoBtn = document.querySelector('.groq-load-conversation-btn');
  loadConvoBtn.addEventListener('click', function() {
    showConversationLoadDialog();
  });
  
  // Clear conversation button
  const clearConvoBtn = document.querySelector('.groq-clear-conversation-btn');
  clearConvoBtn.addEventListener('click', function() {
    if (confirm('Are you sure you want to clear the current conversation?')) {
      clearChat();
      showNotification('Conversation cleared', 'info');
    }
  });
  
  // Export buttons
  const exportBtns = {
    txt: document.querySelector('.groq-export-txt-btn'),
    md: document.querySelector('.groq-export-md-btn'),
    json: document.querySelector('.groq-export-json-btn'),
    html: document.querySelector('.groq-export-html-btn')
  };
  
  // Set up export listeners
  Object.entries(exportBtns).forEach(([format, btn]) => {
    btn.addEventListener('click', function() {
      exportConversation(format);
    });
  });
  
  // Context buttons
  const contextBtn = document.querySelector('.groq-context-btn');
  contextBtn.addEventListener('click', function() {
    const pageContext = extractPageContext();
    if (pageContext.content) {
      const chatInput = document.querySelector('.groq-chat-input');
      chatInput.value = `Please analyze the following content from ${pageContext.title}:\n\n${pageContext.content}`;
      chatInput.focus();
      showNotification('Page context added to input', 'success');
    } else {
      showNotification('No significant content found on page', 'error');
    }
  });
  
  const selectedTextBtn = document.querySelector('.groq-selected-text-btn');
  selectedTextBtn.addEventListener('click', function() {
    const selectedText = window.getSelection().toString().trim();
    if (selectedText) {
      const chatInput = document.querySelector('.groq-chat-input');
      chatInput.value = chatInput.value ? `${chatInput.value}\n\n${selectedText}` : selectedText;
      chatInput.focus();
      showNotification('Selected text added to input', 'success');
    } else {
      showNotification('No text selected on page', 'error');
    }
  });

  // Save all settings
  const saveSettingsBtn = document.querySelector('.groq-save-settings-btn');
  saveSettingsBtn.addEventListener('click', function() {
    // Get all settings values
    const apiKey = document.getElementById('groq-api-key').value;
    const systemMessage = document.getElementById('groq-system-message').value;
    const temperature = document.getElementById('groq-temperature').value;
    const maxTokens = document.getElementById('groq-max-tokens').value;
    const defaultModel = document.getElementById('groq-default-model').value;
    const topP = document.getElementById('groq-top-p').value;
    const frequencyPenalty = document.getElementById('groq-frequency-penalty').value;
    const presencePenalty = document.getElementById('groq-presence-penalty').value;
    const autoSave = document.getElementById('groq-auto-save').checked;
    const keyboardShortcuts = document.getElementById('groq-keyboard-shortcuts').checked;
    
    // Show loading state
    this.classList.add('loading');
    this.textContent = 'Saving...';
    
    // Save to storage
    chrome.storage.sync.set({
      groqApiKey: apiKey,
      groqSystemMessage: systemMessage,
      groqTemperature: temperature,
      groqMaxTokens: maxTokens,
      groqDefaultModel: defaultModel,
      groqTopP: topP,
      groqFrequencyPenalty: frequencyPenalty,
      groqPresencePenalty: presencePenalty,
      groqAutoSave: autoSave,
      groqKeyboardShortcuts: keyboardShortcuts
    }, function() {
      // Reset button state
      saveSettingsBtn.classList.remove('loading');
      saveSettingsBtn.innerHTML = '💾 Save All Settings';
      
      // Show success notification
      showNotification('All settings saved successfully!', 'success');
      
      // Update the chat model dropdown to match default
      document.querySelector('.groq-model-select').value = defaultModel;
      
      // Update global variables
      isAutoSaveEnabled = autoSave;
    });
  });

  // Handle sending messages
  const sendBtn = document.querySelector('.groq-send-btn');
  const chatInput = document.querySelector('.groq-chat-input');
  const messagesContainer = document.getElementById('groq-messages');
  const modelSelect = document.querySelector('.groq-model-select');
  const modelInfo = document.querySelector('.groq-model-info');
  const statusBar = document.querySelector('.groq-status-text');
  
  sendBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('keydown', function(e) {
    const keyboardShortcutsEnabled = document.getElementById('groq-keyboard-shortcuts').checked;
    if (keyboardShortcutsEnabled && (e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  });
  
  // Global keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    const keyboardShortcutsEnabled = document.getElementById('groq-keyboard-shortcuts').checked;
    if (!keyboardShortcutsEnabled) return;
    
    // Alt+G to toggle panel
    if (e.altKey && e.key === 'g') {
      e.preventDefault();
      panelContainer.classList.toggle('hidden');
      toggleButton.classList.toggle('active');
    }
    
    // Only if panel is visible
    if (!panelContainer.classList.contains('hidden')) {
      // Esc to hide panel
      if (e.key === 'Escape') {
        panelContainer.classList.add('hidden');
        toggleButton.classList.remove('active');
      }
      
      // Ctrl+1,2,3,4 to switch tabs
      if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '4') {
        e.preventDefault();
        const tabIndex = parseInt(e.key) - 1;
        const tabs = document.querySelectorAll('.groq-tab');
        if (tabs[tabIndex]) {
          tabs[tabIndex].click();
        }
      }
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
    
    // Get values for API call
    const temperature = parseFloat(document.querySelector('.groq-quick-temp').value);
    const maxTokens = parseInt(document.querySelector('.groq-quick-tokens').value);
    const topP = parseFloat(document.querySelector('.groq-quick-top-p').value);
    const frequencyPenalty = parseFloat(document.querySelector('.groq-quick-freq').value);
    const presencePenalty = parseFloat(document.querySelector('.groq-quick-pres').value);
    
    callGroqAPI(apiKey, messages, model, temperature, maxTokens, topP, frequencyPenalty, presencePenalty, thinkingId);
    
    // Auto-save conversation if enabled
    if (isAutoSaveEnabled) {
      setTimeout(() => {
        saveCurrentConversation();
      }, 1000);
    }
  }

  function addMessage(role, content, id = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `groq-message ${role}-message`;
    if (id) messageDiv.id = `msg-${id}`;
    
    const avatar = role === 'user' ? '👤' : (role === 'system' ? '⚠️' : '🤖');
    
    // Add message reactions UI
    let reactionButtons = '';
    if (role !== 'system') {
      reactionButtons = `
        <div class="groq-message-reactions">
          <button class="groq-reaction-btn groq-copy-msg-btn" title="Copy message">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
          <button class="groq-reaction-btn groq-star-msg-btn" title="Star message">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
          </button>
          ${role === 'user' ? `
          <button class="groq-reaction-btn groq-edit-msg-btn" title="Edit message">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
          </button>
          ` : ''}
          <button class="groq-reaction-btn groq-delete-msg-btn" title="Delete message">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      `;
    }
    
    messageDiv.innerHTML = `
      <div class="groq-message-avatar">${avatar}</div>
      <div class="groq-message-content">
        <div class="groq-message-text">${content}</div>
        ${reactionButtons}
      </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    
    // Attach reaction event handlers
    if (role !== 'system') {
      const copyBtn = messageDiv.querySelector('.groq-copy-msg-btn');
      copyBtn.addEventListener('click', function() {
        const text = messageDiv.querySelector('.groq-message-text').textContent;
        navigator.clipboard.writeText(text).then(() => {
          showNotification('Message copied to clipboard', 'success');
        });
      });
      
      const starBtn = messageDiv.querySelector('.groq-star-msg-btn');
      starBtn.addEventListener('click', function() {
        messageDiv.classList.toggle('starred');
        this.classList.toggle('active');
      });
      
      if (role === 'user') {
        const editBtn = messageDiv.querySelector('.groq-edit-msg-btn');
        editBtn.addEventListener('click', function() {
          const text = messageDiv.querySelector('.groq-message-text').textContent;
          chatInput.value = text;
          chatInput.focus();
          
          // Add a visual marker that we're editing
          messageDiv.classList.add('editing');
          
          // Add a cancel edit button
          const cancelEdit = document.createElement('button');
          cancelEdit.className = 'groq-cancel-edit-btn';
          cancelEdit.textContent = 'Cancel Edit';
          cancelEdit.addEventListener('click', function() {
            messageDiv.classList.remove('editing');
            this.remove();
          });
          
          messageDiv.appendChild(cancelEdit);
        });
      }
      
      const deleteBtn = messageDiv.querySelector('.groq-delete-msg-btn');
      deleteBtn.addEventListener('click', function() {
        if (confirm('Delete this message?')) {
          messageDiv.remove();
          
          // Auto-save after deletion if enabled
          if (isAutoSaveEnabled) {
            saveCurrentConversation();
          }
        }
      });
    }
    
    return messageDiv;
  }

  async function callGroqAPI(apiKey, messages, model, temperature, maxTokens, topP, frequencyPenalty, presencePenalty, thinkingId) {
    const url = "https://api.groq.com/openai/v1/chat/completions";
    
    // Count tokens for usage tracking
    let promptTokens = 0;
    messages.forEach(msg => {
      promptTokens += estimateTokenCount(msg.content);
    });
    
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
        top_p: topP,
        frequency_penalty: frequencyPenalty,
        presence_penalty: presencePenalty,
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
      
      // Create prism.js instance
      const prism = await loadPrismJs().catch(err => {
        console.warn('Could not load Prism.js for syntax highlighting', err);
        return null;
      });
      
      // Function to process stream
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          // Calculate response time
          const responseTime = ((Date.now() - startTime) / 1000).toFixed(2);
          
          // Count response tokens
          const responseTokens = estimateTokenCount(responseContent);
          
          // Update session usage display
          updateSessionUsage(promptTokens, responseTokens);
          
          // Track usage stats
          trackUsage(promptTokens, responseTokens, model);
          
          // Update metadata
          metadataContainer.innerHTML = `
            <div class="groq-message-info">
              <span class="groq-model-badge">${getModelDisplayName(model)}</span>
              <span class="groq-time-badge" title="Response time">${responseTime}s</span>
              <span class="groq-token-badge" title="Approximate token count">${responseTokens} tokens</span>
            </div>
          `;
          
          // Update status bar with completion info
          updateStatusBar(`Complete · ${responseTime}s · ~${responseTokens} tokens`);
          
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
                responseMsgText.innerHTML = formatMessage(responseContent, prism);
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

  // Update session usage display
  function updateSessionUsage(promptTokens, responseTokens) {
    const sessionUsage = document.querySelector('.groq-session-usage');
    const currentTotal = parseInt(sessionUsage.textContent.match(/\d+/) || 0);
    const newTotal = currentTotal + promptTokens + responseTokens;
    sessionUsage.textContent = `Session: ${newTotal} tokens`;
  }

  // Track usage for statistics
  function trackUsage(promptTokens, responseTokens, model) {
    // Update global usage stats
    usageStats.totalPromptTokens += promptTokens;
    usageStats.totalResponseTokens += responseTokens;
    
    // Update for current conversation
    if (!usageStats.conversations[currentConversationId]) {
      usageStats.conversations[currentConversationId] = {
        promptTokens: 0,
        responseTokens: 0,
        messages: 0,
        date: new Date().toISOString(),
        name: `Conversation ${Object.keys(usageStats.conversations).length + 1}`,
        model: model
      };
    }
    
    usageStats.conversations[currentConversationId].promptTokens += promptTokens;
    usageStats.conversations[currentConversationId].responseTokens += responseTokens;
    usageStats.conversations[currentConversationId].messages += 1;
    
    // Save to storage
    chrome.storage.local.set({ groqUsageStats: usageStats });
    
    // Update usage display if visible
    if (document.querySelector('#usage-content').classList.contains('active')) {
      updateUsageDisplay();
    }
  }

  // Load Chart.js library
  function loadChartJs() {
    return new Promise((resolve, reject) => {
      // Only load if not already loaded
      if (window.Chart) {
        resolve(window.Chart);
        return;
      }
      
      const chartScript = document.createElement('script');
      chartScript.src = 'https://cdn.jsdelivr.net/npm/chart.js';
      chartScript.onload = () => resolve(window.Chart);
      chartScript.onerror = reject;
      document.head.appendChild(chartScript);
    });
  }

  // Update usage statistics display
  function updateUsageDisplay() {
    // Update counters
    document.getElementById('groq-total-tokens').textContent = (usageStats.totalPromptTokens + usageStats.totalResponseTokens).toLocaleString();
    document.getElementById('groq-input-tokens').textContent = usageStats.totalPromptTokens.toLocaleString();
    document.getElementById('groq-output-tokens').textContent = usageStats.totalResponseTokens.toLocaleString();
    document.getElementById('groq-total-convos').textContent = Object.keys(usageStats.conversations).length;
    
    // Update table
    const tableBody = document.getElementById('groq-usage-table-body');
    tableBody.innerHTML = '';
    
    Object.entries(usageStats.conversations)
      .sort((a, b) => new Date(b[1].date) - new Date(a[1].date))
      .slice(0, 10) // Show only 10 most recent
      .forEach(([id, convo]) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${new Date(convo.date).toLocaleDateString()}</td>
          <td>${convo.name}</td>
          <td>${convo.messages}</td>
          <td>${(convo.promptTokens + convo.responseTokens).toLocaleString()}</td>
        `;
        tableBody.appendChild(row);
      });
    
    // Update chart
    updateUsageChart();
  }

  // Update usage chart
  async function updateUsageChart() {
    try {
      await loadChartJs();
      
      const canvas = document.getElementById('groq-usage-chart');
      const ctx = canvas.getContext('2d');
      
      // Group by date
      const usageByDate = {};
      Object.values(usageStats.conversations).forEach(convo => {
        const date = new Date(convo.date).toLocaleDateString();
        if (!usageByDate[date]) {
          usageByDate[date] = {
            promptTokens: 0,
            responseTokens: 0
          };
        }
        usageByDate[date].promptTokens += convo.promptTokens;
        usageByDate[date].responseTokens += convo.responseTokens;
      });
      
      // Prepare data
      const dates = Object.keys(usageByDate).sort((a, b) => new Date(a) - new Date(b));
      const promptData = dates.map(date => usageByDate[date].promptTokens);
      const responseData = dates.map(date => usageByDate[date].responseTokens);
      
      // Clear existing chart
      if (window.usageChart) {
        window.usageChart.destroy();
      }
      
      // Create chart
      window.usageChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: dates,
          datasets: [
            {
              label: 'Input Tokens',
              backgroundColor: 'rgba(86, 111, 242, 0.5)',
              borderColor: 'rgba(86, 111, 242, 1)',
              borderWidth: 1,
              data: promptData
            },
            {
              label: 'Output Tokens',
              backgroundColor: 'rgba(242, 86, 111, 0.5)',
              borderColor: 'rgba(242, 86, 111, 1)',
              borderWidth: 1,
              data: responseData
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              stacked: true,
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              }
            },
            y: {
              stacked: true,
              grid: {
                color: 'rgba(255, 255, 255, 0.1)'
              }
            }
          },
          plugins: {
            legend: {
              position: 'top',
              labels: {
                color: '#edf2f7'
              }
            }
          }
        }
      });
    } catch (error) {
      console.error('Error updating usage chart:', error);
    }
  }

  // Reset usage statistics
  document.querySelector('.groq-reset-stats-btn').addEventListener('click', function() {
    if (confirm('Are you sure you want to reset all usage statistics? This cannot be undone.')) {
      usageStats = {
        totalPromptTokens: 0,
        totalResponseTokens: 0,
        conversations: {}
      };
      
      chrome.storage.local.set({ groqUsageStats: usageStats });
      updateUsageDisplay();
      showNotification('Usage statistics have been reset', 'info');
    }
  });

  // Export usage statistics
  document.querySelector('.groq-export-stats-btn').addEventListener('click', function() {
    const jsonData = JSON.stringify(usageStats, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `groq-usage-stats-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

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
  function formatMessage(text, prism) {
    // Check if we have Prism for syntax highlighting
    if (!prism) {
      // Fallback to basic formatting
      return text
        .replace(/```([a-z]*)\n([\s\S]*?)```/g, '<div class="groq-code-block"><div class="groq-code-header">$1</div><pre><code>$2</code></pre></div>')
        .replace(/```\n([\s\S]*?)```/g, '<div class="groq-code-block"><pre><code>$1</code></pre></div>')
        .replace(/`([^`]+)`/g, '<code class="groq-inline-code">$1</code>')
        .replace(/\n/g, '<br>');
    }
    
    // Use Prism.js for syntax highlighting
    return text.replace(/```([a-z]*)\n([\s\S]*?)```/g, (match, lang, code) => {
      // Default to javascript if no language is specified
      const language = lang || 'javascript';
      
      try {
        // Check if the language is available in Prism
        const grammar = prism.languages[language] || prism.languages.javascript;
        const highlighted = prism.highlight(code, grammar, language);
        
        return `
          <div class="groq-code-block">
            <div class="groq-code-header">
              ${language}
              <button class="groq-copy-code-btn" title="Copy code">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
              </button>
            </div>
            <pre class="language-${language}"><code class="language-${language}">${highlighted}</code></pre>
          </div>
        `;
      } catch (error) {
        console.warn('Error highlighting code:', error);
        // Fallback to plain formatting
        return `<div class="groq-code-block"><div class="groq-code-header">${language}</div><pre><code>${code}</code></pre></div>`;
      }
    })
    // Handle code blocks without language specification
    .replace(/```\n([\s\S]*?)```/g, '<div class="groq-code-block"><pre><code>$1</code></pre></div>')
    // Handle inline code
    .replace(/`([^`]+)`/g, '<code class="groq-inline-code">$1</code>')
    // Handle newlines
    .replace(/\n/g, '<br>');
  }

  // Initialize code copy buttons
  document.addEventListener('click', function(e) {
    if (e.target.closest('.groq-copy-code-btn')) {
      const btn = e.target.closest('.groq-copy-code-btn');
      const codeBlock = btn.closest('.groq-code-block');
      const code = codeBlock.querySelector('code').textContent;
      
      navigator.clipboard.writeText(code).then(() => {
        // Visual feedback
        const originalHTML = btn.innerHTML;
        btn.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        `;
        
        setTimeout(() => {
          btn.innerHTML = originalHTML;
        }, 2000);
        
        showNotification('Code copied to clipboard', 'success');
      });
    }
  });

  // Extract context from the current webpage
  function extractPageContext() {
    const title = document.title;
    const url = window.location.href;
    
    // Try different selectors to find the main content
    const selectors = [
      'main', 'article', '.content', '#content', '.main', 
      '.article', '.post', '.entry', 'section'
    ];
    
    let content = '';
    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) {
        content = element.textContent.trim();
        break;
      }
    }
    
    // If no content found, try to get the body content, excluding scripts and styles
    if (!content) {
      const bodyClone = document.body.cloneNode(true);
      // Remove script and style elements
      bodyClone.querySelectorAll('script, style, nav, footer, header, .header, .footer, .nav, .menu, .sidebar, .ad, .ads, .advertisement').forEach(el => {
        el.remove();
      });
      content = bodyClone.textContent.trim();
    }
    
    // Limit content to 3000 characters to avoid token bloat
    if (content.length > 3000) {
      content = content.substring(0, 3000) + '... [content truncated for brevity]';
    }
    
    return {
      title,
      url,
      content
    };
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

  // Initialize the default templates
  function initDefaultTemplates() {
    const defaultTemplates = {
      'code-review': {
        name: 'Code Review',
        template: 'Please review the following code for bugs, performance issues, and style improvements:\n\n```{{language}}\n{{code}}\n```',
        variables: ['language', 'code']
      },
      'summarize': {
        name: 'Summarize Text',
        template: 'Please provide a concise summary of the following text:\n\n{{text}}',
        variables: ['text']
      },
      'translate': {
        name: 'Translate',
        template: 'Please translate the following text from {{source_language}} to {{target_language}}:\n\n{{text}}',
        variables: ['source_language', 'target_language', 'text']
      },
      'explain-concept': {
        name: 'Explain Concept',
        template: 'Please explain the concept of {{concept}} in simple terms. If possible, include examples and analogies.',
        variables: ['concept']
      }
    };
    
    // Check if we already have templates
    chrome.storage.sync.get(['groqTemplates'], function(result) {
      if (!result.groqTemplates) {
        // Save default templates
        chrome.storage.sync.set({ groqTemplates: defaultTemplates });
      }
      
      // Load templates
      loadTemplates(result.groqTemplates || defaultTemplates);
    });
  }

  // Load templates into UI
  function loadTemplates(templates) {
    // Populate template list
    const templatesList = document.getElementById('groq-templates-list');
    templatesList.innerHTML = '';
    
    Object.entries(templates).forEach(([id, template]) => {
      const templateItem = document.createElement('div');
      templateItem.className = 'groq-template-item';
      templateItem.setAttribute('data-template-id', id);
      templateItem.innerHTML = `
        <div class="groq-template-item-name">${template.name}</div>
        <div class="groq-template-item-preview">${template.template.substring(0, 60)}${template.template.length > 60 ? '...' : ''}</div>
      `;
      templatesList.appendChild(templateItem);
    });
    
    // Also populate the templates dropdown in chat
    const templateDropdown = document.querySelector('.groq-template-dropdown-content');
    templateDropdown.innerHTML = '';
    
    Object.entries(templates).forEach(([id, template]) => {
      const templateButton = document.createElement('button');
      templateButton.className = 'groq-dropdown-item groq-template-option';
      templateButton.setAttribute('data-template-id', id);
      templateButton.textContent = template.name;
      templateDropdown.appendChild(templateButton);
    });
    
    // Add event listeners
    document.querySelectorAll('.groq-template-item').forEach(item => {
      item.addEventListener('click', function() {
        const templateId = this.getAttribute('data-template-id');
        loadTemplateToEditor(templateId, templates[templateId]);
      });
    });
    
    document.querySelectorAll('.groq-template-option').forEach(option => {
      option.addEventListener('click', function() {
        const templateId = this.getAttribute('data-template-id');
        const template = templates[templateId];
        
        // If template has variables, show a form to fill them
        if (template.variables && template.variables.length > 0) {
          showTemplateVariablesForm(template);
        } else {
          // Insert directly
          const chatInput = document.querySelector('.groq-chat-input');
          chatInput.value += (chatInput.value ? '\n\n' : '') + template.template;
          chatInput.focus();
        }
      });
    });
  }

  // Load template to editor
  function loadTemplateToEditor(id, template) {
    document.getElementById('groq-template-name').value = template.name;
    document.getElementById('groq-template-content').value = template.template;
    
    // Show variables
    updateTemplateVariables(template.template);
    
    // Activate the edit mode
    document.querySelector('.groq-template-editor').classList.add('active');
    document.querySelector('.groq-delete-template-btn').dataset.templateId = id;
  }

  // Update template variables based on content
  function updateTemplateVariables(content) {
    const variablesContainer = document.getElementById('groq-template-variables');
    variablesContainer.innerHTML = '';
    
    // Extract variables using regex {{variable}}
    const variables = extractTemplateVariables(content);
    
    if (variables.length === 0) {
      variablesContainer.innerHTML = '<div class="groq-no-variables">No variables detected. Use {{variable_name}} syntax to create variables.</div>';
      return;
    }
    
    variables.forEach(variable => {
      const variableDisplay = document.createElement('div');
      variableDisplay.className = 'groq-template-variable';
      variableDisplay.innerHTML = `
        <span class="groq-variable-name">{{${variable}}}</span>
        <span class="groq-variable-info">Will be replaced when using the template</span>
      `;
      variablesContainer.appendChild(variableDisplay);
    });
  }

  // Extract variables from template content
  function extractTemplateVariables(content) {
    const regex = /\{\{([^}]+)\}\}/g;
    const variables = new Set();
    let match;
    
    while ((match = regex.exec(content)) !== null) {
      variables.add(match[1]);
    }
    
    return Array.from(variables);
  }

  // Show form to fill template variables
  function showTemplateVariablesForm(template) {
    // Create modal for variable input
    const modal = document.createElement('div');
    modal.className = 'groq-modal';
    modal.innerHTML = `
      <div class="groq-modal-content">
        <div class="groq-modal-header">
          <h3>Fill Template Variables</h3>
          <button class="groq-modal-close">&times;</button>
        </div>
        <div class="groq-modal-body">
          <form class="groq-template-variables-form">
            ${template.variables.map(variable => `
              <div class="groq-template-variable-field">
                <label for="var-${variable}">${variable.replace(/_/g, ' ')}</label>
                <input type="text" id="var-${variable}" name="${variable}" placeholder="Enter ${variable.replace(/_/g, ' ')}">
              </div>
            `).join('')}
          </form>
        </div>
        <div class="groq-modal-footer">
          <button class="groq-modal-cancel">Cancel</button>
          <button class="groq-modal-apply">Apply Template</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle close/cancel
    const closeModal = () => {
      document.body.removeChild(modal);
    };
    
    modal.querySelector('.groq-modal-close').addEventListener('click', closeModal);
    modal.querySelector('.groq-modal-cancel').addEventListener('click', closeModal);
    
    // Handle apply
    modal.querySelector('.groq-modal-apply').addEventListener('click', () => {
      let filledTemplate = template.template;
      
      // Replace variables
      template.variables.forEach(variable => {
        const input = document.getElementById(`var-${variable}`);
        const value = input.value.trim() || `[${variable}]`; // Default placeholder if empty
        filledTemplate = filledTemplate.replace(new RegExp(`\\{\\{${variable}\\}\\}`, 'g'), value);
      });
      
      // Insert into chat input
      const chatInput = document.querySelector('.groq-chat-input');
      chatInput.value += (chatInput.value ? '\n\n' : '') + filledTemplate;
      chatInput.focus();
      
      closeModal();
    });
  }

  // Save template button
  document.querySelector('.groq-save-template-btn').addEventListener('click', function() {
    const name = document.getElementById('groq-template-name').value.trim();
    const content = document.getElementById('groq-template-content').value.trim();
    
    if (!name || !content) {
      showNotification('Please provide both a name and content for the template', 'error');
      return;
    }
    
    // Generate a unique ID for new templates or use existing ID for edits
    const templateId = document.querySelector('.groq-delete-template-btn').dataset.templateId || 'template-' + Date.now();
    
    // Extract variables
    const variables = extractTemplateVariables(content);
    
    // Create template object
    const template = {
      name,
      template: content,
      variables
    };
    
    // Save to storage
    chrome.storage.sync.get(['groqTemplates'], function(result) {
      const templates = result.groqTemplates || {};
      templates[templateId] = template;
      
      chrome.storage.sync.set({ groqTemplates: templates }, function() {
        showNotification('Template saved successfully', 'success');
        loadTemplates(templates);
      });
    });
  });

  // Delete template button
  document.querySelector('.groq-delete-template-btn').addEventListener('click', function() {
    const templateId = this.dataset.templateId;
    
    if (!templateId) {
      showNotification('No template selected for deletion', 'error');
      return;
    }
    
    if (confirm('Are you sure you want to delete this template?')) {
      chrome.storage.sync.get(['groqTemplates'], function(result) {
        const templates = result.groqTemplates || {};
        
        if (templates[templateId]) {
          delete templates[templateId];
          
          chrome.storage.sync.set({ groqTemplates: templates }, function() {
            showNotification('Template deleted successfully', 'success');
            loadTemplates(templates);
            
            // Clear editor
            document.getElementById('groq-template-name').value = '';
            document.getElementById('groq-template-content').value = '';
            document.getElementById('groq-template-variables').innerHTML = '';
          });
        }
      });
    }
  });

  // Add new template button
  document.querySelector('.groq-add-template-btn').addEventListener('click', function() {
    // Clear editor
    document.getElementById('groq-template-name').value = '';
    document.getElementById('groq-template-content').value = '';
    document.getElementById('groq-template-variables').innerHTML = '';
    document.querySelector('.groq-delete-template-btn').dataset.templateId = '';
  });

  // Live update template variables
  document.getElementById('groq-template-content').addEventListener('input', function() {
    updateTemplateVariables(this.value);
  });

  // Save current conversation
  function saveCurrentConversation(showConfirmation = false) {
    const messages = document.querySelectorAll('.groq-message');
    if (messages.length === 0) return;
    
    // Get messages data
    const conversationData = Array.from(messages).map(msg => {
      const role = msg.classList.contains('user-message') ? 'user' : 
                  (msg.classList.contains('system-message') ? 'system' : 'assistant');
      const content = msg.querySelector('.groq-message-text').textContent;
      const isStarred = msg.classList.contains('starred');
      
      return { role, content, isStarred };
    });
    
    // Get metadata
    const model = document.querySelector('.groq-model-select').value;
    const timestamp = new Date().toISOString();
    
    // Get conversation name (first user message truncated)
    let name = conversationData.find(msg => msg.role === 'user')?.content || '';
    name = name.substring(0, 40) + (name.length > 40 ? '...' : '');
    
    // Create conversation object
    const conversation = {
      id: currentConversationId,
      name,
      messages: conversationData,
      model,
      timestamp,
      lastUpdated: timestamp
    };
    
    // Save to storage
    chrome.storage.local.get(['groqConversations'], function(result) {
      const conversations = result.groqConversations || {};
      conversations[currentConversationId] = conversation;
      
      chrome.storage.local.set({ groqConversations: conversations }, function() {
        if (showConfirmation) {
          showNotification('Conversation saved', 'success');
        }
      });
    });
  }

  // Load saved conversations
  function loadSavedConversations() {
    chrome.storage.local.get(['groqConversations'], function(result) {
      conversations = result.groqConversations || {};
    });
  }

  // Show load conversation dialog
  function showConversationLoadDialog() {
    if (Object.keys(conversations).length === 0) {
      showNotification('No saved conversations found', 'info');
      return;
    }
    
    // Create modal
    const modal = document.createElement('div');
    modal.className = 'groq-modal';
    modal.innerHTML = `
      <div class="groq-modal-content">
        <div class="groq-modal-header">
          <h3>Load Conversation</h3>
          <button class="groq-modal-close">&times;</button>
        </div>
        <div class="groq-modal-body">
          <div class="groq-conversations-list">
            ${Object.values(conversations)
              .sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated))
              .map(convo => `
                <div class="groq-conversation-item" data-conversation-id="${convo.id}">
                  <div class="groq-conversation-name">${convo.name || 'Untitled Conversation'}</div>
                  <div class="groq-conversation-meta">
                    <span>${new Date(convo.timestamp).toLocaleString()}</span>
                    <span>${convo.messages.length} messages</span>
                    <span>${getModelDisplayName(convo.model)}</span>
                  </div>
                </div>
              `).join('')}
          </div>
        </div>
        <div class="groq-modal-footer">
          <button class="groq-modal-cancel">Cancel</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Handle close/cancel
    const closeModal = () => {
      document.body.removeChild(modal);
    };
    
    modal.querySelector('.groq-modal-close').addEventListener('click', closeModal);
    modal.querySelector('.groq-modal-cancel').addEventListener('click', closeModal);
    
    // Handle conversation selection
    modal.querySelectorAll('.groq-conversation-item').forEach(item => {
      item.addEventListener('click', function() {
        const conversationId = this.getAttribute('data-conversation-id');
        const conversation = conversations[conversationId];
        
        if (conversation) {
          // Load conversation
          loadConversation(conversation);
          closeModal();
        }
      });
    });
  }

  // Load a conversation into the chat
  function loadConversation(conversation) {
    // Confirm if there are messages
    const messageCount = document.querySelectorAll('.groq-message').length;
    if (messageCount > 0) {
      if (!confirm('Load this conversation? Current messages will be replaced.')) {
        return;
      }
    }
    
    // Clear current chat
    clearChat();
    
    // Set current conversation ID
    currentConversationId = conversation.id;
    
    // Set model if available
    if (conversation.model) {
      document.querySelector('.groq-model-select').value = conversation.model;
    }
    
    // Add messages
    conversation.messages.forEach(msg => {
      const messageEl = addMessage(msg.role, msg.content);
      
      // Apply starred state if needed
      if (msg.isStarred) {
        messageEl.classList.add('starred');
        const starBtn = messageEl.querySelector('.groq-star-msg-btn');
        if (starBtn) starBtn.classList.add('active');
      }
    });
    
    showNotification('Conversation loaded', 'success');
  }

  // Clear chat
  function clearChat() {
    const messagesContainer = document.getElementById('groq-messages');
    messagesContainer.innerHTML = '';
  }

  // Export conversation in various formats
  function exportConversation(format) {
    const messages = document.querySelectorAll('.groq-message');
    if (messages.length === 0) {
      showNotification('No messages to export', 'error');
      return;
    }
    
    let content = '';
    let filename = `groq-conversation-${new Date().toISOString().split('T')[0]}`;
    
    // Get conversation data
    const conversationData = Array.from(messages).map(msg => {
      const role = msg.classList.contains('user-message') ? 'User' : 
                  (msg.classList.contains('system-message') ? 'System' : 'Assistant');
      const content = msg.querySelector('.groq-message-text').textContent;
      
      return { role, content };
    });
    
    // Format based on export type
    switch (format) {
      case 'txt':
        content = conversationData.map(msg => `${msg.role}:\n${msg.content}\n\n`).join('');
        filename += '.txt';
        break;
        
      case 'md':
        content = conversationData.map(msg => `## ${msg.role}\n\n${msg.content}\n\n`).join('');
        filename += '.md';
        break;
        
      case 'json':
        content = JSON.stringify({
          title: document.title,
          date: new Date().toISOString(),
          model: document.querySelector('.groq-model-select').value,
          messages: conversationData
        }, null, 2);
        filename += '.json';
        break;
        
      case 'html':
        content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Groq Conversation</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .message { margin-bottom: 20px; padding: 10px; border-radius: 8px; }
    .user { background-color: #e6f3ff; }
    .assistant { background-color: #f0f0f0; }
    .system { background-color: #fff0f0; }
    .role { font-weight: bold; margin-bottom: 5px; }
    pre { background-color: #f8f8f8; padding: 10px; border-radius: 4px; overflow-x: auto; }
    code { font-family: monospace; }
  </style>
</head>
<body>
  <h1>Groq Conversation</h1>
  <p>Date: ${new Date().toLocaleString()}</p>
  <p>Model: ${document.querySelector('.groq-model-select').value}</p>
  <div class="conversation">
    ${conversationData.map(msg => `
    <div class="message ${msg.role.toLowerCase()}">
      <div class="role">${msg.role}:</div>
      <div class="content">${msg.content.replace(/```([a-z]*)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
                                       .replace(/`([^`]+)`/g, '<code>$1</code>')
                                       .replace(/\n/g, '<br>')}</div>
    </div>
    `).join('')}
  </div>
</body>
</html>`;
        filename += '.html';
        break;
    }
    
    // Create download link
    const blob = new Blob([content], { type: format === 'html' ? 'text/html' : 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification(`Conversation exported as ${format.toUpperCase()}`, 'success');
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
      if (e.target.classList.contains('groq-close-btn') || 
          e.target.classList.contains('groq-maximize-btn') || 
          e.target.classList.contains('groq-minimize-btn') ||
          e.target.closest('.groq-conversation-controls')) {
        return;
      }
      
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