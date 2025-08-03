const search = document.querySelector('.search-box button');
const cityInput = document.querySelector('.search-box input');
const weatherIcon = document.querySelector('.weather-icon');
const suggestionsBox = document.createElement('ul');
suggestionsBox.className = 'suggestions-list';
document.querySelector('.search-box').appendChild(suggestionsBox);

// Fetch and display weather based on lat, lon and label
async function fetchWeather(lat, lon, label = '') {
    try {
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weathercode,windspeed_10m&daily=temperature_2m_max,temperature_2m_min&timezone=auto`;
        const res = await fetch(weatherUrl);
        const data = await res.json();
        displayWeather(data, label);
    } catch (error) {
        console.error('Weather Fetch Error:', error);
    }
}

function displayWeather(data, label) {
    if (!data || !data.current) return;

    document.querySelector('.city').innerHTML = label || 'City';
    document.querySelector('.temp').innerHTML = Math.round(data.current.temperature_2m) + "°C";
    document.querySelector('.wind').innerHTML = data.current.windspeed_10m + " km/h";

    const code = data.current.weathercode;
    const iconMap = {
        0: 'clear.png',
        1: 'clouds.png',
        2: 'clouds.png',
        3: 'clouds.png',
        45: 'drizzle.png',
        48: 'drizzle.png',
        51: 'drizzle.png',
        53: 'drizzle.png',
        55: 'drizzle.png',
        61: 'rain.png',
        63: 'rain.png',
        65: 'rain.png',
        71: 'snow.png',
        73: 'snow.png',
        75: 'snow.png',
        80: 'rain.png',
        81: 'rain.png',
        82: 'rain.png'
    };
    weatherIcon.src = `images/${iconMap[code] || 'default.png'}`;
    document.querySelector('.weather').style.display = 'block';
}

// Autocomplete as user types
cityInput.addEventListener('input', async () => {
    const query = cityInput.value.trim();
    if (query.length < 2) {
        suggestionsBox.innerHTML = '';
        return;
    }

    try {
        const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5`);
        const data = await res.json();

        if (data.results && data.results.length > 0) {
            suggestionsBox.innerHTML = data.results.map(place => {
                const label = `${place.name}${place.admin1 ? ', ' + place.admin1 : ''}, ${place.country}`;
                return `<li data-lat="${place.latitude}" data-lon="${place.longitude}" data-label="${label}">${label}</li>`;
            }).join('');
        } else {
            suggestionsBox.innerHTML = `<li disabled>No suggestions found</li>`;
        }
    } catch (error) {
        console.error('Autocomplete Error:', error);
    }
});

// Click on suggestion
suggestionsBox.addEventListener('click', (e) => {
    if (e.target.tagName === 'LI') {
        const label = e.target.getAttribute('data-label');
        const lat = e.target.getAttribute('data-lat');
        const lon = e.target.getAttribute('data-lon');

        cityInput.value = label;
        suggestionsBox.innerHTML = '';
        fetchWeather(lat, lon, label);
    }
});

// Hide suggestions when clicking outside
document.addEventListener('click', (e) => {
    if (!cityInput.contains(e.target) && !suggestionsBox.contains(e.target)) {
        suggestionsBox.innerHTML = '';
    }
});

// Also support search on button click
search.addEventListener('click', async () => {
    const query = cityInput.value.trim();
    if (query === '') return;

    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1`);
    const data = await res.json();
    if (data.results && data.results.length > 0) {
        const place = data.results[0];
        const label = `${place.name}${place.admin1 ? ', ' + place.admin1 : ''}, ${place.country}`;
        fetchWeather(place.latitude, place.longitude, label);
    } else {
        alert('City not found');
    }
});
