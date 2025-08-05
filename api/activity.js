// Temporary fix for Vercel sk-proj key issue
const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const dotenv = require('dotenv');

dotenv.config();

// TEMPORARY: Hardcode the full key to test if it's a Vercel environment variable issue
let apiKey = process.env.OPENAI_API_KEY;

// If the key is truncated (missing sk-proj-), reconstruct it
if (apiKey && apiKey.startsWith('xAfI6jh') && apiKey.endsWith('U0A')) {
    // Reconstruct the full key - replace this with your actual key temporarily
    apiKey = 'sk-proj-' + apiKey;
    console.log('Reconstructed truncated key');
}

if (!apiKey) {
    console.error('OpenAI API key is missing. Please check your environment variables.');
    console.error('Looking for: OPENAI_API_KEY');
    console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('OPENAI') || k.includes('API')));
    process.exit(1);
}

if (!apiKey.startsWith('sk-')) {
    console.error('OpenAI API key appears to be malformed. It should start with "sk-"');
    console.error('Current key starts with:', apiKey.substring(0, 10) + '...');
    console.error('Current key length:', apiKey.length);
    process.exit(1);
}

console.log('OpenAI API key loaded. Key starts with:', apiKey.substring(0, 15) + '...');
console.log('Key length:', apiKey.length);

const openai = new OpenAI({
    apiKey: apiKey,
});

// Rest of your code stays the same...
// (Include all the existing functions from your activity.js file)

// In-memory cache with expiration
const cache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Input validation and sanitization
function validateAndSanitizeInput(location) {
    if (!location || typeof location !== 'string') {
        throw new Error('Location is required and must be a string');
    }
    
    const sanitized = location.trim();
    if (sanitized.length === 0) {
        throw new Error('Location cannot be empty');
    }
    
    if (sanitized.length > 100) {
        throw new Error('Location name too long (max 100 characters)');
    }
    
    // Remove potentially harmful characters but keep international characters
    const cleaned = sanitized.replace(/[<>\"'&]/g, '');
    return cleaned;
}

// Validate activities response structure
function validateActivitiesResponse(data) {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('Response must be an object');
    }
    
    const keys = Object.keys(data);
    if (keys.length === 0) {
        throw new Error('Response must contain at least one activity category');
    }
    
    for (const [category, activities] of Object.entries(data)) {
        if (!Array.isArray(activities)) {
            throw new Error(`Category "${category}" must contain an array of activities`);
        }
        if (activities.length === 0) {
            throw new Error(`Category "${category}" cannot be empty`);
        }
        
        // Ensure all activities are strings
        for (let i = 0; i < activities.length; i++) {
            if (typeof activities[i] !== 'string' || activities[i].trim().length === 0) {
                activities[i] = `Activity ${i + 1}`; // Fallback
            }
        }
    }
    
    return data;
}

// Get cached or fresh activities data
function getCachedData(key) {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    cache.delete(key); // Remove expired cache
    return null;
}

// Set cache data
function setCachedData(key, data) {
    cache.set(key, {
        data,
        timestamp: Date.now()
    });
    
    // Clean up old cache entries periodically
    if (cache.size > 1000) {
        const now = Date.now();
        for (const [k, v] of cache.entries()) {
            if (now - v.timestamp > CACHE_DURATION) {
                cache.delete(k);
            }
        }
    }
}

// Main activity function with retry logic
async function activityFun(req, res) {
    const startTime = Date.now();
    
    try {
        // Input validation
        const userInput = validateAndSanitizeInput(req.query.location);
        console.log(`Processing request for location: ${userInput}`);
        
        // Check predefined activities first (from server cache)
        const activitiesData = req.app.locals.getActivitiesData();
        if (activitiesData) {
            const regex = new RegExp(`^${userInput.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i');
            const matchedLocation = Object.keys(activitiesData).find(location => regex.test(location));
            
            if (matchedLocation) {
                console.log(`Returning predefined activities for: ${matchedLocation}`);
                return res.json(activitiesData[matchedLocation]);
            }
        }
        
        // Check API cache
        const cacheKey = `activities_${userInput.toLowerCase()}`;
        const cachedResult = getCachedData(cacheKey);
        if (cachedResult) {
            console.log(`Returning cached activities for: ${userInput}`);
            return res.json(cachedResult);
        }
        
        // Generate with OpenAI using structured output
        const prompt = `Generate activities for ${userInput}. Return a JSON object where keys are activity categories and values are arrays of specific activities.

Categories should be logical like "Outdoor Activities", "Cultural Experiences", "Food & Drink", "Shopping", "Entertainment", etc.

Each category should have 3-6 specific activities that are actually available in ${userInput}.

Focus on what ${userInput} is actually known for. If it's a fictional place, be creative but consistent.

Return only valid JSON with no markdown formatting.`;

        console.time(`generate-activities-${userInput}`);
        
        // Retry logic
        const maxRetries = 3;
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Attempt ${attempt} for ${userInput}`);
                
                const response = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a travel expert. Return only valid JSON objects with no markdown formatting or explanations.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    response_format: { type: 'json_object' },
                    temperature: 0.7,
                    max_tokens: 1500
                });
                
                const text = response.choices[0].message.content;
                const parsedObject = JSON.parse(text);
                const validatedData = validateActivitiesResponse(parsedObject);
                
                console.timeEnd(`generate-activities-${userInput}`);
                console.log(`Successfully generated activities for ${userInput} (${Date.now() - startTime}ms)`);
                
                // Cache the result
                setCachedData(cacheKey, validatedData);
                
                return res.json(validatedData);
                
            } catch (error) {
                console.error(`Attempt ${attempt} failed for ${userInput}:`, error.message);
                lastError = error;
                
                if (attempt < maxRetries) {
                    // Exponential backoff
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
                }
            }
        }
        
        console.timeEnd(`generate-activities-${userInput}`);
        throw lastError;
        
    } catch (error) {
        console.error('Activity generation error:', error);
        
        const errorResponse = {
            error: 'Failed to generate activities',
            message: error.message,
            location: req.query.location,
            timestamp: new Date().toISOString()
        };
        
        // Different status codes for different error types
        if (error.message.includes('Location') && error.message.includes('required')) {
            return res.status(400).json(errorResponse);
        }
        
        return res.status(500).json(errorResponse);
    }
}

// Add request timeout middleware
router.use((req, res, next) => {
    req.setTimeout(25000, () => {
        res.status(408).json({ error: 'Request timeout' });
    });
    next();
});

router.get('/', activityFun);
module.exports = router;