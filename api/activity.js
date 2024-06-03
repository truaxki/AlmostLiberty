const express = require('express');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
dotenv.config();

if (!process.env.API_KEY) {
    console.error('API key is missing. Please check your .env file.');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// Utility function to check if cached data is expired
function isCacheExpired(cacheEntry, expirationTime) {
    const now = Date.now();
    return (now - cacheEntry.timestamp) > expirationTime;
}

module.exports = (locationCache, CACHE_EXPIRATION_TIME) => {
    const router = express.Router();

    async function activityFun(req, res) {
        const location = req.query.location.toLowerCase();  // Normalize the input location

        if (locationCache[location] && !isCacheExpired(locationCache[location], CACHE_EXPIRATION_TIME)) {
            console.log(`Cache hit: Using cached data for location: ${location}`);
            return res.json(locationCache[location].data);
        } else {
            if (locationCache[location]) {
                console.log(`Cache expired for location: ${location}. Fetching new data.`);
            } else {
                console.log(`Cache miss: No cached data for location: ${location}. Fetching new data.`);
            }

            const prompt = `Generate a JSON object listing general activities the area is known for, with specific activities for each general activity. The JSON object should have the following structure:
            {"generalActivity1":["specificActivity1", "specificActivity2", ...],...}
            For example, if the area is known for outdoor sports, provide specific activities such as hiking, mountain biking, and rock climbing under that category. Please use the location: ${location}.`;

            console.time("generate-activities");
            try {
                const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
                const result = await model.generateContent(prompt);
                const response = await result.response;
                const text = await response.text();

                const match = text.match(/```json([\s\S]*?)```/);
                if (match) {
                    try {
                        const parsedObject = JSON.parse(match[1].trim());
                        console.timeEnd("generate-activities");
                        console.log('Returning parsed object:', parsedObject);

                        // Add the new data to the cache
                        locationCache[location] = {
                            data: parsedObject,
                            timestamp: Date.now()
                        };
                        console.log(`New data for ${location} has been successfully stored in the cache.`);

                        return res.json(parsedObject);
                    } catch (finalParseError) {
                        console.error('Final parsing error:', finalParseError);
                        console.timeEnd("generate-activities");
                        return res.status(500).send(`Parsing failure, string = ${text}`);
                    }
                } else {
                    console.timeEnd("generate-activities");
                    return res.status(500).send(`Parsing failure, string = ${text}`);
                }
            } catch (error) {
                console.error('Error:', error);
                console.timeEnd("generate-activities");
                return res.status(500).send('Error generating activities');
            }
        }
    }

    router.get('/', activityFun);
    return router;
};
