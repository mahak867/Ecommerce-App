import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import s from './ProductDetail.module.css';
import { useCurrency } from '../context/CurrencyContext';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { convert } = useCurrency();
  const nav = useNavigate();

  useEffect(() => {
    api.get(`/products/${id}`).then(r => setProduct(r.data)).catch(() => nav('/'));
  }, [id, nav]);

  const handleAdd = async () => {
    if (!user) { nav('/auth'); return; }
    setAdding(true);
    try {
      await addToCart(id, qty);
      setAdded(true);
      setTimeout(() => { setAdded(false); nav('/cart'); }, 800);
    } catch (err) { alert(err.response?.data?.error || 'error'); }
    finally { setAdding(false); }
  };

  if (!product) return (
    <div style={{textAlign:'center',padding:'80px',color:'var(--text3)'}}>
      <div style={{fontFamily:'var(--font-display)',fontSize:'48px',marginBottom:'12px',animation:'pulse 1.5s infinite'}}>...</div>
    </div>
  );

  return (
    <div className={s.page}>
      <button className={s.back} onClick={() => nav(-1)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        Back
      </button>
      <div className={s.wrap}>
        <div className={s.imgbox}>
          {product.image_url
            ? <img src={product.image_url} alt={product.name}/>
            : <div className={s.noimg}>No image</div>
          }
        </div>
        <div className={s.info}>
          <div className={s.cat}>{product.category}</div>
          <h1 className={s.name}>{product.name}</h1>
          <p className={s.desc}>{product.description}</p>
          <div className={s.priceline}>
            <div className={s.price}>{convert(product.price)}</div>
            <span className={`${s.stockbadge} ${product.stock > 0 ? s.instock : s.oos}`}>
              {product.stock > 0 ? `${product.stock} in stock` : 'Sold out'}
            </span>
          </div>
          <div className={s.divider}/>
          {product.stock > 0 && (
            <div className={s.qtyrow}>
              <span className={s.qtylabel}>Quantity</span>
              <div className={s.qtyctrls}>
                <button onClick={() => setQty(q => Math.max(1, q-1))}>−</button>
                <span>{qty}</span>
                <button onClick={() => setQty(q => Math.min(product.stock, q+1))}>+</button>
              </div>
            </div>
          )}
          <button className={s.addbtn} onClick={handleAdd} disabled={product.stock === 0 || adding}>
            {added ? '✓ Added to Cart!' : adding ? 'Adding...' : `Add to Cart — ${convert(parseFloat(product.price) * qty)}`}
          </button>
          <div className={s.divider}/>
          <div className={s.meta}>
            <div className={s.metarow}><span>Category</span><span>{product.category}</span></div>
            <div className={s.metarow}><span>Availability</span><span>{product.stock > 0 ? 'In Stock' : 'Out of Stock'}</span></div>
            <div className={s.metarow}><span>Shipping</span><span>Free worldwide</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
