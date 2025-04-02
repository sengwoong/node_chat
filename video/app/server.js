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

// Route to serve the screen recording page
app.get('/', (req, res) => {
  res.sendFile(path.join(config.paths.recordedDir, 'recorded.html'));
});

// Register routes
app.use('/', videoRoutes);
app.use('/stream', streamRoutes);

// Serve recorded videos
app.use('/recordings', express.static(config.paths.recordedDir));

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