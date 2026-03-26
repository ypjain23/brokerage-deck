import React from 'react';

interface MetricCardProps {
  value: string;
  label: string;
  valueColor?: string;
  small?: boolean;
}

export function MetricCard({ value, label, valueColor = 'var(--cw-navy)', small }: MetricCardProps) {
  return (
    <div style={{ padding: small ? '4px 6px' : '8px 10px' }}>
      <div style={{
        fontSize: small ? 14 : 18, fontWeight: 700, color: valueColor,
        lineHeight: 1, marginBottom: 2, fontFamily: 'var(--font)',
      }}>
        {value}
      </div>
      <div style={{
        fontSize: small ? 6 : 7, fontWeight: 400, color: 'var(--cw-data)',
        textTransform: 'uppercase', letterSpacing: '0.05em',
      }}>
        {label}
      </div>
    </div>
  );
}
