# Sahi Vibhag AI 🇮🇳
### Bas Boliye... AI Pahunchaye Sahi Vibhag Tak.
**IIT Jammu AI Hackathon Project**
*Theme: AI for Bharat: Governance & Social Impact*

---

## 🌟 Overview
**Sahi Vibhag AI** is a production-grade, multilingual civic grievance routing assistant. It solves the key governance challenges of language barriers and routing delays by converting natural voice or text complaints from citizens into structured, government-ready reports and instantly routing them to the correct department with high precision.

It is built as a premium SaaS product with a clean "Apple meets Government" design system using Saffron (Orange), Sapphire (Blue), and pristine White branding.

---

## 🛠️ Tech Stack
* **Frontend**: Next.js 15 (App Router, Turbopack, TypeScript)
* **Styling**: Tailwind CSS v4, Framer Motion (micro-animations)
* **Backend**: Next.js Serverless API Routes (Node.js)
* **Database**: Neon Serverless PostgreSQL (dynamic schema)
* **ORM**: Prisma Client v6
* **AI Models**: OpenAI GPT-4o (Primary Smart Engine) with Google Gemini 3.6 Flash Fallback & Rule-based keyword engine
* **Future-Ready Integrations**: Bhashini Speech-to-Speech API, OpenStreetMap route planning, and Retrieval-Augmented Generation (RAG) knowledge base.

---

## 🚀 Key Features

### 1. Multilingual Audio Grievance Capture ("Bas Boliye...")
Citizens can speak directly into their microphone in their native language (e.g. Hindi, Hinglish, English). The browser's native Web Speech API transcribes the spoken complaint in real-time.

### 2. OpenAI GPT-4o Auto-Routing (with Gemini Fallback)
OpenAI `gpt-4o` (or Gemini fallback) analyzes the grievance to:
* Determine the correct department (e.g. PWD, Sanitation, Electricity Board).
* Assign a priority score (`LOW`, `MEDIUM`, `HIGH`, `URGENT`) based on public safety hazards.
* Extract landmarks/address mentions.
* Generate a formal, structured, English summary suitable for government registries.
* Translate regional dialects into standard Hindi for permanent government records.

### 3. Missing Information Detection
AI highlights missing parameters (like house numbers or specific landmark references) and presents them to the citizen, urging them to supply details before submission.

### 4. Interactive Verification Checklists
Automatically generates an evidence checklist (e.g., "Photograph of the site", "Electricity Bill copy") tailored to the complaint category, helping citizens submit actionable proof.

### 5. Officer Dashboard & Panel
An administrative console with cards summarizing key KPIs (Pending Review, Resolution Rate, Urgent Cases) and animated analytics charts. Select any complaint in the queue to open the **AI Recommendation Panel** to update status (Pending -> In Progress -> Resolved), re-route to another department, and log official inspection notes.

### 6. Interactive OpenStreetMap Simulator
Draws an animated routing path between the coordinates of the grievance site and the department's headquarters on a futuristic GPS HUD.

---

## 📁 Project Architecture
```text
├── prisma/
│   └── schema.prisma        # Prisma Database Schema (Postgres representation)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── ai/          # Endpoint invoking AI grievance parser
│   │   │   └── complaints/  # Grievance CRUD & tracking PATCH endpoints
│   │   ├── citizen/         # Citizen filing portal (Speech + AI analysis)
│   │   ├── complaint/[id]/  # Citizen tracking timeline & OpenStreetMap path
│   │   ├── officer/         # Admin console, stats cards, routing queue
│   │   ├── globals.css      # Design system configurations (Tailwind v4)
│   │   ├── layout.tsx       # Root layout containing Navbar & Footer
│   │   └── page.tsx         # Modern SaaS govtech landing page
│   ├── components/
│   │   ├── Navbar.tsx       # Header with live Neon DB connection indicator
│   │   └── Footer.tsx       # Hackathon credentials & theme info
│   └── lib/
│       ├── db.ts            # Dynamic Database router (Neon PostgreSQL <-> Mock DB)
│       └── gemini.ts        # AI Router (OpenAI gpt-4o -> Gemini Fallback -> Keyword Fallback)
```

---

## 🔧 Setup & Installation

### 1. Clone the repository and install dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
```env
# OpenAI API Key (Primary Smart Engine)
OPENAI_API_KEY="sk-proj-..."

# Gemini Developer API Key (Fallback AI Engine)
GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere"
```

### 3. Setup Database Schema
Once `DATABASE_URL` is set, push the Prisma schema to Neon:
```bash
npx prisma db push
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## 🛡️ Smart Fallback Engines (Zero-Config Demo Mode)
For hackathon evaluation and local testing:
1. **Mock Database Fallback**: If no `DATABASE_URL` is configured, Sahi Vibhag AI automatically switches to a local file-based database store in the system's temporary folder. Submitting, updating, and viewing complaints works 100% out-of-the-box.
2. **AI Keyword Router Fallback**: If no `GEMINI_API_KEY` is set, the portal utilizes a keyword-matching heuristic engine to simulate AI analysis (extracting departments, assigning priorities, formatting checklists, and mock translating) ensuring the demo is always responsive.
