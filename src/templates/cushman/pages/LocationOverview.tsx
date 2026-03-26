import React from 'react';
import { CushmanOMData } from '../types';
import { PageShell } from '../components/PageShell';

const defaultDistances = [
  { name: 'Ontario International Airport', distance: '15 miles', drive: '20 min' },
  { name: 'Port of Los Angeles', distance: '65 miles', drive: '70 min' },
  { name: 'Port of Long Beach', distance: '60 miles', drive: '65 min' },
  { name: 'I-15 Freeway', distance: '2 miles', drive: '4 min' },
  { name: 'I-10 Freeway', distance: '8 miles', drive: '12 min' },
];

export function LocationOverview({ data }: { data: CushmanOMData }) {
  const d = data.deal;

  return (
    <PageShell pageNumber={10} showHeader={false} showFooter={true}>
      <div className="cw-top-stripe" />

      {/* Background map placeholder */}
      <div style={{
        position: 'absolute', inset: 0,
        background: '#3d5a45',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 18, fontFamily: 'var(--font)' }}>
          SATELLITE MAP PLACEHOLDER
        </span>
      </div>

      {/* Title */}
      <div style={{
        position: 'absolute', top: 20, left: 32,
        fontSize: 36, fontWeight: 700, color: 'white',
        fontFamily: 'var(--font)', textTransform: 'uppercase', zIndex: 2,
      }}>
        LOCATION OVERVIEW
      </div>

      {/* Circular inset */}
      <div style={{
        position: 'absolute', left: '2%', top: '13%',
        width: 370, height: 370, borderRadius: '50%',
        border: '3px solid var(--cw-teal)',
        background: 'rgba(61,90,69,0.5)',
        zIndex: 2,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: 30,
      }}>
        <div className="cw-callout-bubble">
          PROPERTY LOCATION
        </div>
      </div>

      {/* Property marker */}
      <div style={{
        position: 'absolute', left: 'calc(2% + 175px)', top: 'calc(13% + 175px)',
        width: 14, height: 14, borderRadius: '50%',
        background: 'var(--cw-teal)', border: '2px solid white',
        transform: 'translate(-50%, -50%)', zIndex: 3,
      }} />

      {/* Distance table */}
      <div style={{
        position: 'absolute', bottom: 80, left: 22,
        width: 380, zIndex: 2,
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <td style={{
                background: 'var(--cw-teal)', color: 'white', fontSize: 7, fontWeight: 700,
                padding: '4px 8px', fontFamily: 'var(--font)', letterSpacing: '0.05em',
              }}>SUBMARKET</td>
              <td style={{
                background: 'var(--cw-teal)', color: 'white', fontSize: 7, fontWeight: 700,
                padding: '4px 8px', textAlign: 'center', fontFamily: 'var(--font)',
              }}>DISTANCE</td>
              <td style={{
                background: 'var(--cw-teal)', color: 'white', fontSize: 7, fontWeight: 700,
                padding: '4px 8px', textAlign: 'center', fontFamily: 'var(--font)',
              }}>DRIVE TIME</td>
            </tr>
          </thead>
          <tbody>
            {defaultDistances.map((row, i) => (
              <tr key={i}>
                <td style={{
                  background: 'rgba(255,255,255,0.9)', fontSize: 7, padding: '3px 8px',
                  color: 'var(--cw-body)', fontFamily: 'var(--font)',
                  borderBottom: '0.5px solid #ddd',
                }}>{row.name}</td>
                <td style={{
                  background: 'rgba(255,255,255,0.9)', fontSize: 7, padding: '3px 8px',
                  color: 'var(--cw-data)', textAlign: 'center', fontFamily: 'var(--font)',
                  borderBottom: '0.5px solid #ddd',
                }}>{row.distance}</td>
                <td style={{
                  background: 'rgba(255,255,255,0.9)', fontSize: 7, padding: '3px 8px',
                  color: 'var(--cw-data)', textAlign: 'center', fontFamily: 'var(--font)',
                  borderBottom: '0.5px solid #ddd',
                }}>{row.drive}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
