"use client";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Settings, Key, AlertCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useSettingStore } from "@/store/setting";
import { useGlobalStore } from "@/store/global";

export default function OnboardingBanner() {
  const { t } = useTranslation();
  const { setOpenSetting } = useGlobalStore();
  const { provider } = useSettingStore();
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check if user has dismissed the banner before
    const wasDismissed = localStorage.getItem("onboarding-banner-dismissed");
    if (wasDismissed) {
      setDismissed(true);
    }
  }, []);

  // Don't render on server or if provider is configured or if dismissed
  if (!mounted || provider || dismissed) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("onboarding-banner-dismissed", "true");
  };

  const handleOpenSettings = () => {
    setOpenSetting(true);
  };

  return (
    <Alert className="mb-4 border-amber-500 bg-amber-50 dark:bg-amber-950/20">
      <AlertCircle className="h-5 w-5 text-amber-600" />
      <div className="flex-1">
        <AlertTitle className="text-amber-800 dark:text-amber-200 font-semibold">
          {t("onboarding.title", "Welcome! Configure Your API Keys to Get Started")}
        </AlertTitle>
        <AlertDescription className="text-amber-700 dark:text-amber-300 mt-2">
          <p className="mb-3">
            {t("onboarding.description", "This app uses a 'Bring Your Own API Key' model. You need to provide your own API keys from AI providers like OpenAI, Anthropic, or others.")}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button 
              onClick={handleOpenSettings}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <Settings className="w-4 h-4 mr-2" />
              {t("onboarding.openSettings", "Open Settings")}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleDismiss}
              className="border-amber-600 text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30"
            >
              <X className="w-4 h-4 mr-2" />
              {t("onboarding.dismiss", "Dismiss")}
            </Button>
          </div>
          <p className="mt-3 text-sm">
            <Key className="w-4 h-4 inline mr-1" />
            {t("onboarding.getKeys", "Don't have API keys?")}
            {" "}
            <a 
              href="https://platform.openai.com/api-keys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:text-amber-900"
            >
              OpenAI
            </a>
            {" | "}
            <a 
              href="https://console.anthropic.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:text-amber-900"
            >
              Anthropic
            </a>
            {" | "}
            <a 
              href="https://tavily.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline hover:text-amber-900"
            >
              Tavily (Search)
            </a>
          </p>
        </AlertDescription>
      </div>
    </Alert>
  );
}
