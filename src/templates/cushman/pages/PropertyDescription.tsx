import React from 'react';
import { CushmanOMData, fmtNum } from '../types';
import { PageShell } from '../components/PageShell';
import { SpecTable } from '../components/SpecTable';

export function PropertyDescription({ data }: { data: CushmanOMData }) {
  const d = data.deal;
  const photo = data.selectedPhotos?.[3] || data.selectedPhotos?.[0];

  const specRows = [
    { label: 'Building Size', value: d.total_sf ? `±${fmtNum(d.total_sf)} SF` : '—' },
    { label: 'Year Built', value: d.year_built ? String(d.year_built) : '—' },
    { label: 'Site Size', value: d.land_area_acres ? `±${d.land_area_acres.toFixed(2)} Acres` : '—' },
    { label: 'Zoning', value: d.zoning || '—' },
    { label: 'Clear Height', value: d.clear_height || '—' },
    { label: 'Dock-High Doors', value: d.dock_doors != null ? String(d.dock_doors) : '—' },
    { label: 'Grade Level Doors', value: d.grade_doors != null ? String(d.grade_doors) : '—' },
    { label: 'Car Parking', value: d.parking_spaces ? `${fmtNum(d.parking_spaces)} Spaces` : '—' },
    { label: 'Power', value: '—' },
    { label: 'Sprinklers', value: 'ESFR' },
  ];

  return (
    <PageShell pageNumber={8} showHeader={false}>
      <div className="cw-top-stripe" />

      <div style={{ display: 'flex', height: 'calc(100% - 30px)', paddingTop: 8 }}>
        {/* Left specs 30% */}
        <div style={{ width: '30%', padding: '30px 16px 20px 32px' }}>
          <div className="cw-teal-bar" style={{ marginBottom: 14 }} />
          <div className="cw-section-title" style={{ fontSize: 36, marginBottom: 22 }}>
            PROPERTY<br />DESCRIPTION
          </div>
          <SpecTable rows={specRows} />
        </div>

        {/* Right site plan 70% */}
        <div style={{
          width: '70%', position: 'relative',
          background: photo ? `url(${photo}) center/cover` : '#e0e4e4',
        }}>
          {/* Property info overlay */}
          <div style={{
            position: 'absolute', bottom: 50, left: 20, right: 20,
            background: 'rgba(27,22,63,0.85)', padding: '12px 16px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{
                fontSize: 14, fontWeight: 700, color: 'white',
                fontFamily: 'var(--font)',
              }}>
                {d.property_name || 'PROPERTY NAME'}
              </div>
              <div style={{
                fontSize: 9, fontWeight: 400, color: 'rgba(255,255,255,0.7)',
                fontFamily: 'var(--font)',
              }}>
                {d.address || 'Address'}, {d.city || 'City'}, {d.state || 'ST'} {d.zip || ''}
              </div>
            </div>
            <div style={{
              fontSize: 8, color: 'var(--cw-teal)', fontWeight: 700,
              fontFamily: 'var(--font)', textTransform: 'uppercase',
            }}>
              SITE PLAN
            </div>
          </div>

          {!photo && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#999', fontSize: 14,
            }}>
              SITE PLAN / AERIAL PHOTO
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
