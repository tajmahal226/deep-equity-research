"use client";
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from "next-themes";

/**
 * ThemeProvider component.
 * Wraps the application with NextThemesProvider to manage color themes.
 *
 * @param props - The component props (ThemeProviderProps).
 * @param props.children - The child components.
 * @returns The NextThemesProvider wrapping the children.
 */
export default function ThemeProvider({
  children,
  ...props
}: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
