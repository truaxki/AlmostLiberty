const express = require('express');
const router = express.Router();
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

// Use __dirname to construct the absolute path to the JSON file
const activitiesFilePath = path.join(__dirname, '../activities.json');

async function activityFun(req, res) {
    const location = req.query.location;
    
    // Attempt to read the activities.json file and parse its contents
    let activitiesData;
    try {
        const activitiesFile = fs.readFileSync(activitiesFilePath, 'utf8'); // Read the file
        activitiesData = JSON.parse(activitiesFile); // Parse JSON data
    } catch (error) {
        console.error('Error reading activities.json:', error);
        return res.status(500).send('Error reading predefined activities data');
    }

    if (activitiesData[location]) {
        console.log(`Returning predefined activities for location: ${location}`);
        return res.json(activitiesData[location]);
    }

    const prompt = `Generate a JSON object listing general activities the area is known for, with specific activities for each general activity. The JSON object should have the following structure:
    {"generalActivity1":["specificActivity1", "specificActivity2", ...],...}
    For example, if the area is known for outdoor sports, provide specific activities such as hiking, mountain biking, and rock climbing under that category. Please use the location: ${location}.`;

    console.time("generate-activities");
    try {
        console.log(`Received request for location: ${location}`);
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

router.get('/', activityFun);
module.exports = router;
