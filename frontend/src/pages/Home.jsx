import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import s from './Home.module.css';
import { useCurrency } from '../context/CurrencyContext';

const CATEGORIES = ['All','Electronics','Footwear','Kitchen','Bags','Accessories','Sports'];
const SORTS = [
  { value: '', label: 'Newest' },
  { value: 'price_asc', label: 'Price ↑' },
  { value: 'price_desc', label: 'Price ↓' },
];

function SkeletonCard() {
  return (
    <div className={s.skeleton}>
      <div className={s.skeletonImg}/>
      <div className={s.skeletonInfo}>
        <div className={s.skeletonLine} style={{width:'40%'}}/>
        <div className={s.skeletonLine} style={{width:'80%'}}/>
        <div className={s.skeletonLine} style={{width:'60%'}}/>
      </div>
    </div>
  );
}

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('');
  const [adding, setAdding] = useState({});
  const { addToCart } = useCart();
  const { user } = useAuth();
  const nav = useNavigate();
  const { convert } = useCurrency();

  useEffect(() => {
    const params = {};
    if (category !== 'All') params.category = category;
    if (search) params.search = search;
    if (sort) params.sort = sort;
    setLoading(true);
    const t = setTimeout(() => {
      api.get('/products', { params })
        .then(r => setProducts(r.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    }, search ? 300 : 0);
    return () => clearTimeout(t);
  }, [category, search, sort]);

  const handleAdd = async (e, id) => {
    e.stopPropagation();
    if (!user) { nav('/auth'); return; }
    setAdding(a => ({ ...a, [id]: 'loading' }));
    try {
      await addToCart(id, 1);
      setAdding(a => ({ ...a, [id]: 'done' }));
      setTimeout(() => setAdding(a => ({ ...a, [id]: false })), 1200);
    } catch (err) {
      alert(err.response?.data?.error || 'error');
      setAdding(a => ({ ...a, [id]: false }));
    }
  };

  return (
    <div className={s.page}>
      <div className={s.hero}>
        <div className={s.heroTop}>
          <div>
            <div className={s.heroTag}><span>New Collection 2026</span></div>
            <h1 className={s.heroH1}>Discover<br/><em>Premium</em><br/>Products</h1>
          </div>
          <p className={s.heroSub}>Curated selection of quality items at honest prices.</p>
        </div>
        <div className={s.heroLine}/>
      </div>

      <div className={s.toolbar}>
        <div className={s.searchWrap}>
          <svg className={s.searchIcon} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input className={s.search} placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <select className={s.sortsel} value={sort} onChange={e => setSort(e.target.value)}>
          {SORTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {!loading && <span className={s.count}>{products.length} items</span>}
      </div>

      <div className={s.cats}>
        {CATEGORIES.map(c => (
          <button key={c} className={`${s.cat} ${category === c ? s.active : ''}`} onClick={() => setCategory(c)}>
            <span>{c}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className={s.skeletons}>
          {[...Array(8)].map((_, i) => <SkeletonCard key={i}/>)}
        </div>
      ) : products.length === 0 ? (
        <div className={s.empty}>
          <div style={{fontSize:'40px'}}>∅</div>
          <p>No products found</p>
        </div>
      ) : (
        <div className={s.grid}>
          {products.map((p, i) => (
            <div
              key={p.id}
              className={s.card}
              style={{ animationDelay: `${i * 0.05}s` }}
              onClick={() => nav(`/product/${p.id}`)}
            >
              <div className={s.imgwrap}>
                {p.image_url
                  ? <img src={p.image_url} alt={p.name} className={s.img}/>
                  : <div className={s.noimg}>No image</div>
                }
                <div className={s.imgOverlay}/>
                {p.stock === 0 && <div className={s.oos}>Sold Out</div>}
                <button
                  className={`${s.quickAdd} ${adding[p.id] === 'done' ? s.added : ''}`}
                  onClick={e => handleAdd(e, p.id)}
                  disabled={p.stock === 0 || !!adding[p.id]}
                >
                  {adding[p.id] === 'done' ? '✓ Added' : adding[p.id] === 'loading' ? '...' : '+ Add to Cart'}
                </button>
              </div>
              <div className={s.info}>
                <div className={s.toprow}>
                  <span className={s.catbadge}>{p.category}</span>
                  <span className={s.stock}>{p.stock > 0 ? `${p.stock} left` : 'Out of stock'}</span>
                </div>
                <div className={s.pname}>{p.name}</div>
                <div className={s.desc}>{p.description}</div>
                <div className={s.bottom}>
                  <span className={s.price}>{convert(p.price)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
