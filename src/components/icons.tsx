import type { ReactNode } from 'react'

function Svg({ children, size = 20 }: { children: ReactNode; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  )
}

export const IconPlay = () => (
  <Svg>
    <path d="M7 4.8v14.4a.6.6 0 0 0 .9.5l11.5-7.2a.6.6 0 0 0 0-1L7.9 4.3a.6.6 0 0 0-.9.5z" fill="currentColor" />
  </Svg>
)
export const IconPause = () => (
  <Svg>
    <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" />
    <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" />
  </Svg>
)
export const IconNext = () => (
  <Svg>
    <path d="M6 5.5l9 6.5-9 6.5z" fill="currentColor" />
    <path d="M18.5 5v14" />
  </Svg>
)
export const IconPrev = () => (
  <Svg>
    <path d="M18 5.5L9 12l9 6.5z" fill="currentColor" />
    <path d="M5.5 5v14" />
  </Svg>
)
export const IconRestart = () => (
  <Svg>
    <path d="M3.5 12a8.5 8.5 0 1 0 2.7-6.2" />
    <path d="M3.5 4.5v4.8h4.8" />
  </Svg>
)
export const IconSun = () => (
  <Svg>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
  </Svg>
)
export const IconMoon = () => (
  <Svg>
    <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />
  </Svg>
)
export const IconCopy = () => (
  <Svg size={16}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15V6a2 2 0 0 1 2-2h9" />
  </Svg>
)
export const IconCheck = () => (
  <Svg size={16}>
    <path d="M4.5 12.5l5 5L19.5 7" />
  </Svg>
)
export const IconExternal = () => (
  <Svg size={14}>
    <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </Svg>
)
export const IconDice = () => (
  <Svg size={16}>
    <rect x="4" y="4" width="16" height="16" rx="3" />
    <circle cx="9" cy="9" r="1" fill="currentColor" />
    <circle cx="15" cy="15" r="1" fill="currentColor" />
    <circle cx="15" cy="9" r="1" fill="currentColor" />
    <circle cx="9" cy="15" r="1" fill="currentColor" />
  </Svg>
)
export const IconArrow = () => (
  <Svg size={16}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Svg>
)
