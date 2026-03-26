import React from 'react';

interface DataTableProps {
  headers: string[];
  groupHeaders?: { label: string; span: number }[];
  rows: { cells: string[]; bold?: boolean; total?: boolean; navyTotal?: boolean }[];
}

export function DataTable({ headers, groupHeaders, rows }: DataTableProps) {
  return (
    <table className="cw-data-table">
      <thead>
        {groupHeaders && (
          <tr className="group-header">
            {groupHeaders.map((gh, i) => (
              <td key={i} colSpan={gh.span}>{gh.label}</td>
            ))}
          </tr>
        )}
        <tr className="col-header">
          {headers.map((h, i) => (
            <td key={i}>{h}</td>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className={row.total ? 'total-row' : row.navyTotal ? 'navy-total-row' : row.bold ? 'bold-row' : 'data-row'}>
            {row.cells.map((cell, j) => (
              <td key={j}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
