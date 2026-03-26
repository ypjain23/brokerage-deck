import React from 'react';

interface PageShellProps {
  pageNumber?: number;
  firmName?: string;
  propertyName?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function PageShell({
  pageNumber,
  firmName = 'Cushman & Wakefield',
  propertyName = '',
  showHeader = true,
  showFooter = true,
  className = '',
  children,
}: PageShellProps) {
  return (
    <div className={`om-page ${className}`}>
      {showHeader && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 8,
          background: 'var(--cw-navy)', zIndex: 10,
        }}>
          <div style={{
            position: 'absolute', right: 0, top: 0, width: '40%', height: '100%',
            background: 'var(--cw-teal)',
          }} />
        </div>
      )}
      {children}
      {showFooter && (
        <div className="cw-footer">
          <span>{firmName} National Industrial Advisory Group</span>
          <span>///&nbsp;&nbsp;&nbsp;{pageNumber}</span>
        </div>
      )}
    </div>
  );
}
