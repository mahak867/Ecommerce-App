import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState([]);

  const fetchCart = useCallback(async () => {
    if (!user) { setCart([]); return; }
    try {
      const { data } = await api.get('/cart');
      setCart(data);
    } catch { setCart([]); }
  }, [user]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const addToCart = async (product_id, quantity = 1) => {
    await api.post('/cart', { product_id, quantity });
    await fetchCart();
  };

  const removeFromCart = async (product_id) => {
    await api.delete(`/cart?product_id=${product_id}`);
    setCart(prev => prev.filter(i => i.product_id !== product_id));
  };

  const clearCart = async () => {
    await api.delete('/cart');
    setCart([]);
  };

  const total = cart.reduce((sum, i) => sum + parseFloat(i.price) * i.quantity, 0);
  const count = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, total, count, addToCart, removeFromCart, clearCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
