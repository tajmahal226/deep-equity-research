import { GROQ_BASE_URL } from "@/constants/urls";
import { createProxyHandler } from "../../create-proxy-handler";

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

const API_PROXY_BASE_URL = process.env.GROQ_API_BASE_URL || GROQ_BASE_URL;

const handler = createProxyHandler(API_PROXY_BASE_URL);

export { handler as GET, handler as POST, handler as PUT, handler as DELETE };
