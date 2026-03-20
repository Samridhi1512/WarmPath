# WarmPath MVP

Turn your LinkedIn connections into a ranked referral strategy.

Upload a LinkedIn connections CSV, enter your target role, and get a ranked list of companies with the best contact at each — scored, labeled, and ready for outreach.

---

## 1. Problem

Job seekers are often advised to "network more" and get referrals, but a LinkedIn connections list does not translate into a clear strategy.

- Students and early professionals rely heavily on LinkedIn due to limited access to in-person networking
- Job boards are saturated, and many opportunities (especially startups) are not visible there
- People may have hundreds of connections but lack clarity on:
  - which companies to prioritize
  - which contacts are most relevant
  - how to initiate outreach

WarmPath addresses this gap by turning a static connections list into an actionable plan.

---

## 2. Solution

WarmPath converts your first-degree LinkedIn network into:

- Ranked companies based on relevance to your target role
- A single best contact per company
- Path strength labels:
  - **Warm Path** (strong referral opportunity)
  - **Stretch Path** (moderate opportunity)
  - **Explore** (low signal)
- Outreach-ready messages (AI-assisted or fallback)

---

## 3. What the MVP Does

1. Upload a LinkedIn connections CSV
2. Enter job preferences (target role, location, company type)
3. WarmPath:
   - groups connections by company
   - selects the most relevant contact per company
   - ranks companies using a deterministic scoring model (0–100)
4. Click a company to view:
   - explanation of relevance
   - recommended next action
   - outreach message

---

## 4. Data Source

### 4.1 Current MVP Uses

LinkedIn first-degree connections export (CSV)

### 4.2 Columns Used

- First Name
- Last Name
- URL
- Email Address
- Company
- Position
- Connected On

### 4.3 How This Data Is Accessed

- manually exported from LinkedIn
- no scraping
- no LinkedIn API integration
- no second-degree network access

This ensures transparency, user control, and reproducibility.

---

## 5. How to Try It

### 5.1 Option 1 — Use Demo Data

Use the included `Connections.csv`.

Steps:
1. Upload the file
2. Enter:
   - Target role: `software engineer`
   - Company type: `enterprise`
3. Click **Analyze**

Expected behavior:
- ~23 valid connections, ~3 excluded (missing company)
- ~21 unique companies ranked by relevance
- Warm Path / Stretch Path / Explore labels visible
- Expand any company to see explanation, next action, and outreach draft

### 5.2 Option 2 — Use Your Own LinkedIn Data

1. Go to LinkedIn → Settings → Data Privacy → Download my data → Download larger data archive (This downloads multiple CSVs, one of them is Connections.csv)
2. Request the Connections export
3. Download the CSV
4. Upload it into WarmPath

---

## 6. How It Works

**Pipeline:**

```
CSV → Normalize → Group by Company → Select Best Contact → Rank → Label → Display
```

- Core pipeline is fully deterministic
- LLM is used only on demand for explanations and outreach drafts
- Fallback responses ensure the system works without external dependencies

---

## 7. Architecture

| Layer | Technology |
|-------|-----------|
| Frontend | React + TypeScript (Vite) |
| Backend | FastAPI |
| Data processing | Deterministic pipeline (parsing, normalization, grouping, ranking) |
| LLM | Optional, invoked only on detail expansion |

---

## 8. Project Structure

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

---

## 9. Quick Start

### 9.1 Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API runs at: `http://localhost:8000`

### 9.2 Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at: `http://localhost:5173`

The frontend proxies `/api` requests to the backend.

---

## 10. LLM Details (Optional)

To enable AI-generated explanations and outreach drafts:

```bash
export LLM_API_KEY=your_openai_key
export LLM_MODEL=gpt-4o-mini
```

Without this:
- the app still works
- fallback messaging is used

---

## 11. Limitations (MVP)

- Only first-degree connections
- Requires manual CSV upload
- No real-time job data integration
- No second-degree network analysis
- Limited company-type mapping
- Heuristic-based ranking

---

## 12. Future Direction

WarmPath is designed to evolve into a network intelligence system.

Planned improvements:
- Direct authenticated data import (removing CSV dependency)
- Second-degree connection path discovery
- Startup and hidden opportunity discovery beyond job boards
- Personalized ranking using user feedback and interaction signals
- Outreach tracking and follow-up recommendations
- Enrichment with company hiring signals

---

## 13. Demo Flow

1. Upload CSV
2. Enter target role
3. View ranked companies
4. Expand a company
5. Copy outreach message

---

## 14. Summary

WarmPath helps move from:

> "I have connections"

to:

> "I know exactly who to reach out to, where, and why."

