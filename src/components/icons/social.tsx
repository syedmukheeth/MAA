/**
 * Brand glyphs.
 *
 * These exist because the footer previously used lucide's AtSign, Globe and
 * MessageCircle to stand in for Instagram, Facebook and WhatsApp — shapes a
 * customer does not read as social links at all. lucide is a UI icon set and
 * correctly ships no trademarked marks, so the outlines live here instead of
 * pulling in a whole second icon dependency for four paths.
 *
 * All take colour from `currentColor` and are aria-hidden: the accessible name
 * belongs on the wrapping link, which already carries an aria-label.
 */

type IconProps = {
  size?: number;
  className?: string;
};

function base(size: number, className?: string) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "currentColor",
    "aria-hidden": true as const,
    focusable: "false" as const,
    className,
  };
}

export function InstagramIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.97.24 2.67.51.72.28 1.33.66 1.94 1.27.61.61.99 1.22 1.27 1.94.27.7.46 1.5.51 2.67.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.24 1.97-.51 2.67a5.4 5.4 0 0 1-1.27 1.94c-.61.61-1.22.99-1.94 1.27-.7.27-1.5.46-2.67.51-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.97-.24-2.67-.51a5.4 5.4 0 0 1-1.94-1.27 5.4 5.4 0 0 1-1.27-1.94c-.27-.7-.46-1.5-.51-2.67C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.24-1.97.51-2.67.28-.72.66-1.33 1.27-1.94A5.4 5.4 0 0 1 5.95 1.27c.7-.27 1.5-.46 2.67-.51C9.89 2.17 10.27 2.16 12 2.16Zm0 1.98c-3.15 0-3.5.01-4.73.07-.94.04-1.5.19-1.9.35-.48.18-.82.4-1.18.76-.36.36-.58.7-.76 1.18-.16.4-.31.96-.35 1.9-.06 1.23-.07 1.58-.07 4.6s.01 3.37.07 4.6c.04.94.19 1.5.35 1.9.18.48.4.82.76 1.18.36.36.7.58 1.18.76.4.16.96.31 1.9.35 1.23.06 1.58.07 4.73.07s3.5-.01 4.73-.07c.94-.04 1.5-.19 1.9-.35.48-.18.82-.4 1.18-.76.36-.36.58-.7.76-1.18.16-.4.31-.96.35-1.9.06-1.23.07-1.58.07-4.6s-.01-3.37-.07-4.6c-.04-.94-.19-1.5-.35-1.9a3.2 3.2 0 0 0-.76-1.18 3.2 3.2 0 0 0-1.18-.76c-.4-.16-.96-.31-1.9-.35-1.23-.06-1.58-.07-4.73-.07Zm0 3.37a4.49 4.49 0 1 1 0 8.98 4.49 4.49 0 0 1 0-8.98Zm0 1.98a2.51 2.51 0 1 0 0 5.02 2.51 2.51 0 0 0 0-5.02Zm5.72-2.2a1.05 1.05 0 1 1-2.1 0 1.05 1.05 0 0 1 2.1 0Z" />
    </svg>
  );
}

export function FacebookIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06C2 17.08 5.66 21.24 10.44 22v-7.02H7.9v-2.92h2.54v-1.9c0-2.52 1.49-3.91 3.77-3.91 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.58h2.78l-.45 2.92h-2.33V22C18.34 21.24 22 17.08 22 12.06Z" />
    </svg>
  );
}

export function WhatsAppIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size, className)}>
      <path d="M12.04 2C6.6 2 2.18 6.42 2.18 11.86c0 1.74.46 3.44 1.32 4.94L2 22l5.34-1.4a9.85 9.85 0 0 0 4.7 1.2h.01c5.43 0 9.85-4.42 9.85-9.86 0-2.63-1.02-5.11-2.88-6.97A9.79 9.79 0 0 0 12.04 2Zm0 1.98c2.1 0 4.07.82 5.56 2.31a7.82 7.82 0 0 1 2.3 5.57c0 4.34-3.53 7.87-7.87 7.87a7.9 7.9 0 0 1-4.01-1.1l-.29-.17-2.98.78.8-2.9-.18-.3a7.83 7.83 0 0 1-1.2-4.18c0-4.34 3.53-7.88 7.87-7.88Zm-3.4 4.1c-.16 0-.42.06-.64.3-.22.24-.85.83-.85 2.02 0 1.2.87 2.35.99 2.5.12.17 1.7 2.72 4.13 3.7 2.02.8 2.43.64 2.87.6.44-.04 1.42-.58 1.62-1.15.2-.56.2-1.05.14-1.15-.06-.1-.22-.16-.46-.28-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.79-.76.95-.14.16-.28.18-.52.06a6.44 6.44 0 0 1-1.9-1.17 7.2 7.2 0 0 1-1.31-1.63c-.14-.24-.02-.37.1-.49.1-.11.26-.3.4-.46.12-.15.16-.26.24-.42.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.46-.4-.4-.55-.41h-.06Z" />
    </svg>
  );
}

export function GoogleIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size, className)} fill="none">
      <path
        fill="currentColor"
        d="M21.8 12.23c0-.7-.06-1.36-.18-2H12v3.79h5.5a4.7 4.7 0 0 1-2.04 3.08v2.56h3.3c1.93-1.78 3.04-4.4 3.04-7.43Z"
      />
      <path
        fill="currentColor"
        d="M12 22c2.75 0 5.06-.91 6.75-2.46l-3.3-2.56c-.91.61-2.08.98-3.45.98a6.02 6.02 0 0 1-5.65-4.16H2.94v2.65A10 10 0 0 0 12 22Z"
        opacity=".75"
      />
      <path
        fill="currentColor"
        d="M6.35 13.8a6.02 6.02 0 0 1 0-3.84V7.31H2.94a10 10 0 0 0 0 9.14l3.41-2.65Z"
        opacity=".5"
      />
      <path
        fill="currentColor"
        d="M12 5.98c1.5 0 2.84.52 3.9 1.53l2.92-2.92C17.06 2.97 14.75 2 12 2a10 10 0 0 0-9.06 5.31l3.41 2.65A6.02 6.02 0 0 1 12 5.98Z"
        opacity=".85"
      />
    </svg>
  );
}
