import localforage from "localforage";
import { createJSONStorage, type StateStorage, type PersistStorage } from "zustand/middleware";

export const researchStore = localforage.createInstance({
  name: "DeepResearch",
  storeName: "researchStore",
  description: "Stores the history and results of in-depth research.",
});

export const researchCacheStorage = localforage.createInstance({
  name: "DeepResearch",
  storeName: "researchCache",
  description: "Stores cached research results to reduce API costs and improve performance.",
});

const noopStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

export const createSafeJSONStorage = <S = unknown>(): PersistStorage<S> | undefined => {
  if (typeof window === "undefined") {
    return createJSONStorage<S>(() => noopStorage);
  }

  try {
    const storage = window.localStorage;
    if (!storage) {
      return createJSONStorage<S>(() => noopStorage);
    }

    const testKey = "__safe_json_storage_test__";
    storage.setItem(testKey, testKey);
    storage.removeItem(testKey);

    return createJSONStorage<S>(() => storage);
  } catch {
    return createJSONStorage<S>(() => noopStorage);
  }
};
