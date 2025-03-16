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
 * Test if a proxy is working
 * @param proxy The proxy to test
 * @returns True if the proxy is working
 */
export const testProxy = async (proxy: string): Promise<boolean> => {
  try {
    const [host, port] = proxy.split(":");
    const httpsAgent = new (require("https-proxy-agent"))(
      `http://${host}:${port}`
    );

    const response = await axios.get("https://api.ipify.org?format=json", {
      httpsAgent,
      timeout: 5000,
    });

    return response.status === 200;
  } catch (error: any) {
    console.error(`Proxy ${proxy} test failed:`, error.message);
    return false;
  }
};

/**
 * Find a working Thai proxy from the list
 * @returns A working proxy or null if none found
 */
export const findWorkingProxy = async (): Promise<string | null> => {
  for (const proxy of thaiProxies) {
    const isWorking = await testProxy(proxy);
    if (isWorking) {
      console.log(`Found working Thai proxy: ${proxy}`);
      return proxy;
    }
  }
  return null;
};

/**
 * Fetch data through a Thai proxy
 * @param url The URL to fetch
 * @returns The fetched data
 */
export const fetchThroughThaiProxy = async (url: string): Promise<any> => {
  const workingProxy = await findWorkingProxy();

  if (!workingProxy) {
    throw new Error("No working Thai proxies found");
  }

  try {
    const [host, port] = workingProxy.split(":");
    const httpsAgent = new (require("https-proxy-agent"))(
      `http://${host}:${port}`
    );

    const response = await axios.get(url, {
      httpsAgent,
      timeout: 30000,
    });

    return response.data;
  } catch (error: any) {
    throw new Error(`Thai proxy request failed: ${error.message}`);
  }
};
