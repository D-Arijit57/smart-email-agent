
# Smart Email Productivity Agent (OceanAI)

An intelligent, prompt-driven email client capable of processing an inbox, categorizing emails, extracting action items, and drafting replies using the Google Gemini API.

![React](https://img.shields.io/badge/React-18-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Gemini API](https://img.shields.io/badge/Google%20Gemini-AI-orange?logo=google)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-cyan?logo=tailwindcss)

## 🚀 Key Features

*   **Smart Ingestion Pipeline**: Analyzes emails to categorize them (Important, To-Do, Spam, etc.) and extract specific tasks/deadlines.
    *   **Optimization**: Achieved an **85% reduction** in processing time by implementing a hybrid architecture (Local Heuristics + Vectorized API Batching).
*   **Agent Brain**: Fully customizable prompt configuration panel. You control the AI's logic for categorization, tone, and extraction rules.
*   **Inbox Assistant**: A global chat agent ("RAG-lite") that can answer questions about your entire inbox (e.g., "What are the deadlines this week?", "Summarize emails from Alice").
*   **Drafting Agent**: Context-aware reply generation with "Persona" settings.
*   **Theme Support**: Built-in Light and Dark modes.

## 🛠️ Prerequisites

*   **Node.js** (v18 or higher)
*   **Google Gemini API Key**: Get one for free at [Google AI Studio](https://aistudio.google.com/).

## 📦 Installation & Setup

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/email-agent.git
    cd email-agent
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```
    *This project uses `lucide-react` for icons and `@google/genai` for the AI SDK.*

3.  **Configure Environment Variables**
    Create a `.env` file in the root directory:
    ```env
    VITE_API_KEY=your_gemini_api_key_here
    ```
    *(Note: If you are using standard Vite, ensure your service code uses `import.meta.env.VITE_API_KEY`)*

4.  **Run the Application**
    ```bash
    npm run dev
    ```
    Open `http://localhost:5173` in your browser.

## 📖 Usage Guide

### 1. Ingesting Emails
*   Click the **"Smart Ingest & Process"** button in the inbox sidebar.
*   **Phase 1 (Pre-Triage)**: Instantly filters Spam and Newsletters using local heuristic rules.
*   **Phase 2 (Advanced AI)**: Batches complex emails and sends them to Gemini 2.5 Flash for Semantic Analysis (Tone, Department, Intent).
*   *Performance*: Processes 10-20 emails in under 10 seconds.

### 2. The "Agent Brain"
*   Navigate to **Settings > Agent Brain**.
*   Here you can rewrite the instructions that guide the AI.
*   *Example*: Change the "Auto-Reply" prompt to "Reply like a pirate" and watch the Draft generator adapt immediately.

### 3. Drafting & Sending
*   Select an email and click **Draft Reply**.
*   Use **"Refine Draft with AI"** to tweak the output (e.g., "Make it more professional").
*   Click **Send** to move the email to the Sent folder (mock action).

### 4. Inbox Assistant
*   Click **Inbox Assistant** in the sidebar.
*   Ask complex queries like:
    *   "Show me all emails from HR."
    *   "Do I have any missed deadlines?"
    *   "Summarize the project roadmap thread."

## 🧩 Architecture Notes

The application uses a **Prompt-Driven Architecture**:
1.  **State**: Emails are stored in local React state (simulating a DB).
2.  **Logic**: `geminiService.ts` handles the interface with Google's GenAI SDK.
3.  **Optimization**: 
    *   **Heuristics**: `O(1)` instant filtering for obvious categories.
    *   **Batching**: Grouping emails into single prompts reduces HTTP overhead and token costs.
    *   **Chain-of-Thought**: The model generates a `reasoning` field before categorizing to ensure high precision.

## ⚠️ Troubleshooting

*   **Quota Exceeded (429 Error)**: The app includes auto-pause logic. If you hit the free tier limit, wait ~1 minute and try again.
*   **Vite/Process Error**: If you see `process is not defined`, update `services/geminiService.ts` to use `import.meta.env.VITE_API_KEY` instead of `process.env.API_KEY`.

## 📄 License

MIT License. Free to use for educational and productivity purposes.
