import io
import re
from typing import Dict, Any, List, Optional
from pypdf import PdfReader
from sqlalchemy.orm import Session
from models import CampusDocument, Notice

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """Extracts raw text from uploaded PDF bytes."""
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        text = ""
        for page in reader.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"
        return text.strip()
    except Exception as e:
        return f"Error reading PDF content: {str(e)}"

def extract_notice_bulletins(text: str) -> Dict[str, Any]:
    """Extracts summary, key dates, and actionable tasks from text using heuristic NLP extraction."""
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    
    # Extract dates (e.g. 25th Oct, 2026-11-05, Nov 12, etc.)
    date_patterns = [
        r'\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}(?:st|nd|rd|th)?,? \d{4}\b',
        r'\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b',
        r'\b\d{4}-\d{2}-\d{2}\b',
        r'\b(?:Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday),?\s+[A-Za-z]+ \d{1,2}\b'
    ]
    found_dates = []
    for pattern in date_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        found_dates.extend(matches)
    
    important_dates = list(dict.fromkeys(found_dates))[:5]  # unique and capped

    # Extract action items
    action_keywords = ["must", "submit", "register", "apply", "pay", "attend", "bring", "deadline", "mandatory", "required to"]
    action_items = []
    for line in lines:
        lower = line.lower()
        if any(ak in lower for ak in action_keywords) and len(line) > 15:
            clean_item = re.sub(r'^[•\-\*\d+\.\s]+', '', line)
            if clean_item not in action_items:
                action_items.append(clean_item)
                
    action_items = action_items[:5]

    # Generate concise summary
    summary_sentences = []
    for line in lines[:6]:
        if len(line) > 20 and not line.isupper() and not line.startswith("Page"):
            summary_sentences.append(line)
    
    summary = " ".join(summary_sentences[:3])
    if not summary:
        summary = text[:200] + "..." if len(text) > 200 else text

    return {
        "summary": summary,
        "action_items": action_items,
        "important_dates": important_dates
    }

def ingest_campus_document(
    db: Session,
    title: str,
    content: str,
    category: str = "Academic Policy",
    file_type: str = "PDF",
    source_file: str = ""
) -> CampusDocument:
    """Saves document into database with automatic summary generation."""
    analysis = extract_notice_bulletins(content)
    doc = CampusDocument(
        title=title,
        category=category,
        content=content,
        summary=analysis["summary"],
        file_type=file_type,
        source_file=source_file
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc
