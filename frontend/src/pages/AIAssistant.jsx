import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  RotateCcw
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
      text: "Hello Alex! I am **CampusMate AI**, your agentic campus companion.\n\nI don't just chat — I have direct access to your academic database, study tools, college bulletins, and official regulations. Ask me to manage deadlines, build study plans, search verified policies, or summarize notices!",
      thought_process: [
        "Agent initialized in Autonomous Agent Engine mode.",
        "Connected to SQLite database with 10 academic tools ready."
      ],
      is_demo: true,
      verified_sources: []
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedThoughtId, setExpandedThoughtId] = useState(null);
  const [expandedToolId, setExpandedToolId] = useState(null);
  const messagesEndRef = useRef(null);

  const [searchParams] = useSearchParams();
  const initialPrompt = searchParams.get('prompt');
  const hasAutoFired = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: query })
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
          verified_sources: data.verified_sources || []
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setExpandedThoughtId(assistantMsg.id); // Auto-expand latest thought process
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'assistant',
            text: "Sorry, I encountered an issue communicating with the backend tools. Please try again.",
            is_demo: true
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
          text: "Network error: Unable to reach the agentic server. Please ensure the backend is running.",
          is_demo: true
        }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 126px)', gap: '16px' }}>
      {/* Header Info Banner */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #DCE5F0',
        borderRadius: '12px',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            backgroundColor: '#EFF6FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#2563EB'
          }}>
            <Sparkles size={18} />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#163A63' }}>
              Campus Agent Intelligence Console
            </div>
            <div style={{ fontSize: '12px', color: '#64748B' }}>
              Structured Tool Calling &bull; Document RAG &bull; Verified Citations
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span className="badge badge-warning" style={{ fontSize: '11px', textTransform: 'none' }}>
            <Zap size={13} /> Demo Mode (Autonomous Agent Engine)
          </span>
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
        border: '1px solid #DCE5F0',
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
              color: '#64748B',
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              {msg.sender === 'user' ? (
                <span>Alex Chen (Student)</span>
              ) : (
                <>
                  <Sparkles size={13} color="#2563EB" />
                  <span>CampusMate AI Agent</span>
                  {msg.is_demo && (
                    <span style={{ fontSize: '10px', color: '#B45309', backgroundColor: '#FFF1CC', padding: '1px 5px', borderRadius: '4px' }}>
                      Agent Engine
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
              backgroundColor: msg.sender === 'user' ? '#163A63' : '#F5F8FC',
              color: msg.sender === 'user' ? '#FFFFFF' : '#172B4D',
              border: msg.sender === 'user' ? 'none' : '1px solid #DCE5F0',
              fontSize: '14px',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap'
            }}>
              {msg.text}

              {/* Verified Sources Badge & Citations */}
              {msg.verified_sources && msg.verified_sources.length > 0 && (
                <div style={{
                  marginTop: '14px',
                  paddingTop: '12px',
                  borderTop: '1px solid #DCE5F0',
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
                        backgroundColor: '#DDF5E5',
                        border: '1px solid #bbf7d0',
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
            </div>

            {/* Step-by-Step Agent Thought Process Accordion */}
            {msg.thought_process && msg.thought_process.length > 0 && (
              <div style={{
                marginTop: '8px',
                maxWidth: '85%',
                backgroundColor: '#EFF6FF',
                border: '1px solid #DBEAFE',
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
                    color: '#163A63'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Terminal size={14} color="#2563EB" />
                    <span>Agent Reasoning & Steps ({msg.thought_process.length})</span>
                  </div>
                  {expandedThoughtId === msg.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {expandedThoughtId === msg.id && (
                  <div style={{ padding: '8px 14px 12px', borderTop: '1px solid #DBEAFE', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {msg.thought_process.map((step, idx) => (
                      <div key={idx} style={{ fontSize: '12px', color: '#1E40AF', display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                        <span style={{ color: '#2563EB', fontWeight: '700' }}>›</span>
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
                border: '1px solid #DCE5F0',
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
                    color: '#64748B'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layers size={13} color="#2563EB" />
                    <span>Tool Called: <code>{msg.tool_called}</code></span>
                  </div>
                  {expandedToolId === msg.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>

                {expandedToolId === msg.id && (
                  <div style={{ padding: '8px 12px', borderTop: '1px solid #DCE5F0', backgroundColor: '#F8FAFC', fontSize: '11px' }}>
                    <div style={{ marginBottom: '6px' }}>
                      <strong style={{ color: '#163A63' }}>Parameters:</strong>
                      <pre style={{ margin: '4px 0', padding: '6px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '4px', overflowX: 'auto' }}>
                        {JSON.stringify(msg.tool_input, null, 2)}
                      </pre>
                    </div>
                    {msg.tool_output && (
                      <div>
                        <strong style={{ color: '#163A63' }}>Execution Result:</strong>
                        <pre style={{ margin: '4px 0', padding: '6px', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '4px', overflowX: 'auto' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#2563EB', fontSize: '13px', padding: '8px 0' }}>
            <Sparkles size={16} className="animate-spin" />
            <span>Agent evaluating goals, selecting tools, and querying database...</span>
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
              padding: '6px 12px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #DCE5F0',
              borderRadius: '20px',
              fontSize: '12px',
              color: '#163A63',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
              flexShrink: 0
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#EFF6FF'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FFFFFF'}
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
          border: '1px solid #DCE5F0',
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
            color: '#172B4D'
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
