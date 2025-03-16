/**
 * Thai proxy list and utilities
 * These are free proxies with Thai IP addresses that can be used to access Thai government APIs
 */

import axios from "axios";

// List of free Thai proxies - update this list as needed
// Source: ProxyScrape, Geonode, free-proxy-list, and other free proxy services
export const thaiProxies = [
  // Thai HTTP/HTTPS proxies - update regularly as they may go offline
  "183.89.170.151:8080",
  "49.49.28.118:8080",
  "203.154.83.69:63230",
  "180.180.124.248:8080",
  "171.97.122.7:8080",
  "180.183.232.243:8080",
  "203.150.113.69:23500",
  "122.154.72.102:8080",
  "183.88.212.141:8080",
  "119.42.115.29:8080",
  "110.77.134.106:8080",
  "171.97.123.206:8080",
  "223.204.10.126:8080",
];

// Public CORS proxies as final fallback options
export const corsProxies = [
  "https://corsproxy.io/?",
  "https://cors-anywhere-fxhv.onrender.com/",
  "https://proxy.cors.sh/",
  "https://api.allorigins.win/raw?url=",
];

/**
 * Cache for proxy test results to avoid repeated testing
 * Maps proxy URL to {working: boolean, lastChecked: timestamp}
 */
const proxyTestCache: Record<
  string,
  { working: boolean; lastChecked: number }
> = {};

// Cache timeout - only test a proxy again after this many minutes
const CACHE_TIMEOUT_MINUTES = 5;

/**
 * Check if a URL is from a Thai government API
 * @param url The URL to check
 * @returns True if the URL is from a Thai government API
 */
export const isThaiGovernmentAPI = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    // Check for Thai government domains
    if (
      hostname.endsWith(".go.th") ||
      hostname.includes(".moph.go.th") ||
      hostname.includes(".ddc.moph.go.th")
    ) {
      return true;
    }

    return false;
  } catch (error) {
    console.error("Error checking if URL is Thai government API:", error);
    return false;
  }
};

/**
 * Test if a proxy is working by making a quick request
 * @param proxy The proxy to test in format IP:PORT
 * @returns Promise resolving to true if working, false otherwise
 */
