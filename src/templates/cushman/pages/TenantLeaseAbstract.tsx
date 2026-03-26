import React from 'react';
import { CushmanOMData, fmtNum } from '../types';
import { PageShell } from '../components/PageShell';

export function TenantLeaseAbstract({ data }: { data: CushmanOMData }) {
  const d = data.deal;

  const leaseRows = [
    { label: 'Address', value: `${d.address || '—'}, ${d.city || ''}, ${d.state || ''} ${d.zip || ''}` },
    { label: 'Tenant', value: 'Primary Tenant' },
    { label: 'Square Footage', value: d.total_sf ? `${fmtNum(d.total_sf)} SF` : '—' },
    { label: 'Lease Commencement', value: '—' },
    { label: 'Lease Expiration', value: '—' },
    { label: 'Expense Structure', value: 'NNN (Triple Net)' },
    { label: 'Landlord Obligations', value: 'Roof and Structure (subject to lease terms)' },
    { label: 'Tenant Obligations', value: 'All operating expenses including property taxes, insurance, CAM, and utilities' },
    { label: 'Renewal Option', value: '—' },
  ];

  return (
    <PageShell pageNumber={19} showHeader={false} showFooter={true}>
      <div className="cw-top-stripe" />

      <div style={{ padding: '30px 32px 20px 32px' }}>
        <div className="cw-teal-bar" style={{ marginBottom: 14 }} />
        <div className="cw-section-title" style={{ fontSize: 30, marginBottom: 24 }}>
          TENANT LEASE ABSTRACT
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {leaseRows.map((row, i) => (
              <tr key={i}>
                <td style={{
                  width: '30%',
                  fontSize: 9, fontWeight: 700, color: 'var(--cw-teal)',
                  padding: '10px 14px', borderBottom: '0.5px solid #e0e0e0',
                  fontFamily: 'var(--font)', verticalAlign: 'top',
                  background: 'rgba(0,146,174,0.06)',
                }}>
                  {row.label}
                </td>
                <td style={{
                  width: '70%',
                  fontSize: 9, color: 'var(--cw-body)', padding: '10px 14px',
                  borderBottom: '0.5px solid #e0e0e0', fontFamily: 'var(--font)',
                  lineHeight: 1.5, verticalAlign: 'top',
                }}>
                  {row.value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PageShell>
  );
}
