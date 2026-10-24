# DocuMind AI — AI-Powered Document Intelligence Platform

**Developer Assessment Task 2 — Complete Phases 1, 2, 3, 4 & 5**  
**Deadline:** Monday, 26 October 2026, 6:00 PM IST  
**Status:** All Phases Completed and Verified  

---

## Executive Summary

DocuMind AI is an enterprise document intelligence and semantic extraction platform designed to ingest unstructured documents (PDFs and TXT files), perform high-fidelity text extraction using PyMuPDF, execute structured inference via Groq Cloud LLM accelerators (`openai/gpt-oss-20b`), and evaluate document structural integrity using deterministic scoring algorithms.

---

## Technology Stack

- **Frontend:** React 18, Vite 5, JavaScript (ES6+), Tailwind CSS 3, Lucide Icons, Recharts 2
- **Backend:** Python 3.11+, FastAPI, Uvicorn, Pydantic v2
- **PDF Extraction Engine:** PyMuPDF (`fitz` 1.25.5)
- **Inference Engine:** Groq Cloud Python SDK (`groq` 1.7.0) with model `openai/gpt-oss-20b`
- **Storage:** Anonymous-session-scoped documents, held temporarily in the backend's in-memory fallback on Render
- **Testing:** Pytest, HTTPX TestClient
- **Deployment:** Vercel (Frontend SPA) + Render (Backend Web Service)
- **No Docker Required**

---

## Project Structure

```text
Document intelligence/
├── backend/
│   ├── app/
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── document.py        # Pydantic models: StructuredResume, CompletenessScore, AnalysisResult
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── documents.py       # Upload, list, get, delete, analyze & sample routes
│   │   │   ├── health.py          # GET /api/health cluster status probe
│   │   │   └── session.py         # POST /api/session anonymous bearer session
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── extractor.py       # PyMuPDF PDF parser & UTF-8 TXT decoder
│   │   │   ├── groq_service.py    # Official Groq SDK client, prompt design & JSON validation
│   │   │   └── scoring.py         # Deterministic completeness scoring (5 required sections)
│   │   ├── __init__.py
│   │   ├── config.py              # Settings loader using python-dotenv
│   │   ├── sessions.py            # Signed anonymous session validation
│   │   ├── database.py            # PyMongo client manager, index setup & resilient fallback store
│   │   ├── errors.py              # Centralized exception handlers (AppException, Starlette HTTP)
│   │   └── main.py                # FastAPI app factory, CORS middleware & lifespan manager
│   ├── tests/
│   │   ├── __init__.py
│   │   ├── test_api_documents.py  # Tests for upload, CRUD, empty files, corrupted files, samples
│   │   ├── test_extractor.py      # PyMuPDF and UTF-8 extraction tests
│   │   ├── test_groq_integration.py # Groq prompt adaptation & mocked analysis tests
│   │   ├── test_health.py         # Health endpoint & 404 tests
│   │   └── test_scoring.py        # Completeness scoring & email regex tests
│   ├── .env.example               # Backend configuration template
│   ├── requirements.txt           # Python backend dependencies
│   └── venv/                      # Python 3.11 isolated virtual environment
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── MetricCard.jsx     # Reusable glass-card telemetry metric display
│   │   │   ├── Navbar.jsx         # Header with cluster health pill & quick actions
│   │   │   ├── Sidebar.jsx        # Responsive collapsible navigation & node topology
│   │   │   └── StatusBanner.jsx   # Dynamic system status & setup instructions banner
│   │   ├── pages/
│   │   │   ├── AboutView.jsx      # Architecture specs, Intel macOS setup, checklist
│   │   │   ├── AnalysisHistoryView.jsx # Live documents collection query, search & delete
│   │   │   ├── DashboardView.jsx  # Primary executive overview, metrics & phase roadmap
│   │   │   ├── DocumentResultsView.jsx # Visual insights, Recharts, Completeness & JSON download
│   │   │   └── UploadDocumentView.jsx  # Upload dropzone, sample picker, config selectors & analyze
│   │   ├── services/
│   │   │   └── api.js             # API communication layer
│   │   ├── App.jsx                # Root coordinator and state router
│   │   ├── index.css              # Custom Tailwind styles & glass panels
│   │   └── main.jsx               # React DOM entrypoint
│   ├── .env.example               # Frontend configuration template
│   ├── index.html                 # HTML template with dark theme and typography
│   ├── package.json               # Frontend dependencies & scripts
│   ├── postcss.config.js          # PostCSS configuration
│   ├── tailwind.config.js         # Custom dark charcoal palette & subtle teal accents
│   ├── vercel.json                # Vercel SPA routing rewrite configuration
│   └── vite.config.js             # Vite 5 configuration
├── sample_documents/
│   ├── complete_resume.txt        # Full sample CV for Priya Sharma
│   ├── missing_contact_resume.txt # CV missing contact details (David Chen)
│   ├── limited_experience_resume.txt # Entry-level CV (Aisha Patel)
│   ├── sample_resume_complete.pdf # PyMuPDF-generated PDF of complete resume
│   ├── sample_resume_missing_contact.pdf # PyMuPDF-generated PDF of missing contact resume
│   ├── sample_resume_limited_experience.pdf # PyMuPDF-generated PDF of junior resume
│   └── README.md
├── candidate_details.txt          # Candidate submission metadata
├── package_submission.sh          # One-click clean submission packager script
├── render.yaml                    # Render deployment specification
├── TECHNICAL_EXPLANATION.md       # Comprehensive architectural deep-dive
├── .gitignore                     # Git ignore rules (node_modules, venv, .env, build output)
└── README.md                      # Comprehensive documentation
```

