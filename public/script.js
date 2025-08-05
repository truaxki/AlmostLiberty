// Optimized script.js with performance improvements
let userLocation = '';
let selectedActivities = new Set();
let loadingController = null; // For canceling requests
let requestCache = new Map(); // Client-side cache

// DOM elements cache
const domElements = {};

// Initialize DOM elements cache when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Cache frequently used DOM elements
    domElements.popup = document.getElementById('welcome-popup');
    domElements.close = document.getElementsByClassName('close')[0];
    domElements.locationInput = document.getElementById('activityLocation');
    domElements.activityInput = document.getElementById('activityString');
    domElements.generalButtons = document.getElementById('generalActivityButtons');
    domElements.specificButtons = document.getElementById('specificActivityButtons');
    domElements.activityOutput = document.getElementById('activityOutput');
    domElements.spotOutput = document.getElementById('spotOutput');
    domElements.loadingMessage = document.getElementById('loadingMessage');
    domElements.searchingMessage = document.getElementById('searchingMessage');
    domElements.searchingMessageText = document.getElementById('searchingMessageText');
    domElements.locationGroup = document.getElementById('locationGroup');
    domElements.activityGroup = document.getElementById('activityGroup');
    domElements.randomLocationButton = document.getElementById('randomLocationButton');

    initializeEventListeners();
    updatePlaceholder();
});

// Initialize all event listeners
function initializeEventListeners() {
    // Popup handlers
    setTimeout(() => domElements.popup.style.display = 'block', 1000);
    
    domElements.close.onclick = () => domElements.popup.style.display = 'none';
    
    window.onclick = (event) => {
        if (event.target === domElements.popup) {
            domElements.popup.style.display = 'none';
        }
    };

    // Input handlers with debouncing
    let locationTimeout;
    domElements.locationInput.addEventListener('input', debounce((e) => {
        const newLocation = e.target.value;
        if (newLocation && newLocation !== userLocation && newLocation.length > 2) {
            userLocation = newLocation;
            clearScreen();
            fetchActivityFun();
        }
    }, 500)); // 500ms debounce

    // Blur event for immediate search when user clicks away
    domElements.locationInput.addEventListener('blur', () => {
        const newLocation = domElements.locationInput.value;
        if (newLocation && newLocation !== userLocation) {
            userLocation = newLocation;
            clearScreen();
            fetchActivityFun();
        }
    });

    // Random location button
    domElements.randomLocationButton.addEventListener('click', handleRandomLocation);

    // Responsive placeholder update
    window.addEventListener('resize', debounce(updatePlaceholder, 250));
}

// Debounce function to limit API calls
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Optimized messages arrays
const messages = [
    "We recommend these activities for your destination. Feeling something else? Customize your search below.",
    "Check out these recommended activities for your trip. Want something different? Tailor your search below.",
    "These activities are popular at your destination. Want more options? Personalize your search below.",
    "Here are some top activities for your location. Have something specific in mind? Customize your search below.",
    "Discover these activities at your destination. Looking for something unique? Adjust your search below."
];

const loadingMessages = [
    "Searching for the best spots...",
    "Finding hidden gems...",
    "Discovering local favorites...",
    "Hunting for unique experiences...",
    "Uncovering adventure opportunities..."
];

// Optimized locations array (reduced for better performance)
const locations = [
    "New York", "London", "Paris", "Tokyo", "Sydney", "Cape Town", "Moscow",
    "Rio de Janeiro", "Toronto", "Dubai", "Bora Bora", "Marrakech", "Santorini",
    "Maldives", "Reykjavik", "Queenstown", "Petra", "Seychelles", "Buenos Aires",
    "Bali", "Bangkok", "Barcelona", "Rome", "Amsterdam", "Prague", "Vienna",
    "Istanbul", "Cairo", "Mumbai", "Singapore", "Hong Kong", "Seoul", "Kyoto",
    "Narnia", "Westeros", "Middle-earth", "Hogwarts", "Wakanda", "Asgard"
];

// Utility functions
function capitalizeWords(str) {
    return str.replace(/\b\w/g, char => char.toUpperCase());
}

function generateCacheKey(location, activity = '') {
    return `${location.toLowerCase()}-${activity.toLowerCase()}`.replace(/[^a-z0-9-]/g, '');
}

function getCachedData(key) {
    const cached = requestCache.get(key);
    if (cached && Date.now() - cached.timestamp < (15 * 60 * 1000)) { // 15 min cache
        return cached.data;
    }
    requestCache.delete(key);
    return null;
}

