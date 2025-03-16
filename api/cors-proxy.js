// CORS Proxy Serverless Function for Vercel
const axios = require("axios");

// Check if a URL is a Thai government API
function isThaiGovernmentAPI(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    return (
      hostname.endsWith(".go.th") ||
      hostname.includes(".moph.go.th") ||
      hostname.includes(".ddc.moph.go.th")
    );
  } catch (e) {
    return false;
  }
}

module.exports = async function handler(req, res) {
  // Set CORS headers to allow requests from any origin
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Log request details for debugging
  console.log("Request method:", req.method);
  console.log("Request URL:", req.url);
  console.log("Request query:", JSON.stringify(req.query));
  console.log("Request headers:", JSON.stringify(req.headers));

  let targetUrl = ""; // Initialize targetUrl for scope
  let isThaiAPI = false; // Initialize isThaiAPI for scope

  try {
    // Extract the URL part from the request path
    // For paths like /api/https://example.com we want to get https://example.com
    let path = req.url;

    // Debug information
    console.log("Original path:", path);

    // Remove the leading /api/ if it exists
    if (path.startsWith("/")) {
      path = path.substring(1);
    }

    // If there are multiple slashes after /api/, fix them
    targetUrl = path;

    console.log("Path after removing leading slash:", targetUrl);

    // Always try to decode the URL first, in case it's been URL encoded
    try {
      // Some clients encode the entire URL
      if (targetUrl.includes("%3A%2F%2F")) {
        const decodedUrl = decodeURIComponent(targetUrl);
        console.log(
          `Successfully decoded URL from full encoding: ${decodedUrl}`
        );
        targetUrl = decodedUrl;
      }
    } catch (e) {
      console.log(`URL decoding failed, will use as-is: ${e.message}`);
    }

    // Handle case when URL might still have encoded parts
    if (targetUrl.includes("%")) {
      try {
        targetUrl = decodeURIComponent(targetUrl);
        console.log(`Additional decoding of URL: ${targetUrl}`);
      } catch (e) {
        console.log(`Secondary URL decoding failed: ${e.message}`);
      }
    }

    // Fix missing protocols or malformed protocols (https:/ instead of https://)
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      // Try to extract protocol from malformed URLs like "https:/example.com"
      const protocolMatch = targetUrl.match(/^(https?):\/([^/])/);
      if (protocolMatch) {
        // Fix malformed protocol (https:/ instead of https://)
        targetUrl = targetUrl.replace(/^(https?):\/([^/])/, "$1://$2");
        console.log(`Fixed malformed protocol: ${targetUrl}`);
      }
      // Handle URLs with no protocol at all
      else if (!targetUrl.includes("://")) {
        console.log(`Adding https:// to URL without protocol: ${targetUrl}`);
        targetUrl = `https://${targetUrl}`;
      }
    }

    // Handle double slashes after protocol (https:////example.com)
    targetUrl = targetUrl.replace(/(https?:\/\/)\/+/g, "$1");

    // Fix specific path patterns we know about
    if (targetUrl.includes("/haze-r2") && !targetUrl.includes("/haze-r2/")) {
      targetUrl = targetUrl.replace("/haze-r2", "/haze-r2/");
    }

    // Add /api after /haze-r2/ if it's not there and the path contains patient-group-location
    if (
      targetUrl.includes("/haze-r2/") &&
      !targetUrl.includes("/haze-r2/api/")
    ) {
      if (targetUrl.includes("/haze-r2/patient-group-location")) {
        targetUrl = targetUrl.replace(
          "/haze-r2/patient-group-location",
          "/haze-r2/api/patient-group-location"
        );
        console.log(`Added missing /api/ in path: ${targetUrl}`);
      }
    }

    // Validate URL structure
    try {
      new URL(targetUrl);
    } catch (error) {
      console.log(
        `Invalid URL structure: ${targetUrl}, Error: ${error.message}`
      );
      return res.status(400).json({
        error: `Invalid URL structure: ${error.message}`,
        receivedUrl: targetUrl,
        originalUrl: req.url,
      });
    }

    console.log(`Proxying request to: ${targetUrl}`);

    // Try to make a direct request to the Thai government API first
    // to check if it's accessible and get more diagnostic information
    if (targetUrl.includes("epid-odpc2.ddc.moph.go.th")) {
      try {
        console.log("Testing direct access to the Thai government API...");
        const testResponse = await axios({
          url: targetUrl,
          method: "HEAD",
          timeout: 10000,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "application/json",
            "Accept-Language": "th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7",
          },
          validateStatus: () => true, // Accept any status code for diagnostic purposes
        });
        console.log("Direct API test result:", {
          status: testResponse.status,
          headers: testResponse.headers,
        });
      } catch (testError) {
        console.log("Direct API test failed:", testError.message);
        if (testError.response) {
          console.log("Test error response:", {
            status: testError.response.status,
            headers: testError.response.headers,
          });
        }
      }
    }

    // Check if this is a Thai government API
    isThaiAPI = isThaiGovernmentAPI(targetUrl);
    if (isThaiAPI) {
      console.log(`Detected Thai government API, using special handling`);
    }

    // Set up headers for the request
    const headers = {
      // Forward these headers to the target server
      Accept: req.headers.accept || "application/json",
      "User-Agent": isThaiAPI
        ? "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        : "API-Converter-Proxy/1.0",
    };

    // Special handling for Thai government APIs
    if (isThaiAPI) {
      headers["Origin"] = new URL(targetUrl).origin;
      headers["Referer"] = targetUrl;
      headers["Accept-Language"] = "th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7";

      // Add more headers that a browser would typically send
      headers["Cache-Control"] = "no-cache";
      headers["Pragma"] = "no-cache";
      headers["sec-ch-ua"] =
        '"Not A(Brand";v="99", "Google Chrome";v="121", "Chromium";v="121"';
      headers["sec-ch-ua-mobile"] = "?0";
      headers["sec-ch-ua-platform"] = '"Windows"';
      headers["Sec-Fetch-Dest"] = "empty";
      headers["Sec-Fetch-Mode"] = "cors";
      headers["Sec-Fetch-Site"] = "same-origin";
    }

    // Log the final request configuration
    console.log("Final request configuration:", {
      url: targetUrl,
      method: req.method,
      headers: headers,
    });

    const response = await axios({
      url: targetUrl,
      method: req.method,
      headers: headers,
      // Longer timeout for Thai government APIs
      timeout: isThaiAPI ? 90000 : 60000,
      // Handle redirects
      maxRedirects: 5,
      // Forward query parameters
      params: req.query,
      // Handle response as arraybuffer to support any content type
      responseType: "arraybuffer",
    });

    // Log response details
    console.log("Response status:", response.status);
    console.log("Response headers:", JSON.stringify(response.headers));

    // Get content type to properly forward it
    const contentType = response.headers["content-type"] || "application/json";
    res.setHeader("Content-Type", contentType);

    // Forward other important headers
    const headersToForward = ["cache-control", "expires", "date", "etag"];
    headersToForward.forEach((header) => {
      if (response.headers[header]) {
        res.setHeader(header, response.headers[header]);
      }
    });

    // Check if response is HTML when JSON was requested
    const acceptHeader = req.headers.accept || "";
    if (
      acceptHeader.includes("application/json") &&
      contentType.includes("text/html")
    ) {
      // If JSON was requested but HTML was returned, it's likely an error page
      const htmlContent = response.data.toString("utf8");

      // Log first 100 chars of the response for debugging
      console.log(
        `HTML detected when JSON requested. First 100 chars: ${htmlContent.substring(
          0,
          100
        )}`
      );

      return res.status(415).json({
        error: "Target server returned HTML when JSON was requested",
        status: response.status,
      });
    }

    // Send the response with the appropriate status code
    res.status(response.status).send(response.data);
    console.log(
      `Successfully proxied ${targetUrl}, status: ${response.status}`
    );
  } catch (error) {
    console.error(`Error proxying request:`, error.message);

    // Log detailed error information
    if (error.response) {
      console.error("Response error details:", {
        status: error.response.status,
        headers: error.response.headers,
        data: error.response.data
          ? error.response.data.toString("utf8").substring(0, 200)
          : null,
      });
    } else if (error.request) {
      console.error("Request error details:", {
        method: error.request.method,
        path: error.request.path,
        host: error.request.host,
      });
    }

    // Format error message
    let errorMessage = "An error occurred while fetching the data";
    let statusCode = 500;

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      statusCode = error.response.status;
      errorMessage = `Target server responded with status ${statusCode}`;
      console.error(`Target server response error:`, {
        status: statusCode,
        headers: error.response.headers,
      });

      // Forward the response from the target server
      const contentType =
        error.response.headers["content-type"] || "application/json";

      if (contentType.includes("application/json")) {
        try {
          const jsonData = JSON.parse(error.response.data.toString("utf8"));
          return res.status(statusCode).json({
            ...jsonData,
            proxied: true,
            originalUrl: targetUrl,
          });
        } catch (parseError) {
          // Unable to parse as JSON, continue with default error handling
          console.error(`Error parsing JSON response: ${parseError.message}`);
        }
      }
    } else if (error.request) {
      // The request was made but no response was received
      statusCode = 504; // Gateway Timeout
      errorMessage = isThaiAPI
        ? "Thai government API timeout - server took too long to respond"
        : "No response received from target server";
      console.error(`No response from target server for: ${targetUrl}`);
    } else {
      // Something happened in setting up the request
      statusCode = 400;
      errorMessage = error.message;
      console.error(`Request setup error for ${targetUrl}: ${error.message}`);
    }

    // Send error response with more details
    return res.status(statusCode).json({
      error: errorMessage,
      originalUrl: targetUrl,
      serverInfo: {
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        proxied: true,
      },
    });
  }
};
