# 🤖 SaruX AI — Personal AI Voice Assistant

> A futuristic, intelligent, and modular personal AI voice assistant powered by Google Gemini.

SaruX AI is an advanced personal AI assistant designed to combine **Generative AI, voice interaction, function calling, computer control, browser automation, and document generation** into one unified system.

The project is designed with a modular architecture so that new capabilities can be added without rebuilding the entire application.

---

## ✨ Features

### 🧠 AI Intelligence
- Google Gemini powered conversations
- Context-aware responses
- Markdown and code support
- Intelligent command routing
- Gemini Function Calling
- Modular AI tool system

### 🎙️ Voice Interaction
- Speech-to-Text
- Text-to-Speech
- Hands-free interaction
- "Hey Saru" wake phrase
- Voice response controls
- English and Hindi speech support

### 🛠️ AI Tools

SaruX AI can use controlled tools for tasks such as:

- Get current time
- Get current date
- Calculator
- Open websites
- Web search architecture
- System information
- Battery status
- Volume control
- Application launching

All tools are handled through a centralized Tool Registry.

---

## 🖥️ Computer Control

SaruX AI includes a secure local computer-agent architecture.

Supported operations include:

- Launching approved applications
- Checking system information
- Checking battery status
- Reading system volume
- Setting volume
- Muting/unmuting volume
- Opening URLs

Dangerous operations such as arbitrary shell commands, file deletion, registry modification, and credential access are intentionally restricted.

---

## 🌐 Browser Automation

SaruX AI can control a dedicated Chrome/Chromium browser through the **Chrome DevTools Protocol (CDP)**.

Supported browser operations include:

- Open URL
- Open new tab
- List tabs
- Switch tabs
- Close tabs
- Go back
- Go forward
- Reload page
- Search the web
- Read basic page information

Browser automation is isolated from the user's normal Chrome profile.

---

## 📄 AI Document Generation

SaruX AI is designed to generate structured academic and professional documents.

Supported formats:

- DOCX
- PDF
- PPTX

Possible generated content includes:

- Academic reports
- Research documents
- Project documentation
- Presentations
- Summaries
- Study material

The document generation system uses structured AI output instead of directly writing uncontrolled files.

---

## 🔬 Research Mode

SaruX AI includes an architecture for AI-assisted research.

Research mode can:

1. Understand the research request
2. Search available web sources
3. Collect relevant information
4. Summarize findings
5. Organize information
6. Provide source references
7. Generate a structured report

> SaruX AI does not intentionally fabricate sources. If a real search provider is unavailable, the system should clearly indicate that limitation.

---

# 🏗️ Architecture

