import localforage from "localforage";

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
