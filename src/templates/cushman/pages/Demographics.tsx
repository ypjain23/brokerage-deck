import React from 'react';
import { CushmanOMData } from '../types';
import { PageShell } from '../components/PageShell';

export function Demographics({ data }: { data: CushmanOMData }) {
  const d = data.deal;
  const cx = 560;
  const cy = 400;

  const circles = [
    { r: 100, label: '1 MILE' },
    { r: 200, label: '3 MILES' },
    { r: 330, label: '5 MILES' },
  ];

  return (
    <PageShell pageNumber={12} showHeader={false} showFooter={true}>
      <div className="cw-top-stripe" />

      {/* Background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: '#e8eef0',
      }}>
        <span style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          color: 'rgba(0,0,0,0.06)', fontSize: 16, fontFamily: 'var(--font)',
        }}>
          MAP PLACEHOLDER
        </span>
      </div>

      {/* Title */}
      <div style={{
        position: 'absolute', top: 22, left: 32,
        fontSize: 34, fontWeight: 700, color: 'var(--cw-navy)',
        fontFamily: 'var(--font)', textTransform: 'uppercase', zIndex: 2,
      }}>
        DEMOGRAPHICS
      </div>

      {/* Concentric circles */}
      {circles.map((c, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: cx - c.r, top: cy - c.r,
          width: c.r * 2, height: c.r * 2,
          borderRadius: '50%',
          border: '2px solid var(--cw-teal)',
          background: 'transparent',
          zIndex: 2,
        }}>
          {/* Radius label bubble */}
          <div style={{
            position: 'absolute',
            right: -10, top: '50%', transform: 'translateY(-50%)',
          }}>
            <div className="cw-callout-bubble" style={{ fontSize: 6, padding: '2px 6px' }}>
              {c.label}
            </div>
          </div>
        </div>
      ))}

      {/* Property star marker */}
      <div style={{
        position: 'absolute', left: cx - 8, top: cy - 8,
        zIndex: 4,
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--cw-teal)" stroke="white" strokeWidth="1">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      </div>

      {/* Demographics data panel */}
      <div style={{
        position: 'absolute', left: 32, bottom: 50, zIndex: 3,
        background: 'white', padding: '12px 16px', border: '1px solid #d0d0d0',
        width: 280,
      }}>
        <div style={{
          fontSize: 8, fontWeight: 700, color: 'var(--cw-teal)',
          marginBottom: 8, letterSpacing: '0.05em',
          fontFamily: 'var(--font)',
        }}>
          DEMOGRAPHIC SUMMARY
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <td style={{ fontSize: 6, fontWeight: 700, color: 'var(--cw-navy)', padding: '2px 4px', borderBottom: '1px solid #ddd' }}></td>
              <td style={{ fontSize: 6, fontWeight: 700, color: 'var(--cw-navy)', padding: '2px 4px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>1-MILE</td>
              <td style={{ fontSize: 6, fontWeight: 700, color: 'var(--cw-navy)', padding: '2px 4px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>3-MILE</td>
              <td style={{ fontSize: 6, fontWeight: 700, color: 'var(--cw-navy)', padding: '2px 4px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>5-MILE</td>
            </tr>
          </thead>
          <tbody>
            {[
              { label: 'Population', vals: ['12,450', '98,320', '285,100'] },
              { label: 'Households', vals: ['4,120', '32,800', '94,500'] },
              { label: 'Avg HH Income', vals: ['$86,200', '$92,100', '$88,700'] },
              { label: 'Median Age', vals: ['34.2', '36.1', '35.5'] },
            ].map((row, i) => (
              <tr key={i}>
                <td style={{ fontSize: 6, fontWeight: 600, color: 'var(--cw-teal)', padding: '2px 4px', borderBottom: '0.5px solid #eee' }}>{row.label}</td>
                {row.vals.map((v, j) => (
                  <td key={j} style={{ fontSize: 6, color: 'var(--cw-data)', padding: '2px 4px', textAlign: 'center', borderBottom: '0.5px solid #eee' }}>{v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
