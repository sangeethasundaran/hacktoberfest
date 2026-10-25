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
  { path: '/assistant', label: 'AI Assistant', icon: Sparkles, badge: 'Agentic' },
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
            backgroundColor: 'rgba(56, 7, 16, 0.55)',
            zIndex: 90,
            backdropFilter: 'blur(3px)'
          }}
          className="md-hidden"
        />
      )}

      <aside 
        style={{
          width: '260px',
          backgroundColor: '#380710',
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
          boxShadow: '2px 0 12px rgba(56, 7, 16, 0.15)'
        }}
        className={isOpen ? 'sidebar-open' : 'sidebar-closed'}
      >
        {/* Brand Header */}
        <div style={{
          padding: '24px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#7B1123',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(123, 17, 35, 0.4)'
            }}>
              <Sparkles size={22} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                CampusMate <span style={{ color: '#F3CCD3', fontWeight: '500' }}>AI</span>
              </div>
              <div style={{ fontSize: '11px', color: '#E5E7EB', opacity: 0.85 }}>
                Intelligent Companion
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
            color: '#FFFFFF',
            opacity: 0.85,
            padding: '8px 12px 12px 12px',
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
                    fontSize: '14px',
                    fontWeight: isActive ? '700' : '500',
                    color: isActive ? '#7B1123' : '#FFFFFF',
                    backgroundColor: isActive ? '#FFFFFF' : 'transparent',
                    boxShadow: isActive ? '0 2px 8px rgba(0, 0, 0, 0.2)' : 'none',
                    transition: 'all 0.15s ease'
                  })}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'inherit' }}>
                    <Icon size={18} style={{ color: 'inherit', flexShrink: 0 }} />
                    <span style={{ color: 'inherit', fontWeight: 'inherit' }}>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.22)',
                      color: '#FFFFFF',
                      fontSize: '10px',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: '700',
                      letterSpacing: '0.04em'
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
          padding: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundColor: 'rgba(0, 0, 0, 0.2)'
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
            marginBottom: '12px'
          }}>
            {isDemo ? (
              <Zap size={15} color="#FDE68A" />
            ) : (
              <Sparkles size={15} color="#DDF5E5" />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: isDemo ? '#FDE68A' : '#DDF5E5' }}>
                {isDemo ? 'Autonomous Agent (Demo)' : 'Live AI Agent Connected'}
              </div>
              <div style={{ fontSize: '10px', color: '#E5E7EB', opacity: 0.9 }}>
                {isDemo ? 'Tool calls active on SQLite' : 'External LLM API active'}
              </div>
            </div>
          </div>

          {/* Student Profile Card */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#FDF2F4',
              color: '#7B1123',
              border: '2px solid rgba(255, 255, 255, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '13px',
              flexShrink: 0
            }}>
              {getInitials(userSettings?.student_name)}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#FFFFFF', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {userSettings?.student_name || 'Alex Chen'}
              </div>
              <div style={{ fontSize: '11px', color: '#E5E7EB', opacity: 0.9 }}>
                {userSettings?.student_id || 'CS-2024-8842'}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
