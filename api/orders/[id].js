const { getPool } = require('../_db');
const { requireAdmin, cors } = require('../_auth');

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { id } = req.query;

  if (req.method === 'PATCH') {
    const admin = requireAdmin(req, res);
    if (!admin) return;
    try {
      const pool = getPool();
      const { status } = req.body;
      const valid = ['pending','processing','shipped','delivered','cancelled'];
      if (!valid.includes(status)) return res.status(400).json({ error: 'invalid status' });
      const { rows } = await pool.query(
        'UPDATE orders SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *',
        [status, id]
      );
      if (!rows.length) return res.status(404).json({ error: 'not found' });
      return res.json(rows[0]);
    } catch (e) {
      console.error(e);
      return res.status(500).json({ error: 'server error' });
    }
  }

  return res.status(405).json({ error: 'method not allowed' });
};
