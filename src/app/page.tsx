"use client";
import dynamic from "next/dynamic";
import { useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";
import { useGlobalStore } from "@/store/global";
import { useSettingStore } from "@/store/setting";

const Header = dynamic(() => import("@/components/Internal/Header"));
const Setting = dynamic(() => import("@/components/Setting"));
const ResearchTabs = dynamic(() => import("@/components/Internal/ResearchTabs"));
const FreeFormResearch = dynamic(() => import("@/components/ResearchModes/FreeFormResearch"));
const CompanyDeepDive = dynamic(() => import("@/components/ResearchModes/CompanyDeepDive"));
const BulkCompanyResearch = dynamic(() => import("@/components/ResearchModes/BulkCompanyResearch"));
const MarketResearch = dynamic(() => import("@/components/ResearchModes/MarketResearch"));
const CompanyDiscovery = dynamic(() => import("@/components/ResearchModes/CompanyDiscovery"));
const CaseStudies = dynamic(() => import("@/components/ResearchModes/CaseStudies"));
const DocStorage = dynamic(() => import("@/components/ResearchModes/DocStorage"));
const PromptLibrary = dynamic(() => import("@/components/ResearchModes/PromptLibrary"));
const History = dynamic(() => import("@/components/History"));
const Knowledge = dynamic(() => import("@/components/Knowledge"));

function Home() {
  const { t } = useTranslation();
  const {
    openSetting,
    setOpenSetting,
    openHistory,
    setOpenHistory,
    openKnowledge,
    setOpenKnowledge,
  } = useGlobalStore();

  const { theme } = useSettingStore();
  const { setTheme } = useTheme();

  useLayoutEffect(() => {
    const settingStore = useSettingStore.getState();
    setTheme(settingStore.theme);
  }, [theme, setTheme]);
  return (
    <div className="max-lg:max-w-screen-md max-w-screen-lg mx-auto px-4">
      <Header />
      <main>
        <ResearchTabs defaultTab="free-form">
          {{
            // First row tabs
            companyDeepDive: <CompanyDeepDive />,
            bulkCompanyResearch: <BulkCompanyResearch />,
            marketResearch: <MarketResearch />,
            freeFormResearch: <FreeFormResearch />,
            // Second row tabs
            companyDiscovery: <CompanyDiscovery />,
            caseStudies: <CaseStudies />,
            docStorage: <DocStorage />,
            promptLibrary: <PromptLibrary />
          }}
        </ResearchTabs>
      </main>
      <footer className="my-4 text-center text-sm text-gray-600 print:hidden">
        <a href="https://github.com/tajmahal226" target="_blank">
          {t("copyright", {
            name: "tajmahal226",
          })}
        </a>
      </footer>
      <aside className="print:hidden">
        <Setting open={openSetting} onClose={() => setOpenSetting(false)} />
        <History open={openHistory} onClose={() => setOpenHistory(false)} />
        <Knowledge
          open={openKnowledge}
          onClose={() => setOpenKnowledge(false)}
        />
      </aside>
    </div>
  );
}

export default Home;
