import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  User, 
  Sparkles, 
  Shield, 
  RotateCcw, 
  CheckCircle2, 
  Zap, 
  Key, 
  Database,
  Cpu,
  Trash2,
  AlertTriangle
} from 'lucide-react';

export default function Settings({ onSettingsUpdated }) {
  const [settings, setSettings] = useState({
    student_name: 'Alex Chen',
    student_id: 'CS-2024-8842',
    major: 'Computer Science & Engineering',
    semester: 'Semester 5 (Fall 2026)',
    email: 'alex.chen@campus.edu',
    ai_mode: 'demo'
  });
  const [apiKey, setApiKey] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [clearSuccess, setClearSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...settings,
        ...(apiKey ? { api_key: apiKey } : {})
      };
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setSavedSuccess(true);
        setApiKey('');
        await fetchSettings();
        setTimeout(() => setSavedSuccess(false), 3000);
        if (onSettingsUpdated) onSettingsUpdated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearSampleData = async () => {
    if (!window.confirm("Purge all demonstration sample records? Your personal tasks, study plans, and custom schedule entries will be safely preserved.")) return;
    try {
      const res = await fetch('/api/clear-sample-data', { method: 'POST' });
      if (res.ok) {
        setClearSuccess(true);
        setTimeout(() => setClearSuccess(false), 4000);
        if (onSettingsUpdated) onSettingsUpdated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetData = async () => {
    if (!window.confirm("Restore default sample campus records? This will re-seed sample tasks and plans alongside existing data.")) return;
    try {
      const res = await fetch('/api/reset-data', { method: 'POST' });
      if (res.ok) {
        setResetSuccess(true);
        setTimeout(() => setResetSuccess(false), 3000);
        if (onSettingsUpdated) onSettingsUpdated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '900px' }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--primary-dark)', margin: 0 }}>
          System & AI Configuration
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px', marginBottom: 0 }}>
          Manage your student profile, configure AI execution mode, and manage database records.
        </p>
      </div>

      {savedSuccess && (
        <div style={{
          backgroundColor: '#DCFCE7',
          border: '1px solid #BBF7D0',
          color: '#166534',
          padding: '12px 18px',
          borderRadius: '8px',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={16} /> Preferences and configuration updated successfully!
        </div>
      )}

      {clearSuccess && (
        <div style={{
          backgroundColor: 'var(--primary-subtle)',
          border: '1px solid #F8D7DA',
          color: 'var(--primary)',
          padding: '12px 18px',
          borderRadius: '8px',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={16} /> Sample demonstration records removed. All user-created records preserved.
        </div>
      )}

      {resetSuccess && (
        <div style={{
          backgroundColor: '#DCFCE7',
          border: '1px solid #BBF7D0',
          color: '#166534',
          padding: '12px 18px',
          borderRadius: '8px',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <RotateCcw size={16} /> Campus database has been reset with demonstration seed records.
        </div>
      )}

      {/* AI Agent Configuration Card */}
      <div className="campus-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Sparkles size={20} color="var(--primary)" />
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--primary-dark)', margin: 0 }}>
            AI Agent Mode & Engine
          </h3>
        </div>

        <div style={{
          backgroundColor: settings.ai_mode === 'demo' ? 'var(--primary-subtle)' : '#DCFCE7',
          border: settings.ai_mode === 'demo' ? '1px solid #F8D7DA' : '1px solid #BBF7D0',
          borderRadius: '8px',
          padding: '14px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
        }}>
          {settings.ai_mode === 'demo' ? (
            <Zap size={20} color="var(--primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
          ) : (
            <Sparkles size={20} color="#166534" style={{ flexShrink: 0, marginTop: '2px' }} />
          )}
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: settings.ai_mode === 'demo' ? 'var(--primary)' : '#166534' }}>
              {settings.ai_mode === 'demo' ? 'Current Mode: Autonomous Agent Engine (Local Engine)' : 'Current Mode: Live External AI Service'}
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-primary)', margin: '4px 0 0 0', lineHeight: 1.5 }}>
              {settings.ai_mode === 'demo'
                ? "Operating in Autonomous Agent Mode. The system understands intents, queries SQLite, extracts tasks, generates study plans, and retrieves verified policies without requiring an external paid API key."
                : "The application is connected to an external LLM API for live agentic reasoning."}
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--primary-dark)', display: 'block', marginBottom: '6px' }}>
              Execution Mode
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: settings.ai_mode === 'demo' ? 'var(--primary-subtle)' : '#FFFFFF',
                borderColor: settings.ai_mode === 'demo' ? 'var(--primary)' : 'var(--border-color)'
              }}>
                <input
                  type="radio"
                  name="ai_mode"
                  value="demo"
                  checked={settings.ai_mode === 'demo'}
                  onChange={(e) => setSettings({ ...settings, ai_mode: e.target.value })}
                />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--primary-dark)' }}>Autonomous Engine</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Built-in rule & tool execution</div>
                </div>
              </label>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: settings.ai_mode === 'openai' ? 'var(--primary-subtle)' : '#FFFFFF',
                borderColor: settings.ai_mode === 'openai' ? 'var(--primary)' : 'var(--border-color)'
              }}>
                <input
                  type="radio"
                  name="ai_mode"
                  value="openai"
                  checked={settings.ai_mode === 'openai'}
                  onChange={(e) => setSettings({ ...settings, ai_mode: e.target.value })}
                />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--primary-dark)' }}>OpenAI (GPT-4o)</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Requires OPENAI_API_KEY</div>
                </div>
              </label>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: settings.ai_mode === 'gemini' ? 'var(--primary-subtle)' : '#FFFFFF',
                borderColor: settings.ai_mode === 'gemini' ? 'var(--primary)' : 'var(--border-color)'
              }}>
                <input
                  type="radio"
                  name="ai_mode"
                  value="gemini"
                  checked={settings.ai_mode === 'gemini'}
                  onChange={(e) => setSettings({ ...settings, ai_mode: e.target.value })}
                />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--primary-dark)' }}>Google Gemini</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Requires GEMINI_API_KEY</div>
                </div>
              </label>
            </div>
          </div>

          {settings.ai_mode !== 'demo' && (
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: 'var(--primary-dark)', display: 'block', marginBottom: '6px' }}>
                {settings.ai_mode === 'openai' ? 'OpenAI API Key' : 'Google Gemini API Key'}
              </label>
              <input
                type="password"
                placeholder={settings.has_api_key ? "•••••••• (Key configured — enter to overwrite)" : (settings.ai_mode === 'openai' ? "sk-..." : "AIzaSy...")}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="form-input"
              />
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                {settings.has_api_key 
                  ? "✓ An API key is active on the server. Enter a new key only if you wish to overwrite it."
                  : "An API key is required for genuine AI responses in this mode."}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className="btn-primary">
              Save AI Settings
            </button>
          </div>
        </form>
      </div>

      {/* Student Profile Card */}
      <div className="campus-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <User size={20} color="var(--primary)" />
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--primary-dark)', margin: 0 }}>
            Student Profile Details
          </h3>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                Full Name
              </label>
              <input
                type="text"
                value={settings.student_name}
                onChange={(e) => setSettings({ ...settings, student_name: e.target.value })}
                className="form-input"
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                Student ID
              </label>
              <input
                type="text"
                value={settings.student_id}
                onChange={(e) => setSettings({ ...settings, student_id: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                Major / Department
              </label>
              <input
                type="text"
                value={settings.major}
                onChange={(e) => setSettings({ ...settings, major: e.target.value })}
                className="form-input"
              />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
                Current Semester
              </label>
              <input
                type="text"
                value={settings.semester}
                onChange={(e) => setSettings({ ...settings, semester: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', display: 'block', marginBottom: '6px' }}>
              University Email
            </label>
            <input
              type="email"
              value={settings.email}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              className="form-input"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
            <button type="submit" className="btn-primary">
              Update Profile
            </button>
          </div>
        </form>
      </div>

      {/* System Diagnostics & Database Management */}
      <div className="campus-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Database size={20} color="var(--primary)" />
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--primary-dark)', margin: 0 }}>
            Database & Demonstration Data Management
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          <div style={{ padding: '12px', backgroundColor: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Backend API</div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#166534', marginTop: '2px' }}>
              ● FastAPI Online (Port 8000)
            </div>
          </div>
          <div style={{ padding: '12px', backgroundColor: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Database Engine</div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#166534', marginTop: '2px' }}>
              ● SQLite / campusmate.db
            </div>
          </div>
          <div style={{ padding: '12px', backgroundColor: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Agentic Tools</div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#166534', marginTop: '2px' }}>
              ● 10 Tools Loaded & Bound
            </div>
          </div>
        </div>

        {/* Clear Demonstration Data */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 0',
          borderTop: '1px solid var(--border-color)'
        }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--primary-dark)' }}>
              Clear Demonstration Records
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Removes sample tasks, demo roadmaps, and mock schedules. User-created records and uploaded documents are strictly preserved.
            </div>
          </div>

          <button
            onClick={handleClearSampleData}
            className="btn-secondary"
            style={{ color: '#991B1B', borderColor: '#FECACA', backgroundColor: '#FEF2F2' }}
          >
            <Trash2 size={14} /> Clear Demo Data
          </button>
        </div>

        {/* Restore Sample Data */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '16px',
          borderTop: '1px solid var(--border-color)'
        }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--primary-dark)' }}>
              Restore Sample Seed Records
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Re-populate sample courses, pending assignments, notices, and club events for testing and showcase.
            </div>
          </div>

          <button
            onClick={handleResetData}
            className="btn-secondary"
          >
            <RotateCcw size={14} /> Re-seed Demo Data
          </button>
        </div>
      </div>
    </div>
  );
}
