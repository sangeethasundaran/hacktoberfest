import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopNavbar from './components/TopNavbar';
import Dashboard from './pages/Dashboard';
import AIAssistant from './pages/AIAssistant';
import StudyPlanner from './pages/StudyPlanner';
import Tasks from './pages/Tasks';
import Notices from './pages/Notices';
import ClubsEvents from './pages/ClubsEvents';
import CampusInfo from './pages/CampusInfo';
import Settings from './pages/Settings';
import './App.css';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userSettings, setUserSettings] = useState({
    student_name: 'Alex Chen',
    student_id: 'CS-2024-8842',
    major: 'Computer Science & Engineering',
    semester: 'Semester 5 (Fall 2026)',
    email: 'alex.chen@campus.edu',
    ai_mode: 'demo'
  });

  const loadSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setUserSettings(data);
      }
    } catch (err) {
      console.error('Could not fetch settings:', err);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return (
    <BrowserRouter>
      <div className="app-container">
        {/* Deep Navy Persistent Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          userSettings={userSettings}
        />

        {/* Main Content Area */}
        <div className="main-content">
          <TopNavbar
            onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
            userSettings={userSettings}
          />

          <main className="page-wrapper">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/assistant" element={<AIAssistant />} />
              <Route path="/study-planner" element={<StudyPlanner />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/notices" element={<Notices />} />
              <Route path="/clubs-events" element={<ClubsEvents />} />
              <Route path="/campus-info" element={<CampusInfo />} />
              <Route path="/settings" element={<Settings onSettingsUpdated={loadSettings} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
