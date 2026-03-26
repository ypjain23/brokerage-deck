import React from 'react';
import { CushmanOMData, getSectionContent } from '../types';

export function InlandEmpire({ data }: { data: CushmanOMData }) {
  const content = getSectionContent(data.sections, 'inland') ||
    'The Inland Empire is one of the largest and most dynamic industrial markets in the United States, serving as the primary distribution hub for goods entering through the ports of Los Angeles and Long Beach. With over 600 million square feet of industrial inventory, the region has experienced unprecedented demand driven by e-commerce growth, supply chain reconfiguration, and population expansion. The market continues to attract significant institutional investment due to its strategic location, robust infrastructure, and deep labor pool.';

  const paragraphs = content.split(/\n\n+/).filter(Boolean);
  const mid = Math.ceil(paragraphs.length / 2);

  return (
    <div className="om-page">
      <div className="cw-top-stripe" />

      <div style={{ display: 'flex', height: 'calc(100% - 30px)', paddingTop: 8 }}>
        {/* Left text 55% */}
        <div style={{ width: '55%', padding: '30px 20px 20px 32px' }}>
          <div className="cw-teal-bar" style={{ marginBottom: 14 }} />
          <div className="cw-section-title" style={{ fontSize: 34, marginBottom: 18 }}>
            INLAND EMPIRE
          </div>

          <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ flex: 1, fontSize: 8, color: 'var(--cw-body)', lineHeight: 1.6, textAlign: 'justify', fontFamily: 'var(--font)' }}>
              {paragraphs.slice(0, mid).map((p, i) => (
                <p key={i} style={{ marginBottom: 8 }}>{p}</p>
              ))}
            </div>
            <div style={{ flex: 1, fontSize: 8, color: 'var(--cw-body)', lineHeight: 1.6, textAlign: 'justify', fontFamily: 'var(--font)' }}>
              {paragraphs.slice(mid).map((p, i) => (
                <p key={i} style={{ marginBottom: 8 }}>{p}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Right dark panel 45% */}
        <div style={{
          width: '45%', background: 'var(--cw-navy)',
          padding: '40px 28px 20px 28px',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            fontSize: 13, fontWeight: 700, color: 'var(--cw-teal)',
            fontFamily: 'var(--font)', letterSpacing: '0.08em', marginBottom: 14,
          }}>
            THE NATION&apos;S LEADING LOGISTICS HUB
          </div>

          <div style={{
            fontSize: 9, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6,
            fontFamily: 'var(--font)', marginBottom: 30,
          }}>
            The Inland Empire has cemented its position as the nation&apos;s preeminent logistics
            hub, processing a substantial share of goods entering the U.S. through
            Southern California&apos;s port complex. The region&apos;s strategic advantages include
            unmatched freeway and rail infrastructure, proximity to the nation&apos;s busiest port
            complex, and a large, skilled labor force.
          </div>

          <div style={{
            fontSize: 10, fontWeight: 700, color: 'var(--cw-teal)',
            fontFamily: 'var(--font)', letterSpacing: '0.06em', marginBottom: 20,
          }}>
            INLAND EMPIRE DEMOGRAPHICS
          </div>

          {/* 2x2 stat grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {[
              { value: '±4.6M', label: 'POPULATION' },
              { value: '±1.6M', label: 'LABOR FORCE' },
              { value: '$86K', label: 'MEDIAN HH INCOME' },
              { value: '$584K', label: 'MEDIAN HOME PRICE' },
            ].map((stat, i) => (
              <div key={i} className="cw-stat-block">
                <div className="cw-stat-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {i === 0 && <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></>}
                    {i === 1 && <><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" /></>}
                    {i === 2 && <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></>}
                    {i === 3 && <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></>}
                  </svg>
                </div>
                <div className="cw-stat-value">{stat.value}</div>
                <div className="cw-stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer - reversed: page number left */}
      <div className="cw-footer">
        <span>14&nbsp;&nbsp;&nbsp;///</span>
        <span>Cushman &amp; Wakefield National Industrial Advisory Group</span>
      </div>
    </div>
  );
}
