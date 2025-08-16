// Enhanced Weather App with Beautiful UI
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const locBtn = document.getElementById('locBtn');
const weatherDisplay = document.getElementById('weatherDisplay');
const currentTimeElement = document.getElementById('currentTime');
const suggestionsContainer = document.getElementById('suggestions');

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

// Function to fetch place suggestions
async function fetchPlaceSuggestions(query) {
    if (!query.trim()) {
        suggestionsContainer.innerHTML = '';
        suggestionsContainer.classList.remove('active');
        return;
    }

    try {
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en&format=json`);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            suggestionsContainer.innerHTML = '';
            data.results.forEach(place => {
                const div = document.createElement('div');
                div.className = 'suggestion-item';
                div.innerHTML = `
                    <div class="location-name">${place.name}</div>
                    <div class="location-details">${place.admin1 ? `${place.admin1}, ` : ''}${place.country}</div>
                `;
                div.addEventListener('click', () => {
                    cityInput.value = place.name;
                    suggestionsContainer.innerHTML = '';
                    suggestionsContainer.classList.remove('active');
                    fetchWeatherByCity(place.name);
                });
                suggestionsContainer.appendChild(div);
            });
            suggestionsContainer.classList.add('active');
        } else {
            suggestionsContainer.innerHTML = `
                <div class="suggestion-item">
                    <div class="location-name">No results found</div>
                </div>
            `;
            suggestionsContainer.classList.add('active');
        }
    } catch (error) {
        console.error('Error fetching suggestions:', error);
        suggestionsContainer.innerHTML = `
            <div class="suggestion-item">
                <div class="location-name">Error fetching suggestions</div>
            </div>
        `;
        suggestionsContainer.classList.add('active');
    }
}

// Add input event listener with debounce
cityInput.addEventListener('input', debounce((e) => {
    fetchPlaceSuggestions(e.target.value);
}, 300));

// Close suggestions when clicking outside
document.addEventListener('click', (e) => {
    if (!cityInput.contains(e.target) && !suggestionsContainer.contains(e.target)) {
        suggestionsContainer.classList.remove('active');
    }
});

// Weather condition mappings
const weatherCodes = {
  0: { desc: 'Clear sky', icon: '☀️' },
  1: { desc: 'Mainly clear', icon: '🌤️' },
  2: { desc: 'Partly cloudy', icon: '⛅' },
  3: { desc: 'Overcast', icon: '☁️' },
  45: { desc: 'Foggy', icon: '🌫️' },
  48: { desc: 'Depositing rime fog', icon: '🌫️' },
  51: { desc: 'Light drizzle', icon: '🌦️' },
  53: { desc: 'Moderate drizzle', icon: '🌦️' },
  55: { desc: 'Dense drizzle', icon: '🌧️' },
  56: { desc: 'Light freezing drizzle', icon: '🌨️' },
  57: { desc: 'Dense freezing drizzle', icon: '🌨️' },
  61: { desc: 'Slight rain', icon: '🌦️' },
  63: { desc: 'Moderate rain', icon: '🌧️' },
  65: { desc: 'Heavy rain', icon: '🌧️' },
  66: { desc: 'Light freezing rain', icon: '🌨️' },
  67: { desc: 'Heavy freezing rain', icon: '🌨️' },
  71: { desc: 'Slight snow fall', icon: '❄️' },
  73: { desc: 'Moderate snow fall', icon: '❄️' },
  75: { desc: 'Heavy snow fall', icon: '❄️' },
  77: { desc: 'Snow grains', icon: '❄️' },
  80: { desc: 'Slight rain showers', icon: '🌦️' },
  81: { desc: 'Moderate rain showers', icon: '🌧️' },
  82: { desc: 'Violent rain showers', icon: '⛈️' },
  85: { desc: 'Slight snow showers', icon: '🌨️' },
  86: { desc: 'Heavy snow showers', icon: '🌨️' },
  95: { desc: 'Thunderstorm', icon: '⛈️' },
  96: { desc: 'Thunderstorm with slight hail', icon: '⛈️' },
  99: { desc: 'Thunderstorm with heavy hail', icon: '⛈️' }
};

// Wind speed to Beaufort scale
function getBeaufortScale(windSpeed) {
  const scales = [
    { min: 0, max: 1, desc: 'Calm', icon: '🌀' },
    { min: 1, max: 5, desc: 'Light air', icon: '🌀' },
    { min: 6, max: 11, desc: 'Gentle breeze', icon: '🌬️' },
    { min: 12, max: 19, desc: 'Moderate breeze', icon: '🌬️' },
    { min: 20, max: 28, desc: 'Fresh breeze', icon: '🌬️' },
    { min: 29, max: 38, desc: 'Strong breeze', icon: '💨' },
    { min: 39, max: 49, desc: 'High wind', icon: '💨' },
    { min: 50, max: 61, desc: 'Gale', icon: '💨' },
    { min: 62, max: 74, desc: 'Strong gale', icon: '🌪️' },
    { min: 75, max: 88, desc: 'Storm', icon: '🌪️' },
    { min: 89, max: 102, desc: 'Violent storm', icon: '🌪️' },
    { min: 103, max: 200, desc: 'Hurricane', icon: '🌪️' }
  ];
  
  for (const scale of scales) {
    if (windSpeed >= scale.min && windSpeed <= scale.max) {
      return scale;
    }
  }
  return scales[scales.length - 1];
}

// Update current time
function updateCurrentTime() {
  const now = new Date();
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  currentTimeElement.textContent = now.toLocaleDateString('en-US', options);
}

// Initialize time and update every minute
updateCurrentTime();
setInterval(updateCurrentTime, 60000);

// Fetch weather by city name
async function fetchWeatherByCity(city) {
  if (!city.trim()) {
    alert('Please enter a city name');
    return;
  }
  
  try {
    const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`);
    const geoData = await geoResponse.json();
    
    if (!geoData.results || geoData.results.length === 0) {
      alert('City not found. Please check the spelling and try again.');
      return;
    }
    
    const { latitude, longitude, name, country, admin1 } = geoData.results[0];
    const locationLabel = admin1 ? `${name}, ${admin1}, ${country}` : `${name}, ${country}`;
    
    await fetchWeather(latitude, longitude, locationLabel);
  } catch (error) {
    console.error('Error fetching city data:', error);
    alert('Error finding city. Please try again.');
  }
}

