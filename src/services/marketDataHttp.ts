import axios from "axios";
import { electronFetch, isElectron } from "../utils/electronBridge";

const YAHOO_ORIGIN = "https://query1.finance.yahoo.com";

function buildYahooUrl(path: string, params?: Record<string, string>): string {
  const url = new URL(`${YAHOO_ORIGIN}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  return url.toString();
}

/** Fetch Yahoo chart API via Vite proxy (web) or Electron IPC (packaged app). */
export async function fetchYahooChart(
  symbol: string,
  params?: Record<string, string>,
): Promise<{ chart: { result?: unknown[] } }> {
  if (isElectron()) {
    const url = buildYahooUrl(`/v8/finance/chart/${symbol}`, params);
    const response = await electronFetch(url);
    if (!response.ok) throw new Error(`Market data request failed (${response.status})`);
    return JSON.parse(await response.text());
  }

  const response = await axios.get(`/api/yahoo/v8/finance/chart/${symbol}`, {
    params,
    timeout: 15000,
  });
  return response.data;
}
