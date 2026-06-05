const { Pool } = require('pg');

let pool;
let initialized = false;

function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 1,
      idleTimeoutMillis: 10000,
    });
  }
  return pool;
}

async function initDB() {
  if (initialized) return;
  const p = getPool();

  await p.query(`CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(10) DEFAULT 'user' CHECK (role IN ('user','admin')),
    created_at TIMESTAMP DEFAULT NOW()
  )`);

  await p.query(`CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    image_url TEXT,
    stock INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`);

  await p.query(`CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    UNIQUE(user_id, product_id)
  )`);

  await p.query(`CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    total NUMERIC(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','processing','shipped','delivered','cancelled')),
    shipping_address TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  )`);

  await p.query(`CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    price NUMERIC(10,2) NOT NULL
  )`);

  await p.query(`CREATE INDEX IF NOT EXISTS idx_products_category ON products(category)`);
  await p.query(`CREATE INDEX IF NOT EXISTS idx_cart_user ON cart_items(user_id)`);
  await p.query(`CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id)`);

  const { rows } = await p.query('SELECT COUNT(*) FROM products');
  if (parseInt(rows[0].count) === 0) {
    await p.query(`INSERT INTO products (name, description, price, category, image_url, stock) VALUES
      ('Wireless Headphones', 'Premium noise-cancelling wireless headphones', 99.99, 'Electronics', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', 50),
      ('Mechanical Keyboard', 'RGB backlit mechanical gaming keyboard', 79.99, 'Electronics', 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400', 30),
      ('Running Shoes', 'Lightweight breathable running shoes', 59.99, 'Footwear', 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', 100),
      ('Coffee Maker', 'Programmable drip coffee maker 12-cup', 49.99, 'Kitchen', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400', 25),
      ('Backpack', 'Waterproof laptop backpack 30L', 39.99, 'Bags', 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400', 75),
      ('Sunglasses', 'Polarized UV400 sunglasses', 29.99, 'Accessories', 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400', 60),
      ('Yoga Mat', 'Non-slip eco-friendly yoga mat', 34.99, 'Sports', 'https://images.unsplash.com/photo-1601925228068-28e5a5a4c9d5?w=400', 40),
      ('Desk Lamp', 'LED desk lamp with USB charging port', 44.99, 'Electronics', 'https://images.unsplash.com/photo-1544428571-5a3e0bba51b3?w=400', 35)`
    );
  }

  initialized = true;
}

module.exports = { getPool, initDB };
