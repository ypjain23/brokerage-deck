import React from 'react';
import { CushmanOMData, fmtNum, fmtDollar } from '../types';
import { PageShell } from '../components/PageShell';
import { DataTable } from '../components/DataTable';

export function CashFlow({ data }: { data: CushmanOMData }) {
  const d = data.deal;
  const sf = d.total_sf || 100000;
  const noi = d.noi || 0;
  const growth = 1.03;

  // Generate 5-year projections
  const years = [1, 2, 3, 4, 5];
  const noiByYear = years.map(y => noi * Math.pow(growth, y - 1));
  const rentByYear = noiByYear.map(n => n * 1.15); // gross rent ~115% of NOI
  const expByYear = rentByYear.map((r, i) => r - noiByYear[i]);
  const reimbByYear = expByYear.map(e => e * 0.95);
  const egrByYear = rentByYear.map((r, i) => r + reimbByYear[i] - expByYear[i] * 0.05);
  const tiLcByYear = years.map(() => sf * 0.15);
  const capResYear = years.map(() => sf * 0.15);
  const ncfByYear = noiByYear.map((n, i) => n - tiLcByYear[i] - capResYear[i]);

  const fmtCell = (n: number) => n ? fmtDollar(Math.round(n)) : '—';
  const fmtPsf = (n: number) => sf > 0 ? `$${(n / sf).toFixed(2)}` : '—';

  const headers = ['', 'Per SF', 'Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'];

  const groupHeaders = [
    { label: '', span: 2 },
    { label: 'PROJECTED CASH FLOW', span: 5 },
  ];

  const rows = [
    { cells: ['Avg Occupancy', '', '100.0%', '100.0%', '95.0%', '95.0%', '95.0%'], bold: false },
    { cells: ['Scheduled Base Rent', fmtPsf(rentByYear[0]), ...rentByYear.map(fmtCell)], bold: false },
    { cells: ['Absorption & Turnover Vacancy', '', '$0', '$0', '$0', '$0', '$0'], bold: false },
    { cells: ['Total Rental Revenue', fmtPsf(rentByYear[0]), ...rentByYear.map(fmtCell)], bold: true },
    { cells: ['Expense Reimbursements', fmtPsf(reimbByYear[0]), ...reimbByYear.map(fmtCell)], bold: false },
    { cells: ['Effective Gross Revenue', fmtPsf(egrByYear[0]), ...egrByYear.map(fmtCell)], total: true },
    { cells: ['Operating Expenses', fmtPsf(expByYear[0]), ...expByYear.map(r => `(${fmtDollar(Math.round(r))})`)], bold: false },
    { cells: ['Net Operating Income', fmtPsf(noiByYear[0]), ...noiByYear.map(fmtCell)], navyTotal: true },
    { cells: ['TI / Leasing Commissions', fmtPsf(tiLcByYear[0]), ...tiLcByYear.map(fmtCell)], bold: false },
    { cells: ['Capital Reserves', fmtPsf(capResYear[0]), ...capResYear.map(fmtCell)], bold: false },
    { cells: ['Net Cash Flow', fmtPsf(ncfByYear[0]), ...ncfByYear.map(fmtCell)], navyTotal: true },
  ];

  return (
    <PageShell pageNumber={23} showHeader={false} showFooter={true}>
      <div className="cw-top-stripe" />

      <div style={{ padding: '30px 24px 20px 32px' }}>
        <div className="cw-teal-bar" style={{ marginBottom: 14 }} />
        <div className="cw-section-title" style={{ fontSize: 34, marginBottom: 12 }}>
          CASH FLOW
        </div>

        <div style={{
          fontSize: 8, color: 'var(--cw-body)', fontFamily: 'var(--font)',
          marginBottom: 16, display: 'flex', gap: 32,
        }}>
          <span><strong style={{ color: 'var(--cw-navy)' }}>NRA:</strong> {fmtNum(sf)} SF</span>
          <span><strong style={{ color: 'var(--cw-navy)' }}>START DATE:</strong> MAY-26</span>
        </div>

        <DataTable headers={headers} groupHeaders={groupHeaders} rows={rows} />
      </div>
    </PageShell>
  );
}
