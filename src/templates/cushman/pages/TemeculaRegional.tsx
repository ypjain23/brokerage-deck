import React from 'react';
import { CushmanOMData, getSectionContent } from '../types';
import { PageShell } from '../components/PageShell';

export function TemeculaRegional({ data }: { data: CushmanOMData }) {
  const content = getSectionContent(data.sections, 'temecula') ||
    'Temecula is a thriving city in southwestern Riverside County known for its wine country, excellent schools, and growing commercial base. The city serves as a regional hub for commerce and distribution, benefiting from its strategic position along the I-15 corridor between San Diego and the Inland Empire.';
  const photo = data.selectedPhotos?.[4] || data.selectedPhotos?.[0];

  return (
    <PageShell pageNumber={15} showHeader={false} showFooter={true}>
      <div className="cw-top-stripe" />

      <div style={{ display: 'flex', height: 'calc(100% - 30px)', paddingTop: 8 }}>
        {/* Left text 48% */}
        <div style={{ width: '48%', padding: '30px 18px 20px 32px' }}>
          <div className="cw-teal-bar" style={{ marginBottom: 14 }} />
          <div style={{
            fontSize: 30, fontWeight: 700, color: 'var(--cw-navy)',
            fontFamily: 'var(--font)', textTransform: 'uppercase', lineHeight: 1.0,
            marginBottom: 4,
          }}>
            TEMECULA
          </div>
          <div style={{
            fontSize: 14, fontWeight: 400, color: 'var(--cw-body)',
            fontFamily: 'var(--font)', marginBottom: 16,
          }}>
            REGIONAL OVERVIEW
          </div>

          <div style={{
            fontSize: 8, color: 'var(--cw-body)', lineHeight: 1.6,
            textAlign: 'justify', fontFamily: 'var(--font)', marginBottom: 20,
          }}>
            {content}
          </div>

          {/* Icon highlight rows */}
          {[
            { title: 'TRANSPORTATION', body: 'Direct access to I-15, the primary north-south corridor connecting San Diego, the Inland Empire, and Las Vegas. The region also benefits from proximity to major rail lines and regional airports.' },
            { title: 'STRATEGIC LOCATION', body: 'Positioned at the nexus of Riverside and San Diego counties, Temecula provides access to a combined population of over 6 million residents and a diverse, skilled workforce.' },
          ].map((item, i) => (
            <div key={i} className="cw-highlight-row" style={{ marginBottom: 14 }}>
              <div className="cw-highlight-icon" style={{ width: 32, height: 32 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {i === 0 ? (
                    <><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></>
                  ) : (
                    <><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" /></>
                  )}
                </svg>
              </div>
              <div>
                <div className="cw-highlight-title" style={{ fontSize: 10 }}>{item.title}</div>
                <div className="cw-highlight-body">{item.body}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Right column 52% */}
        <div style={{ width: '52%', display: 'flex', flexDirection: 'column' }}>
          {/* Top photo 42% */}
          <div style={{
            height: '42%',
            background: photo ? `url(${photo}) center/cover` : '#4a6b7d',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'rgba(255,255,255,0.3)', fontSize: 11,
          }}>
            {!photo && 'PHOTO PLACEHOLDER'}
          </div>

          {/* Bottom demographics 58% */}
          <div style={{ flex: 1, padding: '16px 20px', background: '#f8f9fa' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <td colSpan={2} style={{
                    background: 'var(--cw-teal)', color: 'white', fontSize: 8,
                    fontWeight: 700, padding: '5px 10px', letterSpacing: '0.06em',
                    fontFamily: 'var(--font)',
                  }}>
                    TEMECULA DEMOGRAPHICS
                  </td>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Population', value: '110,003' },
                  { label: 'Labor Force', value: '52,400' },
                  { label: 'Median HH Income', value: '$96,480' },
                  { label: 'Median Home Price', value: '$625,000' },
                  { label: "Bachelor's Degree or Higher", value: '32.1%' },
                  { label: 'Median Age', value: '36.4' },
                ].map((row, i) => (
                  <tr key={i}>
                    <td style={{
                      fontSize: 8, fontWeight: 600, color: 'var(--cw-teal)', padding: '5px 10px',
                      borderBottom: '0.5px solid #ddd', width: '55%', fontFamily: 'var(--font)',
                    }}>{row.label}</td>
                    <td style={{
                      fontSize: 8, color: 'var(--cw-data)', padding: '5px 10px',
                      borderBottom: '0.5px solid #ddd', fontFamily: 'var(--font)',
                    }}>{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
