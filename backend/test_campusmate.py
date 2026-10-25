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

def test_agent_chat_schedule_retrieval():
    res = client.post("/api/agent/chat", json={"message": "What classes do I have today?"})
    assert res.status_code == 200
    data = res.json()
    assert data["tool_called"] == "get_student_schedule"
    assert "schedule" in data["thought_process"][-2].lower() or "retrieved" in data["thought_process"][-1].lower()

def test_agent_chat_exam_schedule():
    res = client.post("/api/agent/chat", json={"message": "When are my upcoming exams?"})
    assert res.status_code == 200
    data = res.json()
    assert data["tool_called"] == "list_exams"
    assert "exam" in data["response"].lower()

def test_agent_chat_events_retrieval():
    res = client.post("/api/agent/chat", json={"message": "What campus events and hackathons are happening?"})
    assert res.status_code == 200
    data = res.json()
    assert data["tool_called"] == "get_upcoming_events"
    assert "event" in data["response"].lower() or len(data["thought_process"]) > 0

def test_agent_chat_educational_concept_no_database_search():
    res = client.post("/api/agent/chat", json={"message": "Explain how Dijkstra's algorithm works"})
    assert res.status_code == 200
    data = res.json()
    assert data["tool_called"] == "educational_reasoner"
    assert len(data["verified_sources"]) == 0
    assert "shortest path" in data["response"].lower() or "dijkstra" in data["response"].lower()
    assert "active academic workload includes" not in data["response"]

def test_agent_chat_general_science_question():
    res = client.post("/api/agent/chat", json={"message": "What is photosynthesis?"})
    assert res.status_code == 200
    data = res.json()
    assert data["tool_called"] == "educational_reasoner"
    assert len(data["verified_sources"]) == 0
    assert "photosynthesis" in data["response"].lower()
    assert "active academic workload includes" not in data["response"]

def test_agent_chat_missing_api_key_error():
    # Configure live mode without key
    client.post("/api/settings", json={"ai_mode": "openai", "api_key": ""})
    try:
        res = client.post("/api/agent/chat", json={"message": "What assignments do I have?"})
        assert res.status_code == 200
        data = res.json()
        assert data["is_error"] is True
        assert data["is_demo"] is False
        assert "API key" in data["response"] or "AI Service Unavailable" in data["response"]
    finally:
        client.post("/api/settings", json={"ai_mode": "demo"})

def test_agent_chat_failed_api_call_no_hardcoded_fallback():
    # Configure live mode with invalid key
    client.post("/api/settings", json={"ai_mode": "openai", "api_key": "sk-invalid-test-key-fake-123456789"})
    try:
        res = client.post("/api/agent/chat", json={"message": "What is Dijkstra algorithm?"})
        assert res.status_code == 200
        data = res.json()
        assert data["is_error"] is True
        assert data["tool_called"] == "api_error"
        assert data["is_demo"] is False
        assert "AI Service Unavailable" in data["response"]
        assert "call to openai failed" in data["response"].lower() or "http error" in data["response"].lower()
    finally:
        client.post("/api/settings", json={"ai_mode": "demo"})

def test_cce_sync_and_status():
    # Trigger manual synchronization
    res = client.post("/api/sync/cce")
    assert res.status_code == 200
    sync_data = res.json()
    assert sync_data["success"] is True
    assert sync_data["total_events"] > 0
    assert "cce.edu.in" in sync_data["source_url"]
    assert "last_synced_at" in sync_data

    # Check sync status endpoint
    status_res = client.get("/api/sync/status")
    assert status_res.status_code == 200
    status_data = status_res.json()
    assert status_data["total_events"] == sync_data["total_events"]
    assert "cce.edu.in" in status_data["primary_source"]
    assert "ieee" in status_data["ieee_source"]

def test_cce_events_source_attribution_and_no_fictional():
    res = client.get("/api/events?status=all")
    assert res.status_code == 200
    events = res.json()
    assert len(events) > 0

    fictional_names = ["hackcampus 2026", "generative ai & agentic", "startup pitch battle", "acoustic sunset jam", "inter-department futsal"]
    for ev in events:
        # Every event must have a source attribution
        assert ev["source_url"] is not None and len(ev["source_url"]) > 0
        assert "cce.edu.in" in ev["source_url"] or ev["source_name"]
        assert "venue" in ev
        assert "organizer" in ev
        # Fictional placeholder events must not be in normal view
        title_lower = ev["title"].lower()
        for f in fictional_names:
            assert f not in title_lower

def test_cce_upcoming_vs_past_events():
    upcoming_res = client.get("/api/events?status=upcoming")
    assert upcoming_res.status_code == 200
    upcoming = upcoming_res.json()
    for ev in upcoming:
        assert ev["is_upcoming"] is True

    past_res = client.get("/api/events?status=past")
    assert past_res.status_code == 200
    past = past_res.json()
    for ev in past:
        assert ev["is_upcoming"] is False

def test_notice_verification_labeling():
    # 1. User uploaded notice without official proof must be unverified
    res_unverified = client.post("/api/notices", json={
        "title": "Informal Coding Meetup",
        "category": "Academic",
        "date": "2026-10-25",
        "content": "Peer study group meeting in common lounge.",
        "source": "Student Study Group"
    })
    assert res_unverified.status_code == 200
    data_unv = res_unverified.json()
    assert data_unv["is_verified"] is False
    assert "Unverified" in data_unv["verification_notes"]

    # 2. Official CCE circular must be verified
    notices_res = client.get("/api/notices")
    assert notices_res.status_code == 200
    notices = notices_res.json()
    cce_official = [n for n in notices if "Autonomous" in n["title"] or "Examination" in n["title"]]
    assert len(cce_official) > 0
    assert cce_official[0]["is_verified"] is True
    assert "cce.edu.in" in cce_official[0]["source_url"]

def test_notifications_endpoint():
    res = client.get("/api/notifications")
    assert res.status_code == 200
    data = res.json()
    assert isinstance(data, list)
    if len(data) > 0:
        assert "id" in data[0]
        assert "title" in data[0]
        assert "category" in data[0]

def test_tasks_csv_import_and_export():
    csv_content = b"Title,Course,DueDate,Priority,Category,EstimatedHours,Description\nReal Chemistry Lab,CHEM101,2026-11-20,High,Lab,3.0,Titration lab report\nReal Physics Exam,PHYS102,2026-11-25,High,Exam,5.0,Optics and waves"
    import_res = client.post(
        "/api/tasks/import-file",
        files={"file": ("real_tasks.csv", csv_content, "text/csv")}
    )
    assert import_res.status_code == 200
    data = import_res.json()
    assert data["success"] is True
    assert data["count"] == 2
    
    # Export and verify the imported task is present
    export_res = client.get("/api/tasks/export.csv")
    assert export_res.status_code == 200
    assert "Real Chemistry Lab" in export_res.text
    assert "CHEM101" in export_res.text

def test_tasks_sample_template():
    res = client.get("/api/tasks/sample-template.csv")
    assert res.status_code == 200
    assert "Title,Course,DueDate" in res.text

def test_dashboard_velocity_and_workload():
    res = client.get("/api/dashboard")
    assert res.status_code == 200
    data = res.json()
    assert "weekly_velocity" in data
    assert len(data["weekly_velocity"]) == 7
    assert data["weekly_velocity"][0]["day"] == "Mon"
    assert "course_workload" in data
    assert isinstance(data["course_workload"], list)



