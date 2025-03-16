// CORS Proxy Server for API Converter app
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 8080;

// Enable CORS for all routes
app.use(cors());

// Add request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get("/", (req, res) => {
  res.send(
    "API Converter CORS Proxy Server is running. Use it by prepending the target URL to the path."
  );
});

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

// Main proxy endpoint - handles any URL passed after the domain
app.get("*", async (req, res) => {
  try {
    // Skip the initial slash to get the URL
    let targetUrl = req.url.slice(1);

    // Debug the received URL
    console.log(`Original request URL: ${req.url}`);
    console.log(`Initial target URL: ${targetUrl}`);

    // Always try to decode the URL first, in case it's been URL encoded
    try {
      const decodedUrl = decodeURIComponent(targetUrl);
      if (decodedUrl !== targetUrl) {
        console.log(`Successfully decoded URL: ${decodedUrl}`);
        targetUrl = decodedUrl;
      }
    } catch (e) {
      console.log(`URL decoding failed, will use as-is: ${e.message}`);
    }

    // Handle case when URL might be double-encoded (from certain clients)
    if (
      targetUrl.startsWith("http%3A%2F%2F") ||
      targetUrl.startsWith("https%3A%2F%2F")
    ) {
      try {
        targetUrl = decodeURIComponent(targetUrl);
        console.log(`Decoded URL from percent encoding: ${targetUrl}`);
      } catch (e) {
        console.log(`Secondary URL decoding failed: ${e.message}`);
      }
    }

    // Fix missing protocols (no http:// or https://)
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

    // Ensure the URL has a protocol now
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      console.log(`Invalid URL (no protocol): ${targetUrl}`);
      return res.status(400).json({
        error: "Invalid URL. URL must start with http:// or https://",
        receivedUrl: targetUrl,
      });
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
      });
    }

    console.log(`Proxying request to: ${targetUrl}`);

    // Check if this is a Thai government API
    const isThaiAPI = isThaiGovernmentAPI(targetUrl);
    if (isThaiAPI) {
      console.log(`Detected Thai government API, using special handling`);
    }

    try {
      // Set up headers for the request
      const headers = {
        // Forward these headers to the target server
        Accept: req.headers.accept || "application/json",
        "User-Agent": isThaiAPI
          ? "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
          : "API-Converter-Proxy/1.0",
        // Avoid forwarding the host header
        ...(req.headers.authorization && {
          Authorization: req.headers.authorization,
        }),
      };

      // Special handling for Thai government APIs
      if (isThaiAPI) {
        headers["Origin"] = new URL(targetUrl).origin;
        headers["Referer"] = targetUrl;
        headers["Accept-Language"] = "th-TH,th;q=0.9,en-US;q=0.8,en;q=0.7";
      }

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

      // Get content type to properly forward it
      const contentType =
        response.headers["content-type"] || "application/json";
      res.set("Content-Type", contentType);

      // Forward other important headers
      const headersToForward = ["cache-control", "expires", "date", "etag"];
      headersToForward.forEach((header) => {
        if (response.headers[header]) {
          res.set(header, response.headers[header]);
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
            return res.status(statusCode).json(jsonData);
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

      // Send error response
      res.status(statusCode).json({
        error: errorMessage,
        code: statusCode,
        url: targetUrl,
        isThaiAPI: isThaiAPI,
      });
    }
  } catch (error) {
    console.error("Unexpected error in proxy server:", error);
    res.status(500).json({
      error: "Internal proxy server error",
      message: error.message,
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`CORS Proxy Server listening at http://localhost:${port}`);
  console.log(`Usage: http://localhost:${port}/https://api-endpoint-url`);
});
