import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Send, 
  Terminal, 
  CheckCircle2, 
  FileText, 
  Layers, 
  HelpCircle, 
  Zap, 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  ShieldCheck, 
  RotateCcw, 
  CheckSquare, 
  Calendar, 
  Ticket, 
  ArrowRight 
} from 'lucide-react';

const SUGGESTIONS = [
  "What assignments do I have due this week?",
  "What is the student attendance requirement for examinations?",
  "Add task Operating Systems Lab 5 due on 2026-11-06",
  "Create a study plan for Database Systems exam",
  "Summarize the mid-term examination notice",
  "What tech club events are happening this week?",
  "What is my schedule for today?"
];

export default function AIAssistant() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: "Hello! I am **CampusMate AI**, your academic assistant.\n\nI have direct access to your campus database, tasks, study roadmaps, club schedules, and official regulations. Ask me to manage deadlines, check your schedule, create study roadmaps, look up verified policies, or summarize notices!",
      thought_process: [
        "Agent initialized and connected to database.",
        "Tools active: query_academic_schedule, get_active_tasks, create_task, create_study_plan, search_campus_documents, get_upcoming_events."
      ],
      is_demo: false,
      verified_sources: []
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedThoughtId, setExpandedThoughtId] = useState(null);
  const [expandedToolId, setExpandedToolId] = useState(null);
  const [aiSettings, setAiSettings] = useState(null);
  const messagesEndRef = useRef(null);

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialPrompt = searchParams.get('prompt');
  const hasAutoFired = useRef(false);

  const fetchAiSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setAiSettings(data);
      }
    } catch (err) {
      console.error("Could not fetch AI settings:", err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    fetchAiSettings();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  useEffect(() => {
    if (initialPrompt && initialPrompt.trim() && !hasAutoFired.current) {
      hasAutoFired.current = true;
      handleSend(initialPrompt);
    }
  }, [initialPrompt]);

  const handleSend = async (userQuery) => {
    const query = userQuery || input;
    if (!query.trim() || isProcessing) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsProcessing(true);

    try {
      const history = messages.slice(-8).map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query, history })
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg = {
          id: Date.now() + 1,
          sender: 'assistant',
          text: data.response,
          thought_process: data.thought_process || [],
          tool_called: data.tool_called,
          tool_input: data.tool_input,
          tool_output: data.tool_output,
          is_demo: data.is_demo,
          is_error: data.is_error || false,
          verified_sources: data.verified_sources || []
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setExpandedThoughtId(assistantMsg.id);
      } else {
        const errData = await res.json().catch(() => ({}));
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'assistant',
            text: `⚠️ **Service Error:** ${errData.detail || "Encountered an issue communicating with the backend. Please try again."}`,
            is_demo: false,
            is_error: true
          }
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'assistant',
          text: "Network error: Unable to reach the campus agent service. Please ensure the backend server is running.",
          is_demo: true,
          is_error: true
        }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const studentDisplayName = aiSettings?.student_name ? `${aiSettings.student_name} (Student)` : 'Student';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', gap: '16px' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--primary-dark)', margin: 0 }}>
            CampusMate AI Assistant
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '2px', marginBottom: 0 }}>
            Conversational agent backed by your academic database and official institutional policies.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {aiSettings?.ai_mode === 'openai' ? (
            <span className="badge badge-success" style={{ fontSize: '11px', textTransform: 'none', backgroundColor: '#DCFCE7', color: '#166534', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Sparkles size={13} /> OpenAI (GPT-4o) Active
            </span>
          ) : aiSettings?.ai_mode === 'gemini' ? (
            <span className="badge badge-success" style={{ fontSize: '11px', textTransform: 'none', backgroundColor: '#DCFCE7', color: '#166534', border: '1px solid #BBF7D0', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Sparkles size={13} /> Google Gemini Active
            </span>
          ) : (
            <span className="badge badge-burgundy" style={{ fontSize: '11px', textTransform: 'none' }}>
              <Zap size={13} /> Campus Agent Engine
            </span>
          )}
          <button 
            onClick={() => setMessages([messages[0]])}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: '12px' }}
            title="Clear Chat History"
          >
            <RotateCcw size={13} /> Clear
          </button>
        </div>
      </div>

      {/* Chat Messages Container */}
      <div style={{
        flex: 1,
        backgroundColor: '#FFFFFF',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '24px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start'
            }}
          >
            {/* Sender Identifier */}
            <div style={{
              fontSize: '11px',
              fontWeight: '600',
              color: 'var(--text-secondary)',
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              {msg.sender === 'user' ? (
                <span>{studentDisplayName}</span>
              ) : (
                <>
                  <Sparkles size={13} color={msg.is_error ? "#DC2626" : "var(--primary)"} />
                  <span>CampusMate AI Agent</span>
                  {msg.is_error ? (
                    <span style={{ fontSize: '10px', color: '#991B1B', backgroundColor: '#FEE2E2', padding: '1px 5px', borderRadius: '4px' }}>
                      Service Alert
                    </span>
                  ) : msg.is_demo ? (
                    <span className="badge badge-demo" style={{ fontSize: '10px', padding: '1px 5px' }}>
                      Demo Mode
                    </span>
                  ) : (
                    <span style={{ fontSize: '10px', color: '#166534', backgroundColor: '#DCFCE7', padding: '1px 5px', borderRadius: '4px' }}>
                      Live DB
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Bubble */}
            <div style={{
              maxWidth: '85%',
              padding: '16px 20px',
              borderRadius: '12px',
              backgroundColor: msg.sender === 'user' ? 'var(--primary)' : (msg.is_error ? '#FEF2F2' : 'var(--bg-subtle)'),
              color: msg.sender === 'user' ? '#FFFFFF' : (msg.is_error ? '#7F1D1D' : 'var(--text-primary)'),
              border: msg.sender === 'user' ? 'none' : (msg.is_error ? '1px solid #FECACA' : '1px solid var(--border-color)'),
              fontSize: '14px',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap'
            }}>
              {msg.text}

              {/* Error Actions */}
              {msg.is_error && (
                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #FCA5A5' }}>
                  <button 
                    onClick={() => navigate('/settings')}
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: '#FFFFFF', color: '#991B1B', borderColor: '#FCA5A5' }}
                  >
                    Open Settings & Check AI Configuration &rarr;
                  </button>
                </div>
              )}

              {/* Verified Sources Badge & Citations */}
              {msg.verified_sources && msg.verified_sources.length > 0 && (
                <div style={{
                  marginTop: '14px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: '#166534', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <ShieldCheck size={14} /> Verified Campus Source Attributed
                  </div>
                  {msg.verified_sources.map((src, idx) => (
                    <div 
                      key={idx}
                      style={{
                        fontSize: '12px',
                        backgroundColor: '#DCFCE7',
                        border: '1px solid #BBF7D0',
                        color: '#166534',
                        padding: '6px 10px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span><strong>{src.title}</strong> ({src.category})</span>
                      <span style={{ fontSize: '11px', opacity: 0.85 }}>{src.source}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Embedded Interactive Action Card */}
              {msg.tool_called === 'create_task' && msg.tool_output?.task && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: 'var(--primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                      <CheckSquare size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--primary-dark)' }}>
                        {msg.tool_output.task.title}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        Course: {msg.tool_output.task.course} &bull; Due: {msg.tool_output.task.due_date}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate('/tasks')}
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '11px', whiteSpace: 'nowrap' }}
                  >
                    View in Tasks &rarr;
                  </button>
                </div>
              )}

              {msg.tool_called === 'create_study_plan' && msg.tool_output?.plan_id && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '6px', backgroundColor: 'var(--primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                      <Calendar size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--primary-dark)' }}>
                        {msg.tool_output.subject} Roadmap
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {msg.tool_output.total_days} Days &bull; Exam: {msg.tool_output.target_exam_date}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate('/study-planner')}
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '11px', whiteSpace: 'nowrap' }}
                  >
                    Open Roadmap &rarr;
                  </button>
                </div>
              )}

              {msg.tool_called === 'get_upcoming_events' && (
                <div style={{ marginTop: '12px' }}>
                  <button 
                    onClick={() => navigate('/clubs-events')}
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '11px' }}
                  >
                    Browse Campus Clubs & Events &rarr;
                  </button>
                </div>
              )}

              {msg.tool_called === 'search_campus_documents' && (
                <div style={{ marginTop: '12px' }}>
                  <button 
                    onClick={() => navigate('/campus-info')}
                    className="btn-secondary"
                    style={{ padding: '6px 12px', fontSize: '11px' }}
                  >
                    View Campus Knowledge Base &rarr;
                  </button>
                </div>
              )}
            </div>

            {/* Step-by-Step Agent Thought Process Accordion */}
            {msg.thought_process && msg.thought_process.length > 0 && (
              <div style={{
                marginTop: '8px',
                maxWidth: '85%',
                backgroundColor: 'var(--primary-subtle)',
                border: '1px solid #F8D7DA',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <button
                  onClick={() => setExpandedThoughtId(expandedThoughtId === msg.id ? null : msg.id)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--primary-dark)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Terminal size={14} color="var(--primary)" />
                    <span>Agent Reasoning & Database Calls ({msg.thought_process.length})</span>
                  </div>
                  {expandedThoughtId === msg.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {expandedThoughtId === msg.id && (
                  <div style={{ padding: '8px 14px 12px', borderTop: '1px solid #F8D7DA', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {msg.thought_process.map((step, idx) => (
                      <div key={idx} style={{ fontSize: '12px', color: 'var(--primary)', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <span style={{ color: 'var(--primary)', fontWeight: '700' }}>›</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tool Execution Details Accordion */}
            {msg.tool_called && (
              <div style={{
                marginTop: '6px',
                maxWidth: '85%',
                backgroundColor: '#FFFFFF',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                overflow: 'hidden'
              }}>
                <button
                  onClick={() => setExpandedToolId(expandedToolId === msg.id ? null : msg.id)}
                  style={{
                    width: '100%',
                    padding: '6px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: '600',
                    color: 'var(--text-secondary)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layers size={13} color="var(--primary)" />
                    <span>Tool Called: <code>{msg.tool_called}</code></span>
                  </div>
                  {expandedToolId === msg.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>

                {expandedToolId === msg.id && (
                  <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-subtle)', fontSize: '11px' }}>
                    <div style={{ marginBottom: '6px' }}>
                      <strong style={{ color: 'var(--primary-dark)' }}>Parameters:</strong>
                      <pre style={{ margin: '4px 0', padding: '6px', backgroundColor: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '4px', overflowX: 'auto' }}>
                        {JSON.stringify(msg.tool_input, null, 2)}
                      </pre>
                    </div>
                    {msg.tool_output && (
                      <div>
                        <strong style={{ color: 'var(--primary-dark)' }}>Execution Result:</strong>
                        <pre style={{ margin: '4px 0', padding: '6px', backgroundColor: '#FFFFFF', border: '1px solid var(--border-color)', borderRadius: '4px', overflowX: 'auto' }}>
                          {JSON.stringify(msg.tool_output, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {isProcessing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)', fontSize: '13px', padding: '8px 0' }}>
            <Sparkles size={16} className="animate-spin" />
            <span>Agent evaluating prompt, invoking tools, and querying database...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts Carousel / Chips */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {SUGGESTIONS.map((s, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(s)}
            disabled={isProcessing}
            style={{
              padding: '6px 14px',
              backgroundColor: '#FFFFFF',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              fontSize: '12px',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--primary-subtle)';
              e.currentTarget.style.borderColor = 'var(--primary)';
              e.currentTarget.style.color = 'var(--primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.borderColor = 'var(--border-color)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        style={{
          display: 'flex',
          gap: '10px',
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '8px 12px',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <input
          type="text"
          placeholder="Ask anything (e.g. 'Add an OS lab task due Friday', 'What is the attendance policy?')..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isProcessing}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: '14px',
            fontFamily: 'inherit',
            color: 'var(--text-primary)'
          }}
        />
        <button
          type="submit"
          disabled={isProcessing || !input.trim()}
          className="btn-primary"
          style={{
            padding: '8px 16px',
            opacity: (!input.trim() || isProcessing) ? 0.6 : 1
          }}
        >
          <Send size={15} /> Send
        </button>
      </form>
    </div>
  );
}
