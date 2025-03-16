import axios from "axios";

/**
 * Normalizes API response data structure
 * @param responseData The raw API response data
 * @returns Properly structured array for processing
 */
const normalizeApiResponse = (responseData: any): any[] => {
  // Check if the response is HTML instead of JSON
  if (
    typeof responseData === "string" &&
    (responseData.trim().startsWith("<!DOCTYPE") ||
      responseData.trim().startsWith("<html"))
  ) {
    console.error("Received HTML response instead of JSON data");
    throw new Error(
      "Invalid response format: Received HTML instead of data. Try using a different API endpoint or a CORS proxy."
    );
  }

  // Check if the response has a 'data' property that's an array or string
  if (responseData && responseData.data) {
    if (typeof responseData.data === "string") {
      // If the data property contains HTML, throw an error
      if (
        responseData.data.trim().startsWith("<!DOCTYPE") ||
        responseData.data.trim().startsWith("<html")
      ) {
        console.error("HTML found in response.data");
        throw new Error(
          "Invalid response format: HTML content detected in data property."
        );
      }

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
  // If URL already has our proxy prefix, use it directly without additional handling
  if (url.includes("localhost:8080/") || url.startsWith("/api/")) {
    try {
      console.log("Using our own proxy server:", url);
      const response = await axios.get(url, {
        timeout: 20000, // 20 second timeout
        headers: {
          Accept: "application/json",
        },
      });
      return normalizeApiResponse(response.data);
    } catch (error) {
      console.error("Error fetching API data from our proxy:", error);
      throw error;
    }
  }

  // Updated list of reliable CORS proxies with better options
  const CORS_PROXIES = [
    "https://api.allorigins.win/raw?url=",
    "https://corsproxy.io/?",
    "https://proxy.cors.sh/",
    "https://cors-anywhere.herokuapp.com/",
  ];

  // Try direct request first (might work for CORS-enabled APIs)
  try {
    console.log("Trying direct request without proxy");
    const response = await axios.get(url, {
      timeout: 10000, // 10 second timeout
      headers: {
        Accept: "application/json",
      },
    });

    // Check if we got HTML instead of JSON
    if (
      typeof response.data === "string" &&
      (response.data.includes("<!DOCTYPE") || response.data.includes("<html"))
    ) {
      console.log("Direct request returned HTML, trying proxies...");
    } else {
      // Success! Return the data
      return normalizeApiResponse(response.data);
    }
  } catch (error: any) {
    console.log("Direct request failed, trying proxies:", error.message);
    // Continue to proxy attempts
  }

  // Try each proxy in sequence until one works
  let lastError: any = null;

  for (const proxy of CORS_PROXIES) {
    try {
      const proxyUrl = `${proxy}${encodeURIComponent(url)}`;
      console.log(`Trying proxy: ${proxy}`);

      const response = await axios.get(proxyUrl, {
        timeout: 15000, // 15 second timeout
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          Accept: "application/json",
        },
      });

      // Skip this proxy if it returned HTML
      if (
        typeof response.data === "string" &&
        (response.data.includes("<!DOCTYPE") || response.data.includes("<html"))
      ) {
        console.log(`Proxy ${proxy} returned HTML, trying next...`);
        continue;
      }

      return normalizeApiResponse(response.data);
    } catch (error) {
      console.error(`Error with proxy ${proxy}:`, error);
      lastError = error;
    }
  }

  // If all attempts fail, throw a more helpful error message
  console.error("All proxy attempts failed");
  throw (
    lastError ||
    new Error(
      "Unable to access API data. This might be due to CORS restrictions. Try using a different API endpoint or use the app locally with the proxy server."
    )
  );
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
