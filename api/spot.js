const express = require('express');
const router = express.Router();
const axios = require('axios'); // Added axios import
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
dotenv.config(); // Ensure dotenv is configured correctly

// In-memory cache object
const cache = {};

// Ensure the API key is loaded from the environment variable
if (!process.env.API_KEY) {
    console.error('API key is missing. Please check your .env file.');
    process.exit(1);
}

// Initializes an instance of GoogleGenerativeAI using an API key stored in an environment variable process.env.API_KEY.
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// Asynchronous function to generate spots
async function spotFun(req, res) {
    const { location, activityString } = req.query; // Extract location and activityString from the query parameters

    // Create a unique cache key based on location and activityString
    const cacheKey = `${location}-${activityString}`;

    // Check if the data for the location and activityString is in the cache
    if (cache[cacheKey]) {
        console.log(`Returning cached spots for location: ${location} and activityString: ${activityString}`);
        return res.json(cache[cacheKey]);
    }

    const prompt = `Generate a JSON object listing:
    places the user should visit in ${location} that has ${activityString} 
    Return with following elements and data structure:
    [
        {
            "relevance": 0-x
            "name": "Notes on ${location}",
            "description": "The first object will contain any notes regarding this search. If the location is not known for ${activityString} return features the user should look for instead. ",
            "features": ["Feature 1a", "Feature 1b", "Feature 1c"]
        },
        {
            "relevance": 1-x
            "name": "Location 1",
            "description": "Description for Location 1",
            "features": ["Feature 1a", "Feature 1b", "Feature 1c"]
        },
        {
            "relevance": 2-x
            "name": "Location 2",
            "description": "Description for Location 2",
            "features": ["Feature 2a", "Feature 2b", "Feature 2c"]
        },
        ...
    ]
    `;
    const timerLabel = `generate-spots-${Date.now()}`; // Unique label for each call
    console.time(timerLabel); // Start the timer for performance measurement

    try {
        console.log(`Received request for location: ${location}, activityString: ${activityString}`);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt); // Send prompt to model
        const response = await result.response; // Await response from model
        const text = await response.text(); // Get the response text

        // Extract JSON object using regex and parse
        const match = text.match(/```json([\s\S]*?)```/);
        if (match) {
            try {
                const parsedObject = JSON.parse(match[1].trim());
                console.timeEnd(timerLabel); // End the timer and log the duration
                console.log('Returning parsed object:', parsedObject);

                // Cache the generated spots
                cache[cacheKey] = parsedObject;
                return res.json(parsedObject); // Return the parsed object as JSON response
            } catch (finalParseError) {
                console.error('Final parsing error:', finalParseError);
                console.timeEnd(timerLabel);
                return res.status(500).send(`Parsing failure, string = ${text}`);
            }
        } else {
            console.timeEnd(timerLabel);
            return res.status(500).send(`Parsing failure, string = ${text}`);
        }
    } catch (error) {
        console.error('Error:', error);
        console.timeEnd(timerLabel); // End the timer in case of error
        return res.status(500).send('Error generating spots');
    }
}

// Define a GET route on the router to handle the spot function
router.get('/', spotFun);
module.exports = router; // Export the router for use in server.js
