'use client';
import React, { useRef, useState } from 'react';

interface EditableBlockProps {
  content: string;
  onChange?: (newContent: string) => void;
  style?: React.CSSProperties;
  className?: string;
}

function renderMarkdownHTML(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br/>');
}

export function EditableBlock({ content, onChange, style, className }: EditableBlockProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);

  function handleClick() {
    setEditing(true);
    setTimeout(() => ref.current?.focus(), 0);
  }

  function handleBlur() {
    setEditing(false);
    if (ref.current && onChange) {
      onChange(ref.current.innerText);
    }
  }

  if (editing) {
    return (
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onBlur={handleBlur}
        style={{
          ...style,
          outline: '2px solid var(--cw-teal)',
          outlineOffset: 2,
          borderRadius: 4,
          padding: 4,
          cursor: 'text',
        }}
        className={className}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      style={{ ...style, cursor: 'pointer' }}
      className={className}
      dangerouslySetInnerHTML={{ __html: `<p>${renderMarkdownHTML(content)}</p>` }}
    />
  );
}
