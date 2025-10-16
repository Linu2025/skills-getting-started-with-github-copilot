
import copy
import pytest

from fastapi.testclient import TestClient
from src import app as application_module


@pytest.fixture(autouse=True)
def reset_activities():
    # Snapshot activities and restore after each test to keep isolation
    snapshot = copy.deepcopy(application_module.activities)
    yield
    application_module.activities = snapshot


client = TestClient(application_module.app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data


def test_signup_and_duplicate_error():
    activity = "Chess Club"
    email = "testuser@example.com"

    # Sign up should work
    resp = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp.status_code == 200
    assert resp.json()["message"] == f"Signed up {email} for {activity}"

    # Signing up again should produce 400
    resp2 = client.post(f"/activities/{activity}/signup?email={email}")
    assert resp2.status_code == 400


def test_remove_participant_and_not_found():
    activity = "Programming Class"
    email = "emma@mergington.edu"

    # Ensure participant exists initially
    assert email in application_module.activities[activity]["participants"]

    # Remove participant
    resp = client.delete(f"/activities/{activity}/participants?email={email}")
    assert resp.status_code == 200
    assert resp.json()["message"] == f"Unregistered {email} from {activity}"

    # Removing again should return 404
    resp2 = client.delete(f"/activities/{activity}/participants?email={email}")
    assert resp2.status_code == 404
