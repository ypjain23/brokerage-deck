import React from 'react';
import { CushmanOMData, fmtNum } from '../types';

export function CoverPage({ data }: { data: CushmanOMData }) {
  const d = data.deal;
  const photo = data.selectedPhotos?.[0];
  const sf = d.total_sf ? `±${fmtNum(d.total_sf)}` : '±0';
  const acres = d.land_area_acres ? `±${d.land_area_acres.toFixed(1)}` : '±0';
  const walt = d.walt ? d.walt.toFixed(1) : '—';

  return (
    <div className="om-page" style={{ background: '#1a2332' }}>
      {/* Background photo */}
      {photo && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${photo})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
        }} />
      )}

      {/* Gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(26,35,50,0.15) 0%, rgba(26,35,50,0.45) 50%, rgba(13,31,45,0.92) 80%, rgba(13,31,45,1) 100%)',
      }} />

      {/* Center content */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 180,
        textAlign: 'center', zIndex: 2,
      }}>
        <div style={{
          fontSize: 9, fontWeight: 300, color: 'white', letterSpacing: '0.2em',
          fontFamily: 'var(--font)', marginBottom: 16,
        }}>
          A <span style={{ fontWeight: 700 }}>CUSHMAN &amp; WAKEFIELD</span> NATIONAL INDUSTRIAL ADVISORY GROUP INVESTMENT OPPORTUNITY
        </div>
        <div style={{
          fontSize: 34, fontWeight: 700, color: 'white', textTransform: 'uppercase',
          fontFamily: 'var(--font)', lineHeight: 1.1, marginBottom: 10,
          padding: '0 80px',
        }}>
          {d.property_name || 'PROPERTY NAME'}
        </div>
        <div style={{
          fontSize: 16, fontWeight: 400, color: 'white', letterSpacing: '0.15em',
          fontFamily: 'var(--font)',
        }}>
          {d.city || 'CITY'}, {d.state || 'STATE'}
        </div>
      </div>

      {/* Bottom metric bar */}
      <div style={{
        position: 'absolute', bottom: 50, left: 0, right: 0, height: 80,
        background: 'var(--cw-cover-bar)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 2,
      }}>
        <div style={{
          fontSize: 12, fontWeight: 400, color: 'white', letterSpacing: '0.12em',
          fontFamily: 'var(--font)', textTransform: 'uppercase',
        }}>
          STABLE IN-PLACE CASH FLOW&nbsp;&nbsp;|&nbsp;&nbsp;100% LEASED&nbsp;&nbsp;|&nbsp;&nbsp;{sf} SF&nbsp;&nbsp;|&nbsp;&nbsp;{acres} ACRES&nbsp;&nbsp;|&nbsp;&nbsp;{walt} YEAR WALT
        </div>
      </div>

      {/* Footer strip */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 50,
        display: 'flex', zIndex: 2,
      }}>
        <div style={{
          width: '30%', background: 'white',
          display: 'flex', alignItems: 'center', paddingLeft: 24,
        }}>
          <span style={{
            fontSize: 11, fontWeight: 700, color: 'var(--cw-navy)',
            fontFamily: 'var(--font)', letterSpacing: '0.08em',
          }}>
            CUSHMAN &amp; WAKEFIELD
          </span>
        </div>
        <div style={{
          width: '70%', background: 'var(--cw-navy)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            fontSize: 11, fontWeight: 700, color: 'white',
            fontFamily: 'var(--font)', letterSpacing: '0.15em',
          }}>
            CONFIDENTIAL OFFERING MEMORANDUM
          </span>
        </div>
      </div>
    </div>
  );
}
