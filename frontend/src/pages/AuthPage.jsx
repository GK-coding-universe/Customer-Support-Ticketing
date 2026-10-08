import { useState } from 'react';
import { api } from '../api';

export default function AuthPage({ onLoginSuccess }) {
  const [step, setStep] = useState('phone'); // 'phone' | 'otp'
  const [phone, setPhone] = useState('+91');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [demoCodeHint, setDemoCodeHint] = useState('');

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');
    setDemoCodeHint('');

    const trimmedPhone = phone.trim();
    if (!trimmedPhone || trimmedPhone.length < 8) {
      setError('Please enter a valid phone number (e.g. +919876543210)');
      return;
    }

    setLoading(true);
    try {
      const data = await api.sendOtp(trimmedPhone);
      setInfoMessage(data.message || 'OTP sent successfully!');
      if (data.demoOtp) {
        setDemoCodeHint(data.demoOtp);
        setOtp(data.demoOtp); // prefill for easy 1-click workshop testing
      }
      setStep('otp');
    } catch (err) {
      setError(err.message || 'Failed to send OTP. Please check phone number.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedOtp = otp.trim();
    if (!trimmedOtp || trimmedOtp.length < 4) {
      setError('Please enter the verification OTP code.');
      return;
    }

    setLoading(true);
    try {
      const data = await api.verifyOtp(phone.trim(), trimmedOtp, name.trim());
      onLoginSuccess(data.user);
    } catch (err) {
      setError(err.message || 'Invalid OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-content fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '75vh' }}>
      <div className="glass-card" style={{ maxWidth: '440px', width: '100%', padding: '2.5rem 2rem' }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '54px',
            height: '54px',
            margin: '0 auto 1rem',
            background: 'var(--accent-gradient)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--accent-glow)'
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: '0.4rem' }}>
            Customer Support Portal
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {step === 'phone'
              ? 'Enter your phone number to receive an instant OTP via Minimoth'
              : `Enter the code sent to ${phone}`}
          </p>
        </div>

        {/* Status Alerts */}
        {error && (
          <div className="alert alert-error">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <div>{error}</div>
          </div>
        )}

        {infoMessage && (
          <div className="alert alert-info">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="16" x2="12" y2="12"></line>
              <line x1="12" y1="8" x2="12.01" y2="8"></line>
            </svg>
            <div>
              {infoMessage}
              {demoCodeHint && (
                <div style={{ marginTop: '0.25rem', fontWeight: 700 }}>
                  Demo OTP code: <code style={{ background: 'rgba(0,0,0,0.3)', padding: '2px 6px', borderRadius: '4px' }}>{demoCodeHint}</code>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 1: Phone input */}
        {step === 'phone' ? (
          <form onSubmit={handleSendOtp}>
            <div className="form-group">
              <label className="form-label" htmlFor="phone-input">Phone Number</label>
              <input
                id="phone-input"
                type="tel"
                className="form-input"
                placeholder="+919876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoFocus
                required
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                Include country code (e.g., +91 for India, +1 for US/Canada)
              </span>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.8rem' }}
              disabled={loading}
            >
              {loading ? 'Sending OTP via Minimoth...' : 'Continue with OTP'}
            </button>
          </form>
        ) : (
          /* Step 2: OTP verification */
          <form onSubmit={handleVerifyOtp}>
            <div className="form-group">
              <label className="form-label" htmlFor="name-input">Your Full Name (Optional)</label>
              <input
                id="name-input"
                type="text"
                className="form-input"
                placeholder="e.g. Alex Johnson"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="otp-input">6-Digit Verification Code</label>
              <input
                id="otp-input"
                type="text"
                className="form-input"
                placeholder="123456"
                maxLength="6"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                style={{
                  letterSpacing: '0.3em',
                  textAlign: 'center',
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  fontFamily: 'monospace'
                }}
                autoFocus
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.8rem' }}
              disabled={loading}
            >
              {loading ? 'Verifying OTP...' : 'Verify & Enter Portal'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.25rem', fontSize: '0.85rem' }}>
              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                onClick={() => {
                  setStep('phone');
                  setError('');
                }}
              >
                ← Change Number
              </button>

              <button
                type="button"
                className="btn btn-outline"
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                onClick={handleSendOtp}
                disabled={loading}
              >
                Resend OTP
              </button>
            </div>
          </form>
        )}

        {/* Footer info pill */}
        <div style={{
          marginTop: '2rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          fontSize: '0.75rem',
          color: 'var(--text-dim)'
        }}>
          <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#6366f1' }}></span>
          Powered by Minimoth WhatsApp & SMS OTP
        </div>

      </div>
    </div>
  );
}