---

## Features Implemented Across All 5 Phases

### Phase 1: Project Foundation & Architecture
- Complete project folder architecture.
- FastAPI backend with CORS middleware, centralized error handling, and python-dotenv configuration.
- React 18 single-page application with modern dark charcoal aesthetic (`#090c10`), subtle teal/blue accents, and responsive navigation.
- Health endpoint (`GET /api/health`) returning cluster telemetry.

### Phase 2: Document Upload & Extraction
- Support for **PDF** and **TXT** files up to **10 MB**.
- Drag-and-drop and manual file browser upload interfaces.
- **PyMuPDF (`fitz`) Text Extraction:** Extracts readable text preserving layout and structure.
- Guardrails for empty files, corrupted PDFs, encrypted/password-protected PDFs, and scanned/image-only documents.
- Pre-built fictional test resumes (Priya Sharma, David Chen, Aisha Patel) directly selectable in the UI.
- Private, anonymous browser sessions with server-enforced document ownership.
- Session-scoped in-memory document storage on Render; temporary documents can disappear when the service restarts.
- Endpoints: `POST /api/documents/upload`, `GET /api/documents`, `GET /api/documents/{id}`, `DELETE /api/documents/{id}`.

### Phase 3: Groq LLM Intelligence Engine
- Official Groq Python SDK integration.
- Target Model: `openai/gpt-oss-20b` (verified active on Groq account).
- **Three Summary Styles:** Brief (1–2 paragraphs), Detailed (comprehensive findings), Bullet Points (structured list).
- **Three Adaptive Analysis Levels:** Basic (surface fields), Standard (core sections), Detailed (deep semantic inspection & uncertainty identification).
- **Custom Field Selection:** Selectively extract `name`, `email`, `phone`, `skills`, `education`, `work_experience`, `projects`, `certifications`.
- **Strict Pydantic Validation:** Strict null safety (`null` for missing scalars, `[]` for missing lists).
- Security-hardened prompt design treating document text as untrusted data to prevent prompt injection.

### Phase 4: Visual Insights & Interactive Results
- **Visual Insights with Recharts:**
  - BarChart: Candidate skills breakdown across technical categories (Languages, Frameworks, Cloud & DevOps, AI/ML, Databases).
  - PieChart: Section presence vs missing required fields.
