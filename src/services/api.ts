import axios from "axios";
import { fetchThroughThaiProxy, isThaiGovernmentAPI } from "./thai-proxies";

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

interface FetchOptions {
  useThaiProxy?: boolean;
}

/**
 * Fetches data from the specified API URL
 * @param url The API URL to fetch data from
 * @returns The fetched data as an array of objects
 */
export const fetchApiData = async (url: string, options: FetchOptions = {}) => {
  const { useThaiProxy = false } = options;

  console.log(`Fetching from ${url} ${useThaiProxy ? "using Thai proxy" : ""}`);

  // If this is a Thai government API and useThaiProxy is true, try using the Thai proxy
  if (useThaiProxy && isThaiGovernmentAPI(url)) {
    try {
      console.log("Attempting to fetch through Thai proxy...");
      const data = await fetchThroughThaiProxy(url);
      console.log("Successfully fetched through Thai proxy");
      return data;
    } catch (error: any) {
      console.error("Thai proxy fetch failed:", error);
      throw new Error(`Thai proxy fetch failed: ${error.message}`);
    }
  }

  try {
    // Ensure URL is properly encoded - critical for some Thai government APIs
    const encodedUrl = encodeURI(url);

    const response = await axios.get(encodedUrl, {
      timeout: 60000, // 60 seconds timeout
    });

    // Handle receiving HTML instead of JSON
    if (
      typeof response.data === "string" &&
      response.data.includes("<!DOCTYPE html>")
    ) {
      throw new Error("HTML response received instead of JSON data");
    }

    return response.data;
  } catch (error: any) {
    console.error("Error fetching API data:", error);
    throw error;
  }
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
