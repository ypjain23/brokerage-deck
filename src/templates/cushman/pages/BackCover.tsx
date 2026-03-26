import React from 'react';
import { CushmanOMData } from '../types';

const teamColumns = [
  { region: 'CENTRAL', names: ['John Smith', 'Jane Doe'] },
  { region: 'MOUNTAIN WEST', names: ['Mike Johnson', 'Sarah Lee'] },
  { region: 'WEST', names: ['Tom Brown', 'Lisa Chen'] },
  { region: 'PACIFIC NW', names: ['David Park', 'Amy Wilson'] },
  { region: 'SOUTHWEST', names: ['Chris Taylor', 'Kelly Martin'] },
  { region: 'SOUTHEAST', names: ['Robert Davis', 'Maria Garcia'] },
  { region: 'NORTHEAST', names: ['James White', 'Susan Clark'] },
  { region: 'MID-ATLANTIC', names: ['Brian Hall', 'Laura Young'] },
  { region: 'GREAT LAKES', names: ['Kevin Moore', 'Rachel Adams'] },
];

export function BackCover({ data }: { data: CushmanOMData }) {
  return (
    <div className="om-page">
      {/* Top section: Transaction leaders contact grid */}
      <div style={{
        padding: '40px 40px 24px 40px',
        display: 'flex', gap: 32,
      }}>
        {[
          {
            title: 'TRANSACTION LEADERS',
            contacts: [
              { name: 'John Smith', role: 'Executive Director', phone: '+1 555 123 4567', email: 'john.smith@cushwake.com' },
              { name: 'Jane Doe', role: 'Senior Director', phone: '+1 555 234 5678', email: 'jane.doe@cushwake.com' },
            ],
          },
          {
            title: 'LEASING ADVISORS',
            contacts: [
              { name: 'Mike Johnson', role: 'Director', phone: '+1 555 345 6789', email: 'mike.johnson@cushwake.com' },
            ],
          },
          {
            title: 'FINANCING',
            contacts: [
              { name: 'Sarah Lee', role: 'Managing Director', phone: '+1 555 456 7890', email: 'sarah.lee@cushwake.com' },
            ],
          },
        ].map((col, i) => (
          <div key={i} style={{ flex: 1 }}>
            <div style={{
              fontSize: 9, fontWeight: 700, color: 'var(--cw-teal)',
              fontFamily: 'var(--font)', letterSpacing: '0.08em', marginBottom: 12,
              borderBottom: '2px solid var(--cw-teal)', paddingBottom: 6,
            }}>
              {col.title}
            </div>
            {col.contacts.map((c, j) => (
              <div key={j} style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--cw-navy)', fontFamily: 'var(--font)' }}>{c.name}</div>
                <div style={{ fontSize: 7, color: 'var(--cw-teal)', fontWeight: 600, marginBottom: 2 }}>{c.role}</div>
                <div style={{ fontSize: 7, color: 'var(--cw-body)', lineHeight: 1.5, fontFamily: 'var(--font)' }}>
                  T {c.phone}<br />{c.email}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Middle: bordered box with team grid */}
      <div style={{
        margin: '10px 40px 0 40px',
        border: '1px solid #d0d0d0',
        padding: '18px 20px',
      }}>
        {/* Title with flanking rules */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 12, marginBottom: 18,
        }}>
          <div style={{ flex: 1, height: 1, background: '#d0d0d0' }} />
          <div style={{
            fontSize: 9, fontWeight: 700, color: 'var(--cw-navy)',
            fontFamily: 'var(--font)', letterSpacing: '0.1em', whiteSpace: 'nowrap',
          }}>
            CUSHMAN &amp; WAKEFIELD NATIONAL INDUSTRIAL ADVISORY GROUP
          </div>
          <div style={{ flex: 1, height: 1, background: '#d0d0d0' }} />
        </div>

        {/* 9-column team grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 8,
        }}>
          {teamColumns.map((col, i) => (
            <div key={i} style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: 5.5, fontWeight: 700, color: 'var(--cw-teal)',
                fontFamily: 'var(--font)', letterSpacing: '0.04em', marginBottom: 6,
                borderBottom: '1px solid var(--cw-teal)', paddingBottom: 3,
              }}>
                {col.region}
              </div>
              {col.names.map((name, j) => (
                <div key={j} style={{
                  fontSize: 5.5, color: 'var(--cw-body)', fontFamily: 'var(--font)',
                  lineHeight: 1.6,
                }}>
                  {name}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Bottom: URL + legal text */}
      <div style={{
        position: 'absolute', bottom: 30, left: 40, right: 40,
        textAlign: 'center',
      }}>
        <div style={{
          fontSize: 10, fontWeight: 700, color: 'var(--cw-teal)',
          fontFamily: 'var(--font)', letterSpacing: '0.1em', marginBottom: 8,
        }}>
          cushmanwakefield.com
        </div>
        <div style={{
          fontSize: 6, color: '#999', fontFamily: 'var(--font)',
          lineHeight: 1.5, maxWidth: 700, margin: '0 auto',
        }}>
          Cushman &amp; Wakefield Copyright 2026. No warranty or representation, express or implied, is made to the
          accuracy or completeness of the information contained herein, and same is submitted subject to errors, omissions,
          change of price, rental or other conditions, withdrawal without notice, and to any special listing conditions
          imposed by the property owner(s). As applicable, we make no representation as to the condition of the property
          (or properties) in question.
        </div>
      </div>
    </div>
  );
}
