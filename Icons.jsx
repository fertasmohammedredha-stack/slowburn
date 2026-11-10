// Small original icon set: 24px grid, 1.75 stroke, round caps. Drawn for this project.
const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round' };

function Icon({ size = 20, children, filled = false, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...base}
      fill={filled ? 'currentColor' : 'none'} {...rest}>
      {children}
    </svg>
  );
}

export const IconPlay = (p) => <Icon filled {...p}><path d="M8 5.5v13l10.5-6.5z" /></Icon>;
export const IconPause = (p) => <Icon {...p} strokeWidth={3}><path d="M8.5 5.5v13M15.5 5.5v13" /></Icon>;
export const IconReset = (p) => <Icon {...p}><path d="M4.5 12a7.5 7.5 0 1 0 2.4-5.5M4.5 4.5v4h4" /></Icon>;
export const IconSkip = (p) => <Icon {...p}><path d="M6 6v12l9-6zM18.5 6v12" /></Icon>;
export const IconPlus = (p) => <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>;
export const IconMinus = (p) => <Icon {...p}><path d="M5 12h14" /></Icon>;
export const IconCheck = (p) => <Icon {...p} strokeWidth={2.25}><path d="M5 12.5l4.5 4.5L19 7.5" /></Icon>;
export const IconTrash = (p) => <Icon {...p}><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" /></Icon>;
export const IconEdit = (p) => <Icon {...p}><path d="M4 20l4-1 11-11-3-3L5 16z" /></Icon>;
export const IconSun = (p) => <Icon {...p}><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" /></Icon>;
export const IconMoon = (p) => <Icon {...p}><path d="M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5z" /></Icon>;
export const IconBell = (p) => <Icon {...p}><path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20.5a2 2 0 0 0 4 0" /></Icon>;
export const IconSliders = (p) => <Icon {...p}><path d="M4 7h9M17 7h3M4 17h3M11 17h9" /><circle cx="15" cy="7" r="2" /><circle cx="9" cy="17" r="2" /></Icon>;
export const IconChart = (p) => <Icon {...p}><path d="M5 19v-8M12 19V5M19 19v-5" /></Icon>;
export const IconClock = (p) => <Icon {...p}><circle cx="12" cy="12" r="8" /><path d="M12 7.5V12l3 2" /></Icon>;
export const IconDownload = (p) => <Icon {...p}><path d="M12 4v11M7.5 11 12 15.5 16.5 11M5 20h14" /></Icon>;
export const IconUpload = (p) => <Icon {...p}><path d="M12 15V4M7.5 8 12 3.5 16.5 8M5 20h14" /></Icon>;
export const IconX = (p) => <Icon {...p}><path d="M6 6l12 12M18 6 6 18" /></Icon>;
export const IconTarget = (p) => <Icon {...p}><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3.5" /></Icon>;

// Brand mark: an open ring (a session in progress) with an ember at the gap.
export function Mark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path d="M16 4.5a11.5 11.5 0 1 0 11.5 11.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="24.1" cy="7.9" r="3.1" fill="var(--accent)" />
    </svg>
  );
}
