"use client";
import Script from "next/script";
import { useLayoutEffect } from "react";
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

  function setup() {
    window.eruda.init({
      tool: ["console", "network", "info"],
    });
  }

  useLayoutEffect(() => {
    const eruda = window.eruda;
    if (eruda) {
      if (debug === "disable") {
        eruda.destroy();
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
