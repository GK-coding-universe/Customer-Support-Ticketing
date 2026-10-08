require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { dbHelpers } = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'workshop_default_secret_key_2026';
const MINIMOTH_API_KEY = process.env.MINIMOTH_API_KEY ? process.env.MINIMOTH_API_KEY.trim() : '';

// In-memory demo OTP store for workshop fallback when no live Minimoth key is configured
const demoOtpStore = new Map();

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Helper to determine if Minimoth API key is real and configured
function isMinimothConfigured() {
  return (
    Boolean(MINIMOTH_API_KEY) &&
    !MINIMOTH_API_KEY.includes('your_minimoth_api_key_here') &&
    MINIMOTH_API_KEY.length > 5
  );
}

// Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, decodedUser) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired session token' });
    }
    req.user = decodedUser;
    next();
  });
}

// ==========================================
// 5 BACKEND API ENDPOINTS
// ==========================================

// 1. POST /api/auth/send-otp
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone || typeof phone !== 'string' || phone.trim().length < 8) {
      return res.status(400).json({ error: 'Valid phone number is required (min 8 digits)' });
    }

    const cleanPhone = phone.trim();

    if (isMinimothConfigured()) {
      // Live Minimoth API call
      try {
        const response = await fetch('https://api.minimoth.dev/v1/otp/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': MINIMOTH_API_KEY,
          },
          body: JSON.stringify({ phone: cleanPhone }),
        });

        const data = await response.json();
        if (!response.ok) {
          return res.status(response.status).json({
            error: data.message || data.error || 'Failed to send OTP via Minimoth',
          });
        }

        return res.json({
          success: true,
          message: 'OTP sent to your phone via Minimoth WhatsApp/SMS',
          provider: 'minimoth-live',
        });
      } catch (networkErr) {
        console.error('Minimoth network error:', networkErr);
        return res.status(502).json({ error: 'Unable to reach Minimoth OTP service' });
      }
    } else {
      // Demo / Workshop fallback mode
      const demoCode = '123456';
      demoOtpStore.set(cleanPhone, {
        code: demoCode,
        expiresAt: Date.now() + 10 * 60 * 1000,
      });

      console.log(`\n======================================================`);
      console.log(`[Minimoth Demo Mode] Phone: ${cleanPhone} | OTP Code: ${demoCode}`);
      console.log(`Add your MINIMOTH_API_KEY to backend/.env for live delivery`);
      console.log(`======================================================\n`);

      return res.json({
        success: true,
        message: 'OTP generated (Workshop Demo Mode: use 123456)',
        provider: 'minimoth-demo',
        demoOtp: demoCode,
      });
    }
  } catch (err) {
    console.error('send-otp error:', err);
    return res.status(500).json({ error: 'Internal server error while sending OTP' });
  }
});

// 2. POST /api/auth/verify-otp
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { phone, code, name } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ error: 'Phone and OTP code are required' });
    }

    const cleanPhone = phone.trim();
    const cleanCode = code.trim();

    let isVerified = false;

    if (isMinimothConfigured()) {
      // Live Minimoth verification
      try {
        const response = await fetch('https://api.minimoth.dev/v1/otp/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Api-Key': MINIMOTH_API_KEY,
          },
          body: JSON.stringify({ phone: cleanPhone, code: cleanCode }),
        });

        const data = await response.json();
        if (!response.ok || data.success === false) {
          return res.status(400).json({
            error: data.message || data.error || 'Invalid OTP code from Minimoth',
          });
        }
        isVerified = true;
      } catch (networkErr) {
        console.error('Minimoth verification network error:', networkErr);
        return res.status(502).json({ error: 'Unable to reach Minimoth verification service' });
      }
    } else {
      // Demo mode verification
      const record = demoOtpStore.get(cleanPhone);
      if (cleanCode === '123456' || (record && record.code === cleanCode && record.expiresAt > Date.now())) {
        isVerified = true;
        demoOtpStore.delete(cleanPhone);
      } else {
        return res.status(400).json({ error: 'Invalid or expired OTP code (Demo code is 123456)' });
      }
    }

    if (!isVerified) {
      return res.status(400).json({ error: 'OTP verification failed' });
    }

    // Find or create user
    let user = dbHelpers.findUserByPhone(cleanPhone);
    if (!user) {
      const defaultName = name && name.trim() ? name.trim() : `User ${cleanPhone.slice(-4)}`;
      user = dbHelpers.createUser(cleanPhone, defaultName);
    }

    // Sign JWT token
    const token = jwt.sign(
      { id: user.id, phone: user.phone, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
      },
    });
  } catch (err) {
    console.error('verify-otp error:', err);
    return res.status(500).json({ error: 'Internal server error while verifying OTP' });
  }
});

// 3. GET /api/tickets (Get all user tickets with message threads)
app.get('/api/tickets', authenticateToken, (req, res) => {
  try {
    const tickets = dbHelpers.getTicketsWithDetails(req.user.id);
    return res.json({ tickets });
  } catch (err) {
    console.error('get-tickets error:', err);
    return res.status(500).json({ error: 'Failed to retrieve tickets' });
  }
});

// 4. POST /api/tickets (Create a new support ticket)
app.post('/api/tickets', authenticateToken, (req, res) => {
  try {
    const { title, description, priority } = req.body;
    if (!title || !title.trim() || !description || !description.trim()) {
      return res.status(400).json({ error: 'Title and description are required' });
    }

    const cleanPriority = ['Low', 'Medium', 'High'].includes(priority) ? priority : 'Medium';
    const ticket = dbHelpers.createTicket(
      req.user.id,
      title.trim(),
      description.trim(),
      cleanPriority,
      req.user.name
    );

    return res.status(201).json({ ticket });
  } catch (err) {
    console.error('create-ticket error:', err);
    return res.status(500).json({ error: 'Failed to create ticket' });
  }
});

// 5. POST /api/tickets/:id/reply (Add message to ticket and optionally update status)
app.post('/api/tickets/:id/reply', authenticateToken, (req, res) => {
  try {
    const ticketId = parseInt(req.params.id, 10);
    const { message, status } = req.body;

    if (isNaN(ticketId)) {
      return res.status(400).json({ error: 'Invalid ticket ID' });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    const updatedTicket = dbHelpers.addMessage(
      ticketId,
      req.user.id,
      req.user.name,
      'customer',
      message.trim(),
      status
    );

    if (!updatedTicket) {
      return res.status(404).json({ error: 'Ticket not found or access unauthorized' });
    }

    return res.json({ ticket: updatedTicket });
  } catch (err) {
    console.error('reply-ticket error:', err);
    return res.status(500).json({ error: 'Failed to add message to ticket' });
  }
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`Customer Support Ticketing Backend running on http://localhost:${PORT}`);
  console.log(`Minimoth API configured: ${isMinimothConfigured() ? 'YES (Live Mode)' : 'NO (Demo Mode enabled)'}`);
});
