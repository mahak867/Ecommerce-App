import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useCurrency } from '../context/CurrencyContext';
import s from './Navbar.module.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const { currency, setCurrency } = useCurrency();
  const nav = useNavigate();

  return (
    <nav className={s.nav}>
      <Link to="/" className={s.brand}>
        <div className={s.logo}>K</div>
        <span className={s.name}>KOVA</span>
      </Link>
      <div className={s.right}>
        <select
          className={s.currencysel}
          value={currency}
          onChange={e => setCurrency(e.target.value)}
        >
          <option value="USD">$ USD</option>
          <option value="SAR">SAR</option>
          <option value="INR">₹ INR</option>
        </select>

        {user ? (
          <>
            <Link to="/orders" className={s.link}>Orders</Link>
            {user.role === 'admin' && (
              <>
                <Link to="/admin" className={s.link}>Admin</Link>
                <span className={s.adminbadge}>ADMIN</span>
              </>
            )}
            <Link to="/cart" className={s.cart}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              {count > 0 && <span className={s.badge}>{count}</span>}
            </Link>
            <div className={s.avatar} title={user.name}>{user.name.slice(0,2).toUpperCase()}</div>
            <button className={s.logout} onClick={() => { logout(); nav('/'); }}>sign out</button>
          </>
        ) : (
          <Link to="/auth" className={s.signin}>Sign In</Link>
        )}
      </div>
    </nav>
  );
}
