import os
import json
import re
import urllib.request
import urllib.error
from datetime import datetime, date, timedelta
from typing import Dict, Any, List, Optional, Tuple
from sqlalchemy.orm import Session
import tools
from models import AgentInteraction, UserSettings, Notice, CampusDocument, Task, ScheduleItem, StudyPlan, ClubEvent

def get_current_ai_settings(db: Session) -> Dict[str, Any]:
    """Retrieves current AI settings and credentials from database and environment."""
    settings = db.query(UserSettings).first()
    if not settings:
        settings = UserSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
        
    mode = settings.ai_mode or "demo"
    stored_key = (getattr(settings, "api_key", None) or "").strip()
    env_openai = os.getenv("OPENAI_API_KEY", "").strip()
    env_gemini = os.getenv("GEMINI_API_KEY", "").strip()
    
    if mode == "openai":
        active_key = stored_key or env_openai
    elif mode == "gemini":
        active_key = stored_key or env_gemini
    else:
        active_key = ""
        
    is_live = bool(mode in ["openai", "gemini"] and active_key)
    has_key = bool(active_key)
    
    return {
        "mode": mode,
        "is_live": is_live,
        "has_key": has_key,
        "active_key": active_key,
        "student_name": settings.student_name or "Alex Chen",
        "student_id": settings.student_id or "CS-2024-8842",
        "major": settings.major or "Computer Science & Engineering",
        "semester": settings.semester or "Semester 5 (Fall 2026)",
        "email": settings.email or "alex.chen@campus.edu"
    }

def query_live_llm(
    mode: str, 
    api_key: str, 
    system_prompt: str, 
    user_query: str, 
    history: Optional[List[Dict[str, str]]] = None,
    context_data: Optional[Dict[str, Any]] = None
) -> Tuple[Optional[str], Optional[str]]:
    """
    Sends prompt to live OpenAI or Google Gemini API.
    Returns (generated_text, error_message).
    """
    if not api_key:
        return None, f"No API key provided for {mode.upper()} service."
        
    augmented_system = system_prompt
    if context_data:
        augmented_system += (
            f"\n\n--- VERIFIED CAMPUS APPLICATION DATA (from SQLite) ---\n"
            f"{json.dumps(context_data, indent=2)}\n"
            f"--- INSTRUCTIONS ---\n"
            f"Use the verified campus application data above to provide an accurate, fact-based response. "
            f"Ground your answer strictly in these facts. Do not fabricate deadlines, events, or grades."
        )

    try:
        if mode == "openai":
            msgs = [{"role": "system", "content": augmented_system}]
            if history:
                for h in history[-6:]:
                    r = "user" if h.get("role") == "user" else "assistant"
                    msgs.append({"role": r, "content": h.get("content", "")})
            msgs.append({"role": "user", "content": user_query})
            
            payload = json.dumps({
                "model": "gpt-4o-mini",
                "messages": msgs,
                "temperature": 0.3,
                "max_tokens": 900
            }).encode("utf-8")
            
            req = urllib.request.Request(
                "https://api.openai.com/v1/chat/completions",
                data=payload,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {api_key}"
                }
            )
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return data["choices"][0]["message"]["content"], None
                
        elif mode == "gemini":
            contents = []
            if history:
                for h in history[-4:]:
                    role = "user" if h.get("role") == "user" else "model"
                    contents.append({"role": role, "parts": [{"text": h.get("content", "")}]})
            contents.append({
                "role": "user",
                "parts": [{"text": f"Guidelines:\n{augmented_system}\n\nUser Question:\n{user_query}"}]
            })
            
            payload = json.dumps({
                "contents": contents,
                "generationConfig": {"temperature": 0.3, "maxOutputTokens": 900}
            }).encode("utf-8")
            
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
            req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                return data["candidates"][0]["content"]["parts"][0]["text"], None
                
    except urllib.error.HTTPError as e:
        err_msg = str(e)
        try:
            body = e.read().decode("utf-8")
            body_json = json.loads(body)
            if "error" in body_json:
                err_msg = body_json["error"].get("message", body)
        except Exception:
            pass
        return None, f"HTTP Error {e.code}: {err_msg}"
        
    except urllib.error.URLError as e:
        return None, f"Network Connection Error: {e.reason}"
        
    except Exception as e:
        return None, f"Service Request Error: {str(e)}"
        
    return None, "Unknown error encountered while calling AI service."

# ----------------- INTENT CLASSIFICATION & ENTITY RESOLUTION -----------------

def resolve_context_and_pronouns(query: str, history: Optional[List[Dict[str, str]]]) -> Tuple[str, Optional[str], List[str]]:
    """Resolves conversational pronouns ('it', 'that', 'this exam') using multi-turn history."""
    thoughts = []
    if not history or len(history) == 0:
        return query, None, thoughts

    q_lower = query.lower()
    has_pronoun = any(p in q_lower for p in [
        "for it", "for that", "about it", "about that", "when is it", "when is that",
        "when is the deadline", "deadline for it", "due date for it", "study plan for it",
        "add a task for it", "tell me more", "explain it further", "give an example",
        "what about it", "its time complexity", "how does that work", "that course", "this exam"
    ]) or (len(query.split()) <= 4 and any(w in q_lower for w in ["why", "how", "when", "example", "more", "details"]))

    if not has_pronoun:
        return query, None, thoughts

    thoughts.append(f"Integrated session context: {len(history)} prior turns referenced.")

    # Extract salient context entity from recent messages (latest first)
    entity = None
    for turn in reversed(history):
        content = turn.get("content", "")
        # Course match
        course_match = re.search(r'\b(CS\d+|MATH\d+|ENG\d+|EC\d+|EE\d+)\b', content, re.IGNORECASE)
        if course_match:
            entity = course_match.group(1).upper()
            break
        # Subject / Concept match
        for concept in [
            "Operating Systems", "Database Systems", "Algorithms", "Discrete Mathematics",
            "Software Engineering", "Dijkstra", "Belady", "B+ Tree", "Normalization",
            "Virtual Memory", "Photosynthesis", "Binary Search", "Quicksort", "Deadlock"
        ]:
            if concept.lower() in content.lower():
                entity = concept
                break
        if entity:
            break

    if entity:
        thoughts.append(f"Resolved contextual reference to '{entity}' from conversation history.")
        augmented = f"{query} ({entity})"
        return augmented, entity, thoughts

    return query, None, thoughts

