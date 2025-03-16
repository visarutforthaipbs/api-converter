/**
 * Thai proxy list and utilities
 * These are free proxies with Thai IP addresses that can be used to access Thai government APIs
 */

import axios from "axios";

// List of free Thai proxies - update this list as needed
export const thaiProxies = [
  "183.89.170.151:8080",
  "49.49.28.118:8080",
  "203.154.83.69:63230",
  "180.180.124.248:8080",
  "171.97.122.7:8080",
  "180.183.232.243:8080",
  "203.150.113.69:23500",
  "122.154.72.102:8080",
];

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
 * In a browser environment, we can't directly use proxy servers from client-side code.
 * Instead, we'll use public CORS proxies that can forward requests to Thai websites.
 *
 * @param url The URL to fetch data from
 * @returns The fetched data
 */
export const fetchThroughThaiProxy = async (url: string): Promise<any> => {
  // List of public CORS proxies
  const corsProxies = [
    "https://api.allorigins.win/raw?url=",
    "https://corsproxy.io/?",
    "https://proxy.cors.sh/",
  ];

  let lastError = null;

  // Try each CORS proxy until one works
  for (const proxy of corsProxies) {
    try {
      console.log(`Trying CORS proxy: ${proxy} for URL: ${url}`);
      const encodedUrl = encodeURIComponent(url);
      const proxyUrl = `${proxy}${encodedUrl}`;

      const response = await axios.get(proxyUrl, {
        timeout: 30000,
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          Accept: "application/json",
        },
      });

      // Skip if we got HTML instead of JSON
      if (
        typeof response.data === "string" &&
        (response.data.includes("<!DOCTYPE") || response.data.includes("<html"))
      ) {
        console.log(`Proxy ${proxy} returned HTML, trying next...`);
        continue;
      }

      console.log(`Successfully fetched data through CORS proxy: ${proxy}`);
      return response.data;
    } catch (error: any) {
      console.error(`Error with CORS proxy ${proxy}:`, error.message);
      lastError = error;
    }
  }

  // All proxies failed
  throw new Error(
    `Thai proxy request failed: ${lastError?.message || "All proxies failed"}`
  );
};