export const testDirectProxy = async (proxy: string): Promise<boolean> => {
  // Check cache first
  const now = Date.now();
  const cacheEntry = proxyTestCache[proxy];
  if (
    cacheEntry &&
    now - cacheEntry.lastChecked < CACHE_TIMEOUT_MINUTES * 60 * 1000
  ) {
    console.log(
      `Using cached proxy test result for ${proxy}: ${
        cacheEntry.working ? "working" : "not working"
      }`
    );
    return cacheEntry.working;
  }

  try {
    // Using a test target that should return quickly
    const testUrl = "https://httpbin.org/ip";

    // Set very short timeout for testing
    const response = await fetch(testUrl, {
      mode: "no-cors", // This may allow some level of proxy testing without CORS issues
      // @ts-ignore - using timeout option that may not be in the types
      timeout: 3000, // 3 second timeout for testing
      signal: AbortSignal.timeout(3000),
    });

    const isWorking = response.status >= 200 && response.status < 300;
    proxyTestCache[proxy] = { working: isWorking, lastChecked: now };

    if (isWorking) {
      console.log(`Proxy ${proxy} is working`);
    } else {
      console.log(`Proxy ${proxy} returned status: ${response.status}`);
    }

    return isWorking;
  } catch (error) {
    console.log(
      `Proxy ${proxy} test failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
    proxyTestCache[proxy] = { working: false, lastChecked: now };
    return false;
  }
};

/**
 * Test if a CORS proxy works with our target URL
 * @param corsProxy The CORS proxy URL (e.g., "https://corsproxy.io/?")
 * @param targetUrl The target URL to check
 * @returns Promise resolving to true if working, false otherwise
 */
export const testCorsProxy = async (
  corsProxy: string,
  targetUrl: string
): Promise<boolean> => {
  const cacheKey = `${corsProxy}_${targetUrl}`;
  const now = Date.now();
  const cacheEntry = proxyTestCache[cacheKey];

  if (
    cacheEntry &&
    now - cacheEntry.lastChecked < CACHE_TIMEOUT_MINUTES * 60 * 1000
  ) {
    console.log(
      `Using cached CORS proxy test result for ${corsProxy}: ${
        cacheEntry.working ? "working" : "not working"
      }`
    );
    return cacheEntry.working;
  }

  try {
    const encodedUrl = encodeURIComponent(targetUrl);
    const fullUrl = `${corsProxy}${encodedUrl}`;

    console.log(`Testing CORS proxy: ${corsProxy} with ${targetUrl}`);

    const response = await axios.get(fullUrl, {
      timeout: 5000,
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        Accept: "application/json",
      },
    });

    const isWorking =
      response.status >= 200 &&
      response.status < 300 &&
      !(
        typeof response.data === "string" &&
        response.data.includes("<!DOCTYPE html>")
      );

    proxyTestCache[cacheKey] = { working: isWorking, lastChecked: now };

    if (isWorking) {
      console.log(`CORS proxy ${corsProxy} is working with ${targetUrl}`);
    } else {
      console.log(`CORS proxy ${corsProxy} returned HTML or unexpected data`);
    }

    return isWorking;
  } catch (error) {
    console.log(
      `CORS proxy ${corsProxy} test failed: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
    proxyTestCache[cacheKey] = { working: false, lastChecked: now };
    return false;
  }
};

/**
 * Find a working Thai proxy from our list
 * @returns The first working proxy or null if none work
 */
export const findWorkingThaiProxy = async (): Promise<string | null> => {
  for (const proxy of thaiProxies) {
    const isWorking = await testDirectProxy(proxy);
    if (isWorking) {
      return proxy;
    }
  }
  return null;
};

/**
 * Find a working CORS proxy for a specific target URL
 * @param targetUrl The target URL we want to access
 * @returns The first working CORS proxy or null if none work
 */
export const findWorkingCorsProxy = async (
  targetUrl: string
): Promise<string | null> => {
  for (const proxy of corsProxies) {
    const isWorking = await testCorsProxy(proxy, targetUrl);
    if (isWorking) {
      return proxy;
    }
  }
  return null;
};

/**
 * Try to use the local CORS proxy if it's running
 * @param url The URL to proxy
 * @returns Promise resolving to data or rejecting if proxy fails
 */
export const tryLocalProxy = async (url: string): Promise<any> => {
  try {
    // Check if we're on localhost (development) or Vercel (production)
    const isProd = window.location.hostname !== "localhost";
    const proxyPrefix = isProd ? "/api/" : "http://localhost:8080/";

    const encodedUrl = encodeURIComponent(url);
    const proxyUrl = `${proxyPrefix}${encodedUrl}`;

    console.log(`Trying local proxy: ${proxyUrl}`);

    const response = await axios.get(proxyUrl, {
      timeout: 30000,
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        Accept: "application/json",
      },
    });

    // Reject if we get HTML instead of data
    if (
      typeof response.data === "string" &&
      (response.data.includes("<!DOCTYPE html>") ||
        response.data.includes("<html"))
    ) {
      throw new Error("Local proxy returned HTML instead of data");
    }

    return response.data;
  } catch (error) {
    console.error("Local proxy failed:", error);
    throw error;
  }
};

/**
 * Try to fetch through a public CORS proxy
 * @param url The URL to fetch
 * @returns Promise resolving to data or rejecting if all proxies fail
 */
