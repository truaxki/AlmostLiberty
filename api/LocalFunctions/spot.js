// The purpose of this module is to handle .
// input: user location
// output: activities as object with key value pairs
// {
//     "generalActivity1": ["specificActivity1", "specificActivity2", ...],
//     "generalActivity2": ["specificActivity1", "specificActivity2", ...],
//     ...
// }

// server setup
const express = require('express');
const router = express.Router();

// Gemini library import statement
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Use dotenv to secure API key
const dotenv = require('dotenv'); 
dotenv.config(); // Ensure dotenv is configured correctly

// Ensure the API key is loaded from the environment variable
if (!process.env.API_KEY) {
    console.error('API key is missing. Please check your .env file.');
    process.exit(1);
}

// Initializes an instance of GoogleGenerativeAI using an API key stored in an environment variable process.env.API_KEY. This instance is stored in the genAI variable.
const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// Asynchronous function to generate activities
async function spotFun(location,activityString) {
    // Use the default prompt template
    const prompt = `Generate a JSON object listing:
    places the user should visit in ${location} that has ${activityString} 
    Return with following elements and data structure:
    [
        {
            "relevence": 0-x
            "name": "Notes on ${location}",
            "description": "The first object will contain any notes regarding this search. If the location is not known for ${activityString} return features the user should look for instead. ",
            "features": ["Feature 1a", "Feature 1b", "Feature 1c"]
        },
        {
            "relevence": 1-x
            "name": "Location 1",
            "description": "Description for Location 1",
            "features": ["Feature 1a", "Feature 1b", "Feature 1c"]
        },
        {
            "relevence": 2-x
            "name": "Location 2",
            "description": "Description for Location 2",
            "features": ["Feature 2a", "Feature 2b", "Feature 2c"]
        },
        ...
    ]
    `;
    // Start the timer
    console.time("generate-spots");

    // 'try' is the beginning of error handling
    try {
        // Selects the specific Model from the genAI instance.
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // Send prompt to model.
        const result = await model.generateContent(prompt);

        // Alternate prompt to convert to text stream.
        // const result = await model.generateContentStream(prompt); // src: streaming section of Google AI for dev
    // Await response from model.
        const response = await result.response;

    // Get the response text
        const text = await response.text();

    // Extract JSON object using regex and parse
        const match = text.match(/```json([\s\S]*?)```/);
if (match) {
    try {
        const parsedObject = JSON.parse(match[1].trim());

        // End the timer and log the duration
        console.timeEnd("generate-spots");

        // Return the parsed object
        return parsedObject;
    } catch (finalParseError) {
        console.error('Final parsing error:', finalParseError);
        return `Parsing failure, string = ${text}`;
    }
} else {
    return `Parsing failure, string = ${text}`;
}

} catch (error) {
// Error handling
console.error('Error:', error);
// End the timer in case of error
console.timeEnd("generate-spots");
throw new Error('Error generating activities');
}
}

// Export the spotFun function for use in other modules {for local}
module.exports = { spotFun };

