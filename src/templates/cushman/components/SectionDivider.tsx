import React from 'react';

interface SectionDividerProps {
  sectionNumber: string;
  sectionTitle: string; // may contain \n for multi-line
}

export function SectionDivider({ sectionNumber, sectionTitle }: SectionDividerProps) {
  const lines = sectionTitle.split('\n');
  return (
    <div className="om-page" style={{
      background: 'linear-gradient(135deg, var(--cw-div-teal) 0%, var(--cw-div-teal) 30%, var(--cw-div-navy) 100%)',
    }}>
      {/* Hatching texture top strip */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: '35%', height: 14,
        background: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.07) 0px, rgba(255,255,255,0.07) 1px, transparent 1px, transparent 8px)',
      }} />

      {/* Diagonal accent stripes */}
      <div style={{
        position: 'absolute', right: '23%', top: -20, bottom: -20, width: 50,
        background: 'var(--cw-div-accent1)', transform: 'skewX(-12deg)',
      }} />
      <div style={{
        position: 'absolute', right: '17.5%', top: -20, bottom: -20, width: 50,
        background: 'var(--cw-div-accent2)', transform: 'skewX(-12deg)',
      }} />
      <div style={{
        position: 'absolute', right: '18.5%', top: '42%', width: 66, height: 110,
        background: 'var(--cw-div-light)', transform: 'skewX(-12deg)',
      }} />

      {/* Section number */}
      <div style={{
        position: 'absolute', left: 32, top: '52%',
        fontSize: 80, fontWeight: 700, color: 'white', lineHeight: 1,
        fontFamily: 'var(--font)',
      }}>
        {sectionNumber}
      </div>

      {/* Teal rule */}
      <div style={{
        position: 'absolute', left: 32, top: 'calc(52% + 90px)',
        width: 260, height: 2, background: 'var(--cw-teal)',
      }} />

      {/* Section title */}
      <div style={{
        position: 'absolute', left: 32, top: 'calc(52% + 100px)',
        fontSize: 36, fontWeight: 700, color: 'white', lineHeight: 1.05,
        textTransform: 'uppercase', fontFamily: 'var(--font)',
      }}>
        {lines.map((line, i) => (
          <React.Fragment key={i}>
            {i > 0 && <br />}
            {line}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