function setCachedData(key, data) {
    // Limit cache size
    if (requestCache.size > 50) {
        const firstKey = requestCache.keys().next().value;
        requestCache.delete(firstKey);
    }
    
    requestCache.set(key, {
        data,
        timestamp: Date.now()
    });
}

// Optimized random location handler
function handleRandomLocation() {
    const randomLocation = locations[Math.floor(Math.random() * locations.length)];
    domElements.locationInput.value = randomLocation;
    userLocation = randomLocation;
    clearScreen();
    fetchActivityFun();
}

// Optimized screen clearing
function clearScreen() {
    // Cancel any ongoing requests
    if (loadingController) {
        loadingController.abort();
        loadingController = null;
    }
    
    // Clear DOM efficiently
    const elementsToHide = [
        domElements.specificButtons,
        domElements.loadingMessage,
        domElements.searchingMessage
    ];
    
    elementsToHide.forEach(el => el.classList.add('hidden'));
    
    // Clear content
    domElements.generalButtons.innerHTML = '';
    domElements.specificButtons.innerHTML = '';
    domElements.activityOutput.innerHTML = '';
    domElements.spotOutput.innerHTML = '';
    domElements.activityInput.value = '';
    
    selectedActivities.clear();
}

// Optimized activity fetching with caching and error handling
async function fetchActivityFun() {
    const location = domElements.locationInput.value.trim();
    if (!location) {
        showError('Please enter a location before searching.');
        return;
    }

    const formattedLocation = capitalizeWords(location);
    const cacheKey = generateCacheKey(formattedLocation);
    
    // Check cache first
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
        console.log('Using cached activities for:', formattedLocation);
        displayGeneralActivityButtons(cachedData);
        return;
    }

    // Show loading state
    domElements.loadingMessage.innerText = `Searching activities for ${formattedLocation}...`;
    domElements.loadingMessage.classList.remove('hidden');

    // Create abort controller for request cancellation
    loadingController = new AbortController();
    const timeoutId = setTimeout(() => loadingController.abort(), 25000); // 25s timeout

    try {
        console.log('Fetching activities for:', formattedLocation);
        
        const response = await fetch(`/api/activity?location=${encodeURIComponent(formattedLocation)}`, {
            signal: loadingController.signal,
            headers: {
                'Content-Type': 'application/json',
            }
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Server error: ${response.status}`);
        }

        const data = await response.json();
        console.log('Received activities:', data);

        // Cache the successful response
        setCachedData(cacheKey, data);
        
        displayGeneralActivityButtons(data);
        
    } catch (error) {
        clearTimeout(timeoutId);
        console.error('Fetch error:', error);
        
        if (error.name === 'AbortError') {
            showError('Request was cancelled or timed out. Please try again.');
        } else {
            showError(`Failed to load activities: ${error.message}`);
        }
    } finally {
        domElements.loadingMessage.classList.add('hidden');
        loadingController = null;
    }
}

// Optimized spot fetching
async function fetchSpotFun() {
    const activityInput = domElements.activityInput.value;
    const combinedText = activityInput + (selectedActivities.size ? ' ; ' + Array.from(selectedActivities).join(' ; ') : '');
    
    if (!combinedText.trim()) {
        showError('Please select some activities or enter a custom search.');
        return;
    }

    console.log('Fetching spots for:', userLocation, combinedText);

    const cacheKey = generateCacheKey(userLocation, combinedText);
    const cachedData = getCachedData(cacheKey);
    
    if (cachedData) {
        console.log('Using cached spots');
        displaySpots(cachedData);
        return;
    }

    // Show loading state
    const randomLoadingMessage = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
    domElements.searchingMessageText.innerHTML = `${randomLoadingMessage}<br><br>Searching spots for ${userLocation}.`;

    // Hide main content, show loading
    domElements.locationGroup.classList.add('hidden');
    domElements.activityGroup.classList.add('hidden');
    domElements.searchingMessage.classList.remove('hidden');

    loadingController = new AbortController();
    const timeoutId = setTimeout(() => loadingController.abort(), 30000); // 30s timeout

    try {
        const response = await fetch(`/api/spot?location=${encodeURIComponent(userLocation)}&activityString=${encodeURIComponent(combinedText)}`, {
            signal: loadingController.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `Server error: ${response.status}`);
        }

        const data = await response.json();
        console.log('Received spots:', data);

        setCachedData(cacheKey, data);
        displaySpots(data);
        
    } catch (error) {
        clearTimeout(timeoutId);
        console.error('Spots fetch error:', error);
        
        if (error.name === 'AbortError') {
            showError('Request was cancelled or timed out. Please try again.');
        } else {
            showError(`Failed to load spots: ${error.message}`);
        }
    } finally {
        // Show main content, hide loading
        domElements.searchingMessage.classList.add('hidden');
        domElements.locationGroup.classList.remove('hidden');
        domElements.activityGroup.classList.remove('hidden');
        loadingController = null;
    }
}

// Optimized activity button display with staggered animation
function displayGeneralActivityButtons(jsonObject) {
    domElements.generalButtons.innerHTML = '';
    domElements.specificButtons.classList.add('hidden');

    const activities = Object.keys(jsonObject);
    const fragment = document.createDocumentFragment(); // Use document fragment for better performance
    
    activities.forEach((activity, index) => {
        const button = document.createElement('button');
        button.classList.add('activity-button');
        button.innerText = activity;
        button.onclick = () => {
            displaySpecificActivityButtons(jsonObject[activity]);
            toggleActivity(activity);
        };
        
        // Add staggered animation delay
        button.style.animationDelay = `${index * 100}ms`;
        fragment.appendChild(button);
    });
    
    domElements.generalButtons.appendChild(fragment);
    domElements.loadingMessage.classList.add('hidden');
    
    // Show random completion message
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    domElements.activityOutput.innerHTML = randomMessage;
}

// Optimized specific activity button display
function displaySpecificActivityButtons(activities) {
    const fragment = document.createDocumentFragment();
    
    activities.forEach(activity => {
        const button = document.createElement('button');
        button.classList.add('specific-activity-button');
        button.innerText = activity;
        button.onclick = () => toggleActivity(activity);
        fragment.appendChild(button);
    });
    
    domElements.specificButtons.innerHTML = '';
    domElements.specificButtons.appendChild(fragment);
    domElements.specificButtons.classList.remove('hidden');
}

// Optimized activity toggle
function toggleActivity(activity) {
    const button = Array.from(document.querySelectorAll('button')).find(btn => btn.innerText === activity);
    if (!button) return;
    
    if (selectedActivities.has(activity)) {
        selectedActivities.delete(activity);
        button.classList.remove('active');
    } else {
        selectedActivities.add(activity);
        button.classList.add('active');
    }
    
    updateActivityInput();
}

// Update activity input display
function updateActivityInput() {
    const activityText = domElements.activityInput.value;
    const selectedActivitiesText = Array.from(selectedActivities).join(' ; ');
    const combinedText = activityText + (selectedActivitiesText ? ' ; ' + selectedActivitiesText : '');
    console.log('Combined Text:', combinedText);
}

// Optimized spots display
function displaySpots(data) {
    const fragment = document.createDocumentFragment();
    
    data.forEach((spot, index) => {
        const spotDiv = document.createElement('div');
        
        if (index === 0) {
            spotDiv.classList.add('general-info');
            spotDiv.innerHTML = `
                <h3>About your search</h3>
                <p>${escapeHtml(spot.description)}</p>
            `;
        } else {
            spotDiv.innerHTML = `
                <h3>${escapeHtml(spot.name)}</h3>
                <p>${escapeHtml(spot.description)}</p>
                <ul>
                    ${spot.features.map(feature => `<li>${escapeHtml(feature)}</li>`).join('')}
                </ul>
            `;
        }
        
        fragment.appendChild(spotDiv);
    });
    
    domElements.spotOutput.innerHTML = '';
    domElements.spotOutput.appendChild(fragment);
}

// Error handling
function showError(message) {
    domElements.activityOutput.innerHTML = `
        <div style="color: #d32f2f; padding: 15px; background-color: #ffebee; border-radius: 8px; border-left: 4px solid #d32f2f;">
            <strong>Error:</strong> ${escapeHtml(message)}
        </div>
    `;
}

// Security: Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Responsive placeholder update
function updatePlaceholder() {
    if (window.innerWidth <= 768) {
        domElements.locationInput.placeholder = "Enter a location";
    } else {
        domElements.locationInput.placeholder = "Enter a location (real or fictional)";
    }
}

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    showError('An unexpected error occurred. Please refresh the page and try again.');
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (loadingController) {
        loadingController.abort();
    }
});