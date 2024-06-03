const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let locationCache = {};

// Load predefined location data
function loadPredefinedLocations() {
    try {
        const data = fs.readFileSync(path.join(__dirname, 'predefinedLocations.json'), 'utf-8');
        if (data) {
            locationCache = JSON.parse(data);
            console.log('Predefined locations loaded successfully.');
        } else {
            console.warn('Predefined locations file is empty.');
        }
    } catch (error) {
        console.error('Error loading predefined locations:', error);
    }
}

// Call the function to load data
loadPredefinedLocations();

const activityRoutes = require('./api/activity')(locationCache);
const spotRoutes = require('./api/spot');

app.use('/api/activity', activityRoutes);
app.use('/api/spot', spotRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

module.exports = { locationCache };
