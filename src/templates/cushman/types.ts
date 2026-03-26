import { BrokerDeal } from '@/lib/supabase';

export interface CushmanOMData {
  deal: Partial<BrokerDeal>;
  sections: { title: string; content: string }[];
  selectedPhotos: string[];
  firmStyle: string;
}

export interface BrokerContact {
  name: string;
  title: string;
  phone: string;
  email: string;
  license?: string;
}

export interface InvestmentHighlight {
  title: string;
  body: string;
  iconType: 'market' | 'barriers' | 'cashflow' | 'location';
}

export function getSectionContent(sections: { title: string; content: string }[], keyword: string): string {
  const section = sections.find(s => s.title.toLowerCase().includes(keyword.toLowerCase()));
  return section?.content || '';
}

export function fmtNum(n: number | null | undefined): string {
  if (n == null) return '—';
  return n.toLocaleString('en-US');
}

export function fmtDollar(n: number | null | undefined): string {
  if (n == null) return '—';
  return '$' + n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function fmtPct(n: number | null | undefined): string {
  if (n == null) return '—';
  return n.toFixed(1) + '%';
}
