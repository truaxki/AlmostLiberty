const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const activityRoutes = require('./api/activity');
const spotRoutes = require('./api/spot');

app.use('/api/activity', activityRoutes);
app.use('/api/spot', spotRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

let locationCache = {};

// Load predefined location data
function loadPredefinedLocations() {
    const data = fs.readFileSync(path.join(__dirname, 'predefinedLocations.json'), 'utf-8');
    locationCache = JSON.parse(data);
}

// Call the function to load data
loadPredefinedLocations();

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

module.exports = { locationCache };
