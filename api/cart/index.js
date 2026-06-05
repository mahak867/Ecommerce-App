const { getPool } = require('../_db');
const { requireAuth, cors } = require('../_auth');

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = requireAuth(req, res);
  if (!user) return;

  try {
    const pool = getPool();

    // GET cart with product details
    if (req.method === 'GET') {
      const { rows } = await pool.query(`
        SELECT ci.id, ci.quantity, p.id as product_id, p.name, p.price, p.image_url, p.stock
        FROM cart_items ci
        JOIN products p ON p.id = ci.product_id
        WHERE ci.user_id=$1
      `, [user.id]);
      return res.json(rows);
    }

    // POST add/update item
    if (req.method === 'POST') {
      const { product_id, quantity } = req.body;
      if (!product_id) return res.status(400).json({ error: 'product_id required' });
      const qty = Math.max(1, parseInt(quantity) || 1);

      // check stock
      const prod = await pool.query('SELECT stock FROM products WHERE id=$1', [product_id]);
      if (!prod.rows.length) return res.status(404).json({ error: 'product not found' });
      if (prod.rows[0].stock < qty) return res.status(400).json({ error: 'insufficient stock' });

      const { rows } = await pool.query(`
        INSERT INTO cart_items (user_id, product_id, quantity)
        VALUES ($1,$2,$3)
        ON CONFLICT (user_id, product_id) DO UPDATE SET quantity=$3
        RETURNING *
      `, [user.id, product_id, qty]);
      return res.status(201).json(rows[0]);
    }

    // DELETE remove item
    if (req.method === 'DELETE') {
      const { product_id } = req.query;
      if (!product_id) {
        // clear entire cart
        await pool.query('DELETE FROM cart_items WHERE user_id=$1', [user.id]);
      } else {
        await pool.query('DELETE FROM cart_items WHERE user_id=$1 AND product_id=$2', [user.id, product_id]);
      }
      return res.json({ ok: true });
    }

    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server error' });
  }
};
