// Optimized api/spot.js with OpenAI GPT-4o-mini
const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const dotenv = require('dotenv');

dotenv.config();

if (!process.env.OPENAI_API_KEY) {
    console.error('OpenAI API key is missing. Please check your .env file.');
    process.exit(1);
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Enhanced cache with TTL and size limits
const cache = new Map();
const CACHE_DURATION = 45 * 60 * 1000; // 45 minutes
const MAX_CACHE_SIZE = 500;

// Input validation
function validateInputs(location, activityString) {
    if (!location || typeof location !== 'string' || location.trim().length === 0) {
        throw new Error('Location is required');
    }
    
    if (!activityString || typeof activityString !== 'string' || activityString.trim().length === 0) {
        throw new Error('Activity string is required');
    }
    
    if (location.length > 100) {
        throw new Error('Location name too long');
    }
    
    if (activityString.length > 200) {
        throw new Error('Activity string too long');
    }
    
    return {
        location: location.trim().replace(/[<>\"'&]/g, ''),
        activityString: activityString.trim().replace(/[<>\"'&]/g, '')
    };
}

// Validate spot response structure
function validateSpotResponse(data) {
    if (!Array.isArray(data)) {
        throw new Error('Response must be an array');
    }
    
    if (data.length === 0) {
        throw new Error('Response cannot be empty');
    }
    
    for (let i = 0; i < data.length; i++) {
        const item = data[i];
        
        // Ensure required fields exist
        if (!item.name || typeof item.name !== 'string') {
            item.name = i === 0 ? 'General Information' : `Location ${i}`;
        }
        
        if (!item.description || typeof item.description !== 'string') {
            item.description = 'No description available';
        }
        
        if (!Array.isArray(item.features)) {
            item.features = ['Information not available'];
        }
        
        // Ensure features are strings
        item.features = item.features.map(feature => 
            typeof feature === 'string' ? feature : 'Feature information'
        );
        
        // Set relevance if missing
        if (typeof item.relevance !== 'number') {
            item.relevance = i;
        }
    }
    
    return data;
}

// Cache management
function getCachedData(key) {
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    cache.delete(key);
    return null;
}

function setCachedData(key, data) {
    // Clean cache if it's getting too large
    if (cache.size >= MAX_CACHE_SIZE) {
        const oldestKeys = Array.from(cache.keys()).slice(0, 100);
        oldestKeys.forEach(k => cache.delete(k));
    }
    
    cache.set(key, {
        data,
        timestamp: Date.now()
    });
}

// Generate unique cache key
function generateCacheKey(location, activityString) {
    const normalized = `${location.toLowerCase()}-${activityString.toLowerCase()}`;
    return normalized.replace(/[^a-z0-9-]/g, ''); // Remove special chars
}

// Main spot generation function
async function spotFun(req, res) {
    const startTime = Date.now();
    
    try {
        // Validate inputs
        const { location, activityString } = validateInputs(
            req.query.location, 
            req.query.activityString
        );
        
        console.log(`Processing spots request: ${location} - ${activityString}`);
        
        // Check cache first
        const cacheKey = generateCacheKey(location, activityString);
        const cachedResult = getCachedData(cacheKey);
        
        if (cachedResult) {
            console.log(`Returning cached spots for: ${cacheKey}`);
            return res.json(cachedResult);
        }
        
        // Generate with OpenAI using structured output
        const prompt = `Find specific places in ${location} for ${activityString}.

Return a JSON array with this exact structure:

[
    {
        "relevance": 0,
        "name": "Notes on ${location}",
        "description": "General information about ${activityString} in ${location}. If ${location} isn't known for ${activityString}, explain what visitors should look for instead.",
        "features": ["General tip 1", "General tip 2", "General tip 3"]
    },
    {
        "relevance": 1,
        "name": "Specific Location 1",
        "description": "Why this place is good for ${activityString}",
        "features": ["Key feature 1", "Key feature 2", "Key feature 3"]
    },
    {
        "relevance": 2,
        "name": "Specific Location 2",
        "description": "Why this place is good for ${activityString}",
        "features": ["Key feature 1", "Key feature 2", "Key feature 3"]
    }
]

Include 3-5 specific locations total. Focus on real places if possible, or describe types of venues if specific names aren't certain. Return only valid JSON with no markdown formatting.`;

        console.time(`generate-spots-${cacheKey}`);
        
        // Retry logic with exponential backoff
        const maxRetries = 3;
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                console.log(`Spots attempt ${attempt} for ${location}`);
                
                const response = await openai.chat.completions.create({
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a travel expert. Return only valid JSON arrays with no markdown formatting or explanations.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    response_format: { type: 'json_object' },
                    temperature: 0.3,
                    max_tokens: 2000
                });
                
                const text = response.choices[0].message.content;
                // OpenAI's JSON mode sometimes wraps arrays in an object, so handle both cases
                let parsedObject;
                try {
                    parsedObject = JSON.parse(text);
                    // If it's wrapped in an object, extract the array
                    if (!Array.isArray(parsedObject) && typeof parsedObject === 'object') {
                        const keys = Object.keys(parsedObject);
                        if (keys.length === 1 && Array.isArray(parsedObject[keys[0]])) {
                            parsedObject = parsedObject[keys[0]];
                        }
                    }
                } catch (parseError) {
                    throw new Error(`Failed to parse JSON: ${text}`);
                }
                
                const validatedData = validateSpotResponse(parsedObject);
                
                console.timeEnd(`generate-spots-${cacheKey}`);
                console.log(`Successfully generated spots for ${location} (${Date.now() - startTime}ms)`);
                
                // Cache the successful result
                setCachedData(cacheKey, validatedData);
                
                return res.json(validatedData);
                
            } catch (error) {
                console.error(`Spots attempt ${attempt} failed:`, error.message);
                lastError = error;
                
                if (attempt < maxRetries) {
                    // Exponential backoff: 1s, 2s, 4s
                    await new Promise(resolve => 
                        setTimeout(resolve, Math.pow(2, attempt) * 1000)
                    );
                }
            }
        }
        
        console.timeEnd(`generate-spots-${cacheKey}`);
        throw lastError;
        
    } catch (error) {
        console.error('Spot generation error:', error);
        
        const errorResponse = {
            error: 'Failed to generate spots',
            message: error.message,
            location: req.query.location,
            activityString: req.query.activityString,
            timestamp: new Date().toISOString()
        };
        
        // Return appropriate status codes
        if (error.message.includes('required')) {
            return res.status(400).json(errorResponse);
        }
        
        return res.status(500).json(errorResponse);
    }
}

// Cache statistics endpoint (for debugging)
router.get('/cache-stats', (req, res) => {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;
    
    for (const [key, value] of cache.entries()) {
        if (now - value.timestamp < CACHE_DURATION) {
            validEntries++;
        } else {
            expiredEntries++;
        }
    }
    
    res.json({
        totalEntries: cache.size,
        validEntries,
        expiredEntries,
        cacheHitRate: req.app.locals.cacheHitRate || 0
    });
});

// Clear cache endpoint (for debugging)
router.post('/clear-cache', (req, res) => {
    cache.clear();
    res.json({ message: 'Cache cleared successfully' });
});

// Request timeout middleware
router.use((req, res, next) => {
    req.setTimeout(25000, () => {
        res.status(408).json({ error: 'Request timeout' });
    });
    next();
});

router.get('/', spotFun);
module.exports = router;