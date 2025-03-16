import axios from "axios";

/**
 * Normalizes API response data structure
 * @param responseData The raw API response data
 * @returns Properly structured array for processing
 */
const normalizeApiResponse = (responseData: any): any[] => {
  // Check if the response has a 'data' property that's an array or string
  if (responseData && responseData.data) {
    if (typeof responseData.data === "string") {
      // If data is a JSON string, parse it
      try {
        return JSON.parse(responseData.data);
      } catch (error) {
        console.error("Error parsing data string:", error);
        return [];
      }
    } else if (Array.isArray(responseData.data)) {
      // If data is already an array, return it
      return responseData.data;
    }
  }

  // If responseData itself is an array, return it
  if (Array.isArray(responseData)) {
    return responseData;
  }

  // Handle case where the entire response is one object with nested data
  console.log("API response structure:", Object.keys(responseData).join(", "));

  // If we can't determine the structure, return as-is wrapped in array if needed
  return Array.isArray(responseData) ? responseData : [responseData];
};

/**
 * Fetches data from the specified API URL
 * @param url The API URL to fetch data from
 * @returns The fetched data as an array of objects
 */
export const fetchApiData = async (url: string): Promise<any[]> => {
  // Check if it's already using a local proxy
  if (url.includes("localhost:8080/")) {
    try {
      const response = await axios.get(url);
      return normalizeApiResponse(response.data);
    } catch (error) {
      console.error("Error fetching API data from local proxy:", error);
      throw error;
    }
  }

  // Try each proxy in sequence until one works
  let lastError: any = null;

  // List of available CORS proxies to try
  const CORS_PROXIES = [
    "https://corsproxy.io/?",
    "https://cors-anywhere.herokuapp.com/",
    "https://api.allorigins.win/raw?url=",
  ];

  for (const proxy of CORS_PROXIES) {
    try {
      const proxyUrl = `${proxy}${encodeURIComponent(url)}`;
      console.log(`Trying proxy: ${proxy}`);

      const response = await axios.get(proxyUrl, {
        timeout: 30000, // 30 second timeout
        headers: {
          "X-Requested-With": "XMLHttpRequest",
        },
      });

      return normalizeApiResponse(response.data);
    } catch (error) {
      console.error(`Error with proxy ${proxy}:`, error);
      lastError = error;
    }
  }

  // If we're here, none of the proxies worked
  // Try a relative URL for the development proxy configured in package.json
  try {
    // Extract the path from the URL to use with the development proxy
    const originalUrl = new URL(url);
    const relativePath = originalUrl.pathname + originalUrl.search;

    console.log(`Trying development proxy with path: ${relativePath}`);
    const response = await axios.get(relativePath);
    return normalizeApiResponse(response.data);
  } catch (error) {
    console.error("Error using development proxy:", error);
  }

  // If all attempts fail, throw the last error
  console.error("All proxy attempts failed");
  throw lastError || new Error("Failed to fetch data from all proxies");
};

/**
 * Validates if the given string is a valid URL
 * @param url The URL to validate
 * @returns Boolean indicating if the URL is valid
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};
