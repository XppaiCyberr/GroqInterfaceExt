document.addEventListener('DOMContentLoaded', function() {
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
    
    // Create panel content
    panelContainer.innerHTML = `
      <div class="groq-panel">
        <div class="groq-header">
          <div class="groq-title">GROQ API INTERFACE</div>
          <div class="groq-close-btn">&times;</div>
        </div>
        <div class="groq-tabs">
          <div class="groq-tab active" data-tab="chat">Chat</div>
          <div class="groq-tab" data-tab="settings">Settings</div>
        </div>
        <div class="groq-content">
          <div class="groq-tab-content active" id="chat-content">
            <div class="groq-chat-container">
              <div class="groq-chat-messages" id="groq-messages"></div>
              <div class="groq-input-container">
                <select class="groq-model-select">
                  <option value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile</option>
                  <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant</option>
                  <option value="mixtral-8x7b-32768">Mixtral 8x7B 32K</option>
                  <option value="gemma-7b-it">Gemma 7B IT</option>
                </select>
                <textarea class="groq-chat-input" placeholder="Enter your message..."></textarea>
                <button class="groq-send-btn">Send</button>
              </div>
            </div>
          </div>
          <div class="groq-tab-content" id="settings-content">
            <div class="groq-settings-container">
              <div class="groq-setting">
                <label for="groq-api-key">API Key</label>
                <input type="password" id="groq-api-key" placeholder="Enter your Groq API key">
                <button class="groq-save-key-btn">Save Key</button>
              </div>
              <div class="groq-setting">
                <label for="groq-temperature">Temperature</label>
                <input type="range" id="groq-temperature" min="0" max="1" step="0.1" value="0.7">
                <span class="groq-temp-value">0.7</span>
              </div>
              <div class="groq-setting">
                <label for="groq-max-tokens">Max Tokens</label>
                <input type="number" id="groq-max-tokens" min="1" max="4096" value="1024">
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(panelContainer);
  
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
  
    // Load API key from storage
    chrome.storage.sync.get(['groqApiKey'], function(result) {
      if (result.groqApiKey) {
        document.getElementById('groq-api-key').value = result.groqApiKey;
      }
    });
  
    // Save API key to storage
    const saveKeyBtn = document.querySelector('.groq-save-key-btn');
    saveKeyBtn.addEventListener('click', function() {
      const apiKey = document.getElementById('groq-api-key').value;
      chrome.storage.sync.set({groqApiKey: apiKey}, function() {
        alert('API key saved!');
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
  
      // Add user message to chat
      addMessage('user', userMessage);
      chatInput.value = '';
  
      // Prepare the messages array
      const messages = Array.from(document.querySelectorAll('.groq-message')).map(msg => {
        const role = msg.classList.contains('user-message') ? 'user' : 'assistant';
        return {
          role: role,
          content: msg.querySelector('.groq-message-text').textContent
        };
      });
  
      // Add thinking message
      const thinkingId = Date.now();
      addMessage('assistant', '<div class="groq-thinking">Thinking<span class="dot-1">.</span><span class="dot-2">.</span><span class="dot-3">.</span></div>', thinkingId);
  
      // Call the Groq API
      const model = modelSelect.value;
      const temperature = parseFloat(document.getElementById('groq-temperature').value);
      const maxTokens = parseInt(document.getElementById('groq-max-tokens').value);
  
      callGroqAPI(apiKey, messages, model, temperature, maxTokens, thinkingId);
    }
  
    function addMessage(role, content, id = null) {
      const messageDiv = document.createElement('div');
      messageDiv.className = `groq-message ${role}-message`;
      if (id) messageDiv.id = `msg-${id}`;
      
      const avatar = role === 'user' ? '👤' : '🤖';
      
      messageDiv.innerHTML = `
        <div class="groq-message-avatar">${avatar}</div>
        <div class="groq-message-text">${content}</div>
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
        const response = await fetch(url, requestOptions);
        
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
        const responseMsg = addMessage('assistant', '');
        const responseMsgText = responseMsg.querySelector('.groq-message-text');
        
        // Function to process stream
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
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
                
                if (content) {
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
        addMessage('system', `Error: ${error.message}`);
      }
    }
  
    function formatMessage(text) {
      // Convert markdown-style code blocks to HTML
      let formatted = text
        .replace(/```([a-z]*)\n([\s\S]*?)```/g, '<pre><code class="language-$1">$2</code></pre>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        // Convert line breaks to <br>
        .replace(/\n/g, '<br>');
      
      return formatted;
    }
  }