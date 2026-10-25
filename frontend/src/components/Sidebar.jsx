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
  ShieldAlert,
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

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(22, 58, 99, 0.5)',
            zIndex: 90,
            backdropFilter: 'blur(2px)'
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
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          transition: 'transform 0.25s ease',
          boxShadow: '2px 0 10px rgba(0,0,0,0.05)'
        }}
        className={isOpen ? 'sidebar-open' : 'sidebar-closed'}
      >
        {/* Brand Header */}
        <div style={{
          padding: '24px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(37, 99, 235, 0.4)'
            }}>
              <Sparkles size={22} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontSize: '18px', fontWeight: '700', letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                CampusMate <span style={{ color: '#DBEAFE', fontWeight: '500' }}>AI</span>
              </div>
              <div style={{ fontSize: '11px', color: '#DBEAFE', opacity: 0.8 }}>
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
            color: '#93c5fd',
            padding: '8px 12px 12px 12px',
            fontWeight: '600'
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
                    fontWeight: isActive ? '600' : '400',
                    color: isActive ? '#163A63' : 'rgba(255, 255, 255, 0.85)',
                    backgroundColor: isActive ? '#DBEAFE' : 'transparent',
                    transition: 'all 0.15s ease'
                  })}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span style={{
                      backgroundColor: 'rgba(37, 99, 235, 0.4)',
                      color: '#FFFFFF',
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: '600'
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
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          backgroundColor: 'rgba(0, 0, 0, 0.15)'
        }}>
          {/* Demo Mode / Live Mode Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: isDemo ? 'rgba(255, 241, 204, 0.15)' : 'rgba(221, 245, 229, 0.15)',
            border: isDemo ? '1px solid rgba(255, 241, 204, 0.3)' : '1px solid rgba(221, 245, 229, 0.3)',
            padding: '8px 10px',
            borderRadius: '8px',
            marginBottom: '12px'
          }}>
            {isDemo ? (
              <Zap size={15} color="#FFF1CC" />
            ) : (
              <Sparkles size={15} color="#DDF5E5" />
            )}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '11px', fontWeight: '600', color: isDemo ? '#FFF1CC' : '#DDF5E5' }}>
                {isDemo ? 'Autonomous Agent (Demo)' : 'Live AI Agent Connected'}
              </div>
              <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.7)' }}>
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
              backgroundColor: '#DBEAFE',
              color: '#163A63',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '14px'
            }}>
              AC
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#FFFFFF', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                {userSettings?.student_name || 'Alex Chen'}
              </div>
              <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.65)' }}>
                {userSettings?.student_id || 'CS-2024-8842'}
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
