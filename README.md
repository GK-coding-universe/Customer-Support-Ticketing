# Customer Support Ticketing

A minimalist, high-performance full-stack customer support ticketing system designed for workshops and rapid deployment. Built with **React** on the frontend, **Node.js (Express)** on the backend, built-in **SQLite** for zero-dependency persistence, and secured with **Minimoth OTP** (WhatsApp & SMS delivery).

---

## ⚡ Workshop Architecture & Constraints

| Constraint | Limit | Implementation |
| :--- | :--- | :--- |
| **Frontend Pages** | Max 3 | 1. **AuthPage** (Minimoth Phone OTP)<br>2. **TicketsPage** (Ticket list, metrics, filter & creation modal)<br>3. **TicketDetailPage** (Ticket discussion thread, status resolver & replies) |
| **Backend API Endpoints** | Max 5 | 1. `POST /api/auth/send-otp`<br>2. `POST /api/auth/verify-otp`<br>3. `GET /api/tickets`<br>4. `POST /api/tickets`<br>5. `POST /api/tickets/:id/reply` |
| **Database Entities** | Max 3 | 1. `users` (id, phone, name, created_at)<br>2. `tickets` (id, user_id, title, description, priority, status, created_at, updated_at)<br>3. `messages` (id, ticket_id, sender_name, sender_role, message, created_at) |
| **Authentication** | Minimoth | WhatsApp-first OTP verification with SMS fallback + built-in workshop demo mode |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (v18 or higher recommended; v24 uses built-in `node:sqlite`)
- **npm** (comes with Node.js)

---

### 1. Backend Setup

```bash
cd backend
npm install
```

#### Configure Environment Variables:
Create `.env` inside `backend/` (or copy from `.env.example`):
```bash
cp .env.example .env
```

`backend/.env`:
```env
PORT=5000
# Leave empty for instant workshop demo mode (code: 123456)
# Or add your key from https://minimoth.dev
MINIMOTH_API_KEY=mm_live_your_actual_key_here
JWT_SECRET=super_secret_workshop_jwt_key_2026
```

> **Note for Workshop Attendees:** If you haven't signed up for a Minimoth API key yet, you can leave `MINIMOTH_API_KEY` empty. The backend will automatically run in **Workshop Demo Mode**, printing test OTPs (`123456`) directly to the console and UI for instant evaluation.

#### Run Backend Server:
```bash
npm run dev
# or
node server.js
```
The backend starts at `http://localhost:5000`.

---

### 2. Frontend Setup

In a new terminal window:
```bash
cd frontend
npm install
```

#### Configure Environment Variables:
Create `.env` inside `frontend/` (or copy from `.env.example`):
```bash
cp .env.example .env
```

`frontend/.env`:
```env
VITE_API_URL=http://localhost:5000
```

#### Run Frontend Development Server:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 📡 REST API Reference (Exact 5 Endpoints)

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/auth/send-otp` | Sends OTP to phone via Minimoth API | No |
| `POST` | `/api/auth/verify-otp` | Validates OTP with Minimoth, logs in/registers user, returns JWT | No |
| `GET` | `/api/tickets` | Returns all tickets & messages for authenticated user | Yes (Bearer) |
| `POST` | `/api/tickets` | Creates a new support ticket | Yes (Bearer) |
| `POST` | `/api/tickets/:id/reply` | Adds message to ticket thread & optionally updates status | Yes (Bearer) |

---

## 🎨 UI Features

- **Obsidian Dark Mode**: Glassmorphic cards with subtle glowing gradients.
- **Micro-interactions**: Smooth transitions between pages, status pill indicators, and priority tags (`High`, `Medium`, `Low`).
- **Interactive Ticket Thread**: Real-time conversation view between customer and support agents with resolution status toggling (`Open` ⇄ `In Progress` ⇄ `Resolved`).
- **Responsive**: Fully optimized for mobile, tablet, and desktop viewports.

---

## 🛡️ Input Validation & Error Handling

- Phone number sanity check (E.164 / 10-digit formats).
- Mandatory title and description validation on ticket submissions.
- Empty reply prevention.
- Graceful network error handling with user-facing alerts.
