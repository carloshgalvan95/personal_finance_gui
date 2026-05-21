/** Minimal bridge for Electron main-process HTTP (avoids CORS in packaged app). */

export interface ElectronApi {
  fetchUrl: (url: string) => Promise<{
    ok: boolean;
    status: number;
    body: string;
  }>;
}

declare global {
  interface Window {
    electronAPI?: ElectronApi;
  }
}

export function isElectron(): boolean {
  return typeof window !== "undefined" && window.electronAPI != null;
}

export async function electronFetch(url: string): Promise<Response> {
  const api = window.electronAPI;
  if (!api) throw new Error("Electron API unavailable");
  const result = await api.fetchUrl(url);
  return new Response(result.body, {
    status: result.status,
    statusText: result.ok ? "OK" : "Error",
  });
}
