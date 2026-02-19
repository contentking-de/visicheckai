import { ProxyAgent } from "undici";

/**
 * Creates a fetch function that routes all requests through the given proxy.
 * Uses undici's ProxyAgent which is compatible with Node.js built-in fetch.
 *
 * Credentials are extracted from the URL and passed as an explicit
 * Proxy-Authorization token so HTTPS CONNECT tunneling works reliably
 * (undici doesn't always send auth from the URL during CONNECT).
 */
export function createProxyFetch(proxyUrl: string): typeof globalThis.fetch {
  const parsed = new URL(proxyUrl);
  let token: string | undefined;

  if (parsed.username || parsed.password) {
    const user = decodeURIComponent(parsed.username);
    const pass = decodeURIComponent(parsed.password);
    token = `Basic ${Buffer.from(`${user}:${pass}`).toString("base64")}`;
    parsed.username = "";
    parsed.password = "";
  }

  const dispatcher = new ProxyAgent({
    uri: parsed.toString(),
    token,
  });

  return ((input: RequestInfo | URL, init?: RequestInit) => {
    return globalThis.fetch(input, { ...init, dispatcher } as RequestInit);
  }) as typeof globalThis.fetch;
}
