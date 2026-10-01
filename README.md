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
