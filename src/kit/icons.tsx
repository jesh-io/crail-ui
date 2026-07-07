import type { CSSProperties } from "react";

/* Minimal stroke icon set, 24-unit grid, 1.75 stroke — matches the
   rounded, quiet iconography of the assistant apps. */

const PATHS: Record<string, JSX.Element> = {
  spark: (
    <path d="M12 3c.6 4.8 3.2 7.4 9 9-5.8 1.6-8.4 4.2-9 9-.6-4.8-3.2-7.4-9-9 5.8-1.6 8.4-4.2 9-9Z" />
  ),
  send: <path d="M12 20V5m0 0-6 6m6-6 6 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  check: <path d="m4.5 12.5 5 5L19.5 6.5" />,
  x: <path d="m6 6 12 12M18 6 6 18" />,
  chevronDown: <path d="m6 9.5 6 6 6-6" />,
  chevronRight: <path d="m9.5 6 6 6-6 6" />,
  chevronUp: <path d="m6 14.5 6-6 6 6" />,
  arrowRight: <path d="M4 12h16m0 0-6-6m6 6-6 6" />,
  arrowUpRight: <path d="M7 17 17 7m0 0H8m9 0v9" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2.8 13.9 5l2.8-.7.7 2.8 2.2 1.9-1.5 2.5 1.5 2.5-2.2 1.9-.7 2.8-2.8-.7-1.9 2.2-1.9-2.2-2.8.7-.7-2.8-2.2-1.9L5 12.5 3.5 10l2.2-1.9.7-2.8 2.8.7L12 2.8Z" />
    </>
  ),
  wrench: (
    <path d="M14.2 6.3a4.5 4.5 0 0 0-5.9 5.9L3 17.5V21h3.5l5.3-5.3a4.5 4.5 0 0 0 5.9-5.9L14.5 13 11 9.5l3.2-3.2Z" />
  ),
  terminal: (
    <>
      <path d="m5 7 5 5-5 5" />
      <path d="M12.5 17H19" />
    </>
  ),
  code: <path d="m8 6-6 6 6 6m8-12 6 6-6 6" />,
  copy: (
    <>
      <rect x="9" y="9" width="12" height="12" rx="2.5" />
      <path d="M5.5 15H4.8A1.8 1.8 0 0 1 3 13.2V4.8A1.8 1.8 0 0 1 4.8 3h8.4A1.8 1.8 0 0 1 15 4.8v.7" />
    </>
  ),
  doc: (
    <>
      <path d="M6 2.8h7.5L19 8.3v11A1.8 1.8 0 0 1 17.2 21H6a1.8 1.8 0 0 1-1.8-1.8V4.6A1.8 1.8 0 0 1 6 2.8Z" />
      <path d="M13.5 3v5.5H19M8.5 12.5h7m-7 4h4.5" />
    </>
  ),
  folder: (
    <path d="M3.5 6.5A1.8 1.8 0 0 1 5.3 4.7h4.2l2.2 2.5h7A1.8 1.8 0 0 1 20.5 9v8.5a1.8 1.8 0 0 1-1.8 1.8H5.3a1.8 1.8 0 0 1-1.8-1.8v-11Z" />
  ),
  image: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="m4.5 17.5 4.8-4.4 3.4 3.1 3.1-2.7 4.7 4" />
    </>
  ),
  chart: <path d="M4 20V4m0 16h16M8.5 16v-5m4.5 5V8m4.5 8v-3" />,
  table: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M3.5 9.5h17M9.5 9.5V19.5M15.5 9.5V19.5" />
    </>
  ),
  list: <path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  columns: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path d="M12 4.5v15" />
    </>
  ),
  expand: <path d="M15 4h5v5M9 20H4v-5M20 4l-6.5 6.5M4 20l6.5-6.5" />,
  shrink: <path d="M4 14h6v6M20 10h-6V4M14 10l6.5-6.5M3.5 20.5 10 14" />,
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.2" />
      <path d="M3.5 10h17M8 2.8V6.5M16 2.8V6.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2.5" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5.5" width="18" height="13.5" rx="2.2" />
      <path d="m3.5 7.5 8.5 6 8.5-6" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5c1.4-3.4 4.1-5 7.5-5s6.1 1.6 7.5 5" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c-4.7 4.9-4.7 12.1 0 17 4.7-4.9 4.7-12.1 0-17Z" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2.2" />
      <path d="M8 10.5V7.7a4 4 0 0 1 8 0v2.8" />
    </>
  ),
  shield: (
    <path d="M12 3 4.5 6v5.5c0 4.6 3 8 7.5 9.7 4.5-1.7 7.5-5.1 7.5-9.7V6L12 3Z" />
  ),
  alert: (
    <>
      <path d="M12 4 2.8 19.5h18.4L12 4Z" />
      <path d="M12 10v4m0 2.7v.3" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5m0-8.3v-.2" />
    </>
  ),
  refresh: (
    <path d="M4.5 9.5A8 8 0 0 1 19 8m.5 6.5A8 8 0 0 1 5 16m-.5 4v-4.5H9M19.5 4v4.5H15" />
  ),
  trash: (
    <path d="M4.5 6.5h15M9 6.5v-2h6v2m-9.5 0 1 13a1.5 1.5 0 0 0 1.5 1.4h8a1.5 1.5 0 0 0 1.5-1.4l1-13M10 10.5V17m4-6.5V17" />
  ),
  pencil: (
    <path d="M4 20h4.2L20 8.2a2.1 2.1 0 0 0-3-3L5.2 17 4 20Zm11.5-13.3 2.8 2.8" />
  ),
  download: <path d="M12 4v11m0 0-5-5m5 5 5-5M4.5 20h15" />,
  upload: <path d="M12 15V4m0 0L7 9m5-5 5 5M4.5 20h15" />,
  link: (
    <path d="M10 14a4 4 0 0 0 6 .4l3-3a4 4 0 1 0-5.7-5.6L11.6 7.5M14 10a4 4 0 0 0-6-.4l-3 3a4 4 0 1 0 5.7 5.6l1.7-1.7" />
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </>
  ),
  play: <path d="M7 4.8v14.4L19 12 7 4.8Z" />,
  pause: <path d="M8 5v14m8-14v14" />,
  music: (
    <>
      <path d="M9 18.5V5.8l11-2v12.7" />
      <circle cx="6.5" cy="18.5" r="2.5" />
      <circle cx="17.5" cy="16.5" r="2.5" />
    </>
  ),
  git: (
    <>
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="6" cy="18" r="2.5" />
      <circle cx="18" cy="9" r="2.5" />
      <path d="M6 8.5v7M15.6 9.8 8.3 16.6" />
    </>
  ),
  server: (
    <>
      <rect x="3.5" y="4" width="17" height="7" rx="1.8" />
      <rect x="3.5" y="13" width="17" height="7" rx="1.8" />
      <path d="M7 7.5h.01M7 16.5h.01" />
    </>
  ),
  db: (
    <>
      <ellipse cx="12" cy="5.5" rx="7.5" ry="2.8" />
      <path d="M4.5 5.5v13c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8v-13M4.5 12c0 1.5 3.4 2.8 7.5 2.8s7.5-1.3 7.5-2.8" />
    </>
  ),
  box: (
    <path d="M12 2.8 20.5 7v10L12 21.2 3.5 17V7L12 2.8Zm0 8.4L3.8 7.1m8.2 4.1 8.2-4.1M12 11.2V21" />
  ),
  home: <path d="m4 11 8-7.5L20 11v8.2A1.8 1.8 0 0 1 18.2 21H5.8A1.8 1.8 0 0 1 4 19.2V11Zm5.5 10v-6.5h5V21" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5V5m0 14v2.5M2.5 12H5m14 0h2.5M4.9 4.9 6.7 6.7m10.6 10.6 1.8 1.8m0-14.2-1.8 1.8M6.7 17.3l-1.8 1.8" />
    </>
  ),
  moon: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />,
  dollar: (
    <path d="M12 3v18m4.5-14.2c-.8-1.2-2.3-1.9-4.4-1.9-2.5 0-4.3 1.2-4.3 3.2 0 4.4 9 2.3 9 6.7 0 2-1.9 3.3-4.6 3.3-2.3 0-4-.9-4.8-2.2" />
  ),
  card: (
    <>
      <rect x="3" y="5.5" width="18" height="13.5" rx="2.2" />
      <path d="M3 10h18M7 15h4" />
    </>
  ),
  tag: (
    <>
      <path d="m12.6 3.5 8 8a1.8 1.8 0 0 1 0 2.5l-6.6 6.6a1.8 1.8 0 0 1-2.5 0l-8-8V4.9A1.4 1.4 0 0 1 4.9 3.5h7.7Z" />
      <path d="M8 8.5h.01" />
    </>
  ),
  filter: <path d="M4 6h16m-13 6h10m-7 6h4" />,
  sliders: (
    <path d="M5 21v-7m0-4V3m7 18v-9m0-4V3m7 18v-5m0-4V3M2.5 14h5M9.5 8h5m2 8h5" />
  ),
  dots: (
    <path d="M12 12h.01M12 5.5h.01M12 18.5h.01" strokeWidth="3.2" />
  ),
  grip: (
    <path d="M9 6h.01M9 12h.01M9 18h.01M15 6h.01M15 12h.01M15 18h.01" strokeWidth="3" />
  ),
  external: (
    <path d="M14 4.5h5.5V10M19 5 11.5 12.5M9.5 5.5H6A1.5 1.5 0 0 0 4.5 7v11A1.5 1.5 0 0 0 6 19.5h11a1.5 1.5 0 0 0 1.5-1.5v-3.5" />
  ),
  branch: (
    <>
      <circle cx="6" cy="5" r="2.3" />
      <circle cx="6" cy="19" r="2.3" />
      <circle cx="18" cy="12" r="2.3" />
      <path d="M6 7.3v9.4M8.3 19c5 0 7.4-2.6 7.4-4.7" />
    </>
  ),
  inbox: (
    <path d="M4.5 4.5h15l1 9H16l-1.5 3h-5L8 13.5H3.5l1-9Zm-1 9v4.7A1.8 1.8 0 0 0 5.3 20h13.4a1.8 1.8 0 0 0 1.8-1.8v-4.7" />
  ),
  bell: (
    <path d="M6 9.5a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6.5H4c.5-1 2-2.5 2-6.5Zm4 9.5a2.2 2.2 0 0 0 4 0" />
  ),
  flag: <path d="M5.5 21V4c4.5-2.4 8.5 2.4 13 0v10.5c-4.5 2.4-8.5-2.4-13 0" />,
  paperclip: (
    <path d="m17.5 11.5-6.4 6.4a4.2 4.2 0 0 1-6-6L12.6 4.4a2.9 2.9 0 0 1 4.1 4.1l-7.3 7.3a1.5 1.5 0 0 1-2.2-2.2l6.2-6.2" />
  ),
  mic: (
    <>
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" />
    </>
  ),
};

export type IconName = keyof typeof PATHS & string;
export const ICON_NAMES = Object.keys(PATHS) as IconName[];

export function Icon({
  name,
  size = 16,
  strokeWidth = 1.75,
  className,
  style,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      style={style}
    >
      {PATHS[name]}
    </svg>
  );
}
