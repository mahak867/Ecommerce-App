const jwt = require('jsonwebtoken');

function authenticate(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return null;
  try {
    return jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

function requireAuth(req, res) {
  const user = authenticate(req);
  if (!user) { res.status(401).json({ error: 'unauthorized' }); return null; }
  return user;
}

function requireAdmin(req, res) {
  const user = authenticate(req);
  if (!user) { res.status(401).json({ error: 'unauthorized' }); return null; }
  if (user.role !== 'admin') { res.status(403).json({ error: 'admin only' }); return null; }
  return user;
}

function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

module.exports = { authenticate, requireAuth, requireAdmin, cors };
