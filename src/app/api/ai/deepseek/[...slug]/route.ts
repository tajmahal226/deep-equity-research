import { proxyHandler } from "./proxy-handler";

export const runtime = "edge";
export const preferredRegion = [
  "cle1",
  "iad1",
  "pdx1",
  "sfo1",
  "sin1",
  "syd1",
  "hnd1",
  "kix1",
];

export { proxyHandler as GET, proxyHandler as POST, proxyHandler as PUT, proxyHandler as DELETE };
