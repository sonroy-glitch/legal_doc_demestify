# ⚖️ LegiDocGPT — Clear, Accessible Legal Insight  

## 📌 Project Description  
**LegiDocGPT** is an **agentic AI platform** that ingests complex legal documents (PDF, Word, scanned text), extracts key clauses, risks, and obligations, then produces **plain-language summaries and actionable guidance**.  

It combines:  
- **Autonomous clause analyzer** for obligations, penalties, and hidden risks  
- **Interactive chatbot** that answers follow-up questions in simple terms  
- **Auto-generated visuals** (rights vs obligations, risk maps, timelines) for instant clarity  

**Who Benefits:**  
- **Everyday Citizens** — Understand rental, loan, or service agreements before signing  
- **Small Businesses** — Review vendor/client contracts faster and smarter  
- **Students & Learners** — Legal concepts explained without jargon  

---

## 🏗 ASCII Architecture Diagram  
  ┌──────────────────────────┐
  │   Frontend (React)       │
  │  Next.js + TailwindCSS   │
  │  shadcn/ui + Jotai       │
  │  Chart.js / Mermaid.js   │
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
  │  PDFs / Word / Scanned    │
  │  OCR for image-based text │
  │  Legal Precedent APIs     │
  └──────────────────────────┘

---

## ⚙️ Setup Instructions  

### 1️⃣ Clone the Repository  
```bash
git clone https://github.com/yourusername/legidocgpt.git
cd legidocgpt
cd backend
pip install -r requirements.txt
cd frontend
npm install

GEMINI_API_KEY=your_google_gemini_api_key
REDIS_URL=redis://localhost:6379
MONGO_URI=your_mongodb_connection
TAVILY_API_KEY=your_tavily_api_key