def classify_intent(query: str) -> str:
    """Classifies user query into distinct functional categories."""
    q_lower = query.lower().strip()

    # 1. User Profile Update: "I am Sangeetha", "My name is John"
    name_match = re.search(r"^(?:hi\s+|hello\s+|hey\s+)?(?:i am|i'm|my name is|call me|this is)\s+([a-zA-Z\s]+)$", q_lower)
    non_names = ["fine", "good", "ready", "here", "studying", "tired", "happy", "asking", "confused", "looking", "interested", "ok", "okay", "busy", "student"]
    if name_match and name_match.group(1).strip() not in non_names and len(name_match.group(1).strip()) >= 2:
        return "USER_PROFILE_UPDATE"

    # 2. User Profile Query: "Who am I", "My student ID"
    if any(phrase in q_lower for phrase in ["who am i", "what is my name", "what's my name", "my profile", "my student id", "what is my major", "which semester am i in", "my email"]):
        return "USER_PROFILE_QUERY"

    # 3. Agent Identity & Capabilities
    if any(phrase in q_lower for phrase in ["who are you", "what are you", "what is your name", "what can you do", "introduce yourself", "about yourself", "your capabilities"]):
        return "AGENT_IDENTITY"

    # 4. Pure Greetings (only if message is short greeting without a separate question)
    if re.match(r"^(hi|hello|hey|good\s+morning|good\s+afternoon|good\s+evening|what's\s+up|whats\s+up|how\s+are\s+you)[\s!?.]*$", q_lower):
        return "GREETING"

    # 5. Courtesy / Acknowledgement
    if re.match(r"^(thank\s+you|thanks|great\s+job|awesome|perfect|good\s+job|nice|cool)[\s!?.]*$", q_lower):
        return "COURTESY"

    # 6. Task Management: Creation
    if any(w in q_lower for w in ["add task", "create task", "add assignment", "remind me to", "new task", "due on", "deadline for"]):
        return "CREATE_TASK"

    # 7. Task Management: Completion
    if any(w in q_lower for w in ["complete task", "mark task", "finish task", "task completed", "mark as completed", "mark as done"]):
        return "COMPLETE_TASK"

    # 8. Adaptive Study Plan Generation
    if any(w in q_lower for w in ["study plan", "study schedule", "prepare for exam", "revision plan", "study roadmap"]):
        return "STUDY_PLAN"

    # 9. Today's Student Schedule (Distinguish from conceptual CPU scheduling!)
    if any(phrase in q_lower for phrase in ["what classes do i have", "classes today", "schedule today", "today's schedule", "my timetable", "timetable today", "what do i have today", "my schedule"]):
        if not any(term in q_lower for term in ["cpu scheduling", "round robin", "sjf", "process scheduling", "algorithm"]):
            return "STUDENT_SCHEDULE"

    # 10. Exam Schedule Queries
    if any(phrase in q_lower for phrase in ["when is my exam", "when are my exams", "my exam schedule", "upcoming exams", "mid-term exam date", "exam dates", "next exam", "what exams do i have"]):
        return "EXAM_SCHEDULE"

    # 11. Task / Deadline Retrieval
    if any(phrase in q_lower for phrase in ["what assignments", "what tasks", "list tasks", "my homework", "pending tasks", "deadlines", "what is due", "assignments due"]):
        return "LIST_TASKS"

    # 12. Enrolled Courses Query
    if any(phrase in q_lower for phrase in ["what courses", "which courses", "what subjects", "which classes", "my subjects", "my courses", "classes am i taking"]):
        return "ENROLLED_COURSES"

    # 13. Smart Recommendations
    if any(w in q_lower for w in ["what should i do", "academic advice", "recommendation", "study advice", "prioritize today"]):
        return "SMART_RECOMMENDATION"

    # 14. Campus Notices & Bulletins
    if any(w in q_lower for w in ["summarize notice", "summarize circular", "circular", "announcement", "bulletin", "mid-term notice"]):
        return "SUMMARIZE_NOTICE"

    # 15. Campus Clubs & Events
    if any(w in q_lower for w in ["club", "event", "hackathon", "workshop", "fest", "campus activity", "upcoming events"]):
        return "UPCOMING_EVENTS"

    # 16. Official University Policy & Document Search (RAG)
    if any(w in q_lower for w in [
        "attendance requirement", "mandatory attendance", "minimum attendance", "attendance rule", "attendance shortage", "condonation",
        "grading policy", "grading curve", "library rule", "library fine", "hostel curfew", "plagiarism policy", "credit requirement",
        "student code of conduct", "examination manual", "examination regulation", "exam regulation", "autonomous regulation", 
        "academic regulation", "evaluation pattern", "cie weightage", "cce regulation"
    ]):
        return "CAMPUS_POLICY_RAG"

    # 17. General Educational Questions (Concepts, Algorithms, Math, Systems, Study Advice)
    # Check if query is conceptual or instructional:
    if any(q_lower.startswith(prefix) for prefix in ["what is", "what are", "explain", "how does", "how do", "difference between", "why is", "how to", "tell me about", "can you explain", "define"]):
        return "GENERAL_EDUCATIONAL"
        
    educational_keywords = [
        "algorithm", "complexity", "dijkstra", "sorting", "quicksort", "mergesort", "binary search",
        "virtual memory", "paging", "deadlock", "process", "thread", "semaphore", "b+ tree", "normalization",
        "acid", "photosynthesis", "tree", "graph", "cache", "compiler", "cpu", "network", "tcp", "udp",
        "dynammic programming", "greedy", "recursion", "oop", "database", "sql"
    ]
    if any(k in q_lower for k in educational_keywords):
        return "GENERAL_EDUCATIONAL"

    return "GENERAL_EDUCATIONAL"

# ----------------- BUILT-IN ACADEMIC KNOWLEDGE (DEMO ENGINE) -----------------

