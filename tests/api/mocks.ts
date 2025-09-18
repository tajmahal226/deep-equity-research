// Minimal mocks for Next.js edge request/response objects used by API route tests.
import { URL } from "node:url";

export class MockNextRequest {
  url: string;
  method: string;
  headers: Headers;
  private _body: string | null;
  readonly nextUrl: URL;

  constructor(url: string, init: RequestInit = {}) {
    this.url = url;
    this.method = (init.method || "GET").toUpperCase();
    this.headers = new Headers(init.headers);
    this._body = typeof init.body === "string" ? init.body : null;
    this.nextUrl = new URL(url);
  }

  async json() {
    if (this._body == null) return {};
    return JSON.parse(this._body);
  }
}

export function createMockRequest(
  url: string,
  init: RequestInit = {},
): MockNextRequest {
  return new MockNextRequest(url, init);
}
