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
 * For Thai government APIs, we'll use our own built-in proxy with additional options.
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

  // Use our own built-in proxy on Vercel if in production,
  // or localhost:8080 if in development
  const isProd = window.location.hostname !== "localhost";
  const proxyPrefix = isProd ? "/api/" : "http://localhost:8080/";

  try {
    console.log(`Using built-in proxy with Thai settings for: ${cleanedUrl}`);
    const encodedUrl = encodeURIComponent(cleanedUrl);
    const proxyUrl = `${proxyPrefix}${encodedUrl}`;

    const response = await axios.get(proxyUrl, {
      timeout: 90000, // Extend timeout to 90 seconds for slow Thai government APIs
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        Accept: "application/json",
        // Add headers that might help with Thai government APIs
        "X-Thai-Proxy": "true",
        "User-Agent": "Mozilla/5.0 (compatible; ThailandProxyUser/1.0)",
        Origin: "https://epid-odpc2.ddc.moph.go.th",
      },
    });

    // Skip if we got HTML instead of JSON
    if (
      typeof response.data === "string" &&
      (response.data.includes("<!DOCTYPE") || response.data.includes("<html"))
    ) {
      throw new Error("API returned HTML instead of JSON data");
    }

    console.log(`Successfully fetched data through our own proxy`);
    return response.data;
  } catch (error: any) {
    console.error("Thai government API request failed:", error);

    // Try to provide more detailed error information
    if (error.response) {
      // Server responded with a non-2xx status code
      const status = error.response.status;
      throw new Error(
        `Thai proxy request failed: Server returned ${status} ${error.response.statusText}`
      );
    } else if (error.request) {
      // Request was made but no response received (timeout, network error)
      if (error.message?.includes("timeout")) {
        throw new Error(
          "Thai government API timeout - server took too long to respond. Try again later."
        );
      } else {
        throw new Error(
          `Network error connecting to Thai government API. Check your connection or try later.`
        );
      }
    } else {
      // Something else caused the error
      throw new Error(
        `Thai proxy request failed: ${error.message || "Unknown error"}`
      );
    }
  }
};
