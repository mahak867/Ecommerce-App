import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api from '../api';
import s from './Cart.module.css';
import { useCurrency } from '../context/CurrencyContext';

export default function Cart() {
  const { cart, total, removeFromCart, clearCart, fetchCart } = useCart();
  const [address, setAddress] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const nav = useNavigate();
  const { convert } = useCurrency();

  const handleCheckout = async e => {
    e.preventDefault();
    if (!address.trim()) { setError('shipping address required'); return; }
    setChecking(true); setError('');
    try {
      await api.post('/orders', { shipping_address: address });
      await clearCart();
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'checkout failed');
    } finally { setChecking(false); }
  };

  if (success) return (
    <div className={s.page}>
      <div className={s.success}>
        <div className={s.checkmark}>✓</div>
        <h2>Order Placed!</h2>
        <p>Your order has been confirmed and is being processed.</p>
        <div className={s.successbtns}>
          <button className={s.orderbtn} onClick={() => nav('/orders')}>View Orders</button>
          <button className={s.shopbtn} onClick={() => nav('/')}>Continue Shopping</button>
        </div>
      </div>
    </div>
  );

  if (cart.length === 0) return (
    <div className={s.page}>
      <div className={s.empty}>
        <div className={s.emptyicon}>🛒</div>
        <h2>Your cart is empty</h2>
        <button className={s.shopbtn} onClick={() => nav('/')}>Browse Products</button>
      </div>
    </div>
  );

  return (
    <div className={s.page}>
      <h1 className={s.title}>Your Cart</h1>
      <div className={s.layout}>
        <div className={s.items}>
          {cart.map(item => (
            <div key={item.id} className={s.item}>
              <img src={item.image_url || ''} alt={item.name} className={s.thumb}
                onError={e => { e.target.style.display='none'; }}/>
              <div className={s.iinfo}>
                <div className={s.iname}>{item.name}</div>
                <div className={s.iprice}>{convert(item.price)} × {item.quantity}</div>
              </div>
              <div className={s.iright}>
                <div className={s.isubtotal}>{convert(parseFloat(item.price) * item.quantity)}</div>
                <button className={s.remove} onClick={() => removeFromCart(item.product_id)}>remove</button>
              </div>
            </div>
          ))}
        </div>

        <div className={s.summary}>
          <h3>Order Summary</h3>
          <div className={s.row}><span>Subtotal</span><span>{convert(total)}</span></div>
          <div className={s.row}><span>Shipping</span><span className={s.free}>Free</span></div>
          <div className={s.divider}/>
          <div className={`${s.row} ${s.totalrow}`}><span>Total</span><span>{convert(total)}</span></div>

          <form onSubmit={handleCheckout} className={s.form}>
            <label>Shipping Address</label>
            <textarea
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="123 Main St, City, Country"
              rows={3}
              required
            />
            {error && <p className={s.error}>{error}</p>}
            <button type="submit" className={s.checkoutbtn} disabled={checking}>
              {checking ? 'Processing...' : `Checkout — ${convert(total)}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
