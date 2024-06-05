let userLocation = '';
let selectedActivities = new Set();

// Array of messages to display after fetching activities
const messages = [
    "We recommend these activities for your destination. Feeling something else? Customize your search below.",
    "Check out these recommended activities for your trip. Want something different? Tailor your search below.",
    "These activities are popular at your destination. Want more options? Personalize your search below.",
    "Here are some top activities for your location. Have something specific in mind? Customize your search below.",
    "Discover these activities at your destination. Looking for something unique? Adjust your search below.",
    "Explore these activities for your trip. Not what you're looking for? Modify your search below.",
    "Enjoy these suggested activities at your destination. Prefer something else? Refine your search below.",
    "These activities are must-try at your location. Have other preferences? Fine-tune your search below.",
    "We think you'll love these activities for your trip. Seeking different activities? Change your search below.",
    "Experience these activities at your destination. Want something specific? Customize your search below.",
    "Don't miss these activities at your location. Looking for more? Adjust your search below."
];

// Array of messages to display while fetching spots
const loadingMessages = [
    "Hacking into travel sites... almost there!",
    "Hijacking travel guides for you... please wait!",
    "Cracking the code of fun activities... just a moment!",
    "Breaking into the best travel databases... hold tight!",
    "Bypassing firewalls to find the best spots... hang in there!",
    "Decoding top-secret travel recommendations... one second!",
    "Infiltrating the web for awesome activities... hold on!",
    "Decrypting adventure secrets... almost done!",
    "Tapping into travel networks... stay tuned!",
    "Unlocking hidden travel gems... please wait!"
];

// Array of locations for "Spin the Globe"
const locations = [
    "New York", "London", "Paris", "Tokyo", "Sydney", "Cape Town", "Moscow", "Rio de Janeiro", "Toronto", "Dubai",
    "Bora Bora", "Marrakech", "Santorini", "Maldives", "Reykjavik", "Queenstown", "Petra", "Seychelles", 
    "Buenos Aires", "Fiji", "Havana", "Cusco", "Kathmandu", "Zanzibar", "Bali", "Phuket", "Machu Picchu", 
    "Madagascar", "Jaipur", "Galápagos Islands", "Dubrovnik", "Ulaanbaatar", "Svalbard", "Siem Reap", 
    "Vientiane", "Monte Carlo", "Havana", "Cairo", "Reykjavik", "Transylvania"
];

// Event listener for the Spin the Globe location button
document.getElementById('randomLocationButton').addEventListener('click', () => {
    const randomLocation = locations[Math.floor(Math.random() * locations.length)];
    document.getElementById('activityLocation').value = randomLocation;
    userLocation = randomLocation;
    clearScreen();
    fetchActivityFun();
});

// Event listener for the location input field. Blur is click out. 
document.getElementById('activityLocation').addEventListener('blur', () => {
    const newLocation = document.getElementById('activityLocation').value;
    if (newLocation && newLocation !== userLocation) {
        userLocation = newLocation;
        clearScreen();
        fetchActivityFun();
    }
});


function clearScreen() {
    document.getElementById('generalActivityButtons').innerHTML = '';
    document.getElementById('specificActivityButtons').innerHTML = '';
    document.getElementById('specificActivityButtons').classList.add('hidden');
    document.getElementById('activityOutput').innerHTML = '';
    document.getElementById('spotOutput').innerHTML = '';
    selectedActivities.clear();
    document.getElementById('activityString').value = '';
}

// Function to fetch activities based on user input location
async function fetchActivityFun() {
    const location = document.getElementById('activityLocation').value;
    const loadingMessage = document.getElementById('loadingMessage');
    if (!location) {
        alert('Please enter a location before searching.');
        return;
    }
    loadingMessage.innerText = `Searching activities for ${location}. Please wait.`;
    loadingMessage.classList.remove('hidden');

    console.log('Fetching activities for:', location);

    try {
        const response = await fetch(`/api/activity?location=${encodeURIComponent(location)}`);
        console.log('Fetch initiated...');
        console.log('Response status:', response.status);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        console.log('Received data:', data);
        displayGeneralActivityButtons(data);
    } catch (error) {
        console.error('Fetch error:', error);
        document.getElementById('activityOutput').innerHTML = `<pre>Error: ${error.message}</pre>`;
        loadingMessage.classList.add('hidden');
    }
}