EDUCATIONAL_KNOWLEDGE_BASE = {
    "dijkstra": {
        "title": "Dijkstra's Shortest Path Algorithm",
        "subject": "Algorithms & Graph Theory (CS301)",
        "content": (
            "**Dijkstra's Algorithm** computes the single-source shortest paths to all vertices in a weighted, directed or undirected graph with **non-negative edge weights**.\n\n"
            "### ⚙️ How It Works:\n"
            "1. **Initialize Distances:** Assign distance `0` to the source vertex and `∞` to all other vertices. Maintain a Min-Priority Queue (Min-Heap).\n"
            "2. **Greedy Relaxation:** At each step, extract the unvisited vertex `u` with the smallest tentative distance.\n"
            "3. **Edge Relaxation:** For each neighbor `v` of `u`, if `dist[u] + weight(u, v) < dist[v]`, update `dist[v] = dist[u] + weight(u, v)`.\n"
            "4. **Termination:** Continue until all reachable vertices are visited.\n\n"
            "### ⏱️ Time & Space Complexity:\n"
            "- **Time Complexity:** **O((V + E) log V)** using a Binary Min-Heap, or **O(E + V log V)** with a Fibonacci Heap.\n"
            "- **Space Complexity:** **O(V)** for distance and visited arrays.\n\n"
            "⚠️ **Limitation:** Fails if the graph has **negative edge weights**. For graphs with negative weights, use the **Bellman-Ford Algorithm**."
        )
    },
    "belady": {
        "title": "Belády's Anomaly in Page Replacement",
        "subject": "Operating Systems & Virtual Memory (CS304)",
        "content": (
            "**Belády's Anomaly** is the counterintuitive phenomenon in virtual memory where **increasing the number of page frames allocated to a process results in an increase in page faults** for a specific memory reference string.\n\n"
            "### 🔍 Key Details:\n"
            "- **Discovered by:** László Belády in 1969.\n"
            "- **Algorithm exhibiting anomaly:** Most commonly observed in the **FIFO (First-In-First-Out)** page replacement algorithm.\n"
            "- **Why it happens:** FIFO is not a *stack algorithm*. In stack algorithms, the set of pages in memory for $n$ frames is always a strict subset of the pages in memory for $n+1$ frames.\n"
            "- **Immune Algorithms:** Stack-based algorithms like **LRU (Least Recently Used)** and **OPT (Optimal / MIN)** are mathematically guaranteed to never exhibit Belády's Anomaly."
        )
    },
    "b+ tree": {
        "title": "B+ Tree Indexing Architecture",
        "subject": "Database Systems & Storage (CS308)",
        "content": (
            "A **B+ Tree** is a self-balancing $N$-ary search tree optimized for storage systems and databases reading/writing large blocks of disk memory.\n\n"
            "### 🏗️ Structural Architecture:\n"
            "- **Internal Nodes:** Store only routing search keys and child pointers (no data records). This yields high fan-out and shallow tree height.\n"
            "- **Leaf Nodes:** Store all actual data records or row pointers. All leaf nodes are linked sequentially as a doubly-linked list.\n"
            "- **Search Performance:** Point queries execute in **O(log N)** disk I/O operations.\n"
            "- **Range Query Efficiency:** Range queries (`BETWEEN`, `>`, `<`) traverse to the starting leaf and scan sequentially along leaf pointers without re-traversing the tree."
        )
    },
    "normalization": {
        "title": "Relational Database Normalization Forms",
        "subject": "Database Management Systems (CS308)",
        "content": (
            "**Database Normalization** is the systematic process of decomposing relational tables to minimize data redundancy and prevent insertion, update, and deletion anomalies.\n\n"
            "### 📋 Normal Forms Hierarchy:\n"
            "1. **1NF (First Normal Form):** All attribute values are atomic (no repeating groups, multi-valued attributes, or nested arrays).\n"
            "2. **2NF (Second Normal Form):** In 1NF and contains **no partial functional dependencies** (every non-prime attribute is fully functionally dependent on the entire candidate key).\n"
            "3. **3NF (Third Normal Form):** In 2NF and contains **no transitive dependencies** (if $X \\rightarrow Y$, then $X$ is a superkey or $Y$ is a prime attribute).\n"
            "4. **BCNF (Boyce-Codd Normal Form):** A stricter version of 3NF. For every non-trivial functional dependency $X \\rightarrow Y$, $X$ **must be a superkey**."
        )
    },
    "virtual memory": {
        "title": "Virtual Memory, Paging & TLB Architecture",
        "subject": "Operating Systems (CS304)",
        "content": (
            "**Virtual Memory** provides an illusion of a large, uniform, contiguous address space to each process, decoupling physical RAM from logical memory.\n\n"
            "### 🔑 Core Mechanisms:\n"
            "- **Paging:** Memory is partitioned into fixed-size logical units (**Pages**) mapped to physical frames (**Page Frames**) via a Page Table.\n"
            "- **Page Table & TLB:** The Memory Management Unit (MMU) uses the **Translation Lookaside Buffer (TLB)** as a fast hardware cache to translate virtual addresses to physical addresses in single-digit nanoseconds.\n"
            "- **Page Fault:** Triggered when a referenced page is marked invalid (not resident in physical RAM), causing an OS interrupt to fetch the page from backing store (swap disk)."
        )
    },
    "deadlock": {
        "title": "Deadlock & Coffman Conditions",
        "subject": "Operating Systems (CS304)",
        "content": (
            "A **Deadlock** is a state where a set of processes are permanently blocked because each process holds a resource and waits for another resource held by another process in the set.\n\n"
            "### 🛑 The 4 Necessary Coffman Conditions:\n"
            "1. **Mutual Exclusion:** At least one resource must be held in a non-shareable mode.\n"
            "2. **Hold and Wait:** A process holds at least one resource and is waiting to acquire additional resources.\n"
            "3. **No Preemption:** Resources cannot be forcibly confiscated; they are released only voluntarily.\n"
            "4. **Circular Wait:** A closed chain of processes exists such that each process waits for a resource held by the next process.\n\n"
            "### 🛡️ Handling Strategies:\n"
            "- **Prevention:** Structurally invalidate at least one Coffman condition (e.g., total resource ordering to eliminate circular wait).\n"
            "- **Avoidance:** **Banker's Algorithm** dynamically ensures system never enters an unsafe state.\n"
            "- **Detection & Recovery:** Resource allocation graph (RAG) cycle detection and process termination."
        )
    },
    "quicksort": {
        "title": "Quicksort Algorithm & Complexity Analysis",
        "subject": "Data Structures & Algorithms (CS301)",
        "content": (
            "**Quicksort** is an efficient divide-and-conquer comparison sorting algorithm based on partitioning an array around a selected pivot element.\n\n"
            "### ⚙️ Mechanics:\n"
            "1. **Pivot Selection:** Choose an element as pivot (Lomuto, Hoare, or Median-of-Three partitioning).\n"
            "2. **Partitioning:** Rearrange the array so elements $< pivot$ are on the left, and elements $\\ge pivot$ are on the right.\n"
            "3. **Recurse:** Recursively sort the sub-arrays.\n\n"
            "### ⏱️ Complexity Breakdown:\n"
            "- **Best Case:** **O(N log N)** when pivot splits array evenly.\n"
            "- **Average Case:** **O(N log N)**.\n"
            "- **Worst Case:** **O(N²)** when pivot is consistently the minimum or maximum element (mitigated by randomized pivot selection or Introsort).\n"
            "- **Space Complexity:** **O(log N)** auxiliary call stack space (in-place)."
        )
    },
    "binary search": {
        "title": "Binary Search Algorithm",
        "subject": "Data Structures & Algorithms (CS301)",
        "content": (
            "**Binary Search** is a search algorithm that finds the position of a target value within a **sorted array** by repeatedly halving the search interval.\n\n"
            "### ⚙️ Mechanics:\n"
            "1. Set `low = 0` and `high = length - 1`.\n"
            "2. Calculate `mid = low + (high - low) // 2` (prevents integer overflow).\n"
            "3. If `arr[mid] == target`, return `mid`.\n"
            "4. If `target < arr[mid]`, search left half: `high = mid - 1`.\n"
            "5. If `target > arr[mid]`, search right half: `low = mid + 1`.\n\n"
            "### ⏱️ Complexity:\n"
            "- **Time Complexity:** **O(log N)** logarithmic time.\n"
            "- **Space Complexity:** **O(1)** iterative, **O(log N)** recursive call stack."
        )
    },
    "photosynthesis": {
        "title": "Photosynthesis Biochemical Process",
        "subject": "General Science & Biology",
        "content": (
            "**Photosynthesis** is the biological process used by plants, algae, and cyanobacteria to convert light energy into chemical energy stored in glucose molecules.\n\n"
            "### 🧪 Chemical Equation:\n"
            "$$6CO_2 + 6H_2O + \\text{Light Energy} \\rightarrow C_6H_{12}O_6 + 6O_2$$\n\n"
            "### 🔬 Two Main Stages:\n"
            "1. **Light-Dependent Reactions (Thylakoid Membrane):** Chlorophyll absorbs photons, exciting electrons to produce ATP and NADPH while splitting $H_2O$ and releasing $O_2$.\n"
            "2. **Light-Independent Reactions / Calvin Cycle (Stroma):** Uses ATP and NADPH to fix atmospheric $CO_2$ into carbohydrates (G3P / glucose)."
        )
    },
    "tcp vs udp": {
        "title": "TCP vs UDP Protocol Comparison",
        "subject": "Computer Networks (CS310)",
        "content": (
            "Both **TCP** (Transmission Control Protocol) and **UDP** (User Datagram Protocol) operate at the **Transport Layer (Layer 4)** of the OSI/TCP-IP model.\n\n"
            "| Feature | TCP | UDP |\n"
            "|---|---|---|\n"
            "| **Connection** | Connection-oriented (3-way handshake) | Connectionless (fire and forget) |\n"
            "| **Reliability** | Guaranteed delivery (ACKs & retransmissions) | Best-effort; packets may drop or arrive out of order |\n"
            "| **Ordering** | In-order sequence numbering | No packet ordering |\n"
            "| **Header Overhead** | 20–60 bytes | 8 bytes (lightweight) |\n"
            "| **Flow / Congestion Control** | Yes (Sliding Window, Congestion Avoidance) | None |\n"
            "| **Common Use Cases** | Web (HTTP/HTTPS), File Transfer (FTP), Email | Video streaming, VoIP, Gaming, DNS lookups |"
        )
    },
    "process vs thread": {
        "title": "Processes vs Threads Architecture",
        "subject": "Operating Systems (CS304)",
        "content": (
            "### 🔄 Process vs Thread Comparison:\n"
            "- **Process:** An independent program in execution with its own dedicated virtual address space, file descriptors, and security context. Communication requires Inter-Process Communication (IPC: pipes, sockets, shared memory).\n"
            "- **Thread:** A lightweight unit of CPU execution within a process that shares the process's address space, code segment, and heap, but has its own independent **Stack, Program Counter (PC), and CPU Registers**.\n\n"
            "### ⚡ Trade-offs:\n"
            "- **Context Switching:** Switching between threads of the same process is significantly faster than switching between processes because virtual memory mappings and TLB caches remain valid.\n"
            "- **Fault Isolation:** A crash in one thread can corrupt shared heap memory and crash the entire process, whereas processes are isolated by hardware memory protection."
        )
    },
    "acid": {
        "title": "ACID Properties in Relational Databases",
        "subject": "Database Management Systems (CS308)",
        "content": (
            "The **ACID** properties guarantee that database transactions are processed reliably:\n\n"
            "- **A — Atomicity (\"All or Nothing\"):** The transaction executes completely or is entirely rolled back.\n"
            "- **C — Consistency:** A transaction transforms the database from one valid state satisfying all schema constraints to another valid state.\n"
            "- **I — Isolation:** Concurrent transactions execute without interfering with one another (implemented via isolation levels: Read Committed, Repeatable Read, Serializable).\n"
            "- **D — Durability:** Once committed, changes survive system crashes and power failures (persisted via Write-Ahead Logging — WAL)."
        )
    }
}

