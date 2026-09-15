# AgreeWise

AgreeWise is a browser extension that helps users quickly review privacy policies and terms of service before accepting them. It scans the current page or uploaded document, extracts readable policy text, and identifies the three highest-impact issues in a clear, user-friendly summary.

## Problem Statement

Most users accept policies without reading them, even when the terms carry serious privacy, data-sharing, or legal implications. AgreeWise makes this review fast and understandable by converting long legal text into a concise risk summary.

## Key Features

- Scan the active browser page for policy text
- Upload PDF, TXT, or MD documents for review
- Extract and analyze policy content
- Highlight the top three risk clauses
- Save recent audit history locally
- Review previous policy summaries in one place
- Built as a Chrome/Edge-compatible browser extension

## Tech Stack

- React + Vite
- JavaScript
- PDF text extraction logic
- Groq API for policy analysis
- Browser extension APIs
- Local browser storage for history

## Project Architecture

The application is structured as a lightweight browser extension popup with the following core areas:

- src/component/Home.jsx — primary UI and policy audit flow
- src/utils/audit.js — Groq audit request and response parsing
- src/utils/policy.js — page and document text extraction logic
- src/utils/history.js — local saved history management
- public/manifest.json — browser extension manifest
- build/ — production build output used for loading the extension

## How It Works

1. The user opens the extension popup.
2. They either scan the active page or upload a document.
3. AgreeWise extracts readable text from the source.
4. The text is sent to the configured AI model for policy risk analysis.
5. The system returns the three most important clauses and explains why they matter.

## Setup Instructions

### 1. Clone the repository

```bash
git clone <your-github-repo-link>
cd Agreewise
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a .env file in the project root using the sample values below:

```env
VITE_REACT_APP_GROQ_API_KEY=
VITE_REACT_APP_GROQ_MODEL=openai/gpt-oss-120b
VITE_REACT_APP_GROQ_PROMPT="You are a policy auditor..."
```

If you are using a direct API key, also add:

```env
VITE_REACT_APP_GROQ_API_KEY=your_groq_api_key_here
```

> Important: do not commit your real API key to GitHub. Keep it local in .env.

### 4. Run the app locally

```bash
npm run dev
```

### 5. Build for production

```bash
npm run build
```

## Browser Extension Demo

To test the extension in Chrome or Edge:

1. Open Chrome and navigate to chrome://extensions
2. Enable Developer mode
3. Click Load unpacked
4. Select the build folder in this project
5. Open the extension and scan a policy page or upload a document

## Demo and Submission Notes

- This project is designed as a local browser extension demo.
- No public deployment URL is currently required for submission.

## Team / Project Information

- Project Name: AgreeWise
- Category: Policy review / privacy awareness / browser extension
- Submission Type: GitHub repository

## Presentation

The project presentation is available here:

- 

## License

This project is shared for hackathon evaluation and educational use.
