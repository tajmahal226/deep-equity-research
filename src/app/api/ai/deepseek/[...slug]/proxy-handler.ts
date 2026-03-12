import { DEEPSEEK_BASE_URL } from '@/constants/urls';
import { createProxyHandler } from '../../create-proxy-handler';

const API_PROXY_BASE_URL = process.env.DEEPSEEK_API_BASE_URL || DEEPSEEK_BASE_URL;

export const proxyHandler = createProxyHandler(API_PROXY_BASE_URL);
