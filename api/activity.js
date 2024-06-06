const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
dotenv.config();

if (!process.env.API_KEY) {
    console.error('API key is missing. Please check your .env file.');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// Use __dirname to construct the absolute path to the JSON file
const activitiesFilePath = path.join(__dirname, '../activities.json');

async function activityFun(req, res) {
    const userInput = req.query.location;
    console.log(`Received request for location: ${userInput}`);

    // Attempt to read the activities.json file and parse its contents
    let activitiesData;
    try {
        const activitiesFile = fs.readFileSync(activitiesFilePath, 'utf8');
        activitiesData = JSON.parse(activitiesFile);
    } catch (error) {
        console.error('Error reading activities.json:', error);
        return res.status(500).send('Error reading predefined activities data');
    }

    // Case-insensitive matching of user input to the locations in activities.json
    const regex = new RegExp(`^${userInput}$`, 'i');
    const matchedLocation = Object.keys(activitiesData).find(location => regex.test(location));

    if (matchedLocation) {
        console.log(`Returning predefined activities for location: ${matchedLocation}`);
        return res.json(activitiesData[matchedLocation]);
    }

    const prompt = `Generate a JSON object listing general activities the area is known for, with specific activities for each general activity. The JSON object should have the following structure:
    {
      "generalActivity1": ["specificActivity1", "specificActivity2", ...],
      "generalActivity2": ["specificActivity1", "specificActivity2", ...],
      ...
    }
    Make sure to use proper JSON syntax, including commas between items and correct quotation marks. The location is: ${userInput}.`;

    console.time("generate-activities");
    try {
        console.log(`Sending request to generate activities for location: ${userInput}`);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = await response.text();

        const match = text.match(/```json([\s\S]*?)```/);
        if (match) {
            const sanitizedText = match[1].trim()
                .replace(/“|”/g, '"')  // Replace fancy quotes with standard quotes
                .replace(/,\s*}/g, '}') // Remove trailing commas before closing braces
                .replace(/,\s*]/g, ']'); // Remove trailing commas before closing brackets
            try {
                const parsedObject = JSON.parse(sanitizedText);
                console.timeEnd("generate-activities");
                console.log('Returning parsed object:', parsedObject);
                return res.json(parsedObject);
            } catch (finalParseError) {
                console.error('Final parsing error:', finalParseError);
                console.error('Invalid JSON:', sanitizedText);
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

router.get('/', activityFun);
module.exports = router;
