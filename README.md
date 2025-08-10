# 📊 FindocGPT — Fast, Actionable Financial Insight

## 📌 Project Description
**FindocGPT** is an **agentic AI platform** that ingests raw financial statements (PDF, CSV, Excel), extracts key metrics, trends, and risk signals, then produces **concise summaries and investment strategies**.

It combines:
- **Autonomous summarization agent** for ratios, trends, and risk detection
- **Interactive chatbot** that answers follow-up questions using extracted data
- **Auto-generated visuals** (KPI cards, trend charts, waterfall views) for instant clarity

**Who Benefits:**
- **Investors** — Evidence-backed trade ideas  
- **Analysts** — Faster coverage & insights  
- **Students & Learners** — Finance explained with visuals in plain English  

---

## 🏗 ASCII Architecture Diagram
      ┌──────────────────────────┐
      │   Frontend (React)       │
      │  Next.js + TailwindCSS   │
      │  shadcn/ui + Jotai       │
      │  Chart.js / D3.js        │
      └───────────▲──────────────┘
                  │ API Calls
                  ▼
      ┌──────────────────────────┐
      │   Backend (FastAPI)      │
      │  LangChain + LangGraph   │
      │  RAG Workflows           │
      │  Gemini LLM              │
      │  Tavily API              │
      │  Redis Caching           │
      │  MongoDB Storage         │
      └───────────▲──────────────┘
                  │
                  ▼
      ┌──────────────────────────┐
      │   Data Sources            │
      │  PDFs / CSVs / Excel      │
      │  Financial APIs           │
      └──────────────────────────┘

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/yourusername/findocgpt.git
cd findocgpt
cd backend
pip install -r requirements.txt
cd frontend
npm install
GEMINI_API_KEY=your_google_gemini_api_key
REDIS_URL=redis://localhost:6379
MONGO_URI=your_mongodb_connection
TAVILY_API_KEY=your_tavily_api_key
```
## 📦 Dependencies

### Runtime dependencies
- `@google/generative-ai` ^0.24.1
- `langragph`
- `@prisma/client` ^6.8.2
- `@tavily/core` ^0.5.2
- `cookie-parser` ^1.4.7
- `cors` ^2.8.5
- `express` ^5.1.0
- `fs` ^0.0.1-security
- `ioredis` ^5.6.1
- `jsonwebtoken` ^9.0.2
- `pdf-parse` ^1.1.1
- `prisma` ^6.8.2
- `typescript` ^5.8.3
- `zod` ^3.25.28

### Development / TypeScript types
- `@types/cookie-parser` ^1.4.8
- `@types/cors` ^2.8.18
- `@types/express` ^5.0.1
- `@types/ioredis` ^5.0.0
- `@types/jsonwebtoken` ^9.0.9
- `@types/pdf-parse` ^1.1.5
- `typescipt` ^1.0.0 *(note: likely a typo, maybe `typescript`)*

