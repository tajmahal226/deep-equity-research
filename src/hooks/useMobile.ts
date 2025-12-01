import { useState, useEffect } from "react";

/**
 * Hook to detect if the current viewport is mobile-sized.
 *
 * @param mobileBreakpoint - The breakpoint in pixels (default: 768).
 * @returns True if the viewport width is less than the breakpoint.
 */
export function useMobile(mobileBreakpoint = 768) {
  const [isMobile, setIsMobile] = useState<boolean | undefined>(undefined);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${mobileBreakpoint - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < mobileBreakpoint);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < mobileBreakpoint);
    return () => mql.removeEventListener("change", onChange);
  }, [mobileBreakpoint]);

  return !!isMobile;
}
