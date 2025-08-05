# Almost Liberty - Development Workflow

## 🚀 Getting Started

### Prerequisites
- Node.js (v14+ recommended)
- Google Gemini API key
- Text editor/IDE
- Git for version control

### Initial Setup
```bash
# Clone repository
git clone [repo-url]
cd AlmostLiberty

# Install dependencies
npm install

# Environment setup
cp .env.example .env  # Create if doesn't exist
# Add: API_KEY=your_gemini_api_key_here

# Start development server
node server.js
# Server running on http://localhost:3000
```

## 🔧 Development Environment

### File Structure Overview
```
AlmostLiberty/
├── server.js              # Main server entry point
├── package.json            # Dependencies and scripts
├── activities.json         # Predefined location data (9,438 lines)
├── vercel.json            # Deployment configuration
├── api/                   # Backend API routes
│   ├── activity.js        # Activity recommendation endpoint
│   ├── spot.js           # Spot discovery endpoint
│   └── LocalFunctions/   # Additional utilities
├── public/               # Frontend static files
│   ├── index.html        # Main UI
│   ├── script.js         # Frontend logic (304 lines)
│   ├── styles.css        # Styling
│   └── *.png            # Images (background, favicon)
└── memory/              # Documentation system
```

### Key Development Files
| File | Purpose | When to Edit |
|------|---------|--------------|
| `server.js` | Server config, routing | Adding new endpoints |
| `api/activity.js` | Activity logic | Changing recommendation logic |
| `api/spot.js` | Spot discovery logic | Modifying spot search |
| `public/script.js` | Frontend behavior | UI functionality changes |
| `public/styles.css` | Styling | Visual design updates |
| `activities.json` | Predefined data | Adding new cities |

## 📝 Coding Standards

### Backend (Node.js)
```javascript
// File structure
const express = require('express');
const router = express.Router();
// ... other imports

// Environment validation
if (!process.env.API_KEY) {
    console.error('API key is missing. Please check your .env file.');
    process.exit(1);
}

// Main function with proper error handling
async function functionName(req, res) {
    try {
        // Implementation
        console.log(`Log important actions`);
        return res.json(data);
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).send('User-friendly error message');
    }
}

// Export
router.get('/', functionName);
module.exports = router;
```

### Frontend (JavaScript)
```javascript
// Use async/await for API calls
async function fetchData() {
    try {
        const response = await fetch('/api/endpoint');
        const data = await response.json();
        // Handle data
    } catch (error) {
        console.error('Error:', error);
        // Show user-friendly error
    }
}

// Event listeners in DOMContentLoaded
document.addEventListener('DOMContentLoaded', function() {
    // Setup code here
});
```

### Error Handling Patterns
- Always use try-catch for async operations
- Log detailed errors to console
- Return user-friendly error messages
- Include timing for performance monitoring

## 🧪 Testing Approach

### Manual Testing Checklist
**Activity Endpoint**:
- [ ] Test predefined location (e.g., "New York")
- [ ] Test fictional location (e.g., "Narnia")
- [ ] Test case insensitive input ("new york")
- [ ] Test empty/invalid input
- [ ] Test special characters in location names

**Spot Endpoint**:
- [ ] Test with real location + activity
- [ ] Test with fictional location + activity
- [ ] Test caching (same request twice)
- [ ] Test different activity strings
- [ ] Test empty activity string

**Frontend**:
- [ ] "Spin the Globe" functionality
- [ ] Activity button generation
- [ ] Loading messages display
- [ ] Error handling display
- [ ] Responsive design on mobile

### Performance Testing
```bash
# Time API responses
curl -w "%{time_total}" "http://localhost:3000/api/activity?location=TestLocation"

# Check memory usage during development
node --inspect server.js
```

## 🔄 Common Development Tasks

### Adding New Predefined Location
1. Edit `activities.json`
2. Follow existing structure:
   ```json
   "Location Name": {
     "Category 1": ["activity1", "activity2"],
     "Category 2": ["activityA", "activityB"]
   }
   ```
3. Test with exact location name
4. Verify case-insensitive matching works

### Modifying AI Prompts
**Location**: `api/activity.js` or `api/spot.js`
**Pattern**:
```javascript
const prompt = `Your clear instructions here.
Format requirements:
- JSON structure
- Specific fields
- Example output
Location: ${userInput}`;
```

### Adding New Frontend Features
1. Update `public/index.html` for new UI elements
2. Add styling in `public/styles.css`
3. Implement logic in `public/script.js`
4. Test user interactions thoroughly

### Debugging AI Responses
```javascript
// Add detailed logging in API files
console.log('AI Response:', text);
console.log('Parsed Object:', parsedObject);

// Check for common parsing issues
- Fancy quotes: " " → " "
- Trailing commas: {...,} → {...}
- Missing quotes on keys
- Incomplete JSON blocks
```

## 🚀 Deployment Workflow

### Vercel Deployment
```bash
# Install Vercel CLI if needed
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Add: API_KEY = your_gemini_api_key
```

### Pre-deployment Checklist
- [ ] All environment variables configured
- [ ] Test API endpoints locally
- [ ] Verify frontend functionality
- [ ] Check console for errors
- [ ] Test with various input types
- [ ] Confirm responsive design

### Post-deployment Testing
- [ ] Test activity endpoint with real data
- [ ] Test spot endpoint with AI generation
- [ ] Verify environment variables work
- [ ] Check loading times
- [ ] Test error handling

## 🐛 Debugging Common Issues

### "API key is missing" Error
1. Check `.env` file exists in root directory
2. Verify `API_KEY=your_actual_key` (no spaces)
3. Restart server after adding environment variables

### AI Generation Errors
1. Check API key validity
2. Monitor console for detailed error messages
3. Verify internet connectivity
4. Check Gemini API service status

### JSON Parsing Failures
1. Log the raw AI response text
2. Check for malformed JSON structure
3. Verify regex extraction is working
4. Test sanitization functions

### Frontend Not Loading
1. Check console for JavaScript errors
2. Verify all file paths are correct
3. Test API endpoints independently
4. Check network tab for failed requests

## 📊 Performance Monitoring

### Key Metrics to Watch
- **Response Times**: Activity (<1ms predefined, 2-5s AI)
- **Cache Hit Rate**: Track in spot endpoint
- **Error Rates**: Monitor console logs
- **Memory Usage**: Check for cache growth

### Optimization Opportunities
- Implement persistent caching (Redis)
- Add request rate limiting
- Optimize AI prompt efficiency
- Compress large JSON responses

---
*Follow this workflow for consistent, maintainable development practices.*