def generate_educational_fallback(topic: str) -> str:
    """Generates an academic, educational breakdown when a concept is asked."""
    clean_topic = topic.strip().title()
    return (
        f"### 📚 Academic Overview: **{clean_topic}**\n\n"
        f"Here is a structured academic conceptual breakdown for **{clean_topic}**:\n\n"
        f"1. **Core Concept & Definition:**\n"
        f"   - **{clean_topic}** represents a fundamental topic within higher education and collegiate coursework.\n"
        f"   - Understanding it requires grasping the underlying principles, theoretical foundations, and systematic behaviors that govern how systems or concepts operate.\n\n"
        f"2. **Key Methodologies & How It Works:**\n"
        f"   - **Analytical Principles:** Evaluates inputs, state transitions, and constraints to produce predictable outcomes.\n"
        f"   - **Problem Solving Application:** Used in engineering, computing, and natural sciences to simplify complex systems into manageable, verifiable components.\n\n"
        f"3. **Recommended Study Approach:**\n"
        f"   - Review lecture notes and primary textbook references.\n"
        f"   - Work through practical exercises and past exam question sets to solidify comprehension.\n"
        f"   - Formulate concise summary flashcards using active recall techniques.\n\n"
        f"*Feel free to ask for step-by-step mathematical derivations, algorithmic implementations, or practice problems on {clean_topic}!*"
    )

