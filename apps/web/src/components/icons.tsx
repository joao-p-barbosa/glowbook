/* Ícones SVG stroke (1.6) — família consistente, sem emoji. */

const base = {
  viewBox: "0 0 20 20",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function PlusIcon() {
  return <svg width="16" height="16" {...base}><path d="M10 4v12M4 10h12" /></svg>;
}

export function PencilIcon() {
  return (
    <svg {...base}>
      <path d="M13.5 4.5l2 2L7 15l-2.6.6.6-2.6 8.5-8.5Z" />
    </svg>
  );
}

export function TrashIcon() {
  return (
    <svg {...base}>
      <path d="M4 6h12M8 6V4.5h4V6M6.5 6l.6 9h5.8l.6-9M9 9v4M11 9v4" />
    </svg>
  );
}

export function SearchIcon() {
  return (
    <svg width="14" height="14" {...base}>
      <circle cx="9" cy="9" r="5" /><path d="m13 13 3 3" />
    </svg>
  );
}
