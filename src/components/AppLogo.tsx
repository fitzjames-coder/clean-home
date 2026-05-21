"use client";

import { useState } from "react";

interface AppLogoProps {
  /** Pixel size (width = height). Defaults to 44. */
  size?: number;
  className?: string;
}

/**
 * Renders /public/icon.png.
 * If the file is missing or fails to load, falls back to the 🏠 emoji
 * so the header never shows a broken-image placeholder.
 */
export default function AppLogo({ size = 44, className = "" }: AppLogoProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className={`flex items-center justify-center rounded-xl bg-[#2B7FFF] text-white font-bold select-none flex-shrink-0 ${className}`}
        style={{ width: size, height: size, fontSize: size * 0.45 }}
        aria-label="Clean Home"
      >
        🏠
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/icon.png"
      alt="Clean Home"
      width={size}
      height={size}
      className={`rounded-xl object-cover flex-shrink-0 ${className}`}
      onError={() => setFailed(true)}
    />
  );
}
