const { getPool } = require('../_db');
const { requireAdmin, cors } = require('../_auth');

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;
  try {
    const pool = getPool();

    if (req.method === 'GET') {
      const { rows } = await pool.query('SELECT * FROM products WHERE id=$1', [id]);
      if (!rows.length) return res.status(404).json({ error: 'not found' });
      return res.json(rows[0]);
    }

    if (req.method === 'PATCH' || req.method === 'PUT') {
      const admin = requireAdmin(req, res);
      if (!admin) return;
      const allowed = ['name','description','price','category','image_url','stock'];
      const updates = []; const values = []; let idx = 1;
      for (const key of allowed) {
        if (req.body[key] !== undefined) {
          updates.push(`${key}=$${idx++}`);
          values.push(req.body[key] === '' ? null : req.body[key]);
        }
      }
      if (!updates.length) return res.status(400).json({ error: 'nothing to update' });
      updates.push(`updated_at=NOW()`);
      values.push(id);
      const { rows } = await pool.query(
        `UPDATE products SET ${updates.join(',')} WHERE id=$${idx} RETURNING *`, values
      );
      if (!rows.length) return res.status(404).json({ error: 'not found' });
      return res.json(rows[0]);
    }

    if (req.method === 'DELETE') {
      const admin = requireAdmin(req, res);
      if (!admin) return;
      await pool.query('DELETE FROM products WHERE id=$1', [id]);
      return res.json({ deleted: id });
    }

    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server error' });
  }
};