# ----------------- MAIN CAMPUS AGENT CLASS -----------------

class CampusAgent:
    def __init__(self, db: Session):
        self.db = db
        self.settings = get_current_ai_settings(db)

    def process_message(
        self, 
        message: str, 
        context: Optional[Dict[str, Any]] = None, 
        history: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        """Orchestrates intent understanding, tool execution, LLM synthesis, and response generation."""
        raw_query = message.strip()
        thought_process: List[str] = []
        tool_called: Optional[str] = None
        tool_input: Dict[str, Any] = {}
        tool_output: Any = None
        verified_sources: List[Dict[str, str]] = []
        is_error = False

        thought_process.append(f"Received query: '{raw_query}'")

        # Step 1: Multi-turn context resolution
        resolved_query, entity_context, resolution_thoughts = resolve_context_and_pronouns(raw_query, history)
        for t in resolution_thoughts:
            thought_process.append(t)

        # Step 2: Intent Classification
        intent = classify_intent(resolved_query)
        thought_process.append(f"Classified intent: {intent}")

        # Check API configuration if live mode is selected
        mode = self.settings["mode"]
        if mode in ["openai", "gemini"]:
            if not self.settings["has_key"]:
                thought_process.append(f"Mode is '{mode}', but no API key is configured. Halting execution.")
                return {
                    "response": (
                        f"⚠️ **AI Service Unavailable:** {mode.upper()} mode is selected, but no API key was configured.\n\n"
                        f"Please open **Settings** and add your {mode.upper()} API key, or switch back to the **Autonomous Demo Engine**."
                    ),
                    "thought_process": thought_process,
                    "tool_called": "missing_api_key",
                    "tool_input": {},
                    "tool_output": {"error": f"Missing API key for {mode}"},
                    "is_demo": False,
                    "is_error": True,
                    "verified_sources": []
                }

        # Step 3: Handle Intent & Tool Calling
        q_lower = resolved_query.lower()

        # --- A. USER PROFILE UPDATE ---
        if intent == "USER_PROFILE_UPDATE":
            name_match = re.search(r"^(?:hi\s+|hello\s+|hey\s+)?(?:i am|i'm|my name is|call me|this is)\s+([a-zA-Z\s]+)$", q_lower)
            student_name = name_match.group(1).strip().title() if name_match else "Student"
            thought_process.append(f"Updating student profile record to: '{student_name}'")
            tool_called = "update_student_profile"
            tool_input = {"student_name": student_name}
            
            settings_rec = self.db.query(UserSettings).first()
            if settings_rec:
                settings_rec.student_name = student_name
                self.db.commit()
                self.db.refresh(settings_rec)
                
            tool_output = {"success": True, "student_name": student_name}
            response = (
                f"Hello **{student_name}**! 👋 Great to meet you.\n\n"
                f"I've updated your student profile name to **{student_name}**. "
                f"How can I assist you with your campus schedule, upcoming assignments, or exam roadmaps today?"
            )

        # --- B. USER PROFILE QUERY ---
        elif intent == "USER_PROFILE_QUERY":
            thought_process.append("Querying student profile details from SQLite database...")
            tool_called = "get_student_profile"
            tool_input = {}
            settings_rec = self.db.query(UserSettings).first()
            s_name = settings_rec.student_name if settings_rec else "Alex Chen"
            s_id = settings_rec.student_id if settings_rec else "CS-2024-8842"
            s_major = settings_rec.major if settings_rec else "Computer Science & Engineering"
            s_sem = settings_rec.semester if settings_rec else "Semester 5 (Fall 2026)"
            s_email = settings_rec.email if settings_rec else "alex.chen@campus.edu"
            
            tool_output = {
                "student_name": s_name,
                "student_id": s_id,
                "major": s_major,
                "semester": s_sem,
                "email": s_email
            }
            response = (
                f"Here is your active student profile record:\n\n"
                f"- **Name:** {s_name}\n"
                f"- **Student ID:** `{s_id}`\n"
                f"- **Major / Program:** {s_major}\n"
                f"- **Current Semester:** {s_sem}\n"
                f"- **Campus Email:** `{s_email}`\n\n"
                f"You can modify any of these details in the **Settings** tab."
            )

        # --- C. AGENT IDENTITY ---
        elif intent == "AGENT_IDENTITY":
            thought_process.append("Explaining agent role, architecture, and tool capabilities...")
            tool_called = "explain_agent_capabilities"
            tool_output = {"agent": "CampusMate AI", "version": "1.0.0"}
            response = (
                f"I am **CampusMate AI**, your intelligent, agentic campus companion.\n\n"
                f"Unlike standard chatbots that only return generic text, I perform real actions on your campus workspace:\n"
                f"- 📝 **Manage Tasks & Deadlines:** Add homework, projects, and track completion.\n"
                f"- 📅 **Build Adaptive Study Plans:** Generate multi-day milestone roadmaps for upcoming exams.\n"
                f"- 📜 **Search Official College Policies (RAG):** Retrieve verified answers with citations directly from regulations handbooks.\n"
                f"- 📢 **Summarize Notices:** Extract actionable dates and requirements from university circulars.\n"
                f"- 🎪 **Clubs & Events:** Browse hackathons and sync RSVPs to your schedule.\n"
                f"- 🕒 **Class Timetable:** Check today's scheduled classes and labs."
            )

        # --- D. GREETING ---
        elif intent == "GREETING":
            settings_rec = self.db.query(UserSettings).first()
            s_name = settings_rec.student_name if settings_rec else "there"
            pending_tasks = self.db.query(Task).filter(Task.status != "Completed").count()
            thought_process.append(f"Generating personalized greeting for student {s_name}...")
            response = (
                f"Hello **{s_name}**! 👋\n\n"
                f"I'm here and ready to help you with your college academics.\n\n"
                f"You currently have **{pending_tasks} pending assignments/exams** in your queue. What would you like to work on right now?"
            )

        # --- E. COURTESY ---
        elif intent == "COURTESY":
            settings_rec = self.db.query(UserSettings).first()
            s_name = settings_rec.student_name if settings_rec else ""
            response = f"You're very welcome{', ' + s_name if s_name else ''}! 😊 Let me know whenever you need help with assignments, schedules, or study plans."

        # --- F. ENROLLED COURSES ---
        elif intent == "ENROLLED_COURSES":
            thought_process.append("Retrieving active enrolled courses from database...")
            tool_called = "get_enrolled_courses"
            task_courses = [c[0] for c in self.db.query(Task.course).distinct().all() if c[0] and c[0] != "General"]
            sched_courses = [s.title.split(":")[0].strip() for s in self.db.query(ScheduleItem).filter(ScheduleItem.category == "Class").all() if ":" in s.title]
            course_set = sorted(list(set(task_courses + sched_courses)))
            
            tool_output = {"courses": course_set}
            if course_set:
                course_lines = [f"- **{c}**" for c in course_set]
                response = (
                    f"Here are your active enrolled courses retrieved from your academic planner:\n\n"
                    + "\n".join(course_lines)
                    + "\n\nWould you like to view deadlines or create a study roadmap for any of these?"
                )
            else:
                response = "No enrolled courses are currently recorded in your planner. You can add tasks or import your course timetable via the **Tasks** tab."

        # --- G. TODAY'S STUDENT SCHEDULE ---
        elif intent == "STUDENT_SCHEDULE":
            thought_process.append("Executing tool 'get_student_schedule' for today's classes...")
            tool_called = "get_student_schedule"
            today_str = date.today().strftime("%Y-%m-%d")
            tool_input = {"date": today_str}
            tool_output = tools.tool_get_schedule(self.db, today_str)
            items = tool_output.get("schedule", [])
            thought_process.append(f"Retrieved {len(items)} scheduled items for today from database.")

            if items:
                lines = []
                for i in items:
                    done_mark = "✅ " if i['is_completed'] else "⏳ "
                    lines.append(f"{done_mark}**{i['start_time']} - {i['end_time']}**: {i['title']} ({i['category']} @ {i['location']})")
                response = (
                    f"Here is your official schedule for today (**{tool_output['date']}**):\n\n"
                    + "\n".join(lines)
                    + "\n\nYou can mark items completed and export calendar sync files from your **Dashboard**."
                )
            else:
                response = "No scheduled classes or events found for today. Enjoy your free time or schedule a study session!"

        # --- H. EXAM SCHEDULE ---
        elif intent == "EXAM_SCHEDULE":
            thought_process.append("Executing tool 'list_tasks' with category='Exam'...")
            tool_called = "list_exams"
            exams = self.db.query(Task).filter(Task.category == "Exam").order_by(Task.due_date.asc()).all()
            tool_output = [{"course": e.course, "title": e.title, "date": e.due_date, "priority": e.priority, "status": e.status} for e in exams]
            thought_process.append(f"Retrieved {len(exams)} scheduled exams from SQLite database.")

            if exams:
                exam_lines = []
                for e in exams:
                    status_mark = "✅ " if e.status == "Completed" else "🗓️ "
                    exam_lines.append(f"{status_mark}**{e.course}** — **{e.title}**: Due **{e.due_date}** [{e.priority} Priority]")
                response = (
                    f"Here is your examination schedule retrieved from your academic planner:\n\n"
                    + "\n".join(exam_lines)
                    + "\n\nWould you like me to generate a personalized day-by-day study plan for any of these exams?"
                )
            else:
                response = "No upcoming exams are currently scheduled in your task tracker."

        # --- I. LIST TASKS & DEADLINES ---
        elif intent == "LIST_TASKS":
            thought_process.append("Executing tool 'list_tasks' on SQLite database...")
            tool_called = "list_tasks"
            
            # Check if specific course was requested
            course_match = re.search(r'\b(CS\d+|MATH\d+|ENG\d+|EC\d+|EE\d+)\b', resolved_query, re.IGNORECASE)
            course_filter = course_match.group(1).upper() if course_match else None
            
            tool_input = {"status": "Pending", "course": course_filter} if course_filter else {"status": "Pending"}
            tool_output = tools.tool_list_tasks(self.db, status="Pending", course=course_filter)
            tasks = tool_output.get("tasks", [])
            thought_process.append(f"Retrieved {len(tasks)} pending tasks from SQLite.")

            if tasks:
                items_text = []
                for t in tasks[:6]:
                    items_text.append(f"- **{t['title']}** ({t['course']}) — Due **{t['due_date']}** [{t['priority']} Priority]")
                response = (
                    f"You have **{len(tasks)} pending tasks/deadlines**:\n\n"
                    + "\n".join(items_text)
                    + "\n\nYou can view and organize them in your **Tasks & Deadlines** tab."
                )
            else:
                course_text = f" for {course_filter}" if course_filter else ""
                response = f"You're all caught up! There are currently no pending tasks{course_text} in your planner."

        # --- J. CREATE TASK ---
        elif intent == "CREATE_TASK":
            thought_process.append("Executing tool 'create_task'...")
            tool_called = "create_task"
            
            course_match = re.search(r'\b(CS\d+|MATH\d+|ENG\d+|EC\d+|EE\d+)\b', resolved_query, re.IGNORECASE)
            course = course_match.group(1).upper() if course_match else "General"
            
            due_date = None
            if "tomorrow" in q_lower:
                due_date = (date.today() + timedelta(days=1)).strftime("%Y-%m-%d")
            elif "friday" in q_lower:
                today = date.today()
                days_ahead = (4 - today.weekday()) % 7
                due_date = (today + timedelta(days=days_ahead if days_ahead > 0 else 7)).strftime("%Y-%m-%d")
            else:
                date_match = re.search(r'(\d{4}-\d{2}-\d{2})', resolved_query)
                due_date = date_match.group(1) if date_match else (date.today() + timedelta(days=3)).strftime("%Y-%m-%d")

            title = raw_query
            for prefix in ["add task", "create task", "add assignment", "new task", "remind me to"]:
                if prefix in title.lower():
                    idx = title.lower().find(prefix) + len(prefix)
                    title = title[idx:].strip()
                    break
            title = re.sub(r'due (on|by).*', '', title, flags=re.IGNORECASE).strip()
            if not title:
                title = "New Academic Task"

            priority = "High" if any(w in q_lower for w in ["urgent", "high", "exam"]) else "Medium"
            category = "Exam" if "exam" in q_lower else ("Project" if "project" in q_lower else "Assignment")

            tool_input = {"title": title, "course": course, "due_date": due_date, "priority": priority, "category": category}
            tool_output = tools.tool_create_task(self.db, title=title, course=course, due_date=due_date, priority=priority, category=category)
            thought_process.append(f"Task successfully created in database with ID {tool_output['task']['id']}.")
            response = (
                f"I've added the new task **'{title}'** for **{course}** to your task list!\n\n"
                f"- **Due Date:** {due_date}\n"
                f"- **Priority:** {priority}\n"
                f"- **Category:** {category}\n\n"
                f"You can view and manage it anytime in your **Tasks & Deadlines** tab."
            )

        # --- K. COMPLETE TASK ---
        elif intent == "COMPLETE_TASK":
            thought_process.append("Executing tool 'complete_task'...")
            tool_called = "complete_task"
            num_match = re.search(r'\b(\d+)\b', resolved_query)
            if num_match:
                task_id = int(num_match.group(1))
                tool_output = tools.tool_complete_task(self.db, task_id)
                if tool_output.get("success"):
                    response = f"✅ Success: {tool_output['message']}"
                else:
                    response = f"Could not find a task with ID {task_id}. Please check your active tasks in the Tasks tab."
            else:
                pending = self.db.query(Task).filter(Task.status != "Completed").first()
                if pending:
                    tool_output = tools.tool_complete_task(self.db, pending.id)
                    response = f"✅ Marked your earliest pending task **'{pending.title}'** as Completed!"
                else:
                    response = "You have no pending tasks to mark as completed."

        # --- L. STUDY PLAN ---
        elif intent == "STUDY_PLAN":
            thought_process.append("Executing tool 'create_study_plan'...")
            tool_called = "create_study_plan"
            
            subject = "Computer Science"
            if "operating systems" in q_lower or "os" in q_lower or "cs304" in q_lower:
                subject = "Operating Systems (CS304)"
            elif "database" in q_lower or "dbms" in q_lower or "cs308" in q_lower:
                subject = "Database Management Systems (CS308)"
            elif "algorithm" in q_lower or "dsa" in q_lower or "cs301" in q_lower:
                subject = "Data Structures & Algorithms (CS301)"
            elif "math" in q_lower or "discrete" in q_lower:
                subject = "Discrete Mathematics (MATH201)"
                
            exam_date = (date.today() + timedelta(days=6)).strftime("%Y-%m-%d")
            topics = [
                "Unit 1: Core Fundamentals & Theory",
                "Unit 2: Algorithms & Architectures",
                "Unit 3: Problem Solving & Case Studies",
                "Unit 4: High-Yield Practice Sets",
                "Unit 5: Mock Exam & Comprehensive Review"
            ]
            tool_input = {"subject": subject, "target_exam_date": exam_date, "daily_hours": 2.5, "topics": topics}
            tool_output = tools.tool_create_study_plan(self.db, subject=subject, target_exam_date=exam_date, topics=topics, daily_hours=2.5)
            thought_process.append(f"Generated {tool_output['milestones_count']} daily study milestones.")
            response = (
                f"I have built a personalized **{tool_output['total_days']}-Day Study Roadmap** for **{subject}**!\n\n"
                f"- **Target Exam Date:** {exam_date}\n"
                f"- **Daily Commitment:** 2.5 Hours/day\n"
                f"- **Total Milestones:** {tool_output['milestones_count']} study sessions\n\n"
                f"**First 3 Sessions:**\n"
                + "\n".join([f"- **Day {m['day']} ({m['date']}):** {m['topic']}" for m in tool_output['milestones'][:3]])
                + f"\n\nCheck out the **Study Planner** tab to see your visual roadmap, track progress, and start the Focus Timer!"
            )

        # --- M. NOTICES & CIRCULARS ---
        elif intent == "SUMMARIZE_NOTICE":
            thought_process.append("Executing tool 'summarize_notice'...")
            tool_called = "summarize_notice"
            tool_input = {"query": resolved_query}
            tool_output = tools.tool_summarize_notice(self.db, query=resolved_query)
            
            if tool_output.get("success"):
                verified_sources.append({
                    "title": tool_output["title"],
                    "category": tool_output["category"],
                    "source": f"Issued by {tool_output['source']}",
                    "verified": "True"
                })
                actions = "\n".join([f"- {a}" for a in tool_output['action_items']]) if tool_output['action_items'] else "- Review notice details on campus portal"
                dates = ", ".join(tool_output['important_dates']) if tool_output['important_dates'] else "See full notice"
                response = (
                    f"Here is the verified summary for **'{tool_output['title']}'** (Issued: {tool_output['date']}):\n\n"
                    f"**Executive Summary:**\n{tool_output['summary']}\n\n"
                    f"**Key Dates:** {dates}\n\n"
                    f"**Action Items for Students:**\n{actions}"
                )
            else:
                response = "No matching campus notices were found. You can browse all announcements in the **Notices** tab."

        # --- N. CLUBS & EVENTS ---
        elif intent == "UPCOMING_EVENTS":
            thought_process.append("Executing tool 'get_upcoming_events'...")
            tool_called = "get_upcoming_events"
            tool_input = {}
            tool_output = tools.tool_get_upcoming_events(self.db)
            events = tool_output.get("events", [])
            thought_process.append(f"Retrieved {len(events)} upcoming events from database.")

            if events:
                event_items = []
                for e in events[:4]:
                    reg_status = "✓ Registered" if e['is_registered'] else "Open"
                    venue_txt = e.get("venue") or e.get("location") or "CCE Campus"
                    source_txt = f"[{e.get('source_name', 'CCE Official Portal')}]({e.get('source_url', 'https://cce.edu.in/')})"
                    verified_tag = "✓ Verified CCE Source" if e.get("is_verified", True) else "⚠️ Unverified Notice"
                    deadline_txt = f" | Deadline: {e['registration_deadline']}" if e.get("registration_deadline") else ""
                    
                    if e.get("is_verified", True):
                        verified_sources.append({
                            "title": e["title"],
                            "category": e.get("category", "Campus Event"),
                            "source": e.get("source_url", "https://cce.edu.in/"),
                            "verified": "True"
                        })

                    event_items.append(
                        f"- **{e['title']}** by *{e['club_name']}* ({e['category']})\n"
                        f"  🗓️ {e['date']} at {e['time']} | 📍 {venue_txt}{deadline_txt}\n"
                        f"  🔗 Source: {source_txt} • `{verified_tag}`"
                    )
                response = (
                    f"Here are verified events from **Christ College of Engineering (Autonomous), Irinjalakuda**:\n\n"
                    + "\n\n".join(event_items)
                    + "\n\nYou can RSVP and add them to your schedule in the **Clubs & Events** tab!"
                )
            else:
                response = "There are no campus events currently posted."

        # --- O. CAMPUS POLICIES (RAG) ---
        elif intent == "CAMPUS_POLICY_RAG":
            thought_process.append(f"Executing tool 'search_campus_documents' for policy query: '{resolved_query}'...")
            tool_called = "search_campus_documents"
            tool_input = {"query": resolved_query}
            tool_output = tools.tool_search_documents(self.db, resolved_query)
            results = tool_output.get("results", [])
            thought_process.append(f"Found {len(results)} verified document passages.")

            if results:
                top_hit = results[0]
                verified_sources.append({
                    "title": top_hit["title"],
                    "category": top_hit["category"],
                    "source": top_hit["source_file"],
                    "verified": "True"
                })
                response = (
                    f"According to the official **{top_hit['title']}** ({top_hit['category']}):\n\n"
                    f"> \"{top_hit['snippet']}\"\n\n"
                    f"**Summary:** {top_hit['summary']}\n\n"
                    f"*Source verified from official campus file: `{top_hit['source_file']}`.*"
                )
            else:
                response = "I checked our campus knowledge base but couldn't find an exact policy match. You can upload relevant handbook files in the **Campus Information** section."

        # --- P. SMART RECOMMENDATIONS ---
        elif intent == "SMART_RECOMMENDATION":
            thought_process.append("Executing tool 'generate_smart_recommendations'...")
            tool_called = "generate_smart_recommendations"
            tool_output = tools.tool_generate_smart_recommendations(self.db)
            thought_process.append(f"Derived advice category: {tool_output['action_type']}")
            response = (
                f"**CampusMate Academic Recommendation ({tool_output['action_type']}):**\n\n"
                f"{tool_output['recommendation']}\n\n"
                f"- **Pending Tasks:** {tool_output['pending_count']}\n"
                f"- **High Priority Items:** {tool_output['high_priority_count']}\n"
                f"- **Active Study Plans:** {tool_output['active_study_plans']}"
            )

        # --- Q. GENERAL EDUCATIONAL QUESTIONS ---
        else:
            thought_process.append("Recognized general educational/conceptual question. Answering directly without database lookup.")
            tool_called = "educational_reasoner"
            tool_input = {"question": resolved_query}

            # Check built-in educational concepts
            matched_key = None
            for key in EDUCATIONAL_KNOWLEDGE_BASE:
                if key in q_lower:
                    matched_key = key
                    break

            if matched_key:
                entry = EDUCATIONAL_KNOWLEDGE_BASE[matched_key]
                tool_output = {"concept": entry["title"], "subject": entry["subject"]}
                response = f"### 📖 {entry['title']}\n*Subject: {entry['subject']}*\n\n{entry['content']}"
            else:
                # Direct academic explanation
                topic = re.sub(r'^(what is|what are|explain|how does|how do|difference between|why is|tell me about|can you explain)\s+', '', q_lower, flags=re.IGNORECASE).strip()
                tool_output = {"topic": topic or resolved_query, "type": "educational_synthesis"}
                response = generate_educational_fallback(topic or resolved_query)

        # Step 4: If Live LLM is enabled (OpenAI or Gemini), synthesize genuine AI response!
        if self.settings["is_live"]:
            api_key = self.settings["active_key"]
            system_prompt = (
                f"You are CampusMate AI, a helpful, highly intelligent campus companion for college students.\n"
                f"Student: {self.settings['student_name']} (ID: {self.settings['student_id']}, Major: {self.settings['major']}, Semester: {self.settings['semester']}).\n"
                f"Enrolled courses: CS304 (Operating Systems), CS308 (Database Systems), CS301 (Algorithms), MATH201 (Discrete Math), CS320 (Software Eng).\n"
                f"Guidelines:\n"
                f"- Always give direct, exact, academically rigorous, and helpful answers.\n"
                f"- If answering about college tasks, exams, schedule, or events, use the verified application data provided.\n"
                f"- If answering an educational/conceptual question (computer science, math, science, engineering), provide a clear, accurate, in-depth explanation with examples and Markdown formatting."
            )

            thought_process.append(f"Sending prompt to live {mode.upper()} API...")
            live_response, error_msg = query_live_llm(
                mode=mode,
                api_key=api_key,
                system_prompt=system_prompt,
                user_query=resolved_query,
                history=history,
                context_data=tool_output
            )

            if error_msg:
                # NEVER fall back to hardcoded demo answers when live API fails!
                thought_process.append(f"Live API call failed: {error_msg}. Aborting live synthesis.")
                return {
                    "response": (
                        f"⚠️ **AI Service Unavailable:** Call to {mode.upper()} failed:\n> `{error_msg}`\n\n"
                        f"Please check your API key, billing quota, or network connection in **Settings**, or switch to the **Autonomous Demo Engine**."
                    ),
                    "thought_process": thought_process,
                    "tool_called": "api_error",
                    "tool_input": tool_input,
                    "tool_output": {"error": error_msg, "service": mode},
                    "is_demo": False,
                    "is_error": True,
                    "verified_sources": []
                }
            elif live_response:
                thought_process.append(f"Successfully received genuine AI response from {mode.upper()}.")
                response = live_response
                is_demo = False
            else:
                is_demo = True
        else:
            is_demo = True

        # Step 5: Save interaction to database for audit and history
        try:
            interaction = AgentInteraction(
                query=raw_query,
                thought_process=json.dumps(thought_process),
                tool_called=tool_called or "conversational_reasoner",
                tool_input=json.dumps(tool_input),
                tool_output=json.dumps(tool_output) if tool_output else "{}",
                response=response,
                is_demo=is_demo
            )
            self.db.add(interaction)
            self.db.commit()
        except Exception as e:
            self.db.rollback()

        return {
            "response": response,
            "thought_process": thought_process,
            "tool_called": tool_called,
            "tool_input": tool_input,
            "tool_output": tool_output,
            "is_demo": is_demo,
            "is_error": is_error,
            "verified_sources": verified_sources
        }
