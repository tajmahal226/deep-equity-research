"use client";
import { useLayoutEffect } from "react";
import { I18nextProvider } from "react-i18next";
import { useSettingStore } from "@/store/setting";
import i18n, { detectLanguage } from "@/utils/i18n";

/**
 * I18Provider component.
 * Initializes and provides internationalization context to the application.
 * Detects browser language if not set, updates the document title and lang attribute.
 *
 * @param props - The component props.
 * @param props.children - The child components.
 * @returns The I18nextProvider wrapping the children.
 */
function I18Provider({ children }: { children: React.ReactNode }) {
  const { language } = useSettingStore();

  useLayoutEffect(() => {
    const settingStore = useSettingStore.getState();
    if (settingStore.language === "") {
      const browserLang = detectLanguage();
      settingStore.update({ language: browserLang });
      i18n.changeLanguage(browserLang);
    } else {
      i18n.changeLanguage(language);
    }
    document.documentElement.setAttribute("lang", language);
    document.title = i18n.t("title");
  }, [language]);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

export default I18Provider;