```text
                    ┌─────────────────────┐
                    │      SaruX AI       │
                    │    Web Dashboard    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    AI Orchestrator  │
                    │    Gemini / LLM      │
                    └──────────┬──────────┘
                               │
                ┌──────────────┼──────────────┐
                ▼              ▼              ▼
        ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
        │ Voice Layer │ │ Tool System │ │  Browser    │
        │ STT / TTS   │ │ Function    │ │  Agent/CDP  │
        └─────────────┘ │ Calling     │ └─────────────┘
                        └──────┬──────┘
                               │
                    ┌──────────┴──────────┐
                    ▼                     ▼
             ┌─────────────┐       ┌─────────────┐
             │ Local Agent │       │   Document  │
             │ Computer    │       │   Generator │
             │ Control     │       │ DOCX/PDF/   │
             └─────────────┘       │ PPTX        │
                                   └─────────────┘


🧩 Technology Stack
Frontend
React
TypeScript
Vite
Tailwind CSS
Web Speech API
Browser Speech Synthesis
AI
Google Gemini API
Gemini Function Calling
Large Language Models
AI Tool Calling
AI Orchestration
Backend
Python
Local Agent
REST API
Secure Tool Registry
Browser Automation
Chrome / Chromium
Chrome DevTools Protocol
Document Generation
python-docx
ReportLab
python-pptx
Storage
Local Storage
SQLite
Vector Database / future RAG layer
📁 Project Structure
sarux-ai/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── tools/
│   │   ├── types/
│   │   └── App.tsx
│   │
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── agent/
│   ├── tools/
│   ├── browser/
│   ├── documents/
│   ├── services/
│   ├── main.py
│   └── requirements.txt
│
├── generated/
├── docs/
│
├── .env.example
├── .gitignore
├── README.md
└── LICENSE

The actual folder structure may differ depending on the current implementation.

🔐 Security

SaruX AI follows a permission-based tool architecture.

SAFE

Operations that can execute automatically:

get_current_time
get_current_date
calculator
get_system_information
get_battery_status
CONFIRMATION REQUIRED

Operations that can affect the computer or browser:

open_application
set_volume
mute_volume
open_website
close_browser_tab
BLOCKED

The following operations are intentionally restricted:

arbitrary shell commands
PowerShell execution
file deletion
registry modification
credential access
password extraction
cookie extraction
payment actions
unrestricted file uploads
unrestricted downloads

The goal is to make SaruX AI useful while preventing unrestricted AI access to the operating system.

⚙️ Installation
1. Clone the repository
git clone https://github.com/YOUR_USERNAME/sarux-ai.git
cd sarux-ai
2. Install frontend dependencies
cd frontend
npm install
3. Configure Gemini API

Create a .env file:

GEMINI_API_KEY=your_gemini_api_key

Never commit your API key to GitHub.

4. Start frontend
npm run dev

The frontend will normally run at:

http://localhost:5173
5. Start backend

Open another terminal:

cd backend
pip install -r requirements.txt
python main.py
🎙️ Example Voice Commands
"Hey Saru"

"What is the current time?"

"Calculate 25 multiplied by 48"

"Open YouTube"

"Open Chrome"

"What is my battery percentage?"

"Set the volume to 40"

"Search the web for recent developments in RAG"

"Create a PDF report about Artificial Intelligence"

"Create a PowerPoint presentation about Generative AI"
🔄 AI Processing Pipeline
User
  │
  ▼
Wake Word
  │
  ▼
Speech-to-Text
  │
  ▼
Command Understanding
  │
  ▼
Gemini AI
  │
  ├── Normal Response
  │
  └── Tool Call
          │
          ▼
      Tool Registry
          │
          ▼
     Permission Check
          │
      ┌───┴────┐
      ▼        ▼
     Safe   Confirmation
      │        │
      └───┬────┘
          ▼
     Tool Execution
          │
          ▼
     Result to Gemini
          │
          ▼
      Final Response
          │
          ▼
        TTS
          │
          ▼
        User
🚀 Development Roadmap
Phase 1 — AI Foundation
 Gemini integration
 Chat interface
 Markdown responses
 Chat history
Phase 2 — Voice
 Speech-to-Text
 Text-to-Speech
 Voice controls
 Wake phrase prototype
Phase 3 — AI Tools
 Gemini Function Calling
 Tool Registry
 Permission system
 Confirmation system
Phase 4 — Computer Control
 Local computer agent
 Application launching
 System information
 Battery information
 Volume control
Phase 5 — Browser Automation
 Chrome CDP integration
 Browser navigation
 Tab management
 Search
 Page information
Phase 6 — Documents & Research
 DOCX generation
 PDF generation
 PPTX generation
 Research mode
 Source citations
Phase 7 — Advanced Intelligence
 Long-term memory
 RAG
 Vector database
 Personal knowledge base
 Document Q&A
 Persistent conversation memory
Phase 8 — Production
 Offline wake-word detection
 Vosk integration
 Piper TTS
 Advanced security
 Automated testing
 Docker support
 Desktop application
 Production deployment
🎯 Future Vision

SaruX AI aims to become a modular personal AI operating layer combining:

AI
+
Voice
+
Tools
+
Computer Control
+
Browser Automation
+
Documents
+
Research
+
Memory
+
RAG

into one intelligent assistant.

🧠 Why SaruX AI?

Traditional AI chatbots mainly provide text responses.

SaruX AI is designed to combine AI reasoning with controlled actions.

Instead of only answering:

"What is the current time?"

SaruX AI can understand the request, call the appropriate tool, receive the result, and respond through text or voice.

This architecture allows the system to grow from a chatbot into a modular AI assistant.

👨‍💻 Developer
Sarvesh Gadage

B.Tech Computer Science Engineering Student
AI/ML & Generative AI Enthusiast

📌 Project Status

🚧 Active Development

SaruX AI is continuously being developed with new AI capabilities, automation features, and intelligent tools.

⚠️ Disclaimer

SaruX AI is an experimental educational and development project.

Computer and browser control features should be used carefully.

Do not provide AI systems with unnecessary access to sensitive credentials, financial accounts, passwords, or private information.

⭐ Support

If you find SaruX AI interesting, consider giving the repository a ⭐ on GitHub.

📜 License

MIT License


============================================================
.gitignore
============================================================

```gitignore
node_modules/
__pycache__/
*.pyc
.venv/
venv/

.env
.env.local
.env.*.local

dist/
build/
.cache/

generated/
*.pdf
*.docx
*.pptx

*.log

.vscode/
.idea/

.DS_Store
Thumbs.db

tmp/
temp/

.pytest_cache/
.mypy_cache/
============================================================
.env.example
GEMINI_API_KEY=your_gemini_api_key_here

# Optional local backend
BACKEND_HOST=127.0.0.1
BACKEND_PORT=8000

# Optional browser automation
CDP_HOST=127.0.0.1
CDP_PORT=9222
============================================================
GITHUB ABOUT

Description:

Futuristic personal AI voice assistant powered by Gemini with function calling, computer control, browser automation, research, and document generation.

Topics:

ai, artificial-intelligence, generative-ai, gemini, google-gemini, voice-assistant, ai-agent, llm, function-calling, react, typescript, python, browser-automation, rag

============================================================
FIRST GIT COMMANDS
git init
git add .
git commit -m "Initial release of SaruX AI"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/sarux-ai.git
git push -u origin main
============================================================
RELEASE

Version:

v0.1.0

Release title:

SaruX AI v0.1.0 — Initial Release

Release description:

Initial release of SaruX AI, a modular personal AI voice assistant powered by Google Gemini with voice interaction, function calling, computer control, browser automation, and an extensible AI tool architecture.

============================================================
