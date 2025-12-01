"use client";
import Script from "next/script";
import { useLayoutEffect, useRef } from "react";
import { useSettingStore } from "@/store/setting";

declare global {
  interface Window {
    eruda: any;
  }
}

/**
 * Debugger component.
 * Initializes the Eruda console for mobile web debugging when enabled in settings.
 *
 * @returns The Script component for Eruda if debug is enabled, otherwise null.
 */
function Debugger() {
  const { debug } = useSettingStore();
  const isErudaInitialized = useRef(false);

  function setup() {
    if (!isErudaInitialized.current) {
      window.eruda.init({
        tool: ["console", "network", "info"],
      });
      isErudaInitialized.current = true;
    }
  }

  useLayoutEffect(() => {
    const eruda = window.eruda;
    if (eruda) {
      if (debug === "disable") {
        eruda.destroy();
        isErudaInitialized.current = false;
      } else {
        setup();
      }
    }
  }, [debug]);

  return debug === "enable" ? (
    <Script
      id="eruda"
      src="./scripts/eruda.min.js"
      onLoad={() => setup()}
    ></Script>
  ) : null;
}

export default Debugger;
