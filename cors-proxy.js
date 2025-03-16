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

// Main proxy endpoint - handles any URL passed after the domain
app.get("*", async (req, res) => {
  try {
    // Skip the initial slash to get the URL
    let targetUrl = req.url.slice(1);

    // Debug the received URL
    console.log(`Original request URL: ${req.url}`);
    console.log(`Initial target URL: ${targetUrl}`);

    // Handle case when URL might be double-encoded (from certain clients)
    if (
      targetUrl.startsWith("http%3A%2F%2F") ||
      targetUrl.startsWith("https%3A%2F%2F")
    ) {
      targetUrl = decodeURIComponent(targetUrl);
      console.log(`Decoded URL: ${targetUrl}`);
    }

    // Fix malformed protocol (https:/ instead of https://)
    if (targetUrl.match(/^https?:\/[^\/]/)) {
      targetUrl = targetUrl.replace(/^(https?):\/([^\/])/, "$1://$2");
      console.log(`Fixed malformed protocol: ${targetUrl}`);
    }

    // Ensure the URL has a protocol
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

    const response = await axios({
      url: targetUrl,
      method: req.method,
      headers: {
        // Forward these headers to the target server
        Accept: req.headers.accept || "application/json",
        "User-Agent": "API-Converter-Proxy/1.0",
        // Avoid forwarding the host header
        ...(req.headers.authorization && {
          Authorization: req.headers.authorization,
        }),
      },
      // Add a reasonable timeout
      timeout: 30000, // Increased to 30 seconds
      // Handle redirects
      maxRedirects: 5,
      // Forward query parameters
      params: req.query,
      // Handle response as arraybuffer to support any content type
      responseType: "arraybuffer",
    });

    // Get content type to properly forward it
    const contentType = response.headers["content-type"] || "application/json";
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
    const targetUrl = req.url.slice(1);

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
      errorMessage = "No response received from target server";
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
    });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`CORS Proxy Server listening at http://localhost:${port}`);
  console.log(`Usage: http://localhost:${port}/https://api-endpoint-url`);
});