async function fetchSpotFun() {
    const activityInput = document.getElementById('activityString').value;
    const combinedText = activityInput + (selectedActivities.size ? ' ; ' + Array.from(selectedActivities).join(' ; ') : '');
    console.log('Fetching spots for:', userLocation, combinedText);

    const randomLoadingMessage = loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
    document.getElementById('searchingMessageText').innerHTML = `${randomLoadingMessage}<br><br>Searching spots for ${userLocation}.`;

    document.getElementById('locationGroup').classList.add('hidden');
    document.getElementById('activityGroup').classList.add('hidden');
    document.getElementById('searchingMessage').classList.remove('hidden');

    try {
        const response = await fetch(`/api/spot?location=${encodeURIComponent(userLocation)}&activityString=${encodeURIComponent(combinedText)}`);
        console.log('Fetch initiated...');
        console.log('Response status:', response.status);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        console.log('Received data:', data);
        displaySpots(data);
        document.getElementById('searchingMessage').classList.add('hidden');
        document.getElementById('locationGroup').classList.remove('hidden');
        document.getElementById('activityGroup').classList.remove('hidden');
    } catch (error) {
        console.error('Fetch error:', error);
        document.getElementById('spotOutput').innerHTML = `<pre>Error: ${error.message}</pre>`;
    }
}

function displayGeneralActivityButtons(jsonObject) {
    const generalActivityButtonsDiv = document.getElementById('generalActivityButtons');
    generalActivityButtonsDiv.innerHTML = ''; // Clear previous buttons
    const specificActivityButtonsDiv = document.getElementById('specificActivityButtons');
    specificActivityButtonsDiv.classList.add('hidden'); // Hide specific activity buttons

    const activities = Object.keys(jsonObject);
    let index = 0;

    function displayNextActivity() {
        if (index >= activities.length) {
            document.getElementById('loadingMessage').classList.add('hidden');
            const randomMessage = messages[Math.floor(Math.random() * messages.length)];
            document.getElementById('activityOutput').innerHTML = randomMessage;
            return;
        }

        const activity = activities[index];
        const button = document.createElement('button');
        button.classList.add('activity-button');
        button.innerText = activity;
        button.onclick = () => {
            displaySpecificActivityButtons(jsonObject[activity]);
            toggleActivity(activity);
        };
        generalActivityButtonsDiv.appendChild(button);
        index++;

        setTimeout(displayNextActivity, Math.random() * 500 + 500); // Random delay between 0.5 and 1 second
    }

    displayNextActivity();
}

function displaySpecificActivityButtons(activities) {
    const specificActivityButtonsDiv = document.getElementById('specificActivityButtons');
    specificActivityButtonsDiv.innerHTML = ''; // Clear previous buttons
    activities.forEach(activity => {
        const button = document.createElement('button');
        button.classList.add('specific-activity-button');
        button.innerText = activity;
        button.onclick = () => toggleActivity(activity);
        specificActivityButtonsDiv.appendChild(button);
    });
    specificActivityButtonsDiv.classList.remove('hidden'); // Show specific activity buttons
}

function toggleActivity(activity) {
    const button = Array.from(document.querySelectorAll('button')).find(btn => btn.innerText === activity);
    if (selectedActivities.has(activity)) {
        selectedActivities.delete(activity);
        button.classList.remove('active');
    } else {
        selectedActivities.add(activity);
        button.classList.add('active');
    }
    updateActivityInput();
}

function updateActivityInput() {
    const activityInput = document.getElementById('activityString');
    const activityText = activityInput.value;
    const selectedActivitiesText = Array.from(selectedActivities).join(' ; ');
    const combinedText = activityText + (selectedActivitiesText ? ' ; ' + selectedActivitiesText : '');
    console.log('Combined Text:', combinedText);
}

function displaySpots(data) {
    const spotOutput = document.getElementById('spotOutput');
    spotOutput.innerHTML = ''; // Clear previous output
    data.forEach((spot, index) => {
        if (index === 0) {
            const generalInfoDiv = document.createElement('div');
            generalInfoDiv.classList.add('general-info');
            generalInfoDiv.innerHTML = `
                <h3>About your search</h3>
                <p>${spot.description}</p>
            `;
            spotOutput.appendChild(generalInfoDiv);
        } else {
            const spotDiv = document.createElement('div');
            spotDiv.innerHTML = `
                <h3>${spot.name}</h3>
                <p>${spot.description}</p>
                <ul>
                    ${spot.features.map(feature => `<li>${feature}</li>`).join('')}
                </ul>
            `;
            spotOutput.appendChild(spotDiv);
        }
    });
}

/* Add this code to dynamically change the placeholder text based on screen size */
document.addEventListener('DOMContentLoaded', () => {
    const activityLocationInput = document.getElementById('activityLocation');
    
    function updatePlaceholder() {
        if (window.innerWidth <= 768) {
            activityLocationInput.placeholder = "Enter a location";
        } else {
            activityLocationInput.placeholder = "Enter a location (real or fictional)";
        }
    }
    
    window.addEventListener('resize', updatePlaceholder);
    updatePlaceholder(); // Initial call to set the placeholder based on the current screen size
});
