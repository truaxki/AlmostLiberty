// Import necessary modules
const express = require('express');
const morgan = require('morgan')
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

// Create an Express application ande define the port
const app = express();
const port = process.env.PORT || 3000;

// Set up logging
app.use(morgan('combined'));

// Parse incoming JSON data
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Import the activity and spot routes
const activityRoutes = require('./api/activity');
const spotRoutes = require('./api/spot');

// Define the API endpoints
app.use('/api/activity', activityRoutes);
app.use('/api/spot', spotRoutes);

// Serve the index.html file as the default route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server and listen on the specified port
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});