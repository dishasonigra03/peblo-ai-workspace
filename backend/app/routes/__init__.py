from app.routes.auth import router as auth_router
from app.routes.notes import router as notes_router
from app.routes.shared import router as shared_router
from app.routes.dashboard import router as dashboard_router

__all__ = ["auth_router", "notes_router", "shared_router", "dashboard_router"]
