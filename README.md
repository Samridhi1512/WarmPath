# WarmPath MVP

Turn your LinkedIn connections into ranked referral opportunities.

Upload a LinkedIn connections CSV, enter your target role, and get a ranked list of companies with the best contact at each — scored, labeled, and ready for outreach.

## Quick Start

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API runs at `http://localhost:8000`. Health check: `GET /health`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Opens at `http://localhost:5173`. The Vite dev server proxies `/api` requests to the backend.

### 3. LLM Details (optional)

To enable AI-generated explanations and outreach drafts, set these environment variables before starting the backend:

```bash
export LLM_API_KEY=sk-your-openai-key
export LLM_MODEL=gpt-4o-mini   # optional, defaults to gpt-4o-mini
```

Without these, the app still works — it returns static fallback content when you expand a company card.

## Demo Walkthrough

Using the included `Connections.csv`:

1. Open `http://localhost:5173`
2. Click "Choose File" and select `Connections.csv`
3. Enter target role: `software engineer`
4. Leave location blank, set company type to `enterprise`
5. Click **Analyze**

Expected results:
- ~23 valid connections, ~3 excluded (missing company)
- ~21 unique companies ranked by relevance
- Top results: companies like Amazon Web Services (AWS) with contacts like "Aditi Dandekar, Software Development Engineer" scoring high due to direct keyword match
- Green "Warm Path" badges on strong matches, yellow "Stretch Path" on partial matches, gray "Explore" on weak matches
- Click any company card to expand and see explanation, next action, and outreach draft
- Copy the outreach message with one click

## Project Structure

```
backend/
  main.py              FastAPI entry point + CORS
  api.py               POST /api/analyze + POST /api/details
  models.py            All data model dataclasses
  csv_parser.py        LinkedIn CSV parser (handles preamble)
  normalizer.py        Whitespace trimming, date parsing, exclusion tracking
  title_categorizer.py Keyword-based title → category mapping
  grouper.py           Company name normalization + grouping
  contact_selector.py  Best contact selection per company
  ranker.py            0–100 scoring + sorting
  path_labeler.py      Score → Warm Path / Stretch Path / Explore
  llm_advisor.py       OpenAI integration with fallback
  requirements.txt

frontend/
  src/
    App.tsx            Main app component + state
    api.ts             Axios calls to backend
    components.tsx     All UI components
    types.ts           TypeScript interfaces
    main.tsx           React entry point
  package.json
  vite.config.ts
  tsconfig.json
  index.html

Connections.csv        Sample LinkedIn export for testing
```