- **Deterministic Completeness Scoring:**
  - Evaluates standard 5 sections: Name, Email (RFC regex validated), Skills, Education, Work Experience.
  - Formula: $\text{Completeness} = (\text{Present Required Fields} / 5) \times 100\%$.
  - Clear objective disclaimer: Completeness measures available information, not candidate quality.
- **Interactive Results Dashboard:**
  - AI Summary display.
  - Extracted entity cards (Contact, Skills, Education timeline, Experience cards, Projects, Certifications).
  - Raw extracted text buffer viewer.
  - Formatted JSON viewer with copy to clipboard and downloadable `.json` file export.
  - Re-run analysis with adjusted parameters.

### Phase 5: Testing, Deployment & Submission
- 24 automated backend unit and integration tests passing via pytest.
- Frontend production build compiles with zero errors (`npm run build`).
- Cloud deployment configuration:
  - `frontend/vercel.json` for Vercel SPA routing.
  - `render.yaml` for Render backend web service.
  - Anonymous session isolation and temporary storage notes.
- Complete `TECHNICAL_EXPLANATION.md` and `candidate_details.txt`.
- Submission packaging script (`package_submission.sh`).

---

## Configuration & Environment Variables

### Backend (`backend/.env`)
```ini
MONGODB_URI=mongodb://localhost:27017/
MONGODB_DB=document_intelligence
GROQ_API_KEY=gsk_YourPrivateGroqApiKeyHere
GROQ_MODEL=openai/gpt-oss-20b
FRONTEND_ORIGIN=http://localhost:5173
```

### Frontend (`frontend/.env`)
```ini
VITE_API_BASE_URL=http://localhost:8000
```

---

## Local Setup & Execution Instructions

### 1. Backend Setup & Startup
In Terminal 1:
```bash
cd "/Users/apple/Documents/Document intelligence/backend"
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
- API Base: `http://localhost:8000`
- Interactive OpenAPI Swagger Docs: `http://localhost:8000/docs`
- Health Endpoint: `http://localhost:8000/api/health`

### 2. Frontend Setup & Startup
In Terminal 2:
```bash
cd "/Users/apple/Documents/Document intelligence/frontend"
npm run dev
```
- Access dashboard: `http://localhost:5173`

---

## Running Automated Backend Tests

```bash
cd "/Users/apple/Documents/Document intelligence"
./backend/venv/bin/pytest backend/tests/ -v
```

All 24 tests execute and pass:
```text
backend/tests/test_api_documents.py::test_upload_valid_txt_document PASSED [  4%]
backend/tests/test_api_documents.py::test_upload_unsupported_file_extension PASSED [  8%]
backend/tests/test_api_documents.py::test_upload_empty_file PASSED       [ 12%]
backend/tests/test_api_documents.py::test_document_lifecycle_upload_get_delete PASSED [ 16%]
backend/tests/test_api_documents.py::test_sample_resumes_endpoints PASSED [ 20%]
backend/tests/test_extractor.py::test_pdf_extraction_valid PASSED        [ 25%]
backend/tests/test_extractor.py::test_txt_extraction_valid PASSED        [ 29%]
backend/tests/test_extractor.py::test_empty_pdf_raises_error PASSED      [ 33%]
backend/tests/test_extractor.py::test_corrupted_pdf_raises_error PASSED  [ 37%]
backend/tests/test_extractor.py::test_empty_txt_raises_error PASSED      [ 41%]
backend/tests/test_extractor.py::test_scanned_pdf_detection PASSED       [ 45%]
backend/tests/test_extractor.py::test_process_document_buffer_unsupported_format PASSED [ 50%]
backend/tests/test_groq_integration.py::test_build_system_prompt_adaptive_levels PASSED [ 54%]
backend/tests/test_groq_integration.py::test_empty_content_raises_error PASSED [ 58%]
backend/tests/test_groq_integration.py::test_mocked_groq_analysis_success PASSED [ 62%]
backend/tests/test_health.py::test_root_endpoint PASSED                  [ 66%]
backend/tests/test_health.py::test_health_endpoint_structure PASSED      [ 70%]
backend/tests/test_health.py::test_404_error_handling PASSED             [ 75%]
backend/tests/test_health.py::test_documents_list_endpoint PASSED        [ 79%]
backend/tests/test_scoring.py::test_valid_email_regex PASSED             [ 83%]
backend/tests/test_scoring.py::test_completeness_all_present PASSED      [ 87%]
backend/tests/test_scoring.py::test_completeness_missing_email PASSED    [ 91%]
backend/tests/test_scoring.py::test_completeness_missing_experience_and_education PASSED [ 95%]
backend/tests/test_scoring.py::test_uncertain_field_disqualifies_from_present PASSED [100%]
======================== 24 passed in 7.27s ========================
```

