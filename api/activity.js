// api/activity.js
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















// // The purpose of this module is to handle the pre-load of activities.
// // input: user location
// // output: activities as object with key value pairs
// // {
// //     "generalActivity1": ["specificActivity1", "specificActivity2", ...],
// //     "generalActivity2": ["specificActivity1", "specificActivity2", ...],
// //     ...
// // }

// // server setup
//     const express = require('express');
//     const router = express.Router();

// // Gemini library import statement
// const { GoogleGenerativeAI } = require('@google/generative-ai');

// // Use dotenv to secure API key
// const dotenv = require('dotenv'); 
// dotenv.config(); // Ensure dotenv is configured correctly

// // Ensure the API key is loaded from the environment variable
// if (!process.env.API_KEY) {
//     console.error('API key is missing. Please check your .env file.');
//     process.exit(1);
// }

// // Initializes an instance of GoogleGenerativeAI using an API key stored in an environment variable process.env.API_KEY. This instance is stored in the genAI variable.
// const genAI = new GoogleGenerativeAI(process.env.API_KEY);

// // Asynchronous function to generate activities
// async function activityFun(location) {
//     console.log(location,process.env.API_KEY)
//     // Use the default prompt template
//     const prompt = `Generate a JSON object listing general activities the area is known for, with specific activities for each general activity. The JSON object should have the following structure:
//     {"generalActivity1":["specificActivity1", "specificActivity2", ...],...}
//     For example, if the area is known for outdoor sports, provide specific activities such as hiking, mountain biking, and rock climbing under that category. Please use the location: ${location}.`;

//     // Start the timer
//     console.time("generate-activities");

//     // 'try' is the beginning of error handling
//     try {
//             // Selects the specific Model from the genAI instance.
//             const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

//             // Send prompt to model.
//             const result = await model.generateContent(prompt);

//             // Alternate prompt to convert to text stream.
//             // const result = await model.generateContentStream(prompt); // src: streaming section of Google AI for dev

//             // Await response from model.
//             const response = await result.response;

//             // Get the response text
//             const text = await response.text();

//             // Extract JSON object using regex and parse
//             const match = text.match(/```json([\s\S]*?)```/);
//             if (match) {
//                 try {
//                     const parsedObject = JSON.parse(match[1].trim());

//                     // End the timer and log the duration
//                     console.timeEnd("generate-activities");

//                     // Return the parsed object
//                         // NOTE: single word general activities are being parced without quotes. Not sure if this will be a problem. 
//                         console.log('Returning parsed object:', parsedObject);
//                         return res.json(parsedObject);
//                 } catch (finalParseError) {
//                     console.error('Final parsing error:', finalParseError);
//                     console.timeEnd("generate-activities");
//                     return res.status(500).send(`Parsing failure, string = ${text}`);
//                 }
//             } else {
//                 console.timeEnd("generate-activities");
//                 return res.status(500).send(`Parsing failure, string = ${text}`);
//             }
//         } catch (error) {
//             // Error handling
//             console.error('Error:', error);
//             // End the timer in case of error
//             console.timeEnd("generate-activities");
//             return res.status(500).send('Error generating activities');
// // throw new Error('Error generating activities');
//     }
// }

// // // Export the activityFun function for use in other modules {for local}
// // module.exports = { activityFun };

// //
// router.get('/', activityFun);
// module.exports = router;