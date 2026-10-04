import type { ReactNode, SVGProps } from "react";

/** Stroke icon set (24px grid, 2px stroke). Add a new icon by adding a key here. */
export const iconPaths = {
  arrowR: <path d="M5 12h14M12 5l7 7-7 7" />,
  arrowL: <path d="M19 12H5M12 19l-7-7 7-7" />,
  arrowUpRight: <path d="M7 17L17 7M8 7h9v9" />,
  chevR: <path d="M9 18l6-6-6-6" />,
  chevD: <path d="M6 9l6 6 6-6" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  search: (<><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>),
  pin: (<><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0116 0z" /><circle cx="12" cy="10" r="3" /></>),
  user: (<><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a6 6 0 016-6h4a6 6 0 016 6v1" /></>),
  users: (<><circle cx="9" cy="8" r="3.5" /><path d="M2 20v-1a5 5 0 015-5h4a5 5 0 015 5v1M16 4.5a3.5 3.5 0 010 7M22 20v-1a5 5 0 00-3.5-4.8" /></>),
  wallet: (<><path d="M3 7a2 2 0 012-2h13v4" /><path d="M3 7v11a2 2 0 002 2h15a1 1 0 001-1V10a1 1 0 00-1-1H5a2 2 0 01-2-2z" /><circle cx="16.5" cy="14.5" r="1.2" /></>),
  clock: (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  bell: (<><path d="M6 9a6 6 0 0112 0c0 6 2.5 8 2.5 8h-17S6 15 6 9z" /><path d="M10 21a2 2 0 004 0" /></>),
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  phone: (<><rect x="6" y="2" width="12" height="20" rx="3" /><path d="M11 18h2" /></>),
  check: <path d="M20 6L9 17l-5-5" />,
  x: <path d="M18 6L6 18M6 6l12 12" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  bus: (<><rect x="4" y="3" width="16" height="15" rx="3" /><path d="M4 11h16M8 18v3M16 18v3" /><circle cx="8.5" cy="14.5" r=".8" /><circle cx="15.5" cy="14.5" r=".8" /></>),
  car: (<><path d="M5 17H4a1 1 0 01-1-1v-4l2-5a2 2 0 012-1h10a2 2 0 012 1l2 5v4a1 1 0 01-1 1h-1" /><path d="M3 12h18" /><circle cx="7.5" cy="17" r="2" /><circle cx="16.5" cy="17" r="2" /></>),
  ticket: (<><path d="M3 9V6a1 1 0 011-1h16a1 1 0 011 1v3a3 3 0 000 6v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3a3 3 0 000-6z" /><path d="M14 5v14" strokeDasharray="2 3" /></>),
  home: (<><path d="M3 10l9-7 9 7v10a1 1 0 01-1 1H4a1 1 0 01-1-1z" /><path d="M9 21v-7h6v7" /></>),
  star: <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />,
  share: <path d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 002 2h10a2 2 0 002-2v-5" />,
  qr: (<><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h3v3M21 14v.01M14 21h3M21 17v4" /></>),
  swap: <path d="M7 4v16M7 4L3 8M7 4l4 4M17 20V4M17 20l-4-4M17 20l4-4" />,
  cal: (<><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>),
  help: (<><circle cx="12" cy="12" r="9" /><path d="M9.5 9a2.5 2.5 0 015 .5c0 1.7-2.5 2-2.5 3.5M12 17v.01" /></>),
  nav: <path d="M3 11l19-9-9 19-2-8-8-2z" />,
  lock: (<><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></>),
  sliders: (<><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12" /><circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></>),
  alert: (<><path d="M12 3l10 18H2z" /><path d="M12 10v5M12 18v.01" /></>),
  gift: (<><rect x="3" y="8" width="18" height="4" /><path d="M12 8v13M5 12v9h14v-9M8 8a2.5 2.5 0 010-5c3 0 4 5 4 5s1-5 4-5a2.5 2.5 0 010 5" /></>),
  globe: (<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></>),
  chat: <path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z" />,
  copy: (<><rect x="9" y="9" width="12" height="12" rx="2" /><path d="M5 15H4a1 1 0 01-1-1V4a1 1 0 011-1h10a1 1 0 011 1v1" /></>),
  logout: <path d="M9 21H5a1 1 0 01-1-1V4a1 1 0 011-1h4M16 17l5-5-5-5M21 12H9" />,
  fuel: (<><path d="M4 21V5a2 2 0 012-2h6a2 2 0 012 2v16M3 21h12M14 10h2a2 2 0 012 2v4a1.5 1.5 0 003 0V8l-3-3" /><path d="M7 8h4" /></>),
  route: (<><circle cx="6" cy="19" r="2.5" /><circle cx="18" cy="5" r="2.5" /><path d="M8.5 19H15a3 3 0 000-6H9a3 3 0 010-6h6.5" /></>),
  history: (<><path d="M3 12a9 9 0 109-9 9 9 0 00-6.4 2.6L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></>),
  camera: (<><path d="M4 8a2 2 0 012-2h2l1.5-2h5L16 6h2a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2z" /><circle cx="12" cy="13" r="3.5" /></>),
  badge: (<><path d="M12 2l2.4 2 3.1-.3 1.1 2.9 2.7 1.6-.9 3 .9 3-2.7 1.6-1.1 2.9-3.1-.3L12 22l-2.4-2-3.1.3-1.1-2.9L2.7 15.8l.9-3-.9-3 2.7-1.6L6.5 5.3l3.1.3z" /><path d="M8.5 12l2.5 2.5 4.5-5" /></>),
  bank: <path d="M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 21h18" />,
  card: (<><rect x="2" y="5" width="20" height="14" rx="3" /><path d="M2 10h20" /></>),
  cash: (<><rect x="2" y="6" width="20" height="12" rx="2" /><circle cx="12" cy="12" r="2.5" /></>),
  bag: (<><rect x="4" y="8" width="16" height="12" rx="2" /><path d="M9 8V6a3 3 0 016 0v2" /></>),
  down: <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />,
  upload: <path d="M12 15V3M7 8l5-5 5 5M5 14v5a2 2 0 002 2h14" />,
  flag: <path d="M5 21V4M5 4h11l-2 4 2 4H5" />,
  doc: (<><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></>),
  scan: <path d="M4 8V5a1 1 0 011-1h3M16 4h3a1 1 0 011 1v3M20 16v3a1 1 0 01-1 1h-3M8 20H5a1 1 0 01-1-1v-3M4 12h16" />,
  power: <path d="M12 3v9M6.4 6.4a8 8 0 1011.2 0" />,
  trend: <path d="M3 17l6-6 4 4 8-8M15 7h6v6" />,
  sun: (<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>),
  moon: <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof iconPaths;

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
  strokeWidth?: number;
}

export function Icon({ name, size = 20, strokeWidth = 2, className, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...rest}
    >
      {iconPaths[name]}
    </svg>
  );
}
