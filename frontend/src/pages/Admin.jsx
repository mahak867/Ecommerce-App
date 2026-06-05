import { useState, useEffect } from 'react';
import api from '../api';
import s from './Admin.module.css';

const STATUS_OPTIONS = ['pending','processing','shipped','delivered','cancelled'];
const EMPTY_PRODUCT = { name:'', description:'', price:'', category:'', image_url:'', stock:'' };

export default function Admin() {
  const [tab, setTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_PRODUCT);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/products'), api.get('/orders')])
      .then(([p, o]) => { setProducts(p.data); setOrders(o.data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { ...form, price: parseFloat(form.price), stock: parseInt(form.stock) || 0 };
      if (editing) {
        const { data } = await api.patch(`/products/${editing}`, payload);
        setProducts(prev => prev.map(p => p.id === editing ? data : p));
      } else {
        const { data } = await api.post('/products', payload);
        setProducts(prev => [data, ...prev]);
      }
      setForm(EMPTY_PRODUCT); setEditing(null);
    } catch (err) {
      setError(err.response?.data?.error || 'save failed');
    } finally { setSaving(false); }
  };

  const handleEdit = p => {
    setEditing(p.id);
    setForm({ name:p.name, description:p.description||'', price:p.price, category:p.category, image_url:p.image_url||'', stock:p.stock });
    window.scrollTo(0,0);
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this product?')) return;
    await api.delete(`/products/${id}`);
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  const handleOrderStatus = async (id, status) => {
    try {
      const { data } = await api.patch(`/orders/${id}`, { status });
      setOrders(prev => prev.map(o => o.id === id ? { ...o, status: data.status } : o));
    } catch (err) { alert('failed to update status'); }
  };

  if (loading) return <div style={{textAlign:'center',padding:'60px',color:'var(--text3)'}}>loading...</div>;

  return (
    <div className={s.page}>
      <h1 className={s.title}>Admin Panel</h1>
      <div className={s.tabs}>
        <button className={`${s.tab} ${tab==='products'?s.active:''}`} onClick={() => setTab('products')}>
          Products ({products.length})
        </button>
        <button className={`${s.tab} ${tab==='orders'?s.active:''}`} onClick={() => setTab('orders')}>
          Orders ({orders.length})
        </button>
      </div>

      {tab === 'products' && (
        <div className={s.pcontent}>
          <div className={s.formcard}>
            <h3>{editing ? 'Edit Product' : 'Add New Product'}</h3>
            <form onSubmit={handleSubmit} className={s.pform}>
              <div className={s.frow}>
                <div className={s.field}><label>Name*</label><input value={form.name} onChange={set('name')} required/></div>
                <div className={s.field}><label>Category*</label><input value={form.category} onChange={set('category')} required/></div>
              </div>
              <div className={s.field}><label>Description</label><textarea value={form.description} onChange={set('description')} rows={2}/></div>
              <div className={s.frow}>
                <div className={s.field}><label>Price*</label><input type="number" step="0.01" min="0" value={form.price} onChange={set('price')} required/></div>
                <div className={s.field}><label>Stock</label><input type="number" min="0" value={form.stock} onChange={set('stock')}/></div>
              </div>
              <div className={s.field}><label>Image URL</label><input value={form.image_url} onChange={set('image_url')} placeholder="https://..."/></div>
              {error && <p className={s.error}>{error}</p>}
              <div className={s.formbtns}>
                {editing && <button type="button" className={s.cancelbtn} onClick={() => { setEditing(null); setForm(EMPTY_PRODUCT); }}>Cancel</button>}
                <button type="submit" className={s.savebtn} disabled={saving}>{saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Product'}</button>
              </div>
            </form>
          </div>

          <div className={s.ptable}>
            {products.map(p => (
              <div key={p.id} className={s.prow}>
                {p.image_url && <img src={p.image_url} alt={p.name} className={s.pthumb}/>}
                <div className={s.pinfo}>
                  <div className={s.pname}>{p.name}</div>
                  <div className={s.pmeta}>{p.category} · ${parseFloat(p.price).toFixed(2)} · {p.stock} in stock</div>
                </div>
                <div className={s.pactions}>
                  <button className={s.editbtn} onClick={() => handleEdit(p)}>edit</button>
                  <button className={s.delbtn} onClick={() => handleDelete(p.id)}>delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'orders' && (
        <div className={s.otable}>
          {orders.length === 0 ? (
            <p style={{color:'var(--text3)',textAlign:'center',padding:'40px'}}>No orders yet</p>
          ) : orders.map(order => (
            <div key={order.id} className={s.orow}>
              <div className={s.oinfo}>
                <div className={s.oid}>#{order.id.slice(0,8).toUpperCase()}</div>
                <div className={s.ometa}>
                  {order.user_name || 'User'} · ${parseFloat(order.total).toFixed(2)} · {new Date(order.created_at).toLocaleDateString()}
                </div>
                <div className={s.oaddr}>{order.shipping_address}</div>
              </div>
              <select
                className={s.statussel}
                value={order.status}
                onChange={e => handleOrderStatus(order.id, e.target.value)}
              >
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
