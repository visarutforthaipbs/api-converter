// Simple CORS proxy server
const corsAnywhere = require("cors-anywhere");

// Configure and start the server
const host = process.env.HOST || "0.0.0.0";
const port = process.env.PORT || 8080;

corsAnywhere
  .createServer({
    originWhitelist: [], // Allow all origins
    requireHeader: ["origin", "x-requested-with"],
    removeHeaders: ["cookie", "cookie2"],
  })
  .listen(port, host, () => {
    console.log(`CORS Anywhere proxy server running on ${host}:${port}`);
    console.log(
      `Example usage: http://localhost:${port}/https://api-example.com`
    );
  });
