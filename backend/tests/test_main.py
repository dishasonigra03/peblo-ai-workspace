import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.main import app
from app.database import Base, get_db

# Create an in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Override database dependency in FastAPI app
def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    # Setup tables
    Base.metadata.create_all(bind=engine)
    yield
    # Drop tables after tests
    Base.metadata.drop_all(bind=engine)

client = TestClient(app)

def test_health_check():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_auth_and_notes_flow():
    # 1. Signup a new user
    signup_payload = {
        "name": "Test User",
        "email": "test@example.com",
        "password": "testpassword123"
    }
    response = client.post("/auth/signup", json=signup_payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "test@example.com"
    token = data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Verify /auth/me
    response = client.get("/auth/me", headers=headers)
    assert response.status_code == 200
    assert response.json()["name"] == "Test User"

    # 3. Create a new note
    note_payload = {
        "title": "Test Title",
        "content": "Test note content.",
        "tags": ["unit-test", "python"]
    }
    response = client.post("/notes", json=note_payload, headers=headers)
    assert response.status_code == 201
    note_data = response.json()
    assert note_data["title"] == "Test Title"
    assert len(note_data["tags"]) == 2
    note_id = note_data["id"]

    # 4. List notes and verify it exists
    response = client.get("/notes", headers=headers)
    assert response.status_code == 200
    notes_list = response.json()
    assert len(notes_list) >= 1
    assert notes_list[0]["id"] == note_id

    # 5. Patch note
    patch_payload = {
        "title": "Updated Title",
        "is_pinned": True
    }
    response = client.patch(f"/notes/{note_id}", json=patch_payload, headers=headers)
    assert response.status_code == 200
    updated_data = response.json()
    assert updated_data["title"] == "Updated Title"
    assert updated_data["is_pinned"] is True

    # 6. Test sharing lookup
    share_id = updated_data["share_id"]
    # Verify that shared note lookup raises 403 when it's not marked public
    response = client.get(f"/shared/{share_id}")
    assert response.status_code == 403

    # Mark public and test again
    client.patch(f"/notes/{note_id}", json={"is_public": True}, headers=headers)
    response = client.get(f"/shared/{share_id}")
    assert response.status_code == 200
    assert response.json()["title"] == "Updated Title"

    # 7. Delete note
    response = client.delete(f"/notes/{note_id}", headers=headers)
    assert response.status_code == 204

    # Verify deleted
    response = client.get(f"/notes/{note_id}", headers=headers)
    assert response.status_code == 404