// Fetch weather data
async function fetchWeather(lat, lon, locationLabel = 'Your Location') {
  weatherDisplay.innerHTML = '<div class="loading">Loading weather data...</div>';
  
  const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,weathercode,precipitation_probability,windspeed_10m,relative_humidity_2m,visibility,uv_index&daily=temperature_2m_max,temperature_2m_min,weathercode,precipitation_probability_max,windspeed_10m_max,sunrise,sunset,uv_index_max&timezone=auto&forecast_days=5`;
  
  try {
    const response = await fetch(apiUrl);
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.reason || 'Failed to fetch weather data');
    }
    
    displayWeather(data, locationLabel);
  } catch (error) {
    console.error('Error fetching weather data:', error);
    weatherDisplay.innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <h3>Unable to load weather data</h3>
        <p>Please check your internet connection and try again.</p>
      </div>
    `;
  }
}

// Display weather data
function displayWeather(data, locationLabel) {
  const current = data.current_weather;
  const hourly = data.hourly;
  const daily = data.daily;
  
  const weatherInfo = weatherCodes[current.weathercode] || { desc: 'Unknown', icon: '❓' };
  const windInfo = getBeaufortScale(current.windspeed);
  
  // Current weather display
  const currentHour = new Date().getHours();
  const currentHumidity = hourly.relative_humidity_2m[currentHour] || 'N/A';
  const currentVisibility = hourly.visibility[currentHour] || 'N/A';
  const currentUV = hourly.uv_index[currentHour] || 'N/A';
  
  // Sunrise and sunset times
  const sunrise = new Date(daily.sunrise[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const sunset = new Date(daily.sunset[0]).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  weatherDisplay.innerHTML = `
    <div class="weather-card">
      <div class="weather-header">
        <div class="location-info">
          <h2><i class="fas fa-map-marker-alt"></i> ${locationLabel}</h2>
          <p>Last updated: ${new Date(current.time).toLocaleTimeString()}</p>
        </div>
      </div>

      <div class="weather-main">
        <img src="https://open-meteo.com/images/weathericons/${current.weathercode}.svg" 
             alt="${weatherInfo.desc}" 
             class="weather-icon"
             onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
        <span class="weather-icon" style="display:none; font-size: 80px;">${weatherInfo.icon}</span>
        
        <div class="weather-temp">
          <div class="temperature">${Math.round(current.temperature)}°C</div>
          <div class="feels-like">Feels like ${Math.round(current.temperature)}°C</div>
          <div class="weather-desc">${weatherInfo.desc}</div>
        </div>
      </div>

      <div class="weather-summary">
        <i class="fas fa-info-circle"></i>
        Currently ${weatherInfo.desc.toLowerCase()} with ${windInfo.desc.toLowerCase()} winds at ${current.windspeed} km/h
      </div>

      <div class="weather-details">
        <div class="detail-item">
          <i class="fas fa-tint detail-icon" style="color: #06B6D4;"></i>
          <div class="detail-content">
            <div class="detail-label">Humidity</div>
            <div class="detail-value">${currentHumidity}${currentHumidity !== 'N/A' ? '%' : ''}</div>
          </div>
        </div>
        
        <div class="detail-item">
          <i class="fas fa-wind detail-icon" style="color: #8B5CF6;"></i>
          <div class="detail-content">
            <div class="detail-label">Wind Speed</div>
            <div class="detail-value">${current.windspeed} km/h</div>
          </div>
        </div>
        
        <div class="detail-item">
          <i class="fas fa-eye detail-icon" style="color: #10B981;"></i>
          <div class="detail-content">
            <div class="detail-label">Visibility</div>
            <div class="detail-value">${currentVisibility !== 'N/A' ? Math.round(currentVisibility/1000) + ' km' : 'N/A'}</div>
          </div>
        </div>
        
        <div class="detail-item">
          <i class="fas fa-sun detail-icon" style="color: #F59E0B;"></i>
          <div class="detail-content">
            <div class="detail-label">UV Index</div>
            <div class="detail-value">${currentUV !== 'N/A' ? Math.round(currentUV) : 'N/A'}</div>
          </div>
        </div>
        
        <div class="detail-item">
          <i class="fas fa-sunrise detail-icon" style="color: #EF4444;"></i>
          <div class="detail-content">
            <div class="detail-label">Sunrise</div>
            <div class="detail-value">${sunrise}</div>
          </div>
        </div>
        
        <div class="detail-item">
          <i class="fas fa-sunset detail-icon" style="color: #F59E0B;"></i>
          <div class="detail-content">
            <div class="detail-label">Sunset</div>
            <div class="detail-value">${sunset}</div>
          </div>
        </div>
      </div>

      <div class="forecast-section">
        <h3 class="forecast-title">
          <i class="fas fa-clock"></i>
          24-Hour Forecast
        </h3>
        <div class="forecast-container">
          ${generateHourlyForecast(hourly)}
        </div>
      </div>

      <div class="forecast-section">
        <h3 class="forecast-title">
          <i class="fas fa-calendar-alt"></i>
          5-Day Forecast
        </h3>
        <div class="forecast-container">
          ${generateDailyForecast(daily)}
        </div>
      </div>
    </div>
  `;
}

// Generate hourly forecast
function generateHourlyForecast(hourly) {
  const next24Hours = hourly.time.slice(0, 24);
  return next24Hours.map((time, index) => {
    const date = new Date(time);
    const weatherInfo = weatherCodes[hourly.weathercode[index]] || { desc: 'Unknown', icon: '❓' };
    const temp = Math.round(hourly.temperature_2m[index]);
    const precipChance = hourly.precipitation_probability[index] || 0;
    const windSpeed = Math.round(hourly.windspeed_10m[index]);
    
    return `
      <div class="forecast-item">
        <div class="forecast-time">${date.getHours()}:00</div>
        <img src="https://open-meteo.com/images/weathericons/${hourly.weathercode[index]}.svg" 
             alt="${weatherInfo.desc}" 
             class="forecast-icon"
             onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
        <span class="forecast-icon" style="display:none; font-size: 32px;">${weatherInfo.icon}</span>
        <div class="forecast-temp">${temp}°C</div>
        <div class="forecast-details">
          <div class="forecast-rain">
            <i class="fas fa-umbrella"></i> ${precipChance}%
          </div>
          <div class="forecast-wind">
            <i class="fas fa-wind"></i> ${windSpeed} km/h
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Generate daily forecast
function generateDailyForecast(daily) {
  return daily.time.slice(0, 5).map((time, index) => {
    const date = new Date(time);
    const weatherInfo = weatherCodes[daily.weathercode[index]] || { desc: 'Unknown', icon: '❓' };
    const tempMax = Math.round(daily.temperature_2m_max[index]);
    const tempMin = Math.round(daily.temperature_2m_min[index]);
    const precipChance = daily.precipitation_probability_max[index] || 0;
    const windSpeed = Math.round(daily.windspeed_10m_max[index]);
    
    const dayName = index === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
    
    return `
      <div class="daily-forecast-item">
        <div class="forecast-day">${dayName}</div>
        <img src="https://open-meteo.com/images/weathericons/${daily.weathercode[index]}.svg" 
             alt="${weatherInfo.desc}" 
             class="forecast-icon"
             onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
        <span class="forecast-icon" style="display:none; font-size: 32px;">${weatherInfo.icon}</span>
        <div class="daily-temps">
          <span class="temp-high">${tempMax}°</span>
          <span class="temp-low">${tempMin}°</span>
        </div>
        <div class="forecast-details">
          <div class="forecast-rain">
            <i class="fas fa-umbrella"></i> ${precipChance}%
          </div>
          <div class="forecast-wind">
            <i class="fas fa-wind"></i> ${windSpeed} km/h
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Event listeners
searchBtn.addEventListener('click', () => {
  const city = cityInput.value.trim();
  if (city) {
    fetchWeatherByCity(city);
  }
});

cityInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const city = cityInput.value.trim();
    if (city) {
      fetchWeatherByCity(city);
    }
  }
});

locBtn.addEventListener('click', () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchWeather(latitude, longitude);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Unable to get your location. Please enter a city name manually.');
      }
    );
  } else {
    alert('Geolocation is not supported by this browser.');
  }
});

// Initialize with a default city or user location
document.addEventListener('DOMContentLoaded', () => {
  // Try to get user's location on page load
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchWeather(latitude, longitude);
      },
      () => {
        // If geolocation fails, show welcome message
        console.log('Geolocation not available, showing welcome message');
      }
    );
  }
});
