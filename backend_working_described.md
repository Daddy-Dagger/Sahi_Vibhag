# Sahi Vibhag - Backend Architecture & Database Documentation

This document describes how the backend of the **Sahi Vibhag** (AI-Powered Multilingual Civic Grievance Portal) operates. It details the database configuration, AI pipelines, REST API design, and environment keys used in this application.

---

## 1. High-Level Technology Stack

- **Core Framework**: [Next.js](https://nextjs.org/) (version 16.2.11) with App Router API route handlers.
- **ORM & Database Client**: [Prisma Client](https://www.prisma.io/) (version 6.19.3) mapping database operations.
- **AI Processing**: [Google Generative AI SDK](https://www.npmjs.com/package/@google/generative-ai) (version 0.24.1) using the `gemini-2.5-flash` model.
- **Database Engine**: [PostgreSQL](https://www.postgresql.org/) (designed for cloud-hosted environments like Neon, with a custom JSON fallback for zero-dependency local runs).

---

## 2. Database Design & Fallback Client

The application uses Prisma to model and interact with the database.

### Database Schema
The schema is defined in [schema.prisma](file:///Users/aryan/Documents/Sahi_Vibhag/prisma/schema.prisma) under a single model: `Complaint`.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `String` (UUID) | Primary Key. |
| `title` | `String` | Brief English summary of the issue. |
| `description` | `String` | Raw description entered by the citizen. |
| `translatedDescription` | `String?` | Hindi translation if the complaint was in a regional language. |
| `department` | `String` | Categorized department (e.g., PWD, Municipal, PDD, Jal Shakti). |
| `status` | `String` | Current status (`PENDING`, `IN_PROGRESS`, `RESOLVED`, `REJECTED`). |
| `priority` | `String` | Priority level (`LOW`, `MEDIUM`, `HIGH`, `URGENT`). |
| `category` | `String` | Specific subcategory (e.g., "Road Potholes", "Sewerage Overflows"). |
| `summary` | `String` | Clean, formal English summary generated for government officials. |
| `missingInformation` | `Json` | Array of strings outlining missing critical details. |
| `evidenceChecklist` | `Json` | List of items citizen needs to submit (e.g. photo, geo-tag). |
| `citizenName` | `String?` | Optional submitter name. |
| `citizenPhone` | `String?` | Optional submitter phone. |
| `location` | `String?` | Landmark, street, or city extracted from description. |
| `confidence` | `Float` | AI routing/classification confidence score. |
| `audioUrl` | `String?` | URL of voice-complaint if submitted. |
| `officerNotes` | `String?` | Internal notes left by resolving officers. |
| `timeline` | `Json` | Chronological logs of changes (`{ status, timestamp, note }[]`). |
| `createdAt` | `DateTime` | Automatic timestamp of submission. |
| `updatedAt` | `DateTime` | Automatic update timestamp. |

### Smart Database Routing
Implemented in [db.ts](file:///Users/aryan/Documents/Sahi_Vibhag/src/lib/db.ts), the database connection adapts dynamically depending on whether a remote database exists:
1. **Real Database Mode**: Active if a valid `DATABASE_URL` is detected in `.env`. It instantiates `new PrismaClient()` to connect to the PostgreSQL database.
2. **Local Mock Database Mode**: Active if `DATABASE_URL` is empty, missing, or points to the default Prisma local development address.
   - It stores records locally in a JSON file at `os.tmpdir()/sahi_vibhag_mock_db.json`.
   - It exposes a mock client mimicking Prisma Client's core CRUD methods (`findMany`, `findUnique`, `create`, `update`, `delete`, `count`).
   - Automatically seeds three realistic complaints upon first-time start for dashboard visualization.

---

## 3. AI Pipeline & Regional Translation

The core intelligence of Sahi Vibhag is managed in [gemini.ts](file:///Users/aryan/Documents/Sahi_Vibhag/src/lib/gemini.ts).

### Multi-lingual Complaint Parsing
When a citizen enters a complaint, it is passed to the `analyzeComplaint(text)` method:
1. **Real Gemini Mode**: If a `GEMINI_API_KEY` is present in `.env`, the system starts the `GoogleGenerativeAI` client:
   - Target model is `gemini-2.5-flash`.
   - The query leverages a strict structured prompt enforcing `responseMimeType: "application/json"`.
   - It extracts structured data (department, priority, location), summarizes it professionally, and translates any regional language input (Hinglish, Hindi, Urdu, Dogri, etc.) into **formal Hindi** for official records, keeping English text as-is.
2. **Fallback Analysis Mode**: If `GEMINI_API_KEY` is empty, not set, or equals `"MOCK_KEY"`, the system falls back to a deterministic, keyword-matching algorithm:
   - Looks for keywords (like `pothole`, `garbage`, `light`, `water`, `traffic`) to route the complaint to the appropriate department.
   - Creates a mock summary and checklist, and simulates regional translation by detecting Hindi keywords.

---

## 4. API Endpoints

The API is structured using Next.js App Router route handlers.

### A. AI Analysis Endpoint
- **Path**: [`/api/ai`](file:///Users/aryan/Documents/Sahi_Vibhag/src/app/api/ai/route.ts)
- **Method**: `POST`
- **Payload**: `{ text: string }`
- **Behavior**: Runs the AI pipeline on the raw complaint text and returns the JSON analysis containing suggested categories, departments, and translations without saving it to the database yet.

### B. Complaints Management
- **Path**: [`/api/complaints`](file:///Users/aryan/Documents/Sahi_Vibhag/src/app/api/complaints/route.ts)
- **Method**: `GET`
  - Retrieves all complaints sorted by creation date (`desc`). Ensures all JSON stringified fields from the database are correctly parsed back into arrays/objects before returning.
- **Method**: `POST`
  - Validates required parameters, initializes the history timeline with a `SUBMITTED` entry, stringifies JSON arrays, and persists the new complaint record in the active database.

### C. Single Complaint Operations & Re-routing
- **Path**: [`/api/complaints/[id]`](file:///Users/aryan/Documents/Sahi_Vibhag/src/app/api/complaints/[id]/route.ts)
- **Method**: `GET`
  - Retrieves a single complaint by its ID, returning parsed JSON fields.
- **Method**: `PATCH`
  - Updates mutable attributes: `status`, `department`, `priority`, `officerNotes`, or `evidenceChecklist`.
  - Automatically appends a change record (e.g., status changes, re-routing departments, updating officer notes) to the complaint's history timeline.
- **Method**: `DELETE`
  - Deletes the complaint matching the ID from the database.

---

## 5. Configuration & Environment Keys

The backend is configured using standard environment variables defined in the `.env` file at the root directory:

1. **`DATABASE_URL`**
   - **Description**: The connection string for the PostgreSQL database.
   - **Current Value**: Set to a local Prisma Postgres endpoint `prisma+postgres://localhost:51213/?api_key=...`.
   - **Behavior**: When set to this local address, the backend automatically flags it as a mock database environment and routes calls to the file system database, ensuring the app starts up out-of-the-box. Replace with a real PostgreSQL connection string (such as from Neon DB) to run in production.

2. **`GEMINI_API_KEY`**
   - **Description**: API authorization key for accessing the Gemini model.
   - **Current Value**: *(Not present in default `.env`, defaults to empty/missing)*
   - **Behavior**: If missing or set to `"MOCK_KEY"`, the system routes queries to the offline rule-based keyword classifier. Adding a valid Gemini API key enables full NLP-based routing, auto-translation of vernacular languages, and context extraction.
