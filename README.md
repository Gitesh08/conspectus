# Conspectus

> A powerful Chrome extension that leverages built-in AI to convert descriptions into beautiful diagrams directly in your browser!

## ✨ Features

- 🤖 Uses Chrome's built-in AI to understand diagram requirements
- 📊 Generates various diagram types:
  - Flowcharts
  - Sequence diagrams
  - Class diagrams
  - State diagrams
  - Entity Relationship diagrams
- 🎯 Simple, intuitive interface
- ⚡ Real-time diagram generation
- 🎨 Clean, modern design
- 📱 Responsive side panel interface


## ⚠️ **Before You Begin**  

Make sure you’re fully set up with Chrome’s AI capabilities by reviewing our quick [Setup Guide](https://docs.google.com/document/d/1VG8HIyz361zGduWgNG7R_R8Xkv0OOJ8b5C9QKeCjU0c/edit?tab=t.0#heading=h.witohboigk0o).


## 🚀 Installation

### Local Development Installation

1. Clone this repository:

```bash
git clone https://github.com/Gitesh08/conspectus.git
```

2. Open Chrome and navigate to:

```bash
chrome://extensions/
```

3. Enable "Developer mode" in the top right corner.

4. Click "Load unpacked" and select the extension directory.

## 🛠️ Project Structure

```bash
mermaid-diagram-generator/
├── manifest.json
├── background.js
├── images/
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
├── lib/
│   └── mermaid.min.js
└── sidepanel/
    ├── index.html
    ├── styles.css
    └── script.js
```

## 💡 Usage

1. Click the extension icon in your Chrome toolbar
2. The side panel will open with the diagram generator interface
3. Type your diagram description in natural language
   - Example: "Create a flowchart showing user registration process"
   - Example: "Make a sequence diagram for checkout flow"
4. Click "Generate Diagram"
5. View your generated diagram in the panel
6. Use the reset button to start over

## 🌟 Example Prompts

```bash
Create a flowchart for user authentication with login and signup options

Generate a sequence diagram showing how a payment processor handles transactions

Make a state diagram for a traffic light system

Draw an ER diagram for a basic e-commerce database
```

## ⚙️ Technical Details

- Built with vanilla JavaScript
- Uses Chrome's built-in AI API
- Integrates Mermaid.js for diagram rendering
- Follows Chrome Extension Manifest V3 guidelines
- CSP-compliant implementation


## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

## 👏 Acknowledgments

- [Mermaid.js](https://mermaid-js.github.io/) for diagram rendering
- Chrome team for the built-in AI API

---

⭐ If you found this project helpful, please consider giving it a star!

Made with ❤️ by [Gitesh](https://github.com/Gitesh08)
