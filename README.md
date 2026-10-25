# CampusMate AI
### An Agentic AI-Powered Campus Companion
> **Tagline:** Your Campus. Your Goals. One Intelligent Companion.

CampusMate AI is a modern, responsive, and functional agentic web application designed to help college students manage academic responsibilities and campus life through a unified AI-powered companion.

Students can ask questions in natural language, manage assignments, organize deadlines, generate personalized study roadmaps, summarize college notices, discover clubs and events, and search college handbooks and policies with source citations.

---

## 🌟 Key Features

1. **Autonomous Campus AI Agent**:
   - Goes beyond static chat by executing backend Python tools on the student's SQLite database.
   - Transparent step-by-step reasoning (`Thought -> Tool Selection -> Execution -> Synthesis`).
   - Clearly badges verified campus documents vs AI suggestions vs demo engine data.
   - Built-in tools:
     - `create_task`: Add assignments, homework, and exam milestones.
     - `list_tasks`: Filter and retrieve active deadlines.
     - `complete_task`: Mark tasks as completed.
     - `create_study_plan`: Build multi-day study roadmaps.
     - `get_student_schedule`: Fetch classes and timeline for today.
     - `search_campus_documents`: Source-backed RAG search through university regulations.
     - `summarize_notice`: Parse circulars and extract dates and required action items.
     - `get_upcoming_events`: Retrieve hackathons, tech talks, and club meetups.
     - `generate_smart_recommendations`: Daily contextual academic guidance.

2. **Dashboard Overview**:
   - Time-sensitive greeting ("Good morning / afternoon / evening!").
   - 4 Live Statistics Cards calculated directly from SQLite (Pending Tasks, Upcoming Exams, Completed Tasks, Upcoming Events).
   - Interactive Today's Schedule timeline with completion toggles.
   - Upcoming Deadlines tracker sorted by due date with urgency badges (Overdue, Due Today, Due Soon, Completed).
   - AI Academic Recommendation Card with one-click "Ask CampusMate" action.
   - Quick action shortcuts.

3. **Adaptive Study Planner**:
   - Dynamic study roadmap generator based on target exam dates and daily hours commitment.
   - Milestone checklist with live progress percentage calculation.
   - Built-in Deep Work Focus Timer (Pomodoro mode: 25m sprints / 50m blocks) with session logging.

4. **Tasks & Deadlines**:
   - Complete CRUD task manager.
   - Filters by Status (Pending, In Progress, Completed), Category (Assignment, Exam, Project, Lab), and Course Code.
   - Real-time search and priority tagging.

5. **Notices & Circulars (NLP Extraction)**:
   - Official university bulletins categorized into Academic, Administrative, Placement, Hostel, and Sports.
   - AI Executive Summary modal with extracted key dates and required student actions.
   - PDF upload & text parser for ingesting new campus notices.

6. **Clubs & Campus Life**:
   - Campus events directory and RSVP system that automatically synchronizes with the student's schedule.
   - Student organization directory (ACM, GDSC, E-Cell, Cultural Society, Sports Council).

7. **Campus Information & Document Knowledge Base (RAG)**:
   - Official document repository for handbooks, attendance codes, and grading systems.
   - Semantic & keyword retrieval with snippet highlights and verified citations.
   - Document ingestion for PDFs and syllabus files.

8. **Settings & System Diagnostics**:
   - Autonomous Agent Demo Engine toggle (no external API key required).
   - Support for OpenAI (GPT-4o) and Google Gemini with safe key management.
   - Student profile configuration.
   - Database restore button to re-seed clean campus sample data at any time.

---

## 🎨 Visual Identity & Colour Theme

CampusMate AI features a minimal, professional blue-and-white visual identity adhering to a 70/20/10 surface balance:

| UI Element | Colour | Hex Code |
|---|---|---|
| Main background | Soft blue-grey white | `#F5F8FC` |
| Main cards | Pure white | `#FFFFFF` |
| Secondary background | Light blue-grey | `#EAF1FA` |
| Primary accent | Modern royal blue | `#2563EB` |
| Primary hover | Darker blue | `#1D4ED8` |
| Deep navy | Dark blue | `#163A63` |
| Primary text | Dark navy-grey | `#172B4D` |
| Secondary text | Muted blue-grey | `#64748B` |
| Soft blue | Pale blue | `#DBEAFE` |
| Highlight background | Very pale blue | `#EFF6FF` |
| Borders | Light blue-grey | `#DCE5F0` |
| Hover background | Soft blue-white | `#E8F0FC` |
| Success background | Soft green | `#DDF5E5` |
| Warning background | Soft amber | `#FFF1CC` |
| Error background | Soft red | `#FCE4E4` |

---

## 🛠️ Technology Stack

- **Frontend**: React, Vite, JavaScript, CSS Variables (Central Design Tokens), Lucide React, React Router.
- **Backend**: Python 3.11+, FastAPI, SQLAlchemy, Pydantic, SQLite (`campusmate.db`).
- **Document Processing & RAG**: `pypdf`, Regex heuristic NLP extraction, keyword & semantic relevance ranking.
- **Testing**: `pytest`, FastAPI `TestClient`.

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18+)
- Python 3.11+

### 1. Backend Setup
```bash
cd backend
py -m pip install -r requirements.txt
py -m uvicorn main:app --host 127.0.0.1 --port 8000
```
The backend will automatically start at `http://127.0.0.1:8000` and seed the initial campus database.

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://127.0.0.1:5173/` in your browser.

### 3. Running Automated Tests
```bash
cd backend
py -m pytest test_campusmate.py -v
```

---

## 📄 License
MIT License &bull; CampusMate AI 2026.
