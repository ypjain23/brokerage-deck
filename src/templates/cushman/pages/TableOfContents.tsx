import React from 'react';
import { CushmanOMData } from '../types';

const tocItems = [
  { num: '01', label: 'EXECUTIVE\nSUMMARY' },
  { num: '02', label: 'PROPERTY\nDESCRIPTION' },
  { num: '03', label: 'AREA AND MARKET\nOVERVIEWS' },
  { num: '04', label: 'TENANT AND LEASE\nSUMMARIES' },
  { num: '05', label: 'FINANCIALS' },
];

export function TableOfContents({ data }: { data: CushmanOMData }) {
  const photo = data.selectedPhotos?.[1] || data.selectedPhotos?.[0];

  return (
    <div className="om-page">
      {/* Top 60% - photo or gradient */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '60%',
        background: photo ? `url(${photo}) center/cover` : 'linear-gradient(135deg, #3d5a6b 0%, #1a2332 100%)',
      }} />

      {/* Bottom 40% - navy bg */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%',
        background: 'var(--cw-navy)',
      }}>
        {/* Title with flanking rules */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 16, marginTop: 28,
        }}>
          <div style={{ width: 80, height: 2, background: 'var(--cw-teal)' }} />
          <div style={{
            fontSize: 14, fontWeight: 700, color: 'white', letterSpacing: '0.2em',
            fontFamily: 'var(--font)',
          }}>
            TABLE OF CONTENTS
          </div>
          <div style={{ width: 80, height: 2, background: 'var(--cw-teal)' }} />
        </div>

        {/* TOC items row */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 0,
          position: 'absolute', bottom: 60, left: 32, right: 32,
        }}>
          {tocItems.map((item, i) => (
            <div key={i} style={{
              flex: 1, textAlign: 'center', padding: '0 8px',
              borderRight: i < tocItems.length - 1 ? '1px solid rgba(255,255,255,0.15)' : 'none',
            }}>
              <div style={{
                fontSize: 50, fontWeight: 700, color: 'var(--cw-teal)',
                fontFamily: 'var(--font)', lineHeight: 1, marginBottom: 8,
              }}>
                {item.num}
              </div>
              <div style={{
                fontSize: 9, fontWeight: 700, color: 'white',
                fontFamily: 'var(--font)', letterSpacing: '0.06em',
                lineHeight: 1.3, whiteSpace: 'pre-line',
              }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer bar */}
      <div className="cw-footer">
        <span>Cushman &amp; Wakefield National Industrial Advisory Group</span>
        <span>///&nbsp;&nbsp;&nbsp;3</span>
      </div>
    </div>
  );
}