export const tryPublicCorsProxies = async (url: string): Promise<any> => {
  // Find a working CORS proxy first
  const corsProxy = await findWorkingCorsProxy(url);

  if (!corsProxy) {
    throw new Error("No working CORS proxies found");
  }

  try {
    const encodedUrl = encodeURIComponent(url);
    const proxyUrl = `${corsProxy}${encodedUrl}`;

    console.log(`Using public CORS proxy: ${corsProxy}`);

    const response = await axios.get(proxyUrl, {
      timeout: 30000,
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        Accept: "application/json",
      },
    });

    // Reject if we get HTML instead of data
    if (
      typeof response.data === "string" &&
      (response.data.includes("<!DOCTYPE html>") ||
        response.data.includes("<html"))
    ) {
      throw new Error("CORS proxy returned HTML instead of data");
    }

    return response.data;
  } catch (error) {
    console.error("CORS proxy failed:", error);
    throw error;
  }
};

/**
 * Configure direct Thai proxy request
 * @param proxy Thai proxy in format IP:PORT
 * @param url Target URL
 * @returns Promise resolving to data or rejecting if proxy fails
 */
export const tryDirectThaiProxy = async (url: string): Promise<any> => {
  const workingProxy = await findWorkingThaiProxy();

  if (!workingProxy) {
    throw new Error("No working Thai proxies found");
  }

  // Since we can't use direct proxies from browser, we'll post to a hidden iframe
  // This is a hack and may not work in all cases due to browser security restrictions
  // A better approach would be a server-side proxy

  // For now, we'll just throw an error since this won't work reliably in browsers
  throw new Error(
    "Direct Thai proxy requests can't be made from browser. Use a server-side proxy instead."
  );
};

/**
 * In a browser environment, we can't directly use proxy servers from client-side code.
 * For Thai government APIs, we'll use a multi-tiered approach with fallbacks.
 *
 * @param url The URL to fetch data from
 * @returns The fetched data
 */
export const fetchThroughThaiProxy = async (url: string): Promise<any> => {
  // First, ensure the URL has the correct protocol format
  let cleanedUrl = url;
  if (cleanedUrl.match(/^https?:\/[^/]/)) {
    cleanedUrl = cleanedUrl.replace(/^(https?):\/([^/])/, "$1://$2");
    console.log("Fixed malformed protocol:", cleanedUrl);
  }

  // Add /api/ into the URL path for endpoints that need it
  if (
    cleanedUrl.includes("/haze-r2/") &&
    !cleanedUrl.includes("/haze-r2/api/")
  ) {
    if (cleanedUrl.includes("/haze-r2/patient-group-location")) {
      cleanedUrl = cleanedUrl.replace(
        "/haze-r2/patient-group-location",
        "/haze-r2/api/patient-group-location"
      );
      console.log(`Added missing /api/ in path: ${cleanedUrl}`);
    }
  }

  // Try multiple approaches with fallbacks
  const errors: Error[] = [];

  // Approach 1: Try the local proxy server
  try {
    console.log("Attempt 1: Trying local proxy server");
    return await tryLocalProxy(cleanedUrl);
  } catch (error: any) {
    console.error("Local proxy failed:", error.message);
    errors.push(new Error(`Local proxy error: ${error.message}`));
  }

  // Approach 2: Try public CORS proxies
  try {
    console.log("Attempt 2: Trying public CORS proxies");
    return await tryPublicCorsProxies(cleanedUrl);
  } catch (error: any) {
    console.error("Public CORS proxies failed:", error.message);
    errors.push(new Error(`CORS proxy error: ${error.message}`));
  }

  // Approach 3: Try direct proxy (likely won't work in browser)
  try {
    console.log("Attempt 3: Trying direct Thai proxy");
    return await tryDirectThaiProxy(cleanedUrl);
  } catch (error: any) {
    console.error("Direct Thai proxy failed:", error.message);
    errors.push(new Error(`Direct proxy error: ${error.message}`));
  }

  // All approaches failed
  const errorMessage = `All proxy approaches failed. Errors: ${errors
    .map((e) => e.message)
    .join(", ")}`;
  console.error(errorMessage);
  throw new Error(errorMessage);
};
