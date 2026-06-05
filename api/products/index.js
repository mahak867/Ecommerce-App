const { getPool, initDB } = require('../_db');
const { requireAdmin, cors } = require('../_auth');

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await initDB();
    const pool = getPool();

    if (req.method === 'GET') {
      const { category, search, sort } = req.query;
      let query = 'SELECT * FROM products WHERE 1=1';
      const params = [];
      let idx = 1;
      if (category) { query += ` AND category=$${idx++}`; params.push(category); }
      if (search) { query += ` AND (name ILIKE $${idx} OR description ILIKE $${idx++})`; params.push(`%${search}%`); }
      if (sort === 'price_asc') query += ' ORDER BY price ASC';
      else if (sort === 'price_desc') query += ' ORDER BY price DESC';
      else query += ' ORDER BY created_at DESC';
      const { rows } = await pool.query(query, params);
      return res.json(rows);
    }

    if (req.method === 'POST') {
      const admin = requireAdmin(req, res);
      if (!admin) return;
      const { name, description, price, category, image_url, stock } = req.body;
      if (!name || !price || !category)
        return res.status(400).json({ error: 'name, price and category required' });
      const { rows } = await pool.query(
        'INSERT INTO products (name,description,price,category,image_url,stock) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
        [name, description || null, price, category, image_url || null, stock || 0]
      );
      return res.status(201).json(rows[0]);
    }

    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server error' });
  }
};
