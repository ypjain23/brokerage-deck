import React from 'react';
import { CushmanOMData } from '../types';
import { PageShell } from '../components/PageShell';

export function DisclaimerPage({ data }: { data: CushmanOMData }) {
  return (
    <PageShell pageNumber={2} propertyName={data.deal.property_name}>
      <div className="cw-top-stripe" />

      <div style={{ display: 'flex', height: 'calc(100% - 38px)', paddingTop: 28 }}>
        {/* Left column - Disclaimer */}
        <div style={{ width: '54%', padding: '20px 28px 20px 32px', overflow: 'hidden' }}>
          <div style={{
            fontSize: 14, fontWeight: 700, color: 'var(--cw-navy)',
            fontFamily: 'var(--font)', marginBottom: 14, textTransform: 'uppercase',
          }}>
            Confidentiality &amp; Disclaimer
          </div>
          <div style={{
            fontSize: 8, color: 'var(--cw-body)', fontFamily: 'var(--font)',
            lineHeight: 1.6, textAlign: 'justify',
          }}>
            <p style={{ marginBottom: 8 }}>
              This Confidential Offering Memorandum has been prepared by Cushman &amp; Wakefield for
              use by a limited number of parties and does not purport to provide a necessarily accurate
              summary of the property or any of the documents related thereto, nor does it purport to be
              all-inclusive or to contain all of the information which prospective investors may need or
              desire.
            </p>
            <p style={{ marginBottom: 8 }}>
              All financial projections are provided for general reference purposes only and are based on
              assumptions relating to the general economy, competition, and other factors beyond the
              control of the owner and the broker. Therefore, actual results may vary materially from
              those projected.
            </p>
            <p style={{ marginBottom: 8 }}>
              The information contained herein is not a substitute for thorough due diligence
              investigation. The owner and the broker make no guarantees, warranties, or representations
              whatsoever regarding the accuracy, completeness, or suitability of any information
              provided.
            </p>
            <p style={{ marginBottom: 8 }}>
              Prospective buyers should make their own projections and form their own conclusions
              without reliance upon the material contained herein and should consult their own
              professional advisors including attorneys, accountants, and real estate professionals.
            </p>
            <p>
              By accepting this Offering Memorandum, the recipient agrees that the information contained
              herein is confidential, and that the recipient will not copy, reproduce, or distribute this
              memorandum to others without the prior written authorization of the broker.
            </p>
          </div>
        </div>

        {/* Vertical divider */}
        <div style={{
          width: 1, background: '#d8d8d8', flexShrink: 0,
        }} />

        {/* Right column - Contacts */}
        <div style={{ flex: 1, padding: '20px 28px 20px 24px' }}>
          <div style={{
            fontSize: 10, fontWeight: 600, color: 'var(--cw-teal)',
            fontFamily: 'var(--font)', marginBottom: 20,
          }}>
            For more information, please contact:
          </div>

          {[
            { name: 'John Smith', title: 'Executive Director', phone: '+1 555 123 4567', email: 'john.smith@cushwake.com', lic: 'CA Lic. #01234567' },
            { name: 'Jane Doe', title: 'Senior Director', phone: '+1 555 234 5678', email: 'jane.doe@cushwake.com', lic: 'CA Lic. #02345678' },
          ].map((c, i) => (
            <div key={i} style={{ marginBottom: 20 }}>
              <div style={{
                fontSize: 13, fontWeight: 700, color: 'var(--cw-navy)',
                fontFamily: 'var(--font)', marginBottom: 2,
              }}>{c.name}</div>
              <div style={{ fontSize: 9, color: 'var(--cw-teal)', fontWeight: 600, marginBottom: 4 }}>{c.title}</div>
              <div style={{ fontSize: 8, color: 'var(--cw-body)', lineHeight: 1.6 }}>
                <div>T {c.phone}</div>
                <div>{c.email}</div>
                <div style={{ marginTop: 2, fontSize: 7, color: '#999' }}>{c.lic}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
