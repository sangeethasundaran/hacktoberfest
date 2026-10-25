import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Sparkles, 
  GraduationCap, 
  CheckSquare, 
  Bell, 
  Users, 
  BookOpen, 
  Settings as SettingsIcon,
  Zap, 
  X
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/assistant', label: 'AI Assistant', icon: Sparkles, badge: 'Agent' },
  { path: '/study-planner', label: 'Study Planner', icon: GraduationCap },
  { path: '/tasks', label: 'Tasks & Deadlines', icon: CheckSquare },
  { path: '/notices', label: 'Notices', icon: Bell },
  { path: '/clubs-events', label: 'Clubs & Events', icon: Users },
  { path: '/campus-info', label: 'Campus Information', icon: BookOpen },
  { path: '/settings', label: 'Settings', icon: SettingsIcon },
];

export default function Sidebar({ isOpen, onClose, userSettings }) {
  const isDemo = !userSettings?.ai_mode || userSettings.ai_mode === 'demo';

  const getInitials = (name) => {
    if (!name) return 'AC';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 39, 68, 0.55)',
            zIndex: 90,
            backdropFilter: 'blur(3px)'
          }}
          className="md-hidden"
        />
      )}

      <aside 
        style={{
          width: '260px',
          backgroundColor: '#163A63',
          color: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          height: '100vh',
          position: 'sticky',
          top: 0,
          zIndex: 100,
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          transition: 'transform 0.25s ease',
          boxShadow: '2px 0 12px rgba(15, 39, 68, 0.15)'
        }}
        className={isOpen ? 'sidebar-open' : 'sidebar-closed'}
      >
        {/* Brand Header */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: '#2563EB',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.4)'
            }}>
              <Sparkles size={20} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontSize: '17px', fontWeight: '700', letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                CampusMate <span style={{ color: '#93C5FD', fontWeight: '500' }}>AI</span>
              </div>
              <div style={{ fontSize: '11px', color: '#BFDBFE', opacity: 0.9 }}>
                Student Productivity Platform
              </div>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="md-hidden"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#FFFFFF',
              cursor: 'pointer',
              padding: '4px'
            }}
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
          <div style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#93C5FD',
            padding: '4px 12px 10px 12px',
            fontWeight: '700'
          }}>
            Navigation
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className="sidebar-nav-link"
                  onClick={() => {
                    if (window.innerWidth < 768 && onClose) onClose();
                  }}
                  style={({ isActive }) => ({
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '13.5px',
                    fontWeight: isActive ? '700' : '500',
                    color: isActive ? '#163A63' : '#E2E8F0',
                    backgroundColor: isActive ? '#DBEAFE' : 'transparent',
                    boxShadow: isActive ? '0 1px 3px rgba(0, 0, 0, 0.12)' : 'none',
                    transition: 'all 0.15s ease'
                  })}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'inherit' }}>
                    <Icon size={18} style={{ color: 'inherit', flexShrink: 0 }} />
                    <span style={{ color: 'inherit', fontWeight: 'inherit' }}>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.15)',
                      color: '#FFFFFF',
                      fontSize: '10px',
                      padding: '2px 7px',
                      borderRadius: '4px',
                      fontWeight: '700',
                      letterSpacing: '0.03em'
                    }}>
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Bottom Profile & Mode Card */}
        <div style={{
          padding: '14px 16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: '#0F2744'
        }}>
          {/* Demo Mode / Live Mode Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: isDemo ? 'rgba(254, 243, 199, 0.12)' : 'rgba(221, 245, 229, 0.12)',
            border: isDemo ? '1px solid rgba(254, 243, 199, 0.25)' : '1px solid rgba(221, 245, 229, 0.25)',
            padding: '8px 10px',
            borderRadius: '8px',
            marginBottom: '10px'
          }}>
            {isDemo ? (
              <Zap size={14} color="#FDE68A" />
            ) : (
              <Sparkles size={14} color="#86EFAC" />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: isDemo ? '#FDE68A' : '#86EFAC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {isDemo ? 'Autonomous Agent' : 'Live AI Agent Connected'}
              </div>
              <div style={{ fontSize: '10px', color: '#93C5FD', opacity: 0.9 }}>
                {isDemo ? 'Local SQLite Database' : 'External LLM API active'}
              </div>
            </div>
          </div>

          {/* Student Profile Card */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              backgroundColor: '#DBEAFE',
              color: '#163A63',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '12px',
              flexShrink: 0
            }}>
              {getInitials(userSettings?.student_name)}
            </div>
            <div style={{ overflow: 'hidden', minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#FFFFFF', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {userSettings?.student_name || 'Alex Chen'}
              </div>
              <div style={{ fontSize: '11px', color: '#93C5FD' }}>
                {userSettings?.student_id || 'CS-2024-8842'}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
