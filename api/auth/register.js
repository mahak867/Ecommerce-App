const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool, initDB } = require('../_db');
const { cors } = require('../_auth');

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'method not allowed' });

  try {
    await initDB();
    const pool = getPool();
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'all fields required' });

    const exists = await pool.query('SELECT id FROM users WHERE email=$1', [email]);
    if (exists.rows.length)
      return res.status(409).json({ error: 'email already registered' });

    const hash = await bcrypt.hash(password, 12);
    // first user becomes admin
    const count = await pool.query('SELECT COUNT(*) FROM users');
    const role = parseInt(count.rows[0].count) === 0 ? 'admin' : 'user';

    const { rows } = await pool.query(
      'INSERT INTO users (name,email,password,role) VALUES ($1,$2,$3,$4) RETURNING id,name,email,role',
      [name, email, hash, role]
    );
    const user = rows[0];
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    return res.status(201).json({ token, user });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server error' });
  }
};
