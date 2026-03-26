import React from 'react';
import { CushmanOMData, fmtNum, fmtDollar } from '../types';
import { PageShell } from '../components/PageShell';
import { DataTable } from '../components/DataTable';

export function RentRoll({ data }: { data: CushmanOMData }) {
  const d = data.deal;
  const sf = d.total_sf || 0;
  const noi = d.noi || 0;
  const annualRent = noi > 0 ? noi : 0;
  const psf = sf > 0 && annualRent > 0 ? annualRent / sf : 0;
  const monthly = annualRent / 12;
  const photo = data.selectedPhotos?.[6] || data.selectedPhotos?.[0];

  const headers = ['Suite #', 'Tenant', 'RSF', '% of NRA', 'Start', 'Expiration', 'Annual', 'PSF', 'Monthly'];

  const rows = [
    {
      cells: [
        '100',
        'Primary Tenant',
        sf ? fmtNum(sf) : '—',
        '100.0%',
        '—',
        '—',
        annualRent ? fmtDollar(annualRent) : '—',
        psf ? `$${psf.toFixed(2)}` : '—',
        monthly ? fmtDollar(Math.round(monthly)) : '—',
      ],
    },
    {
      cells: [
        '',
        'TOTAL',
        sf ? fmtNum(sf) : '—',
        '100.0%',
        '',
        '',
        annualRent ? fmtDollar(annualRent) : '—',
        psf ? `$${psf.toFixed(2)}` : '—',
        monthly ? fmtDollar(Math.round(monthly)) : '—',
      ],
      total: true,
    },
  ];

  return (
    <PageShell pageNumber={21} showHeader={false} showFooter={true}>
      <div className="cw-top-stripe" />

      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 30px)', paddingTop: 8 }}>
        {/* Top table */}
        <div style={{ padding: '22px 32px 16px 32px' }}>
          <div className="cw-teal-bar" style={{ marginBottom: 14 }} />
          <div className="cw-section-title" style={{ fontSize: 36, marginBottom: 20 }}>
            RENT ROLL
          </div>

          <DataTable headers={headers} rows={rows} />
        </div>

        {/* Bottom photo */}
        <div style={{
          flex: 1,
          background: photo ? `url(${photo}) center/cover` : '#4a6b7d',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'rgba(255,255,255,0.3)', fontSize: 12,
        }}>
          {!photo && 'PHOTO PLACEHOLDER'}
        </div>
      </div>
    </PageShell>
  );
}
