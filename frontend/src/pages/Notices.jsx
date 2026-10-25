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
  ExternalLink
} from 'lucide-react';

export default function Notices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
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

  const categories = ['All', 'Academic', 'Administrative', 'Placement', 'Hostel'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#163A63' }}>
            Campus Notices & Bulletins
          </h2>
          <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>
            Official university circulars with automated AI summaries, key dates, and actionable tasks.
          </p>
        </div>

        <button className="btn-primary" onClick={() => setShowUploadModal(true)}>
          <Upload size={16} /> Upload Official Notice / PDF
        </button>
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`btn-secondary ${selectedCategory === cat ? 'btn-active' : ''}`}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              backgroundColor: selectedCategory === cat ? '#DBEAFE' : '#FFFFFF',
              color: selectedCategory === cat ? '#163A63' : '#64748B',
              borderColor: selectedCategory === cat ? '#2563EB' : '#DCE5F0',
              fontWeight: selectedCategory === cat ? '600' : '400'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Notices Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '20px'
      }}>
        {loading ? (
          <div style={{ padding: '40px', gridColumn: '1 / -1', textAlign: 'center', color: '#64748B' }}>
            Loading notices...
          </div>
        ) : notices.length === 0 ? (
          <div className="campus-card" style={{ padding: '40px', gridColumn: '1 / -1', textAlign: 'center', color: '#64748B' }}>
            No notices found in this category.
          </div>
        ) : (
          notices.map((notice) => (
            <div
              key={notice.id}
              className="campus-card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                cursor: 'pointer'
              }}
              onClick={() => setSelectedNotice(notice)}
            >
              <div>
                {/* Meta Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span className="badge badge-blue">
                    {notice.category}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748B' }}>
                    <Calendar size={13} /> {notice.date}
                  </div>
                </div>

                {/* Title */}
                <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#163A63', marginBottom: '8px', lineHeight: 1.4 }}>
                  {notice.title}
                </h4>

                {/* AI Executive Summary Snippet */}
                <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5, marginBottom: '16px' }}>
                  {notice.summary ? (
                    notice.summary.length > 150 ? notice.summary.substring(0, 150) + "..." : notice.summary
                  ) : (
                    notice.content.substring(0, 140) + "..."
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
                marginTop: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#166534', fontWeight: '600' }}>
                  <ShieldCheck size={14} color="#166534" /> Verified Circular
                </div>

                <button
                  className="btn-tertiary"
                  style={{ padding: '4px 8px', fontSize: '12px' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNotice(notice);
                  }}
                >
                  <Sparkles size={13} /> AI Breakdown &rarr;
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Notice Detailed AI Breakdown */}
      {selectedNotice && (
        <div className="modal-overlay" onClick={() => setSelectedNotice(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()} style={{ padding: '28px', maxWidth: '680px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span className="badge badge-blue">{selectedNotice.category}</span>
                  <span style={{ fontSize: '12px', color: '#64748B' }}>Issued by {selectedNotice.source} &bull; {selectedNotice.date}</span>
                </div>
                <h3 style={{ fontSize: '19px', fontWeight: '700', color: '#163A63', lineHeight: 1.3 }}>
                  {selectedNotice.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedNotice(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* AI Summary Box */}
            <div style={{
              backgroundColor: '#EFF6FF',
              border: '1px solid #DBEAFE',
              borderRadius: '10px',
              padding: '16px',
              marginBottom: '20px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#1E40AF', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <Sparkles size={16} /> CampusMate AI Executive Summary
              </div>
              <p style={{ fontSize: '13px', color: '#172B4D', margin: 0, lineHeight: 1.6 }}>
                {selectedNotice.summary || "Summary automatically generated by agentic parser."}
              </p>
            </div>

            {/* Key Dates Section */}
            {selectedNotice.important_dates && selectedNotice.important_dates.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#163A63', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Calendar size={15} color="#2563EB" /> Key Deadlines & Dates
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {selectedNotice.important_dates.map((d, i) => (
                    <div key={i} style={{ fontSize: '13px', padding: '6px 10px', backgroundColor: '#FFF1CC', borderRadius: '6px', color: '#854D0E', fontWeight: '500' }}>
                      🗓️ {d}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Items for Students */}
            {selectedNotice.action_items && selectedNotice.action_items.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#163A63', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <CheckCircle2 size={15} color="#166534" /> Required Action Items
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {selectedNotice.action_items.map((action, i) => (
                    <div key={i} style={{ fontSize: '13px', padding: '6px 10px', backgroundColor: '#DDF5E5', borderRadius: '6px', color: '#166534' }}>
                      ✓ {action}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Full Official Content */}
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#163A63', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <FileText size={15} color="#64748B" /> Full Official Notice Text
              </div>
              <div style={{
                fontSize: '13px',
                color: '#172B4D',
                backgroundColor: '#F5F8FC',
                border: '1px solid #DCE5F0',
                borderRadius: '8px',
                padding: '12px 16px',
                maxHeight: '180px',
                overflowY: 'auto',
                lineHeight: 1.6
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
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#163A63', marginBottom: '16px' }}>
              Upload Official Notice or Circular
            </h3>

            <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#163A63', display: 'block', marginBottom: '6px' }}>
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
                  <label style={{ fontSize: '13px', fontWeight: '500', color: '#163A63', display: 'block', marginBottom: '6px' }}>
                    Category
                  </label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="form-select"
                  >
                    <option value="Academic">Academic</option>
                    <option value="Administrative">Administrative</option>
                    <option value="Placement">Placement</option>
                    <option value="Hostel">Hostel</option>
                    <option value="Sports">Sports</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '13px', fontWeight: '500', color: '#163A63', display: 'block', marginBottom: '6px' }}>
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
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#163A63', display: 'block', marginBottom: '6px' }}>
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
                <label style={{ fontSize: '13px', fontWeight: '500', color: '#163A63', display: 'block', marginBottom: '6px' }}>
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
