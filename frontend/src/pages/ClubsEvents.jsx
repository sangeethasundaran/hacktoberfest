import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Calendar, 
  Clock, 
  MapPin, 
  Check, 
  Plus, 
  Tag, 
  ExternalLink,
  Sparkles,
  Ticket
} from 'lucide-react';

export default function ClubsEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [activeTab, setActiveTab] = useState('events'); // 'events' | 'clubs'

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const url = selectedCategory === 'All' ? '/api/events' : `/api/events?category=${encodeURIComponent(selectedCategory)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setEvents(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [selectedCategory]);

  const handleToggleRegister = async (eventId) => {
    try {
      const res = await fetch(`/api/events/${eventId}/toggle-register`, { method: 'POST' });
      if (res.ok) {
        fetchEvents();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const categories = ['All', 'Technical', 'Cultural', 'Sports', 'Entrepreneurship'];

  const clubsDirectory = [
    {
      name: "ACM Student Chapter",
      category: "Technical",
      lead: "President: Maya Patel (CS '25)",
      meets: "Every Wednesday 6 PM @ CS Lab 2",
      description: "Fosters competitive programming, hackathons, and systems engineering. Hosts the flagship annual HackCampus."
    },
    {
      name: "Google Developer Student Club (GDSC)",
      category: "Technical",
      lead: "Lead: Rohan Sharma (IT '26)",
      meets: "Alternate Fridays 5 PM @ Innovation Hub",
      description: "Explores Generative AI, cloud architectures, and open-source software with Google developer resources."
    },
    {
      name: "E-Cell (Entrepreneurship Cell)",
      category: "Entrepreneurship",
      lead: "President: Ananya Deshmukh (ECE '25)",
      meets: "Tuesdays 6:30 PM @ Incubation Center",
      description: "Empowers student founders through pitch competitions, seed grant mentoring, and fireside talks with venture capitalists."
    },
    {
      name: "Cultural & Music Society",
      category: "Cultural",
      lead: "Secretary: Liam O'Connor (BioEng '26)",
      meets: "Thursdays 5:30 PM @ Amphitheatre",
      description: "The creative pulse of the campus featuring acoustic jam sessions, theatrical productions, and annual cultural fest."
    },
    {
      name: "University Sports Council",
      category: "Sports",
      lead: "Sports Sec: Marcus Vance (ME '25)",
      meets: "Daily 6 AM - 8 AM & 4 PM - 7 PM @ Sports Complex",
      description: "Coordinates inter-collegiate championships, football tournaments, badminton leagues, and athletics training."
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#163A63' }}>
            Campus Clubs & Life
          </h2>
          <p style={{ color: '#64748B', fontSize: '14px', marginTop: '4px' }}>
            Discover student organizations, hackathons, tech talks, and RSVP to add them to your schedule.
          </p>
        </div>

        {/* View Toggle */}
        <div style={{ display: 'flex', backgroundColor: '#EAF1FA', padding: '4px', borderRadius: '8px' }}>
          <button
            onClick={() => setActiveTab('events')}
            style={{
              padding: '6px 16px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '13px',
              fontWeight: activeTab === 'events' ? '600' : '400',
              backgroundColor: activeTab === 'events' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'events' ? '#163A63' : '#64748B',
              boxShadow: activeTab === 'events' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              cursor: 'pointer'
            }}
          >
            Upcoming Events
          </button>
          <button
            onClick={() => setActiveTab('clubs')}
            style={{
              padding: '6px 16px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '13px',
              fontWeight: activeTab === 'clubs' ? '600' : '400',
              backgroundColor: activeTab === 'clubs' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'clubs' ? '#163A63' : '#64748B',
              boxShadow: activeTab === 'clubs' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              cursor: 'pointer'
            }}
          >
            Clubs Directory
          </button>
        </div>
      </div>

      {activeTab === 'events' ? (
        <>
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

          {/* Events Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '20px'
          }}>
            {loading ? (
              <div style={{ padding: '40px', gridColumn: '1 / -1', textAlign: 'center', color: '#64748B' }}>
                Loading events...
              </div>
            ) : events.length === 0 ? (
              <div className="campus-card" style={{ padding: '40px', gridColumn: '1 / -1', textAlign: 'center', color: '#64748B' }}>
                No events found for this category.
              </div>
            ) : (
              events.map((event) => (
                <div
                  key={event.id}
                  className="campus-card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    {/* Club Header & Tag */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '12px', fontWeight: '700', color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {event.club_name}
                      </span>
                      <span className="badge badge-blue">
                        {event.category}
                      </span>
                    </div>

                    {/* Event Title */}
                    <h4 style={{ fontSize: '17px', fontWeight: '700', color: '#163A63', marginBottom: '10px', lineHeight: 1.3 }}>
                      {event.title}
                    </h4>

                    {/* Logistics */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px', color: '#64748B', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={14} color="#2563EB" /> <strong>{event.date}</strong> &bull; {event.time}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={14} color="#64748B" /> {event.location}
                      </div>
                    </div>

                    <p style={{ fontSize: '13px', color: '#172B4D', lineHeight: 1.5, marginBottom: '16px' }}>
                      {event.description}
                    </p>
                  </div>

                  {/* RSVP / Add to Schedule Action */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '14px',
                    borderTop: '1px solid #DCE5F0'
                  }}>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>
                      {event.is_registered ? "✓ Added to your Today's Schedule" : "Free Student Entry"}
                    </span>

                    <button
                      onClick={() => handleToggleRegister(event.id)}
                      className={event.is_registered ? "btn-secondary" : "btn-primary"}
                      style={{
                        padding: '8px 14px',
                        fontSize: '12px',
                        backgroundColor: event.is_registered ? '#DDF5E5' : '#2563EB',
                        color: event.is_registered ? '#166534' : '#FFFFFF',
                        borderColor: event.is_registered ? '#bbf7d0' : 'transparent'
                      }}
                    >
                      {event.is_registered ? (
                        <>
                          <Check size={14} /> RSVP Confirmed
                        </>
                      ) : (
                        <>
                          <Ticket size={14} /> RSVP & Add to Schedule
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        /* Clubs Directory Tab */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          {clubsDirectory.map((club, idx) => (
            <div key={idx} className="campus-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span className="badge badge-blue">{club.category}</span>
                <span style={{ fontSize: '12px', color: '#64748B' }}>Active Chapter</span>
              </div>

              <h4 style={{ fontSize: '18px', fontWeight: '700', color: '#163A63', marginBottom: '8px' }}>
                {club.name}
              </h4>

              <div style={{ fontSize: '12px', color: '#2563EB', fontWeight: '600', marginBottom: '4px' }}>
                {club.lead}
              </div>

              <div style={{ fontSize: '12px', color: '#64748B', marginBottom: '12px' }}>
                🗓️ {club.meets}
              </div>

              <p style={{ fontSize: '13px', color: '#172B4D', lineHeight: 1.5 }}>
                {club.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
