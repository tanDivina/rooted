import React from 'react'

/**
 * Rooted's own icon set: hand-drawn, slightly organic strokes.
 * All icons inherit `currentColor` and size from className.
 */
type IconProps = React.SVGProps<SVGSVGElement>

function Svg({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

/** The Rooted mark: a broad old oak, with its roots showing below the ground line. */
export function TreeMark({ className, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" {...props}>
      <path d="M10.5 31 C4.5 29.5 4 21.5 9.8 19 C8.6 12.6 14.6 8.4 20.6 10.4 C22.6 5.2 30.6 4 34 8.2 C38 4.2 46.2 5.8 47.4 11.4 C53.4 10.2 58.6 15.2 56.4 21 C61.4 24 59.6 32 53.6 32.2 C51.6 36.4 44.6 36.6 42.2 33.4 C38.2 36.6 30.4 36.4 27.4 33.2 C23.2 36.4 15.2 35.4 14.2 31.4 C12.8 32 11.4 31.8 10.5 31 Z" fill="#5C6B37"/>
      <path d="M12.5 21 C11.8 16 16 12.6 20.8 13.6 C22.6 9.4 28.6 8.4 31.4 11.6 C34.6 8.6 40.4 9.6 41.8 13.4 C37.4 12.4 34.4 14.6 32.6 16.6 C29.6 13.8 24.6 14.4 23.2 18 C19.6 16.4 15.2 17.6 12.5 21 Z" fill="#8E9A5E" opacity="0.9"/>
      <path d="M14.2 31.4 C18 31.6 21.2 30 23.4 28.4 C25.8 31 31 31.8 34.6 29.8 C38 32 44 32 47.6 29.4 C49.8 30.8 52.4 31.2 53.6 32.2 C51.6 36.4 44.6 36.6 42.2 33.4 C38.2 36.6 30.4 36.4 27.4 33.2 C23.2 36.4 15.2 35.4 14.2 31.4 Z" fill="#3E4A23" opacity="0.55"/>
      <path d="M25.6 48 C27.6 43.4 27.4 39.4 24.8 35.6 C22.6 32.6 18.8 30.6 15.4 29.6 L16.6 27.8 C20.4 28.6 23.6 30.2 26 32.6 C26.8 29 26.2 25.4 23.8 21.6 L25.8 20.6 C28.8 24.4 30 28.4 30 31.8 C31.6 28.4 34.2 25 38.4 22.4 L39.8 24 C36.2 26.8 34.4 30 33.8 33.2 C36.8 30.8 41.2 29.8 46 30 L45.8 32 C41.2 32.2 37.6 33.8 35.8 37 C34.6 40.6 35.2 44.2 37.8 48 Z" fill="#3B2A1E"/>
      <ellipse cx="31.2" cy="42" rx="1.1" ry="1.6" fill="#6B5242"/>
      <path d="M8 48.2 H56" stroke="#3B2A1E" strokeWidth="1.4" strokeLinecap="round" opacity="0.3"/>
      <g stroke="#6B5242" strokeWidth="1.9" strokeLinecap="round" fill="none">
        <path d="M28 48.2 C25 51.6 19 52.4 11 52.2"/>
        <path d="M29.6 48.2 C28 53 22.4 56 15.6 57.6"/>
        <path d="M31.6 48.2 C31.2 52.6 30.6 56.4 31.4 60.4"/>
        <path d="M33.6 48.2 C35.6 53 41 55.6 47.6 57"/>
        <path d="M35.6 48.2 C38.8 51.2 45 52 53 51.6"/>
      </g>
      <g stroke="#6B5242" strokeWidth="1.1" strokeLinecap="round" fill="none" opacity="0.7">
        <path d="M19 52.2 C17 53.6 15.6 55 14.6 56.4"/>
        <path d="M44 55.6 C45.6 54.2 47.6 53.6 49.6 53.8"/>
      </g>
    </svg>
  )
}

export const LeafIcon = (p: IconProps) => (
  <Svg {...p}><path d="M5 19c0-8 5-13 14-14-.4 9-5.6 14-13 14" /><path d="M5 19 13 11" /></Svg>
)
export const RootsIcon = (p: IconProps) => (
  <Svg {...p}><path d="M12 3v8" /><path d="M12 11c0 4-4 5-7 9" /><path d="M12 11c0 4 4 5 7 9" /><path d="M12 11v10" /><path d="M4 11h16" /></Svg>
)
export const RingsIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M12 6.5c3.2 0 5.6 2.4 5.4 5.6-.2 3-2.6 5.2-5.6 5-2.6-.2-4.4-2.2-4.2-4.8.2-2.2 2-3.8 4.2-3.6 1.8.2 3 1.6 2.8 3.4-.2 1.2-1.2 2-2.4 2" /></Svg>
)
export const SensorsIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5 12a7 7 0 0 1 14 0" />
    <path d="M8.5 12a3.5 3.5 0 0 1 7 0" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
    <path d="M12 13v8" />
    <path d="M9 21h6" />
  </Svg>
)
export const FallIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="16.5" cy="5" r="2" /><path d="M14.5 8.5 9 11l-2.5 4.5" /><path d="M9 11l3.5 3.5L17 13" /><path d="M3 20h18" /></Svg>
)
export const KettleIcon = (p: IconProps) => (
  <Svg {...p}><path d="M6 10h11l-1 8H7z" /><path d="M17 12c2.4 0 3.2 3 1 4" /><path d="M9 7c0-1.4 1-2 1-3M13 7c0-1.4 1-2 1-3" /><path d="M5 21h13" /></Svg>
)
export const VoiceIcon = (p: IconProps) => (
  <Svg {...p}><path d="M5 9v6M9 6v12M13 9v6M17 7v10M21 10v4" /></Svg>
)
export const SignalOffIcon = (p: IconProps) => (
  <Svg {...p}><path d="M5 12.5a10 10 0 0 1 4-2.6M2 9a14 14 0 0 1 5-3" /><path d="M14.6 10a10 10 0 0 1 4.4 2.5M17 6a14 14 0 0 1 5 3" /><path d="M8.6 16a5 5 0 0 1 6.8 0" /><circle cx="12" cy="19.5" r=".6" fill="currentColor" /><path d="M3 3l18 18" /></Svg>
)
export const SignalIcon = (p: IconProps) => (
  <Svg {...p}><path d="M2 9a15 15 0 0 1 20 0" /><path d="M5 12.5a10 10 0 0 1 14 0" /><path d="M8.6 16a5 5 0 0 1 6.8 0" /><circle cx="12" cy="19.5" r=".6" fill="currentColor" /></Svg>
)
export const SapIcon = (p: IconProps) => (
  <Svg {...p}><path d="M3 12h4l2-5 3 10 2.5-6 1.5 1H21" /></Svg>
)
export const CellIcon = (p: IconProps) => (
  <Svg {...p}><path d="M4 20v-3M9 20v-6M14 20v-9M19 20V5" /></Svg>
)
export const BatteryIcon = (p: IconProps) => (
  <Svg {...p}><rect x="3" y="7" width="16" height="10" rx="2.5" /><path d="M22 10.5v3" /><path d="M6 10v4M9 10v4M12 10v4" /></Svg>
)
export const CameraIcon = (p: IconProps) => (
  <Svg {...p}><rect x="3" y="6" width="13" height="12" rx="3" /><path d="M16 10.5 21 8v8l-5-2.5" /></Svg>
)
export const ChimeIcon = (p: IconProps) => (
  <Svg {...p}><path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" /><path d="M10 20.5a2.2 2.2 0 0 0 4 0" /></Svg>
)
export const FamilyIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="8" cy="7.5" r="2.6" /><circle cx="16.5" cy="9" r="2.1" /><path d="M3 19c.4-3.6 2.4-5.6 5-5.6s4.6 2 5 5.6" /><path d="M13.6 14.2c.8-.6 1.8-1 2.9-1 2.2 0 3.8 1.8 4.1 4.8" /></Svg>
)
export const HelpIcon = (p: IconProps) => (
  <Svg {...p}><path d="M12 4v16M4 12h16" strokeWidth={2.4} /></Svg>
)
export const PhoneIcon = (p: IconProps) => (
  <Svg {...p}><path d="M5 4h3.5l1.8 4.4-2.2 1.4a11 11 0 0 0 6.1 6.1l1.4-2.2L20 15.5V19a1.5 1.5 0 0 1-1.6 1.5A16.5 16.5 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4z" /></Svg>
)
export const CheckIcon = (p: IconProps) => (
  <Svg {...p}><path d="M4.5 12.5 9.5 17.5 19.5 6.5" /></Svg>
)
export const ClockIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></Svg>
)
export const KeyIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="8" cy="15" r="4" /><path d="M11 12 20 3M16.5 6.5l2.5 2.5M14 9l2 2" /></Svg>
)
export const PlayIcon = (p: IconProps) => (
  <Svg {...p}><path d="M8 5.5v13l10.5-6.5z" fill="currentColor" /></Svg>
)
export const StopIcon = (p: IconProps) => (
  <Svg {...p}><rect x="6.5" y="6.5" width="11" height="11" rx="2" fill="currentColor" /></Svg>
)
export const PageIcon = (p: IconProps) => (
  <Svg {...p}><path d="M6 3.5h8l4 4V20a.5.5 0 0 1-.5.5h-11A.5.5 0 0 1 6 20z" /><path d="M14 3.5V8h4M9 12h6M9 15.5h6" /></Svg>
)
export const CloseIcon = (p: IconProps) => (
  <Svg {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>
)
export const ArrowOutIcon = (p: IconProps) => (
  <Svg {...p}><path d="M8 16 16 8M10 8h6v6" /></Svg>
)
export const ArrowLeftIcon = (p: IconProps) => (
  <Svg {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></Svg>
)
export const AlertIcon = (p: IconProps) => (
  <Svg {...p}><path d="M12 4 21 19.5H3z" /><path d="M12 10v4.5" /><circle cx="12" cy="17" r=".6" fill="currentColor" /></Svg>
)
export const SproutIcon = (p: IconProps) => (
  <Svg {...p}><path d="M12 21v-9" /><path d="M12 12c0-4-3-6-7-6 0 4 3 6 7 6z" /><path d="M12 14c0-3.4 2.6-5.2 6-5.2 0 3.4-2.6 5.2-6 5.2z" /></Svg>
)
