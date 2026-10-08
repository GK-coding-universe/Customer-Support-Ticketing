import { useState, useEffect } from 'react';
import { getStoredUser, clearSession } from './api';
import AuthPage from './pages/AuthPage';
import TicketsPage from './pages/TicketsPage';
import TicketDetailPage from './pages/TicketDetailPage';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activePage, setActivePage] = useState('tickets'); // 'tickets' | 'ticket-detail'
  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      setCurrentUser(user);
    }
  }, []);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setActivePage('tickets');
  };

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    setSelectedTicket(null);
    setActivePage('tickets');
  };

  const handleSelectTicket = (ticket) => {
    setSelectedTicket(ticket);
    setActivePage('ticket-detail');
  };

  const handleBackToTickets = () => {
    setSelectedTicket(null);
    setActivePage('tickets');
  };

  const handleTicketUpdated = (updatedTicket) => {
    setSelectedTicket(updatedTicket);
  };

  return (
    <div className="app-container">
      {/* Navigation Bar */}
      <header className="navbar">
        <div
          className="brand-wrap"
          onClick={() => {
            if (currentUser) handleBackToTickets();
          }}
        >
          <div className="brand-logo-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 9a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v2a2 2 0 0 0 0 4v2a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3v-2a2 2 0 0 0 0-4V9z"/>
            </svg>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="brand-title">Customer Support</span>
              <span className="brand-badge">Ticketing</span>
            </div>
          </div>
        </div>

        {currentUser ? (
          <div className="user-nav-actions">
            <div className="user-info-pill">
              <span className="user-avatar-dot"></span>
              <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{currentUser.name}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>({currentUser.phone})</span>
            </div>

            <button
              onClick={handleLogout}
              className="btn btn-outline"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
              title="Sign Out"
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.04)', padding: '4px 10px', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
              🔒 Minimoth OTP Auth
            </span>
          </div>
        )}
      </header>

      {/* Main Page Router (Maximum 3 Pages) */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {!currentUser ? (
          /* PAGE 1: Authentication (Minimoth OTP Login / Registration) */
          <AuthPage onLoginSuccess={handleLoginSuccess} />
        ) : activePage === 'ticket-detail' && selectedTicket ? (
          /* PAGE 3: Ticket Detail & Message Thread */
          <TicketDetailPage
            ticket={selectedTicket}
            onBack={handleBackToTickets}
            onTicketUpdated={handleTicketUpdated}
          />
        ) : (
          /* PAGE 2: Tickets Overview & Creation */
          <TicketsPage onSelectTicket={handleSelectTicket} />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '1.25rem',
        fontSize: '0.8rem',
        color: 'var(--text-dim)',
        borderTop: '1px solid var(--border-subtle)',
      }}>
        Customer Support Ticketing • Powered by Minimoth OTP Authentication
      </footer>
    </div>
  );
}
