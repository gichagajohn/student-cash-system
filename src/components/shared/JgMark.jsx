export default function JgMark({ className = '' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <rect
        x="1.25"
        y="1.25"
        width="37.5"
        height="37.5"
        rx="8.5"
        stroke="currentColor"
        strokeWidth="1.4"
        opacity=".3"
      />
      <path
        d="M14.2 11.6v11.1c0 3.05-1.72 4.62-4.16 4.62-1.28 0-2.32-.32-3.04-.86"
        stroke="#E8A020"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M33.9 15.4a7.4 7.4 0 1 0 0 9.2"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M34.3 20h-5.1"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
