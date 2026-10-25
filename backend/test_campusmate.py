import pytest
from fastapi.testclient import TestClient
from main import app
from database import get_db, Base, engine
from models import Task, Notice, StudyPlan
from seed_data import seed_database

client = TestClient(app)

def test_dashboard_stats():
    response = client.get("/api/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert "pending_tasks" in data
    assert "upcoming_exams" in data
    assert "completed_tasks" in data
    assert "upcoming_events" in data
    assert "greeting" in data
    assert "ai_recommendation" in data
    assert isinstance(data["deadlines"], list)

def test_tasks_crud():
    # 1. Create a task
    new_task = {
        "title": "Automated Test Assignment",
        "course": "TEST101",
        "due_date": "2026-11-15",
        "priority": "High",
        "category": "Assignment",
        "description": "Created during pytest execution."
    }
    res = client.post("/api/tasks", json=new_task)
    assert res.status_code == 200
    created = res.json()
    task_id = created["id"]
    assert created["title"] == "Automated Test Assignment"
    assert created["status"] == "Pending"

    # 2. Toggle status
    toggle_res = client.post(f"/api/tasks/{task_id}/toggle")
    assert toggle_res.status_code == 200
    assert toggle_res.json()["status"] == "Completed"

    # 3. Delete task
    del_res = client.delete(f"/api/tasks/{task_id}")
    assert del_res.status_code == 200

def test_agent_chat_tool_calling():
    # Test task retrieval intent
    res = client.post("/api/agent/chat", json={"message": "What assignments do I have due this week?"})
    assert res.status_code == 200
    data = res.json()
    assert "response" in data
    assert "thought_process" in data
    assert data["tool_called"] == "list_tasks"
    assert len(data["thought_process"]) > 0

def test_agent_chat_rag_policy_search():
    # Test official document search intent
    res = client.post("/api/agent/chat", json={"message": "What is the mandatory attendance requirement?"})
    assert res.status_code == 200
    data = res.json()
    assert data["tool_called"] == "search_campus_documents"
    assert "75%" in data["response"] or "attendance" in data["response"].lower()
    assert len(data["verified_sources"]) > 0

def test_notices_list():
    res = client.get("/api/notices")
    assert res.status_code == 200
    data = res.json()
    assert len(data) > 0
    assert "title" in data[0]
    assert "summary" in data[0]

def test_study_plan_generation():
    res = client.post("/api/study-plans", json={
        "subject": "Algorithm Analysis",
        "target_exam_date": "2026-11-20",
        "daily_hours": 3.0,
        "topics": ["Dynamic Programming", "Greedy Algorithms", "NP-Completeness"]
    })
    assert res.status_code == 200
    plan = res.json()
    assert plan["subject"] == "Algorithm Analysis"
    assert len(plan["milestones"]) > 0

def test_ask_specific_document():
    # Fetch first document
    docs_res = client.get("/api/documents")
    assert docs_res.status_code == 200
    docs = docs_res.json()
    assert len(docs) > 0
    doc_id = docs[0]["id"]

    # Ask document a targeted question
    ask_res = client.post(f"/api/documents/{doc_id}/ask", json={"question": "What are the rules and penalties?"})
    assert ask_res.status_code == 200
    data = ask_res.json()
    assert data["success"] is True
    assert "answer" in data
    assert "snippet" in data

def test_export_schedule_ics():
    res = client.get("/api/schedule/export.ics")
    assert res.status_code == 200
    assert "BEGIN:VCALENDAR" in res.text
    assert "END:VCALENDAR" in res.text
    assert "text/calendar" in res.headers["content-type"]

def test_export_study_plan_ics():
    create_res = client.post("/api/study-plans", json={
        "subject": "Data Mining",
        "target_exam_date": "2026-12-05",
        "daily_hours": 2.0,
        "topics": ["Clustering", "Classification"]
    })
    assert create_res.status_code == 200
    plan_id = create_res.json()["id"]
    res = client.get(f"/api/study-plans/{plan_id}/export.ics")
    assert res.status_code == 200
    assert "BEGIN:VCALENDAR" in res.text
    assert "Data Mining" in res.text
    assert "text/calendar" in res.headers["content-type"]

def test_agent_chat_with_history():
    res = client.post("/api/agent/chat", json={
        "message": "When is the deadline for it?",
        "history": [
            {"role": "user", "content": "What about Database Systems assignment?"},
            {"role": "assistant", "content": "You have a Database Systems assignment."}
        ]
    })
    assert res.status_code == 200
    data = res.json()
    assert any("prior turns referenced" in step or "Integrated session context" in step for step in data["thought_process"])


