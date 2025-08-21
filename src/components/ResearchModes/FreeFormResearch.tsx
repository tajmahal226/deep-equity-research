"use client";
import dynamic from "next/dynamic";
import { useGlobalStore } from "@/store/global";

const Topic = dynamic(() => import("@/components/Research/Topic"));
const Feedback = dynamic(() => import("@/components/Research/Feedback"));
const SearchResult = dynamic(() => import("@/components/Research/SearchResult"));
const FinalReport = dynamic(() => import("@/components/Research/FinalReport"));
const PreFilledPrompts = dynamic(() => import("@/components/PreFilledPrompts"), {
  ssr: false,
});

export default function FreeFormResearch() {
  const { openPreFilledPrompts, setOpenPreFilledPrompts } = useGlobalStore();

  return (
    <div className="w-full">
      <Topic />
      <Feedback />
      <SearchResult />
      <FinalReport />
      <PreFilledPrompts 
        open={openPreFilledPrompts} 
        onClose={() => setOpenPreFilledPrompts(false)} 
      />
    </div>
  );
}