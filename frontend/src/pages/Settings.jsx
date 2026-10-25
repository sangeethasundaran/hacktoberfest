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
  Cpu
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
        setTimeout(() => setSavedSuccess(false), 3000);
        if (onSettingsUpdated) onSettingsUpdated();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetData = async () => {
    if (!window.confirm("Restore sample campus data? This will reset all tasks, roadmaps, and notices to the clean demo state.")) return;
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
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#163A63' }}>
          System & AI Configuration
        </h2>
        <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>
          Manage your student profile, configure AI execution mode, and inspect system diagnostics.
        </p>
      </div>

      {savedSuccess && (
        <div style={{
          backgroundColor: '#DDF5E5',
          border: '1px solid #bbf7d0',
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

      {resetSuccess && (
        <div style={{
          backgroundColor: '#EFF6FF',
          border: '1px solid #DBEAFE',
          color: '#1E40AF',
          padding: '12px 18px',
          borderRadius: '8px',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <RotateCcw size={16} /> Campus database has been reset to official sample state.
        </div>
      )}

      {/* AI Agent Configuration Card */}
      <div className="campus-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Sparkles size={20} color="#2563EB" />
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#163A63' }}>
            AI Agent Mode & Engine
          </h3>
        </div>

        <div style={{
          backgroundColor: settings.ai_mode === 'demo' ? '#FFF1CC' : '#DDF5E5',
          border: settings.ai_mode === 'demo' ? '1px solid #fde047' : '1px solid #bbf7d0',
          borderRadius: '8px',
          padding: '14px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
        }}>
          {settings.ai_mode === 'demo' ? (
            <Zap size={20} color="#B45309" style={{ flexShrink: 0, marginTop: '2px' }} />
          ) : (
            <Sparkles size={20} color="#166534" style={{ flexShrink: 0, marginTop: '2px' }} />
          )}
          <div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: settings.ai_mode === 'demo' ? '#854D0E' : '#166534' }}>
              {settings.ai_mode === 'demo' ? 'Current Mode: Autonomous Agent Engine (Demo Mode)' : 'Current Mode: Live External AI Service'}
            </div>
            <p style={{ fontSize: '12px', color: '#172B4D', margin: '4px 0 0 0', lineHeight: 1.5 }}>
              {settings.ai_mode === 'demo'
                ? "The application is operating in fully-functional Autonomous Demo Mode. The agent understands intents, selects tools, writes tasks to SQLite, generates study plans, and retrieves verified policies without requiring an external paid API key."
                : "The application is connected to an external LLM API for live agentic reasoning."}
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#163A63', display: 'block', marginBottom: '6px' }}>
              Execution Mode
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                border: '1px solid #DCE5F0',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: settings.ai_mode === 'demo' ? '#EFF6FF' : '#FFFFFF',
                borderColor: settings.ai_mode === 'demo' ? '#2563EB' : '#DCE5F0'
              }}>
                <input
                  type="radio"
                  name="ai_mode"
                  value="demo"
                  checked={settings.ai_mode === 'demo'}
                  onChange={(e) => setSettings({ ...settings, ai_mode: e.target.value })}
                />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#163A63' }}>Autonomous Demo Engine</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Built-in rule & tool execution</div>
                </div>
              </label>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                border: '1px solid #DCE5F0',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: settings.ai_mode === 'openai' ? '#EFF6FF' : '#FFFFFF',
                borderColor: settings.ai_mode === 'openai' ? '#2563EB' : '#DCE5F0'
              }}>
                <input
                  type="radio"
                  name="ai_mode"
                  value="openai"
                  checked={settings.ai_mode === 'openai'}
                  onChange={(e) => setSettings({ ...settings, ai_mode: e.target.value })}
                />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#163A63' }}>OpenAI (GPT-4o)</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Requires OPENAI_API_KEY</div>
                </div>
              </label>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                border: '1px solid #DCE5F0',
                borderRadius: '8px',
                cursor: 'pointer',
                backgroundColor: settings.ai_mode === 'gemini' ? '#EFF6FF' : '#FFFFFF',
                borderColor: settings.ai_mode === 'gemini' ? '#2563EB' : '#DCE5F0'
              }}>
                <input
                  type="radio"
                  name="ai_mode"
                  value="gemini"
                  checked={settings.ai_mode === 'gemini'}
                  onChange={(e) => setSettings({ ...settings, ai_mode: e.target.value })}
                />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '600', color: '#163A63' }}>Google Gemini</div>
                  <div style={{ fontSize: '11px', color: '#64748B' }}>Requires GEMINI_API_KEY</div>
                </div>
              </label>
            </div>
          </div>

          {settings.ai_mode !== 'demo' && (
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#163A63', display: 'block', marginBottom: '6px' }}>
                Optional API Key
              </label>
              <input
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="form-input"
              />
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                Keys are never logged or exposed to the client.
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
          <User size={20} color="#2563EB" />
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#163A63' }}>
            Student Profile Details
          </h3>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '500', color: '#163A63', display: 'block', marginBottom: '6px' }}>
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
              <label style={{ fontSize: '13px', fontWeight: '500', color: '#163A63', display: 'block', marginBottom: '6px' }}>
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
              <label style={{ fontSize: '13px', fontWeight: '500', color: '#163A63', display: 'block', marginBottom: '6px' }}>
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
              <label style={{ fontSize: '13px', fontWeight: '500', color: '#163A63', display: 'block', marginBottom: '6px' }}>
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
            <label style={{ fontSize: '13px', fontWeight: '500', color: '#163A63', display: 'block', marginBottom: '6px' }}>
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

      {/* System Diagnostics & Database Reset */}
      <div className="campus-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Database size={20} color="#2563EB" />
          <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#163A63' }}>
            Diagnostics & Database Management
          </h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '20px' }}>
          <div style={{ padding: '12px', backgroundColor: '#F5F8FC', borderRadius: '8px', border: '1px solid #DCE5F0' }}>
            <div style={{ fontSize: '11px', color: '#64748B' }}>Backend API</div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#166534', marginTop: '2px' }}>
              ● FastAPI Online (Port 8000)
            </div>
          </div>
          <div style={{ padding: '12px', backgroundColor: '#F5F8FC', borderRadius: '8px', border: '1px solid #DCE5F0' }}>
            <div style={{ fontSize: '11px', color: '#64748B' }}>Database Engine</div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#166534', marginTop: '2px' }}>
              ● SQLite / campusmate.db
            </div>
          </div>
          <div style={{ padding: '12px', backgroundColor: '#F5F8FC', borderRadius: '8px', border: '1px solid #DCE5F0' }}>
            <div style={{ fontSize: '11px', color: '#64748B' }}>Agentic Tools</div>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#166534', marginTop: '2px' }}>
              ● 10 Tools Loaded & Bound
            </div>
          </div>
        </div>

        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: '16px',
          borderTop: '1px solid #DCE5F0'
        }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#163A63' }}>
              Restore Demo Database
            </div>
            <div style={{ fontSize: '12px', color: '#64748B' }}>
              Re-populate sample courses, pending assignments, notices, and club events.
            </div>
          </div>

          <button
            onClick={handleResetData}
            className="btn-secondary"
            style={{ color: '#2563EB', borderColor: '#2563EB' }}
          >
            <RotateCcw size={14} /> Reset Campus Data
          </button>
        </div>
      </div>
    </div>
  );
}
