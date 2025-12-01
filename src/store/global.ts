import { create } from "zustand";

interface GlobalStore {
  openSetting: boolean;
  openHistory: boolean;
  openKnowledge: boolean;
  openPreFilledPrompts: boolean;
}

interface GlobalFunction {
  setOpenSetting: (visible: boolean) => void;
  setOpenHistory: (visible: boolean) => void;
  setOpenKnowledge: (visible: boolean) => void;
  setOpenPreFilledPrompts: (visible: boolean) => void;
}

/**
 * Global UI state store.
 * Manages visibility of side panels and modals.
 */
export const useGlobalStore = create<GlobalStore & GlobalFunction>((set) => ({
  openSetting: false,
  openHistory: false,
  openKnowledge: false,
  openPreFilledPrompts: false,
  setOpenSetting: (visible) => set({ openSetting: visible }),
  setOpenHistory: (visible) => set({ openHistory: visible }),
  setOpenKnowledge: (visible) => set({ openKnowledge: visible }),
  setOpenPreFilledPrompts: (visible) => set({ openPreFilledPrompts: visible }),
}));
