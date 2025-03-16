import axios from "axios";
import { fetchThroughThaiProxy, isThaiGovernmentAPI } from "./thai-proxies";

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
