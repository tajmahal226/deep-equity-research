"use client";
import { useTranslation } from "react-i18next";
import { Settings, Github, History, BookText } from "lucide-react";
import { Button } from "@/components/Internal/Button";
import { useGlobalStore } from "@/store/global";

const VERSION = process.env.NEXT_PUBLIC_VERSION;

/**
 * Header component.
 * Displays the application title, version, and action buttons (Github, History, Knowledge, Settings).
 *
 * @returns The header component.
 */
function Header() {
  const { t } = useTranslation();
  const { setOpenSetting, setOpenHistory, setOpenKnowledge } = useGlobalStore();

  return (
    <>
      <header className="flex justify-between items-center my-6 max-sm:my-4 print:hidden">
        <h1 className="text-left text-xl font-semibold">
          {t("title")}
          <small className="ml-2 font-normal text-base">v{VERSION}</small>
        </h1>
        <div className="flex">
          <a href="https://github.com/tajmahal226" target="_blank">
            <Button
              className="h-8 w-8"
              title={t("openSource")}
              variant="ghost"
              size="icon"
            >
              <Github className="h-5 w-5" />
            </Button>
          </a>
          <Button
            className="h-8 w-8"
            variant="ghost"
            size="icon"
            title={t("history.title")}
            onClick={() => setOpenHistory(true)}
          >
            <History className="h-5 w-5" />
          </Button>
          <Button
            className="h-8 w-8"
            variant="ghost"
            size="icon"
            title={t("knowledge.title")}
            onClick={() => setOpenKnowledge(true)}
          >
            <BookText />
          </Button>
          <Button
            className="h-8 w-8"
            title={t("setting.title")}
            variant="ghost"
            size="icon"
            onClick={() => setOpenSetting(true)}
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>
    </>
  );
}

export default Header;
