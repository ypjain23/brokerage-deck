import React from 'react';
import { CushmanOMData, getSectionContent, fmtNum } from '../types';
import { PageShell } from '../components/PageShell';

export function TenantSummary({ data }: { data: CushmanOMData }) {
  const d = data.deal;
  const content = getSectionContent(data.sections, 'tenant') ||
    'The tenant is a well-established company with a strong credit profile and long operating history. Their commitment to this location is evidenced by their long-term lease agreement and significant investment in tenant improvements. The company has demonstrated consistent revenue growth and maintains a solid balance sheet, providing investors with confidence in the stability of the rental income stream.';
  const photo = data.selectedPhotos?.[5] || data.selectedPhotos?.[0];

  const tenantInfo = [
    { label: 'Tenant', value: 'Primary Tenant' },
    { label: 'Headquarters', value: `${d.city || 'City'}, ${d.state || 'ST'}` },
    { label: 'Founded', value: '—' },
    { label: 'Website', value: '—' },
    { label: 'Square Footage', value: d.total_sf ? `${fmtNum(d.total_sf)} SF` : '—' },
  ];

  return (
    <PageShell pageNumber={18} showHeader={false} showFooter={true}>
      <div className="cw-top-stripe" />

      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100% - 30px)', paddingTop: 8 }}>
        {/* Top content 38% */}
        <div style={{ height: '38%', display: 'flex', padding: '22px 24px 12px 32px' }}>
          {/* Left tenant info table 40% */}
          <div style={{ width: '40%', paddingRight: 16 }}>
            <div className="cw-teal-bar" style={{ marginBottom: 14 }} />
            <div className="cw-section-title" style={{ fontSize: 36, marginBottom: 16 }}>
              TENANT<br />SUMMARY
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <tbody>
                {tenantInfo.map((row, i) => (
                  <tr key={i}>
                    <td style={{
                      fontSize: 8, fontWeight: 700, color: 'var(--cw-teal)',
                      padding: '4px 8px 4px 0', borderBottom: '0.5px solid #e8e8e8',
                      fontFamily: 'var(--font)', width: '40%',
                    }}>{row.label}</td>
                    <td style={{
                      fontSize: 8, color: 'var(--cw-data)', padding: '4px 0',
                      borderBottom: '0.5px solid #e8e8e8', fontFamily: 'var(--font)',
                    }}>{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Right summary text 60% */}
          <div style={{ width: '60%', paddingTop: 50 }}>
            <div style={{
              fontSize: 8, color: 'var(--cw-body)', lineHeight: 1.6,
              textAlign: 'justify', fontFamily: 'var(--font)',
            }}>
              {content}
            </div>
          </div>
        </div>

        {/* Bottom photo 62% */}
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