---

## Production Deployment Guide

### A. Deploy Frontend to Vercel
1. Push your repository to GitHub.
2. Sign in to [Vercel](https://vercel.com) and click **"Add New Project"**.
3. Import the repository and set the **Root Directory** to `frontend`.
4. Configure Environment Variable:
   - `VITE_API_BASE_URL`: `https://your-render-backend-url.onrender.com`
5. Click **Deploy**. Vercel will build the SPA using `frontend/vercel.json`.

### B. Deploy Backend to Render
1. Sign in to [Render](https://render.com) and click **"New Web Service"**.
2. Connect your GitHub repository.
3. Configure the service settings:
   - **Environment:** Python 3
   - **Build Command:** `pip install -r backend/requirements.txt`
   - **Start Command:** `cd backend && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path:** `/api/health`
4. Add Environment Variables:
   - `PYTHON_VERSION`: `3.11.9`
   - `GROQ_API_KEY`: `gsk_YourPrivateGroqApiKeyHere`
   - `GROQ_MODEL`: `openai/gpt-oss-20b`
5. Click **Create Web Service**.

### C. Anonymous Sessions and Temporary Storage

- The frontend requests an anonymous signed session token from `POST /api/session` and keeps it in browser `sessionStorage`.
- Document requests send the token in the `X-Session-Token` header. The backend checks ownership for every document read, analysis, list, and delete.
- CORS explicitly allows the production Vercel origin and local Vite development origin; no cookie or credential configuration is required.
- No MongoDB Atlas or new environment variables are required. On Render, temporary documents may be lost when the service restarts or its in-memory storage is cleared.

---

## Generating the Final Submission ZIP

1. Fill out your details in `candidate_details.txt`.
2. Place your resume in the project root as `[FullName]_Resume.pdf` (e.g. `JohnDoe_Resume.pdf`).
3. Run the packager script:
   ```bash
   ./package_submission.sh "YourFullName" "YourRegisterNumber"
   ```
   *Example:*
   ```bash
   ./package_submission.sh JohnDoe 21BCE1001
   ```
4. The script generates a clean ZIP archive named `JohnDoe_21BCE1001_Task2.zip` containing all source code, documentation, and samples while strictly excluding `.env` secrets, `node_modules`, `venv`, and caches.

---

## Known Limitations & Considerations

1. **Scanned / Handwritten Documents:** PyMuPDF extracts digital text layers embedded in PDFs. For pure image scans (with no digital text), the platform detects this condition and warns that OCR is required.
2. **Groq Model Availability:** The platform is configured for `openai/gpt-oss-20b` and includes automated fallback to standard Groq models (`llama-3.3-70b-versatile`, `llama-3.1-8b-instant`) if custom endpoints are ever suspended.
3. **Local MongoDB:** When running on machines without local MongoDB running on port 27017, the application operates in resilient degraded mode with in-memory caching until MongoDB is started.
4. **Anonymous browser sessions:** Session tokens expire after 24 hours and are signed with a process-local key. A Render restart invalidates existing sessions and may clear temporary documents; session data is not backed up or shared across backend instances.
