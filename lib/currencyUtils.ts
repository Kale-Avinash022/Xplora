export interface CurrencyRate {
  code: string;
  symbol: string;
  name: string;
  rateFromINR: number;
}

export const SUPPORTED_CURRENCIES: Record<string, CurrencyRate> = {
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', rateFromINR: 1.0 },
  USD: { code: 'USD', symbol: '$', name: 'US Dollar', rateFromINR: 0.012 },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', rateFromINR: 0.011 },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', rateFromINR: 0.0094 },
  AED: { code: 'AED', symbol: 'Dhs', name: 'UAE Dirham', rateFromINR: 0.044 },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rateFromINR: 1.76 },
};

export function convertAmount(amountInINR: number, targetCurrencyCode: string): string {
  const currency = SUPPORTED_CURRENCIES[targetCurrencyCode] || SUPPORTED_CURRENCIES.INR;
  const converted = amountInINR * currency.rateFromINR;
  
  if (currency.code === 'JPY') {
    return `${currency.symbol}${Math.round(converted).toLocaleString()}`;
  }
  return `${currency.symbol}${converted.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
