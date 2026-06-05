import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useCurrency } from '../context/CurrencyContext';
import s from './Orders.module.css';

const STEPS = ['pending', 'processing', 'shipped', 'delivered'];

function StatusTimeline({ status }) {
  if (status === 'cancelled') return (
    <div className={s.cancelled}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>
      Order Cancelled
    </div>
  );
  const current = STEPS.indexOf(status);
  return (
    <div className={s.timeline}>
      {STEPS.map((step, i) => (
        <div key={step} className={s.tlstep}>
          <div className={`${s.tldot} ${i <= current ? s.tldone : ''} ${i === current ? s.tlactive : ''}`}>
            {i < current ? (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
            ) : i === current ? (
              <div className={s.tlpulse}/>
            ) : null}
          </div>
          {i < STEPS.length - 1 && <div className={`${s.tlline} ${i < current ? s.tldone : ''}`}/>}
          <span className={`${s.tllabel} ${i <= current ? s.tldone : ''}`}>{step}</span>
        </div>
      ))}
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});
  const { convert } = useCurrency();
  const nav = useNavigate();

  useEffect(() => {
    api.get('/orders').then(r => {
      setOrders(r.data);
      // auto-expand first order
      if (r.data.length > 0) setExpanded({ [r.data[0].id]: true });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const toggle = id => setExpanded(e => ({ ...e, [id]: !e[id] }));

  const estimatedDelivery = (createdAt) => {
    const d = new Date(createdAt);
    d.setDate(d.getDate() + 7);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (loading) return (
    <div className={s.loadwrap}>
      {[1,2].map(i => <div key={i} className={s.skeleton}/>)}
    </div>
  );

  if (orders.length === 0) return (
    <div className={s.empty}>
      <div className={s.emptyIcon}>
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M5 8h14M5 8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2M5 8l-1 12h16L19 8M10 12v4M14 12v4"/>
        </svg>
      </div>
      <h2>No orders yet</h2>
      <p>Your order history will appear here</p>
      <button className={s.shopBtn} onClick={() => nav('/')}>Start Shopping</button>
    </div>
  );

  return (
    <div className={s.page}>
      <div className={s.header}>
        <div>
          <h1 className={s.title}>Your Orders</h1>
          <p className={s.sub}>{orders.length} order{orders.length !== 1 ? 's' : ''} placed</p>
        </div>
      </div>

      <div className={s.list}>
        {orders.map((order, idx) => (
          <div key={order.id} className={s.card} style={{ animationDelay: `${idx * 0.06}s` }}>

            {/* Card Header */}
            <div className={s.cardHead} onClick={() => toggle(order.id)}>
              <div className={s.orderMeta}>
                <div className={s.orderId}>#{order.id.slice(0, 8).toUpperCase()}</div>
                <div className={s.orderDate}>
                  {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
              <div className={s.cardRight}>
                <span className={s.statusBadge} data-s={order.status}>{order.status}</span>
                <span className={s.orderTotal}>{convert(order.total)}</span>
                <svg className={`${s.chevron} ${expanded[order.id] ? s.open : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </div>

            {/* Expanded Content */}
            {expanded[order.id] && (
              <div className={s.cardBody}>

                {/* Status Timeline */}
                <StatusTimeline status={order.status} />

                {/* Estimated Delivery */}
                {order.status !== 'cancelled' && order.status !== 'delivered' && (
                  <div className={s.eta}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    Estimated delivery: <strong>{estimatedDelivery(order.created_at)}</strong>
                  </div>
                )}

                {/* Items */}
                {order.items && order.items.length > 0 && (
                  <div className={s.items}>
                    <div className={s.itemsLabel}>Items ({order.items.reduce((s, i) => s + i.quantity, 0)})</div>
                    {order.items.map(item => (
                      <div key={item.id} className={s.item}>
                        <div className={s.itemLeft}>
                          {item.image_url
                            ? <img src={item.image_url} alt={item.product_name} className={s.thumb}/>
                            : <div className={s.thumbPlaceholder}/>
                          }
                          <div>
                            <div className={s.itemName}>{item.product_name}</div>
                            <div className={s.itemQty}>Qty: {item.quantity}</div>
                          </div>
                        </div>
                        <div className={s.itemPrice}>{convert(parseFloat(item.price) * item.quantity)}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Summary */}
                <div className={s.summary}>
                  <div className={s.summaryRow}>
                    <span>Subtotal</span>
                    <span>{convert(order.total)}</span>
                  </div>
                  <div className={s.summaryRow}>
                    <span>Shipping</span>
                    <span className={s.free}>Free</span>
                  </div>
                  <div className={s.summaryDivider}/>
                  <div className={`${s.summaryRow} ${s.summaryTotal}`}>
                    <span>Total</span>
                    <span>{convert(order.total)}</span>
                  </div>
                </div>

                {/* Address */}
                <div className={s.address}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  <span>Shipping to: {order.shipping_address}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
