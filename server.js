// Optimized server.js with performance improvements
const express = require('express');
const morgan = require('morgan');
const path = require('path');
const dotenv = require('dotenv');
const compression = require('compression'); // Add compression middleware
const rateLimit = require('express-rate-limit'); // Add rate limiting

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Add compression middleware first for better response times
app.use(compression());

// Implement rate limiting to prevent abuse
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply rate limiting to API routes only
app.use('/api/', limiter);

// Optimize logging - use 'combined' only in production, 'dev' in development
const logFormat = process.env.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use(morgan(logFormat));

// Parse incoming JSON data with size limit
app.use(express.json({ limit: '10mb' }));

// Serve static files with caching headers
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: process.env.NODE_ENV === 'production' ? '1d' : '0', // Cache static files in production
    etag: true,
    lastModified: true
}));

// Cache activities.json in memory to avoid repeated file reads
let activitiesCache = null;
let activitiesCacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getActivitiesData() {
    const now = Date.now();
    if (!activitiesCache || (now - activitiesCacheTime) > CACHE_DURATION) {
        try {
            const fs = require('fs');
            const activitiesFile = fs.readFileSync(path.join(__dirname, 'activities.json'), 'utf8');
            activitiesCache = JSON.parse(activitiesFile);
            activitiesCacheTime = now;
            console.log('Activities cache refreshed');
        } catch (error) {
            console.error('Error reading activities.json:', error);
            return null;
        }
    }
    return activitiesCache;
}

// Make cached activities available to routes
app.locals.getActivitiesData = getActivitiesData;

// Import routes
const activityRoutes = require('./api/activity');
const spotRoutes = require('./api/spot');

// Define API endpoints
app.use('/api/activity', activityRoutes);
app.use('/api/spot', spotRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Serve index.html with proper caching
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'), {
        maxAge: process.env.NODE_ENV === 'production' ? '1h' : '0'
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((error, req, res, next) => {
    console.error('Global error handler:', error);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    process.exit(0);
});

// Start server
const server = app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Increase server timeout for AI requests
server.timeout = 30000; // 30 seconds

module.exports = app;