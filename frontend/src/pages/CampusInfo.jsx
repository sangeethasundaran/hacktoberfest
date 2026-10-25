import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  Search, 
  Upload, 
  FileText, 
  ShieldCheck, 
  ExternalLink, 
  Sparkles, 
  X, 
  FileCheck2,
  FolderOpen,
  Send,
  HelpCircle,
  MessageSquare
} from 'lucide-react';

export default function CampusInfo() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Ask Document state
  const [docQuestion, setDocQuestion] = useState('');
  const [docAnswer, setDocAnswer] = useState(null);
  const [isAskingDoc, setIsAskingDoc] = useState(false);

  // Upload modal state
  const [docTitle, setDocTitle] = useState('');
  const [docCategory, setDocCategory] = useState('Academic Policy');
  const [docFile, setDocFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDocuments();
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = async (qToSearch) => {
    const q = qToSearch !== undefined ? qToSearch : searchQuery;
    if (!q.trim()) {
      setSearchResults(null);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch('/api/documents/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q })
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAskDocument = async (e) => {
    e.preventDefault();
    if (!docQuestion.trim() || !selectedDoc) return;
    setIsAskingDoc(true);
    try {
      const res = await fetch(`/api/documents/${selectedDoc.id}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: docQuestion })
      });
      if (res.ok) {
        const data = await res.json();
        setDocAnswer(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAskingDoc(false);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!docTitle.trim() || !docFile) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', docFile);
      formData.append('title', docTitle);
      formData.append('category', docCategory);

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        setShowUploadModal(false);
        setDocTitle('');
        setDocFile(null);
        fetchDocuments();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--primary-dark)' }}>
            Campus Information & Knowledge Base
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>
            Source-backed repository for academic regulations, attendance policies, handbooks, and course syllabi.
          </p>
        </div>

        <button className="btn-primary" onClick={() => setShowUploadModal(true)}>
          <Upload size={16} /> Ingest New Document / PDF
        </button>
      </div>

      {/* Search Bar */}
      <div className="campus-card" style={{ padding: '20px' }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch();
          }}
          style={{ display: 'flex', gap: '12px', alignItems: 'center' }}
        >
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Search policies (e.g. '75% attendance rule', 'late submission penalties', 'library hours')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingLeft: '40px', fontSize: '15px' }}
            />
          </div>

          <button type="submit" className="btn-primary" disabled={isSearching} style={{ padding: '10px 20px' }}>
            {isSearching ? "Searching..." : "Search RAG"}
          </button>

          {searchResults && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setSearchResults(null);
                setSearchQuery('');
              }}
            >
              Reset
            </button>
          )}
        </form>
      </div>

      {/* Search Results if active */}
      {searchResults && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--primary)" />
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: 'var(--primary-dark)' }}>
              RAG Matches for "{searchResults.query}" ({searchResults.results_count})
            </h3>
          </div>

          {searchResults.results.length === 0 ? (
            <div className="empty-state">
              <BookOpen className="empty-state-icon" />
              <div className="empty-state-title">No Document Matches Found</div>
              <div className="empty-state-desc">
                No policy matches found for your query. Try broader keywords like "attendance", "grading", or "regulations".
              </div>
            </div>
          ) : (
            searchResults.results.map((hit) => (
              <div
                key={hit.id}
                className="campus-card"
                style={{
                  borderLeft: '4px solid var(--primary)',
                  padding: '20px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="badge badge-blue">{hit.category}</span>
                    <span style={{ fontSize: '12px', color: '#166534', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ShieldCheck size={14} /> Verified Source: {hit.source_file}
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Relevance Score: {hit.score}
                  </span>
                </div>

                <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--primary-dark)', marginBottom: '8px' }}>
                  {hit.title}
                </h4>

                <div style={{
                  fontSize: '13px',
                  backgroundColor: 'var(--primary-subtle)',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  fontStyle: 'italic',
                  marginBottom: '10px',
                  lineHeight: 1.5
                }}>
                  "{hit.snippet}"
                </div>

                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: 0 }}>
                  <strong>Summary:</strong> {hit.summary}
                </p>
              </div>
            ))
          )}
        </div>
      )}

      {/* All Documents Repository Grid */}
      <div>
        <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--primary-dark)', marginBottom: '16px' }}>
          Official Documents Repository ({documents.length})
        </h3>

        {documents.length === 0 ? (
          <div className="empty-state">
            <BookOpen className="empty-state-icon" />
            <div className="empty-state-title">No Documents Ingested Yet</div>
            <div className="empty-state-desc">
              Upload institutional policies, syllabi, or student handbooks to allow CampusMate AI to answer grounded questions.
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '20px'
          }}>
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="campus-card card-interactive"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedDoc(doc)}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span className="badge badge-blue">{doc.category}</span>
                    <span className="badge badge-neutral" style={{ fontSize: '10px' }}>{doc.file_type}</span>
                  </div>

                  <h4 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--primary-dark)', marginBottom: '8px', lineHeight: 1.4 }}>
                    {doc.title}
                  </h4>

                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '14px' }}>
                    {doc.summary}
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-color)',
                  fontSize: '12px',
                  color: 'var(--primary)',
                  fontWeight: '600'
                }}>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '11px' }}>
                    {doc.source_file || `${doc.title}.pdf`}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Read Content &rarr;
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal: Document Detail */}
      {selectedDoc && (
        <div className="modal-overlay" onClick={() => {
          setSelectedDoc(null);
          setDocAnswer(null);
          setDocQuestion('');
        }}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ padding: '28px', maxWidth: '700px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <span className="badge badge-blue" style={{ marginBottom: '6px' }}>{selectedDoc.category}</span>
                <h3 style={{ fontSize: '19px', fontWeight: '700', color: 'var(--primary-dark)' }}>
                  {selectedDoc.title}
                </h3>
                <div style={{ fontSize: '12px', color: '#166534', fontWeight: '600', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={14} /> Official Verified Source: {selectedDoc.source_file}
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedDoc(null);
                  setDocAnswer(null);
                  setDocQuestion('');
                }}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* AI Summary */}
            <div style={{
              backgroundColor: 'var(--primary-subtle)',
              border: '1px solid #DBEAFE',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '13px',
              color: 'var(--primary-dark)',
              marginBottom: '16px',
              lineHeight: 1.5
            }}>
              <strong>Document Summary:</strong> {selectedDoc.summary}
            </div>

            {/* Full text content */}
            <div style={{
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-color)',
              borderRadius: '8px',
              padding: '16px',
              maxHeight: '260px',
              overflowY: 'auto',
              fontSize: '13px',
              lineHeight: 1.6,
              color: 'var(--text-primary)',
              whiteSpace: 'pre-wrap',
              marginBottom: '18px'
            }}>
              {selectedDoc.content}
            </div>

            {/* Interactive Ask This Document Section */}
            <div style={{
              borderTop: '1px solid var(--border-color)',
              paddingTop: '18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} color="var(--primary)" /> Ask CampusMate About This Document
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/assistant?prompt=${encodeURIComponent(`According to the official ${selectedDoc.title}: what are the key requirements?`)}`)}
                  className="btn-secondary"
                  style={{ padding: '2px 8px', fontSize: '11px' }}
                >
                  Open in AI Assistant &rarr;
                </button>
              </div>

              <form onSubmit={handleAskDocument} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Ask a question (e.g. 'What is the attendance condonation criteria?')..."
                  value={docQuestion}
                  onChange={(e) => setDocQuestion(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '13px' }}
                />
                <button 
                  type="submit" 
                  disabled={isAskingDoc || !docQuestion.trim()} 
                  className="btn-primary"
                  style={{ padding: '8px 14px', fontSize: '13px', whiteSpace: 'nowrap' }}
                >
                  <Send size={14} /> {isAskingDoc ? "Searching..." : "Ask Document"}
                </button>
              </form>

              {docAnswer && (
                <div style={{
                  backgroundColor: '#DCFCE7',
                  border: '1px solid #BBF7D0',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  fontSize: '13px',
                  color: '#166534',
                  lineHeight: 1.5
                }}>
                  <div style={{ fontWeight: '700', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ShieldCheck size={14} /> Grounded Answer ({docAnswer.source_file}):
                  </div>
                  <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                    {docAnswer.answer}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Ingest New Document */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--primary-dark)', marginBottom: '16px' }}>
              Ingest Document into Campus Knowledge Base
            </h3>

            <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Computer Science Department Syllabus 2026"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="form-input"
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  Document Category
                </label>
                <select
                  value={docCategory}
                  onChange={(e) => setDocCategory(e.target.value)}
                  className="form-select"
                >
                  <option value="Academic Policy">Academic Policy</option>
                  <option value="Syllabus">Syllabus</option>
                  <option value="Handbook">Handbook</option>
                  <option value="Examination Regulations">Examination Regulations</option>
                  <option value="Campus Facilities">Campus Facilities</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                  Select File (PDF or TXT) *
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.txt,.md"
                  onChange={(e) => setDocFile(e.target.files[0])}
                  className="form-input"
                  style={{ padding: '8px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowUploadModal(false)}
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isUploading}>
                  {isUploading ? "Ingesting & Indexing..." : "Upload & Index with RAG"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
