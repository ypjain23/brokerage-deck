import React from 'react';
import { CushmanOMData, getSectionContent } from '../types';
import { EditableBlock } from '../components/EditableBlock';

export function ExecutiveSummary({ data }: { data: CushmanOMData }) {
  const photo = data.selectedPhotos?.[2] || data.selectedPhotos?.[0];
  const content = getSectionContent(data.sections, 'executive') ||
    'This section provides an overview of the investment opportunity, including key financial metrics, property highlights, and market positioning. The property represents a compelling investment with strong in-place cash flow and favorable market dynamics.';

  return (
    <div className="om-page">
      {/* Full-bleed photo background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: photo ? `url(${photo}) center/cover` : 'linear-gradient(135deg, #4a6b7d 0%, #2a3b4d 100%)',
      }} />

      {/* Left text panel */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 30, width: '28%',
        background: 'rgba(233,236,236,0.96)',
        padding: '40px 22px 20px 32px',
        display: 'flex', flexDirection: 'column',
      }}>
        <div className="cw-teal-bar" style={{ marginBottom: 14 }} />
        <div style={{
          fontSize: 36, fontWeight: 700, color: 'var(--cw-navy)',
          fontFamily: 'var(--font)', lineHeight: 1.0, textTransform: 'uppercase',
          marginBottom: 18, letterSpacing: '-0.5px',
        }}>
          EXECUTIVE<br />SUMMARY
        </div>
        <EditableBlock
          content={content}
          style={{
            fontSize: 10, color: 'var(--cw-body)', fontFamily: 'var(--font)',
            lineHeight: 1.6, textAlign: 'justify', flex: 1, overflow: 'hidden',
          }}
        />
      </div>

      {/* Footer */}
      <div className="cw-footer">
        <span>Cushman &amp; Wakefield National Industrial Advisory Group</span>
        <span>///&nbsp;&nbsp;&nbsp;5</span>
      </div>
    </div>
  );
}
