import { ProxyAgent } from "undici";

/**
 * Creates a fetch function that routes all requests through the given proxy.
 * Uses undici's ProxyAgent which is compatible with Node.js built-in fetch.
 */
export function createProxyFetch(proxyUrl: string): typeof globalThis.fetch {
  const dispatcher = new ProxyAgent(proxyUrl);
  return ((input: RequestInfo | URL, init?: RequestInit) => {
    return globalThis.fetch(input, { ...init, dispatcher } as RequestInit);
  }) as typeof globalThis.fetch;
}
