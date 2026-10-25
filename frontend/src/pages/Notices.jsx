import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Upload, 
  Sparkles, 
  Calendar, 
  FileText, 
  ShieldCheck, 
  Filter, 
  CheckCircle2, 
  X,
  ExternalLink,
  AlertTriangle,
  Search
} from 'lucide-react';

export default function Notices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload Form
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('Academic');
  const [uploadSource, setUploadSource] = useState('Office of the Dean');
  const [uploadText, setUploadText] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const url = selectedCategory === 'All' ? '/api/notices' : `/api/notices?category=${encodeURIComponent(selectedCategory)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setNotices(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, [selectedCategory]);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadTitle.trim()) return;

    setIsUploading(true);
    try {
      if (uploadFile) {
        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('title', uploadTitle);
        formData.append('category', uploadCategory);
        formData.append('source', uploadSource);

        const res = await fetch('/api/notices/upload-pdf', {
          method: 'POST',
          body: formData
        });
        if (res.ok) {
          setShowUploadModal(false);
          resetUploadForm();
          fetchNotices();
        }
      } else {
        const res = await fetch('/api/notices', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: uploadTitle,
            category: uploadCategory,
            date: new Date().toISOString().split('T')[0],
            content: uploadText || "Campus administrative notice.",
            source: uploadSource
          })
        });
        if (res.ok) {
          setShowUploadModal(false);
          resetUploadForm();
          fetchNotices();
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadTitle('');
    setUploadCategory('Academic');
    setUploadSource('Office of the Dean');
    setUploadText('');
    setUploadFile(null);
  };

  const categories = ['All', 'Examination', 'Academic', 'Administrative', 'Placement', 'Hostel'];

  const filteredNotices = notices.filter(n => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return n.title.toLowerCase().includes(q) || (n.summary && n.summary.toLowerCase().includes(q));
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span className="badge badge-blue" style={{ fontSize: '11px', textTransform: 'uppercase' }}>
              Christ College of Engineering (Autonomous)
            </span>
            <span style={{ fontSize: '12px', color: '#64748B' }}>
              Examination Cell & Academic Circulars
            </span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#163A63', margin: 0 }}>
            Campus Notices & Circulars
          </h2>
          <p style={{ color: '#64748B', fontSize: '13px', marginTop: '2px', marginBottom: 0 }}>
            Official university circulars with automated AI summaries, key dates, and required action items.
          </p>
        </div>

        <button className="btn-primary" onClick={() => setShowUploadModal(true)}>
          <Upload size={15} /> Upload Notice / PDF
        </button>
      </div>

      {/* Toolbar: Category Tabs & Search Input */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="btn-secondary"
              style={{
                padding: '6px 14px',
                fontSize: '12.5px',
                backgroundColor: selectedCategory === cat ? '#DBEAFE' : '#FFFFFF',
                color: selectedCategory === cat ? '#163A63' : '#64748B',
                borderColor: selectedCategory === cat ? '#2563EB' : '#DCE5F0',
                fontWeight: selectedCategory === cat ? '700' : '500'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', minWidth: '220px' }}>
          <Search size={14} color="#64748B" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search circulars..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '30px', fontSize: '12.5px', padding: '6px 12px 6px 30px' }}
          />
        </div>
      </div>

      {/* Notices Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '20px'
      }}>
        {loading ? (
          <div style={{ padding: '40px', gridColumn: '1 / -1', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
            Loading notices...
          </div>
        ) : filteredNotices.length === 0 ? (
          <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
            <Bell className="empty-state-icon" />
            <div className="empty-state-title">
              No Notices Found
            </div>
            <div className="empty-state-desc">
              No circulars are currently available matching this category or search filter.
            </div>
            <button className="btn-primary" style={{ marginTop: '14px' }} onClick={() => setShowUploadModal(true)}>
              <Upload size={14} /> Upload First Circular
            </button>
          </div>
        ) : (
          filteredNotices.map((notice) => (
            <div
              key={notice.id}
              className="campus-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer',
                padding: '20px'
              }}
              onClick={() => setSelectedNotice(notice)}
            >
              <div>
                {/* Meta Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="badge badge-blue">
                      {notice.category}
                    </span>
                    {notice.is_sample && (
                      <span className="badge badge-demo">Demo</span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748B' }}>
                    <Calendar size={13} /> {notice.date}
                  </div>
                </div>

                {/* Title */}
                <h4 style={{ fontSize: '15.5px', fontWeight: '700', color: '#163A63', marginBottom: '8px', lineHeight: 1.35 }}>
                  {notice.title}
                </h4>

                {/* AI Executive Summary Snippet */}
                <p style={{ fontSize: '12.5px', color: '#64748B', lineHeight: 1.5, marginBottom: '14px' }}>
                  {notice.summary ? (
                    notice.summary.length > 140 ? notice.summary.substring(0, 140) + "..." : notice.summary
                  ) : (
                    notice.content.substring(0, 130) + "..."
                  )}
                </p>
              </div>

              {/* Bottom Actions & Verified Badge */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '12px',
                borderTop: '1px solid #DCE5F0',
                marginTop: '10px'
              }}>
                {notice.is_verified ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#166534', fontWeight: '600' }}>
                    <ShieldCheck size={14} color="#166534" /> Verified Circular
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#92400E', fontWeight: '600' }}>
                    <AlertTriangle size={14} color="#B45309" /> User Uploaded
                  </div>
                )}

                <button
                  className="btn-secondary"
                  style={{ padding: '4px 10px', fontSize: '11.5px' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNotice(notice);
                  }}
                >
                  <Sparkles size={12} color="#2563EB" /> AI Breakdown &rarr;
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Notice Detailed AI Breakdown */}
      {selectedNotice && (
        <div className="modal-overlay" onClick={() => setSelectedNotice(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ padding: '26px', maxWidth: '640px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <span className="badge badge-blue">{selectedNotice.category}</span>
                  {selectedNotice.is_sample && <span className="badge badge-demo">Demo Circular</span>}
                  <span style={{ fontSize: '12px', color: '#64748B' }}>Issued by {selectedNotice.source} &bull; {selectedNotice.date}</span>
                  {selectedNotice.is_verified ? (
                    <span style={{ fontSize: '11px', color: '#166534', backgroundColor: '#DCFCE7', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>
                      ✓ {selectedNotice.verification_notes || "Verified Official Publication"}
                    </span>
                  ) : (
                    <span style={{ fontSize: '11px', color: '#92400E', backgroundColor: '#FEF3C7', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>
                      ⚠️ {selectedNotice.verification_notes || "User Uploaded (Unverified)"}
                    </span>
                  )}
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#163A63', lineHeight: 1.3, marginBottom: '6px' }}>
                  {selectedNotice.title}
                </h3>
                {selectedNotice.source_url && (
                  <div style={{ fontSize: '12px' }}>
                    <a 
                      href={selectedNotice.source_url} 
                      target="_blank" 
                      rel="noreferrer" 
                      style={{ color: '#2563EB', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}
                    >
                      Official Reference <ExternalLink size={11} />
                    </a>
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelectedNotice(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* AI Summary Box */}
            <div style={{
              backgroundColor: '#EFF6FF',
              border: '1px solid #DBEAFE',
              borderRadius: '8px',
              padding: '14px',
              marginBottom: '18px'
            }}>
              <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#1E40AF', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Sparkles size={15} /> CampusMate AI Executive Summary
              </div>
              <p style={{ fontSize: '13px', color: '#172B4D', margin: 0, lineHeight: 1.55 }}>
                {selectedNotice.summary || "Summary automatically generated by database circular parser."}
              </p>
            </div>

            {/* Key Dates Section */}
            {selectedNotice.important_dates && selectedNotice.important_dates.length > 0 && (
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#163A63', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Calendar size={14} color="#2563EB" /> Key Deadlines & Dates
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {selectedNotice.important_dates.map((d, i) => (
                    <div key={i} style={{ fontSize: '12.5px', padding: '6px 10px', backgroundColor: '#FEF3C7', borderRadius: '6px', color: '#92400E', fontWeight: '500' }}>
                      🗓️ {d}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Items for Students */}
            {selectedNotice.action_items && selectedNotice.action_items.length > 0 && (
              <div style={{ marginBottom: '18px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#163A63', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <CheckCircle2 size={14} color="#166534" /> Required Action Items
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {selectedNotice.action_items.map((action, i) => (
                    <div key={i} style={{ fontSize: '12.5px', padding: '6px 10px', backgroundColor: '#DCFCE7', borderRadius: '6px', color: '#166534' }}>
                      ✓ {action}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full Official Content */}
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#163A63', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <FileText size={14} color="#64748B" /> Full Circular Text
              </div>
              <div style={{
                fontSize: '12.5px',
                color: '#172B4D',
                backgroundColor: '#F8FAFC',
                border: '1px solid #DCE5F0',
                borderRadius: '8px',
                padding: '12px 14px',
                maxHeight: '160px',
                overflowY: 'auto',
                lineHeight: 1.55
              }}>
                {selectedNotice.content}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Upload Notice / PDF */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#163A63', marginBottom: '8px' }}>
              Upload Notice or Circular
            </h3>

            <div style={{
              padding: '10px 12px',
              backgroundColor: '#FEF3C7',
              border: '1px solid #FDE68A',
              borderRadius: '6px',
              fontSize: '12px',
              color: '#92400E',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '8px',
              marginBottom: '14px'
            }}>
              <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>
                <strong>Verification Notice:</strong> Uploaded circulars are imported with an <em>"Unverified"</em> label until authenticated by college staff.
              </span>
            </div>

            <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#163A63', display: 'block', marginBottom: '5px' }}>
                  Notice Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Campus Placement Drive Schedule 2026"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#163A63', display: 'block', marginBottom: '5px' }}>
                    Category
                  </label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="form-select"
                  >
                    <option value="Examination">Examination</option>
                    <option value="Academic">Academic</option>
                    <option value="Administrative">Administrative</option>
                    <option value="Placement">Placement</option>
                    <option value="Hostel">Hostel</option>
                    <option value="Sports">Sports</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#163A63', display: 'block', marginBottom: '5px' }}>
                    Issuing Authority
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Office of Controller of Exams"
                    value={uploadSource}
                    onChange={(e) => setUploadSource(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#163A63', display: 'block', marginBottom: '5px' }}>
                  Upload PDF File (Optional)
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="form-input"
                  style={{ padding: '8px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#163A63', display: 'block', marginBottom: '5px' }}>
                  Or Paste Notice Text Directly
                </label>
                <textarea
                  rows={4}
                  value={uploadText}
                  onChange={(e) => setUploadText(e.target.value)}
                  className="form-input"
                  placeholder="Paste circular contents here..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowUploadModal(false)}
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={isUploading}>
                  {isUploading ? "Processing PDF..." : "Upload & Analyze with AI"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
