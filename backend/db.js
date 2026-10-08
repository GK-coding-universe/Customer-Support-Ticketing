const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');

// Initialize SQLite database stored locally in backend/tickets.db
const dbPath = path.join(__dirname, 'tickets.db');
const db = new DatabaseSync(dbPath);

// Create 3 Database Entities: users, tickets, messages
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'Medium',
    status TEXT NOT NULL DEFAULT 'Open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    sender_name TEXT NOT NULL,
    sender_role TEXT NOT NULL DEFAULT 'customer',
    message TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
  );
`);

// Prepared statements for users
const stmtFindUserByPhone = db.prepare('SELECT * FROM users WHERE phone = ?');
const stmtFindUserById = db.prepare('SELECT id, phone, name, created_at FROM users WHERE id = ?');
const stmtCreateUser = db.prepare('INSERT INTO users (phone, name) VALUES (?, ?)');

// Prepared statements for tickets & messages
const stmtGetTicketsByUser = db.prepare(`
  SELECT id, user_id, title, description, priority, status, created_at, updated_at
  FROM tickets
  WHERE user_id = ?
  ORDER BY created_at DESC
`);

const stmtGetTicketById = db.prepare(`
  SELECT id, user_id, title, description, priority, status, created_at, updated_at
  FROM tickets
  WHERE id = ? AND user_id = ?
`);

const stmtCreateTicket = db.prepare(`
  INSERT INTO tickets (user_id, title, description, priority, status)
  VALUES (?, ?, ?, ?, 'Open')
`);

const stmtUpdateTicketStatus = db.prepare(`
  UPDATE tickets
  SET status = ?, updated_at = CURRENT_TIMESTAMP
  WHERE id = ?
`);

const stmtGetMessages = db.prepare(`
  SELECT id, ticket_id, sender_name, sender_role, message, created_at
  FROM messages
  WHERE ticket_id = ?
  ORDER BY created_at ASC
`);

const stmtCreateMessage = db.prepare(`
  INSERT INTO messages (ticket_id, sender_name, sender_role, message)
  VALUES (?, ?, ?, ?)
`);

// Exported database helpers
const dbHelpers = {
  findUserByPhone(phone) {
    return stmtFindUserByPhone.get(phone) || null;
  },

  findUserById(id) {
    return stmtFindUserById.get(id) || null;
  },

  createUser(phone, name) {
    const info = stmtCreateUser.run(phone, name);
    return {
      id: Number(info.lastInsertRowid),
      phone,
      name,
    };
  },

  getTicketsWithDetails(userId) {
    const tickets = stmtGetTicketsByUser.all(userId);
    return tickets.map((t) => {
      const messages = stmtGetMessages.all(t.id);
      return {
        ...t,
        messages,
      };
    });
  },

  getTicketWithMessages(ticketId, userId) {
    const ticket = stmtGetTicketById.get(ticketId, userId);
    if (!ticket) return null;
    const messages = stmtGetMessages.all(ticket.id);
    return {
      ...ticket,
      messages,
    };
  },

  createTicket(userId, title, description, priority, senderName) {
    const info = stmtCreateTicket.run(userId, title, description, priority || 'Medium');
    const ticketId = Number(info.lastInsertRowid);

    // Add initial message
    stmtCreateMessage.run(ticketId, senderName, 'customer', description);

    return this.getTicketWithMessages(ticketId, userId);
  },

  addMessage(ticketId, userId, senderName, senderRole, message, newStatus) {
    const ticket = stmtGetTicketById.get(ticketId, userId);
    if (!ticket) return null;

    stmtCreateMessage.run(ticketId, senderName, senderRole || 'customer', message);

    if (newStatus && ['Open', 'In Progress', 'Resolved'].includes(newStatus)) {
      stmtUpdateTicketStatus.run(newStatus, ticketId);
    }

    return this.getTicketWithMessages(ticketId, userId);
  },
};

module.exports = { db, dbHelpers };
