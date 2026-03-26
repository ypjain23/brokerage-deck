import React from 'react';
import { CushmanOMData } from '../types';
import { PageShell } from '../components/PageShell';

export function PhotoGallery({ data }: { data: CushmanOMData }) {
  const photos = data.selectedPhotos || [];
  const gap = 2;

  const photoCell = (index: number, style: React.CSSProperties) => (
    <div style={{
      ...style,
      background: photos[index]
        ? `url(${photos[index]}) center/cover`
        : '#4a6b7d',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'rgba(255,255,255,0.3)', fontSize: 11,
    }}>
      {!photos[index] && 'PHOTO'}
    </div>
  );

  return (
    <PageShell pageNumber={9} showHeader={false} showFooter={true}>
      <div className="cw-top-stripe" />

      <div style={{
        position: 'absolute', top: 8, left: 0, right: 0, bottom: 30,
        display: 'flex', flexDirection: 'column', gap,
      }}>
        {/* Top row: 1 large left + 2 stacked right */}
        <div style={{ flex: 1, display: 'flex', gap }}>
          {photoCell(0, { width: '50%' })}
          <div style={{ width: '50%', display: 'flex', flexDirection: 'column', gap }}>
            {photoCell(1, { flex: 1 })}
            {photoCell(2, { flex: 1 })}
          </div>
        </div>

        {/* Bottom row: 3 equal */}
        <div style={{ flex: 1, display: 'flex', gap }}>
          {photoCell(3, { flex: 1 })}
          {photoCell(4, { flex: 1 })}
          {photoCell(5, { flex: 1 })}
        </div>
      </div>
    </PageShell>
  );
}
