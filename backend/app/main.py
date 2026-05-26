from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routes import auth_router, dashboard_router, notes_router, shared_router

# Auto-create tables (SQLite/PostgreSQL) at startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="PEBLO Collaborative AI Notes Workspace API",
    description="FastAPI Backend for PEBLO Challenge MVP",
    version="1.0.0"
)

# Configure CORS for local Next.js app running on port 3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register endpoints
app.include_router(auth_router)
app.include_router(notes_router)
app.include_router(shared_router)
app.include_router(dashboard_router)

@app.get("/")
def health_check():
    return {
        "name": "PEBLO AI API",
        "status": "healthy",
        "version": "1.0.0"
    }
