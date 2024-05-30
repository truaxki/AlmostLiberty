// server.js
const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config(); // Load environment variables

const app = express();
const port = process.env.PORT || 3000; // Set the port from environment or default to 3000

app.use(express.json()); // Middleware to parse JSON bodies
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from the 'public' directory

// Import your API routes
const activityRoutes = require('./api/activity');
const spotRoutes = require('./api/spot'); // Ensure correct path to spot.js

// Set up the API routes
app.use('/api/activity', activityRoutes); // Use the activity routes for /api/activity endpoint
app.use('/api/spot', spotRoutes); // Use the spot routes for /api/spot endpoint

// Serve the index.html file for the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
