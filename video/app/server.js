const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const config = require('./config/config');

// Import routes
const videoRoutes = require('./routes/videoRoutes');
const streamRoutes = require('./routes/streamRoutes');

const app = express();
const port = config.port;

// Enable CORS with more explicit configuration
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'], // Allow all methods
  allowedHeaders: ['Content-Type', 'Authorization', 'Range']
}));

// Add middleware to log all requests for debugging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Serve static files
app.use(express.static(config.paths.publicDir));

// Root route - redirect to a default user ID
app.get('/', (req, res) => {
  console.log('[server] Root route accessed, redirecting to /default');
  // Redirect to default user route
  res.redirect('/default');
});

// User-specific route to serve recorded HTML
app.get('/:userId', (req, res) => {
  const userId = req.params.userId;
  console.log(`[server] User route accessed: /${userId}`);
  
  // Make user directory if it doesn't exist
  const userDir = path.join(config.paths.recordedDir, userId);
  if (!fs.existsSync(userDir)) {
    console.log(`[server] Creating user directory: ${userDir}`);
    fs.mkdirSync(userDir, { recursive: true });
  }
  
  // Serve the HTML file
  res.sendFile(path.join(config.paths.recordedDir, 'recorded.html'));
});

// User-specific API routes
app.use('/:userId', (req, res, next) => {
  const userId = req.params.userId;
  console.log(`[server] API route middleware for user: ${userId}, URL: ${req.url}, originalUrl: ${req.originalUrl}`);
  console.log(`[server] Params before videoRoutes:`, req.params);
  
  // Make sure userId stays in params
  const originalParams = { ...req.params };
  
  // This prevents Express from overriding the params
  req.userIdFromPath = userId;
  
  next();
}, videoRoutes);

// User-specific stream routes
app.use('/:userId/stream', (req, res, next) => {
  const userId = req.params.userId;
  console.log(`[server] Stream route middleware for user: ${userId}, URL: ${req.url}, originalUrl: ${req.originalUrl}`);
  console.log(`[server] Params before streamRoutes:`, req.params);
  
  // Make sure userId stays in params
  const originalParams = { ...req.params };
  
  // This prevents Express from overriding the params
  req.userIdFromPath = userId;
  
  next();
}, streamRoutes);

// Serve user-specific recorded videos
app.use('/:userId/recordings', (req, res, next) => {
  const userId = req.params.userId;
  console.log(`[server] Serving recordings for user: ${userId}, URL: ${req.url}`);
  
  const userDir = path.join(config.paths.recordedDir, userId);
  
  // Check if user directory exists
  if (!fs.existsSync(userDir)) {
    console.log(`[server] Creating user recordings directory: ${userDir}`);
    fs.mkdirSync(userDir, { recursive: true });
  }
  
  express.static(userDir)(req, res, next);
});

// Handle 404 errors
app.use((req, res, next) => {
  console.log(`404 Not Found: ${req.method} ${req.url}`);
  res.status(404).send('Not Found');
});

// Handle server errors
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).send('Server Error');
});

app.listen(port, () => {
  console.log(`Screen recording server running at http://localhost:${port}`);
}); 