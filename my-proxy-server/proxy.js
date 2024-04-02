const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();

// Enable CORS for all routes
app.use(cors());

// Configure proxy middleware
const splunkProxy = createProxyMiddleware({
  target: 'http://127.0.0.1:8088', // Target host
  changeOrigin: true, // Needed for virtual hosted sites
  pathRewrite: {
    '^/splunk-proxy': '/services/collector/event', // Rewrite URL for the target
  },
  onProxyReq: (proxyReq, req) => {
    // Add the Splunk HEC token header to each proxied request
    proxyReq.setHeader('Authorization', 'Splunk 253ac52e-a6e4-42b0-a667-3484d6c0d9a1');
  },
});

// Use the proxy middleware for the specific path
app.use('/splunk-proxy', splunkProxy);

// Start the server
const port = 8081; // Use a different port than your client app
app.listen(port, () => {
  console.log(`Proxy server listening on port ${port}`);
});
