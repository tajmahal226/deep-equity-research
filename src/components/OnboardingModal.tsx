"use client";

import { useEffect, useState } from "react";
import { useSettingStore } from "@/store/setting";
import { useGlobalStore } from "@/store/global";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/Internal/Button";

const ONBOARDING_COMPLETED_KEY = "onboarding-completed";

export default function OnboardingModal() {
  const [open, setOpen] = useState(false);
  const { setOpenSetting } = useGlobalStore();
  
  useEffect(() => {
    // Check if onboarding has been completed
    const onboardingCompleted = localStorage.getItem(ONBOARDING_COMPLETED_KEY);
    
    if (!onboardingCompleted) {
      // Check if user has any API keys configured
      const settingStore = useSettingStore.getState();
      const hasApiKeys = 
        settingStore.apiKey ||
        settingStore.openAIApiKey ||
        settingStore.anthropicApiKey ||
        settingStore.deepseekApiKey ||
        settingStore.mistralApiKey ||
        settingStore.xAIApiKey ||
        settingStore.cohereApiKey ||
        settingStore.openRouterApiKey;
      
      // Show modal if no API keys are configured
      if (!hasApiKeys) {
        setOpen(true);
      }
    }
  }, []);

  const handleGetStarted = () => {
    setOpen(false);
    // Open settings modal
    setOpenSetting(true);
    // Mark onboarding as completed
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, "true");
  };

  const handleDismiss = () => {
    setOpen(false);
    localStorage.setItem(ONBOARDING_COMPLETED_KEY, "true");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">Welcome to Deep Equity Research! 🚀</DialogTitle>
          <DialogDescription className="space-y-4 pt-4">
            <p className="text-base">
              To get started, you&apos;ll need to provide your own API keys. Your keys are stored
              <strong> only in your browser</strong> and are never sent to our servers.
            </p>
            
            <div className="bg-muted p-4 rounded-lg">
              <p className="font-semibold mb-2">Supported Providers:</p>
              <ul className="space-y-1 text-sm">
                <li>• OpenAI (GPT-4, GPT-4 Turbo, o1, o3)</li>
                <li>• Anthropic (Claude 3.5 Sonnet, Opus)</li>
                <li>• Google (Gemini)</li>
                <li>• DeepSeek, xAI, Mistral, and more</li>
              </ul>
            </div>

            <p className="text-sm text-muted-foreground">
              You only need <strong>one API key</strong> from any provider to start researching companies.
            </p>
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex gap-3 mt-4">
          <Button
            onClick={handleGetStarted}
            className="flex-1"
          >
            Add API Keys →
          </Button>
          <Button
            onClick={handleDismiss}
            variant="outline"
            className="flex-1"
          >
            I&apos;ll do it later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
