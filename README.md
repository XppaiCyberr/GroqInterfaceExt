# Groq API Chrome Extension

A powerful, feature-rich Chrome extension for interacting with the Groq API directly from any webpage. This extension provides a floating chat interface with advanced features for developers and AI enthusiasts.

![Groq API Extension Screenshot](screenshot.jpg)

## Features

### Core Functionality
- 🚀 **Floating UI**: Access Groq API from any webpage with a floating, resizable interface
- 🧩 **Multi-Model Support**: Switch between Groq's latest models including:
  - Llama 3.3 70B Versatile
  - Llama 3.3 70B SpecDec
  - DeepSeek R1 Distill Llama 70B
  - Mixtral 8x7B
  - and more
- 🖌️ **Custom System Messages**: Set custom instructions for AI behavior
- 🔄 **Real-time Streaming**: Watch AI responses appear in real-time

### New in v2.0
- ⌨️ **Keyboard Shortcuts**: 
  - `Ctrl+Enter` or `Cmd+Enter`: Send message
  - `Alt+G`: Toggle extension panel
  - `Ctrl+1-4`: Switch between tabs
  - `Esc`: Minimize panel
- 💾 **Conversation Management**:
  - Save/load conversations with custom names
  - Auto-save conversations
  - Clear chat history
- 📤 **Export Options**:
  - Export as Text (.txt)
  - Export as Markdown (.md)
  - Export as JSON (.json)
  - Export as HTML (.html)
- 🔍 **Message Reactions**:
  - Star/favorite important messages
  - Copy message text with one click
  - Edit your previous messages
  - Delete individual messages
- 📊 **Advanced Code Formatting**:
  - Syntax highlighting for 20+ programming languages
  - Copy code button for each code block
  - Language detection and formatting
- 🌐 **Context Awareness**:
  - Extract content from current webpage
  - Use selected text as input
  - Include page URL for reference
- 📈 **API Usage Tracking**:
  - Monitor token usage with statistics
  - Usage visualization with charts
  - Per-conversation metrics
  - Export usage data
- 🎨 **Multiple Themes**:
  - Dark (default), Light, Synthwave, and Midnight themes
  - Custom theme option with color pickers
- 📝 **Prompt Templates**:
  - Library of reusable prompt templates
  - Create and save custom templates
  - Variable substitution
  - Quick insert into chat
- ⚙️ **Advanced Parameters**:
  - Quick access to temperature and max tokens
  - Control top_p, frequency_penalty, and presence_penalty
  - Save parameter presets

## Installation

### From Chrome Web Store
1. Visit the [Chrome Web Store page](#) (coming soon)
2. Click "Add to Chrome"

### Manual Installation (Developer Mode)
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top-right corner
4. Click "Load unpacked" and select the extension folder
5. The extension icon will appear in your toolbar

## Usage

1. Click the floating button in the bottom-left corner of any webpage
2. Go to the Settings tab and enter your Groq API key
3. (Optional) Configure a system message to customize AI behavior
4. Return to the Chat tab
5. Select your preferred model
6. Type your message and click Send or press Ctrl+Enter
7. View the AI's response in real-time

## Keyboard Shortcuts

- `Ctrl+Enter` / `Cmd+Enter`: Send message
- `Alt+G`: Toggle extension panel visibility
- `Ctrl+1`: Switch to Chat tab
- `Ctrl+2`: Switch to Settings tab
- `Ctrl+3`: Switch to Usage tab
- `Ctrl+4`: Switch to Templates tab
- `Esc`: Minimize panel

## Themes

The extension includes four built-in themes:

- **Dark**: Default dark theme with blue accents
- **Light**: Light theme for daytime use
- **Synthwave**: Retro-futuristic theme with neon colors
- **Midnight**: Deep blue theme for night use

You can also create a custom theme with your own colors for background, text, and accents.

## Privacy

This extension:
- Stores your API key in Chrome's secure storage
- Only communicates directly with the official Groq API
- Does not collect or share your conversations
- Does not send your API key to any third-party servers

## Requirements

- A Groq API key (sign up at [groq.com](https://groq.com))
- Google Chrome browser or Chromium-based browsers (Edge, Brave, etc.)

## Development

### Project Structure
```
groq-api-extension/
├── manifest.json       # Extension configuration
├── content.js          # Main extension code
├── styles.css          # Extension styling
└── screenshot.jpg
```

### Building from Source
1. Clone the repository
2. Make any desired modifications
3. Load as an unpacked extension in Chrome

## Contributing

Contributions are welcome! Feel free to submit issues or pull requests.

## License

This project is licensed under the Unlicense - see the LICENSE file for details.

## Acknowledgments

- [Groq](https://groq.com) for their powerful API
- [Prism.js](https://prismjs.com/) for syntax highlighting
- [Chart.js](https://www.chartjs.org/) for usage visualization
- [Lucide](https://lucide.dev) for icon inspiration

---

Made with ❤️ for the AI community