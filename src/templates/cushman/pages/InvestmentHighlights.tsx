import React from 'react';
import { CushmanOMData } from '../types';
import { PageShell } from '../components/PageShell';

const defaultHighlights = [
  { title: 'STRONG MARKET FUNDAMENTALS', body: 'The property is located in one of the nation\'s premier industrial markets with historically low vacancy rates and strong rent growth. Demand continues to outpace supply, providing a favorable environment for investors.' },
  { title: 'HIGH BARRIERS TO ENTRY', body: 'Limited land availability and stringent zoning requirements create significant barriers to new development in the immediate submarket, protecting long-term value and ensuring sustained demand for existing product.' },
  { title: 'STABLE IN-PLACE CASH FLOW', body: 'The property is 100% leased to a creditworthy tenant on a long-term lease providing investors with predictable, stable cash flow. The lease features annual rent escalations that provide built-in income growth.' },
  { title: 'STRATEGIC LOCATION', body: 'Ideally positioned with excellent access to major transportation corridors, the property benefits from proximity to key distribution nodes, a deep labor pool, and strong demographic trends in the surrounding area.' },
];

export function InvestmentHighlights({ data }: { data: CushmanOMData }) {
  const highlights = data.deal.highlights && data.deal.highlights.length >= 4
    ? data.deal.highlights.map((h, i) => ({ title: defaultHighlights[i]?.title || `HIGHLIGHT ${i + 1}`, body: h }))
    : defaultHighlights;

  const photos = data.selectedPhotos || [];

  return (
    <PageShell pageNumber={6} showHeader={false}>
      <div className="cw-top-stripe" />

      <div style={{ display: 'flex', height: 'calc(100% - 30px)', paddingTop: 8 }}>
        {/* Left content 60% */}
        <div style={{ width: '60%', padding: '30px 24px 20px 32px' }}>
          <div className="cw-teal-bar" style={{ marginBottom: 14 }} />
          <div className="cw-section-title" style={{ marginBottom: 24 }}>
            INVESTMENT<br />HIGHLIGHTS
          </div>

          {highlights.slice(0, 4).map((h, i) => (
            <div key={i} className="cw-highlight-row">
              <div className="cw-highlight-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {i === 0 && <><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></>}
                  {i === 1 && <><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></>}
                  {i === 2 && <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></>}
                  {i === 3 && <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></>}
                </svg>
              </div>
              <div>
                <div className="cw-highlight-title">{h.title}</div>
                <div className="cw-highlight-body">{h.body}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Right photos 40% */}
        <div style={{
          width: '40%', display: 'flex', flexDirection: 'column', gap: 3,
          padding: '8px 0 0 0',
        }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              flex: 1,
              background: photos[i + 1]
                ? `url(${photos[i + 1]}) center/cover`
                : '#4a6b7d',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.3)', fontSize: 10,
            }}>
              {!photos[i + 1] && 'PHOTO'}
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
