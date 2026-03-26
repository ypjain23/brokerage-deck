import React from 'react';
import { CushmanOMData, fmtNum, fmtDollar, fmtPct } from '../types';
import { PageShell } from '../components/PageShell';

export function MarketAssumptions({ data }: { data: CushmanOMData }) {
  const d = data.deal;
  const psf = d.total_sf && d.noi ? (d.noi / d.total_sf).toFixed(2) : '—';

  const assumptions = [
    { label: 'Analysis Start Date', value: 'May 2026' },
    { label: 'Occupancy', value: d.occupancy_pct ? fmtPct(d.occupancy_pct) : '100.0%' },
    { label: 'General Vacancy', value: '5.0%' },
    { label: 'Market Rent Inflation', value: '3.0%' },
    { label: 'Expense Inflation', value: '3.0%' },
    { label: 'Lease Term', value: '5 Years' },
    { label: 'Market Rents NNN', value: psf !== '—' ? `$${psf} PSF` : '—' },
    { label: 'Annual Increases', value: '3.0%' },
    { label: 'Reimbursements', value: 'NNN — Tenant pays all operating expenses' },
    { label: 'Management Fee', value: '2.0% of EGR' },
    { label: 'Tax Rate', value: '1.1% of assessed value' },
    { label: 'Retention Ratio', value: '75%' },
    { label: 'Downtime', value: '6 Months' },
    { label: 'Tenant Improvements', value: '$5.00 PSF (New) / $2.50 PSF (Renewal)' },
    { label: 'Leasing Commissions', value: '6.0% (New) / 3.0% (Renewal)' },
    { label: 'Capital Reserve', value: '$0.15 PSF' },
  ];

  return (
    <PageShell pageNumber={22} showHeader={false} showFooter={true}>
      <div className="cw-top-stripe" />

      <div style={{ padding: '30px 32px 20px 32px' }}>
        <div className="cw-teal-bar" style={{ marginBottom: 14 }} />
        <div className="cw-section-title" style={{ fontSize: 30, marginBottom: 10 }}>
          MARKET LEASE ASSUMPTION
        </div>
        <div style={{
          fontSize: 10, fontWeight: 600, color: 'var(--cw-teal)',
          fontFamily: 'var(--font)', marginBottom: 18,
        }}>
          Primary Cash Flow Assumptions
        </div>

        <table className="cw-assumptions-table">
          <tbody>
            {assumptions.map((row, i) => (
              <tr key={i}>
                <td className="label-cell">{row.label}</td>
                <td className="value-cell">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
