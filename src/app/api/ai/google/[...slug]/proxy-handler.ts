import { GEMINI_BASE_URL } from '@/constants/urls';
import { createProxyHandler } from '../../create-proxy-handler';

const API_PROXY_BASE_URL = process.env.GOOGLE_API_BASE_URL || GEMINI_BASE_URL;

export const proxyHandler = createProxyHandler(API_PROXY_BASE_URL, {
  headers: (req) => ({
    'x-goog-api-key': req.headers.get('x-goog-api-key') || '',
  }),
});
