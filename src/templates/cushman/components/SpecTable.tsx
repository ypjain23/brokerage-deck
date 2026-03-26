import React from 'react';

interface SpecRow {
  label: string;
  value: string;
}

export function SpecTable({ rows }: { rows: SpecRow[] }) {
  return (
    <table className="cw-specs-table">
      <tbody>
        <tr className="header-row">
          <td>PROPERTY SPECIFICS</td>
          <td></td>
        </tr>
        {rows.map((row, i) => (
          <tr key={i} className="data-row">
            <td className="label">{row.label}</td>
            <td className="value">{row.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
