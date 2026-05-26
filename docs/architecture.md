# PEBLO Technical Architecture

This document describes the technical architecture, data design, and integration pipelines for the PEBLO AI Notes Workspace.

---

## 🚀 Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios (configured with token request interceptors)
- **Markdown Compiler**: ReactMarkdown with GFM

### Backend
- **Framework**: FastAPI (Python 3.13)
- **ORM**: SQLAlchemy
- **Input/Output Validation**: Pydantic
- **Security**: JWT & Native bcrypt password hashing
- **Testing**: pytest & FastAPI TestClient

### Database
- **Engine**: PostgreSQL (Production) / SQLite (Local-friendly fallback)

---

## 💾 Database Schema

The database consists of 5 main tables managing relationships and cascading constraints.

```
                  +-------------------+
                  |       users       |
                  +-------------------+
                  | id                | (PK)
                  | name              |
                  | email             | (Unique Index)
                  | hashed_password   |
                  | created_at        |
                  | updated_at        |
                  +-------------------+
                            |
                            | 1:N
                            v
                  +-------------------+
                  |       notes       |
                  +-------------------+
                  | id                | (PK)
                  | title             |
                  | content           |
                  | is_archived       | (Index)
                  | is_pinned         | (Index)
                  | is_public         | (Index)
                  | share_id          | (Unique Index)
                  | user_id           | (FK -> users.id)
                  | created_at        |
                  | updated_at        |
                  +-------------------+
                   /        |        \
                  /         |         \
           1:N   /     M:N  |          \ 1:1
                v           v           v
     +------------+  +------------+  +-----------------+
     |    tags    |  | note_tags  |  | ai_generations  |
     +------------+  +------------+  +-----------------+
     | id    (PK) |  | note_id    |  | id         (PK) |
     | name (Idx) |  | tag_id     |  | note_id    (FK) |
     | user_id(FK)|  +------------+  | summary         |
     +------------+                  | action_items    |
                                     | suggested_title |
                                     | created_at      |
                                     +-----------------+
```

### Constraints & Cascades
- **Cascade Deletes**: Deleting a User automatically deletes all their Notes and Tags. Deleting a Note automatically deletes all its relationships in `note_tags` and its AI summary records in `ai_generations`.
- **Composite Unique Constraint**: A composite unique index on `(tags.name, tags.user_id)` prevents the duplication of tags for a single user.

---

## 🔑 Session & Token Flow

PEBLO utilizes stateless JSON Web Token (JWT) authorization.

```
[ Client Browser ]                      [ FastAPI Backend ]
        |                                       |
        | ----- POST /auth/login -------------> | 
        |       (email & password)              | [Verify bcrypt hash]
        |                                       | [Issue JWT token]
        | <---- Response (JWT access_token) --- | 
        |                                       |
  [Save to localStorage]                        |
        |                                       |
        | ----- GET /notes -------------------> |
        |       Headers: Authorization: Bearer  | [Validate JWT signature]
        |                                       | [Resolve user session]
        | <---- Response (Notes Array JSON) --- |
```

---

## 🧠 AI Pipeline (Google Gemini)

AI summarization and task extraction utilize the Google Gemini API.

1. **Trigger**: The client clicks "AI Analysis" in the Workspace.
2. **Request**: The client sends a `POST /notes/{id}/generate-summary` request containing the JWT bearer token.
3. **Prompt Engineering**: The backend fetches the note's title and content, compiles them into a system-prompt instructing the model to output a strict JSON scheme:
   ```json
   {
     "summary": "...",
     "action_items": ["...", "..."],
     "suggested_title": "..."
   }
   ```
4. **Execution**: The backend utilizes `gemini-1.5-flash` with the `response_mime_type="application/json"` config parameter to guarantee JSON integrity.
5. **Persistence**: The backend saves the generated items in the `ai_generations` table.
6. **Result**: The backend returns the summary result to the frontend where the user can choose to insert it or apply the suggested title.
