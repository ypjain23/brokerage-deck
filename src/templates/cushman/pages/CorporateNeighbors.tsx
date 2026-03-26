import React from 'react';
import { CushmanOMData } from '../types';
import { PageShell } from '../components/PageShell';

const defaultNeighbors = [
  { name: 'DENSO', x: '15%', y: '25%' },
  { name: 'CRASH CHAMPIONS', x: '55%', y: '18%' },
  { name: 'amazon', x: '70%', y: '35%' },
  { name: 'MEDLINE', x: '25%', y: '50%' },
  { name: 'Abbott', x: '60%', y: '55%' },
  { name: 'Scotts', x: '40%', y: '70%' },
  { name: 'MILGARD', x: '75%', y: '65%' },
];

export function CorporateNeighbors({ data }: { data: CushmanOMData }) {
  return (
    <PageShell pageNumber={11} showHeader={false} showFooter={true}>
      <div className="cw-top-stripe" />

      {/* Background aerial placeholder */}
      <div style={{
        position: 'absolute', inset: 0,
        background: '#4a5d52',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ color: 'rgba(255,255,255,0.1)', fontSize: 18, fontFamily: 'var(--font)' }}>
          AERIAL MAP PLACEHOLDER
        </span>
      </div>

      {/* Title */}
      <div style={{
        position: 'absolute', top: 22, left: 32,
        fontSize: 34, fontWeight: 700, color: 'white',
        fontFamily: 'var(--font)', textTransform: 'uppercase', zIndex: 2,
      }}>
        CORPORATE NEIGHBORS
      </div>

      {/* Company name cards */}
      {defaultNeighbors.map((n, i) => (
        <div key={i} style={{
          position: 'absolute', left: n.x, top: n.y,
          background: 'rgba(255,255,255,0.92)', padding: '5px 10px',
          fontSize: 8, fontWeight: 700, color: 'var(--cw-navy)',
          fontFamily: 'var(--font)', letterSpacing: '0.04em',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)', zIndex: 2,
          whiteSpace: 'nowrap',
        }}>
          {n.name}
        </div>
      ))}

      {/* Property marker */}
      <div style={{
        position: 'absolute', left: '45%', top: '42%',
        zIndex: 3,
      }}>
        <div style={{
          width: 18, height: 18, borderRadius: '50%',
          background: 'var(--cw-teal)', border: '2px solid white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'white' }} />
        </div>
        <div style={{
          background: 'var(--cw-teal)', color: 'white', fontSize: 6,
          fontWeight: 700, padding: '2px 6px', marginTop: 2,
          fontFamily: 'var(--font)', whiteSpace: 'nowrap',
        }}>
          SUBJECT PROPERTY
        </div>
      </div>
    </PageShell>
  );
}
