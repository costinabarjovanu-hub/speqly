# Speqly

AI-powered tool that turns UI screenshots and requirement documents into structured, Jira-ready user stories and acceptance criteria.

## The Problem

Business Analysts and Product Owners spend a significant amount of time manually translating mockups, design screenshots, and requirement documents into well-structured tickets. Speqly automates the first draft of that process — extracting features, generating user stories with acceptance criteria, and flagging open questions for stakeholders — so the BA/PM can focus on refinement and review instead of starting from a blank page.

## Features

- **Dual input support** — upload either a UI mockup/screenshot or a requirements document (text, PDF, or Excel)
- **AI-driven extraction** — automatically identifies features and requirements from the uploaded source
- **Format selection** — choose your preferred acceptance criteria format before stories are generated
- **Structured output** — user stories, acceptance criteria, story point estimates, and clarification questions
- **Jira-ready preview** — review and approve generated tickets before export
- **Source traceability** — each extracted item references where it came from in the original input

## Tech Stack

- **Frontend:** Vite + JavaScript
- **Backend:** Node.js + Express
- **AI:** Anthropic Claude API
- **File parsing:** Support for documents and spreadsheet (.xlsx/.xls/.csv) inputs

## Screenshots

> 📸 *Screenshots coming soon — to be added from the live local flow.*

| Step | Screenshot |
|------|------------|
| 1. Input selection (Mockup / Document) | <img width="1507" height="1344" alt="01-configure-mockup-input" src="https://github.com/user-attachments/assets/b5d7ccd2-5685-4e09-b31b-18b3929830b1" />
 |
| 2. Selecting document/screenshot | <img width="1124" height="654" alt="02-configure-document-input" src="https://github.com/user-attachments/assets/df043f58-ca96-4fd9-b910-96c91f38ec9e" />

| 3. Choose AC format | <img width="1047" height="362" alt="03-configure-ac-format-options" src="https://github.com/user-attachments/assets/6f2f10fd-d023-4c7f-a8d5-1a4e4cb33f1a" />
 |
| 4. Review generated stories 
| 5. Jira export preview 
| 6. Push if you want them in Jira


## Getting Started

### Prerequisites

- Node.js installed
- An Anthropic API key ([console.anthropic.com](https://console.anthropic.com))

### Installation

```bash
git clone https://github.com/costinabarjovanu-hub/speqly.git
cd speqly
npm install
```

### Configuration

Create a `.env` file in the root directory based on `.env.example`:

```
ANTHROPIC_API_KEY=your_api_key_here
```

### Running locally

```bash
npm run dev
```

The app will be available at `http://localhost:5173`, with the backend running on `http://localhost:3001`.

## Status

This is a working prototype, actively evolving. Current focus areas:
- Improving Excel input handling
- Refining the dual mockup/document extraction prompts
- Exploring deployment options

## License

No license specified yet — all rights reserved by default.
