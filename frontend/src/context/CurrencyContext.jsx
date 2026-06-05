import { createContext, useContext, useState } from 'react';

const RATES = { USD: 1, SAR: 3.75, INR: 83.5 };
const SYMBOLS = { USD: '$', SAR: 'SAR ', INR: '₹' };

const CurrencyContext = createContext(null);

export function CurrencyProvider({ children }) {
  const [currency, setCurrency] = useState('USD');

  const convert = (usdPrice) => {
    const val = parseFloat(usdPrice) * RATES[currency];
    return `${SYMBOLS[currency]}${val.toFixed(currency === 'INR' ? 0 : 2)}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convert, RATES, SYMBOLS }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export const useCurrency = () => useContext(CurrencyContext);
