const { getPool } = require('../_db');
const { requireAuth, requireAdmin, cors } = require('../_auth');

module.exports = async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const user = requireAuth(req, res);
  if (!user) return;

  try {
    const pool = getPool();

    // GET orders (admin sees all, user sees own)
    if (req.method === 'GET') {
      let rows;
      if (user.role === 'admin') {
        const result = await pool.query(`
          SELECT o.*, u.name as user_name, u.email as user_email
          FROM orders o JOIN users u ON u.id=o.user_id
          ORDER BY o.created_at DESC
        `);
        rows = result.rows;
      } else {
        const result = await pool.query(
          'SELECT * FROM orders WHERE user_id=$1 ORDER BY created_at DESC',
          [user.id]
        );
        rows = result.rows;
      }
      // attach items to each order
      const orderIds = rows.map(o => o.id);
      if (orderIds.length > 0) {
        const items = await pool.query(`
          SELECT oi.*, p.name as product_name, p.image_url
          FROM order_items oi JOIN products p ON p.id=oi.product_id
          WHERE oi.order_id = ANY($1::uuid[])
        `, [orderIds]);
        const itemMap = {};
        items.rows.forEach(item => {
          if (!itemMap[item.order_id]) itemMap[item.order_id] = [];
          itemMap[item.order_id].push(item);
        });
        rows = rows.map(o => ({ ...o, items: itemMap[o.id] || [] }));
      }
      return res.json(rows);
    }

    // POST checkout — convert cart to order
    if (req.method === 'POST') {
      const { shipping_address } = req.body;
      if (!shipping_address) return res.status(400).json({ error: 'shipping address required' });

      const cartResult = await pool.query(`
        SELECT ci.quantity, p.id as product_id, p.price, p.stock, p.name
        FROM cart_items ci JOIN products p ON p.id=ci.product_id
        WHERE ci.user_id=$1
      `, [user.id]);

      if (!cartResult.rows.length) return res.status(400).json({ error: 'cart is empty' });

      // check stock
      for (const item of cartResult.rows) {
        if (item.stock < item.quantity)
          return res.status(400).json({ error: `insufficient stock for ${item.name}` });
      }

      const total = cartResult.rows.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);

      // create order
      const { rows: [order] } = await pool.query(
        'INSERT INTO orders (user_id, total, shipping_address) VALUES ($1,$2,$3) RETURNING *',
        [user.id, total.toFixed(2), shipping_address]
      );

      // create order items + decrement stock
      for (const item of cartResult.rows) {
        await pool.query(
          'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1,$2,$3,$4)',
          [order.id, item.product_id, item.quantity, item.price]
        );
        await pool.query(
          'UPDATE products SET stock=stock-$1 WHERE id=$2',
          [item.quantity, item.product_id]
        );
      }

      // clear cart
      await pool.query('DELETE FROM cart_items WHERE user_id=$1', [user.id]);

      return res.status(201).json(order);
    }

    return res.status(405).json({ error: 'method not allowed' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'server error' });
  }
};
