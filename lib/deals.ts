export interface Deal {
  id?: string;
  category: 'hotel' | 'flight' | 'train';
  provider: string;
  tag?: string;
  title?: string;
  from?: string;
  to: string;
  fromCode?: string;
  toCode?: string;
  rating?: number;
  classLabel: string;
  nights?: number;
  travellers: number;
  amenities: string[];
  departTime?: string;
  arriveTime?: string;
  arriveDayOffset?: number;
  durationMins?: number;
  stops?: number;
  date: string;
  price: number;
  originalPrice: number;
  discountPct: number;
  unitPrice: number;
  availability: number;
  validTill: string;
}

export function formatINR(val?: number): string {
  if (val == null) return '₹0';
  return `₹${val.toLocaleString('en-IN')}`;
}

export function formatDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatDealDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch {
    return dateStr;
  }
}
