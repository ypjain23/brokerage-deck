import React from 'react';
import { CushmanOMData, getSectionContent } from '../types';
import { PageShell } from '../components/PageShell';

export function MarketOverview({ data }: { data: CushmanOMData }) {
  const content = getSectionContent(data.sections, 'market') ||
    'The Inland Empire industrial market continues to demonstrate exceptional fundamentals, with vacancy rates remaining near historic lows despite significant new construction deliveries. Strong tenant demand, driven by e-commerce expansion and supply chain optimization, has kept absorption levels elevated. Rental rates have experienced sustained growth, with asking rents increasing substantially year-over-year across all product types.';

  const paragraphs = content.split(/\n\n+/).filter(Boolean);

  return (
    <PageShell pageNumber={16} showHeader={false} showFooter={true}>
      <div className="cw-top-stripe" />

      <div style={{ display: 'flex', height: 'calc(100% - 30px)', paddingTop: 8 }}>
        {/* Left text 44% */}
        <div style={{ width: '44%', padding: '30px 18px 20px 32px' }}>
          <div className="cw-teal-bar" style={{ marginBottom: 14 }} />
          <div className="cw-section-title" style={{ fontSize: 34, marginBottom: 18 }}>
            MARKET<br />OVERVIEW
          </div>

          <div style={{
            fontSize: 9, fontWeight: 700, color: 'var(--cw-teal)',
            fontFamily: 'var(--font)', letterSpacing: '0.06em', marginBottom: 12,
          }}>
            INLAND EMPIRE INDUSTRIAL OVERVIEW
          </div>

          <div style={{
            fontSize: 8, color: 'var(--cw-body)', lineHeight: 1.6,
            textAlign: 'justify', fontFamily: 'var(--font)',
          }}>
            {paragraphs.map((p, i) => (
              <p key={i} style={{ marginBottom: 8 }}>{p}</p>
            ))}
          </div>
        </div>

        {/* Right charts 56% */}
        <div style={{
          width: '56%', padding: '30px 24px 20px 12px',
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          {[
            'NEW LEASING ACTIVITY',
            'SPACE DEMAND / DELIVERIES',
            'OVERALL VACANCY / ASKING RENT',
          ].map((label, i) => (
            <div key={i} style={{
              flex: 1, background: '#f0f2f4', borderRadius: 4,
              display: 'flex', flexDirection: 'column',
              border: '1px solid #e0e2e4',
            }}>
              <div style={{
                fontSize: 7, fontWeight: 700, color: 'var(--cw-navy)',
                padding: '6px 10px', borderBottom: '1px solid #e0e2e4',
                fontFamily: 'var(--font)', letterSpacing: '0.04em',
              }}>
                {label}
              </div>
              <div style={{
                flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#bbb', fontSize: 9, fontFamily: 'var(--font)',
              }}>
                Chart Placeholder
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
