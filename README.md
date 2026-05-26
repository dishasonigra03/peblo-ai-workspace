# PEBLO: AI-Powered Collaborative Notes Workspace

PEBLO is a production-quality, modern, full-stack collaborative notes workspace with automated AI insights (summaries, action items, suggested titles), secure JWT authentication, tags organization, sharing, and a productivity insights analytics dashboard.

---

## 🏗️ Architecture Overview

PEBLO is structured as a monorepo consisting of:
- **/frontend**: A Next.js (App Router) TypeScript web client using Tailwind CSS for a premium glassmorphic theme, and Zustand for global state management.
- **/backend**: A FastAPI Python application serving a REST API, utilizing SQLAlchemy ORM for database connectivity, and Pydantic for validation.
- **/docs**: Technical documentation and system designs.

```
peblo/
├── backend/            # FastAPI Backend
│   ├── app/
│   │   ├── auth/       # JWT and Password utils
│   │   ├── models/     # SQLAlchemy Database schemas
│   │   ├── routes/     # Router Controllers
│   │   ├── schemas/    # Pydantic validation models
│   │   ├── services/   # Gemini AI API wrapper
│   │   └── main.py     # Entrypoint
│   ├──requirements.txt # Python packages
│   └── .env            # Environment config
├── frontend/           # Next.js Frontend
│   ├── src/
│   │   ├── app/        # Pages and layouts
│   │   ├── components/ # Core reusable UI widgets
│   │   ├── store/      # Zustand state hooks
│   │   └── utils/      # Axios client configurations
│   ├── package.json    # Javascript packages
│   └── tailwind.config # Styling setups
└── README.md           # Documentation
```

### Database Entity Relationship Diagram

```
 +-------------+       1:N        +-------------+
 |    users    | ---------------->|    notes    |
 +-------------+                  +-------------+
        |                                |
        | 1:N                            | 1:1
        v                                v
 +-------------+       M:N        +-------------+
 |    tags     | <--------------->|ai_generation|
 +-------------+                  +-------------+
```

---

## 🛠️ Local Setup & Run Instructions

Ensure you have **Node.js (v18+)** and **Python (3.9+)** installed.

### 1. Backend Setup

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure the environment:
   Copy `.env.example` to `.env` and fill in your details:
   ```bash
   cp .env.example .env
   ```
   *Note: If `GEMINI_API_KEY` is left blank, the app will run in fallback warning mode without crashing.*
5. Start the FastAPI server:
   ```bash
   uvicorn app.main:app --reload
   ```
   The backend API will run at `http://localhost:8000`. You can inspect the interactive Swagger API documentation at `http://localhost:8000/docs`.

---

### 2. Frontend Setup

1. Open another terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install npm dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
4. Open your browser and go to `http://localhost:3000`.

---

## 🔐 Environment Variables

The project uses `.env` files for configuration. A root `.env.example` is provided:

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | SQLAlchemy connection string. | `sqlite:///./peblo.db` or `postgresql://...` |
| `JWT_SECRET` | Secret key for hashing tokens. | Random 256-bit hash. |
| `GEMINI_API_KEY` | Google Gemini API Key. | Obtain from Google AI Studio. |

---

## 🚀 API Documentation Spec

### 🗝️ Authentication Router
- **`POST /auth/signup`**
  - **Request Body**: `{ "name": "John", "email": "john@ex.com", "password": "password123" }`
  - **Response**: JWT session token and user details payload.
- **`POST /auth/login`**
  - **Request Body**: `{ "email": "john@ex.com", "password": "password123" }`
  - **Response**: JWT access token.
- **`GET /auth/me`**
  - **Headers**: `Authorization: Bearer <token>`
  - **Response**: Profile details for current user session.

### 📝 Notes Router
- **`GET /notes`**
  - **Params**: `search` (keyword), `tag` (tag name), `is_archived` (boolean)
  - **Response**: List of notes, sorted by pinned first, then recently updated.
- **`POST /notes`**
  - **Request Body**: `{ "title": "Planning", "content": "agenda details...", "tags": ["work"] }`
  - **Response**: Newly created note record.
- **`GET /notes/{id}`**
  - **Response**: Note detail data structure.
- **`PATCH /notes/{id}`**
  - **Request Body**: `{ "title": "Updated Title", "is_pinned": true, "tags": ["personal"] }`
  - **Response**: Updated note record.
- **`DELETE /notes/{id}`**
  - **Response**: Status HTTP 204.

### 🧠 AI Analysis Router
- **`POST /notes/{id}/generate-summary`**
  - **Response**: Generates summary analysis from note content. Returns JSON structure:
    ```json
    {
      "id": "AI_XXXX",
      "note_id": "NOTE_XXXX",
      "summary": "AI summary details here...",
      "action_items": ["Prepare mockups", "Run server tests"],
      "suggested_title": "Sprint Planning Insights"
    }
    ```

### 🌍 Public Sharing Router
- **`GET /shared/{shareId}`**
  - **Description**: Returns note markdown details for public reading without auth tokens. Checks if `is_public` is true, otherwise returns a 403 Forbidden error.

### 📊 Dashboard Analytics Router
- **`GET /dashboard/analytics`**
  - **Response**: Metrics dashboard including total notes, unique tags list, AI generations counter, and weekly editing history statistics.

---

## 🌐 Deployment Instructions

### Frontend (Vercel)
1. Push the code to a Github repository.
2. Link the repository to your Vercel Dashboard.
3. Configure settings:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Environment Variables**: Add `NEXT_PUBLIC_API_URL` pointing to your hosted FastAPI backend URL.

### Backend (Railway/Render)
1. Create a PostgreSQL Database on Render or Railway.
2. Deploy the backend project pointing to the `backend` subdirectory.
3. Configure environment variables in settings:
   - `DATABASE_URL`: Set to the production PostgreSQL connection string.
   - `JWT_SECRET`: Random secure string.
   - `GEMINI_API_KEY`: Your production Gemini API credential.
4. Set build command (if Render): `pip install -r requirements.txt` and start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.

---

## 🔮 Future Improvements
1. **Real-time collaboration**: Implement WebSockets for live peer editing indicators.
2. **Offline-first Syncing**: Integrate IndexDB with local state syncing for offline creation.
3. **Advanced AI Search**: Embed vector databases for semantic search indexing of user notes.
