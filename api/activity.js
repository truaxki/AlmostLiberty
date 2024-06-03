const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const dotenv = require('dotenv');
dotenv.config();

if (!process.env.API_KEY) {
    console.error('API key is missing. Please check your .env file.');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.API_KEY);

async function activityFun(req, res) {
    const location = req.query.location;
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
                return res.json(parsedObject); // Return the parsed object as JSON response
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
