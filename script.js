// API key
const API_KEY = "e979b1af09b39d52bff8cbdc7d505393";

// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const recentCities = document.getElementById('recentCities');

const currentWeather = document.getElementById('currentWeather');
const currentCity = document.getElementById('currentCity');
const tempEl = document.getElementById('temp');
const descriptionEl = document.getElementById('description');
const humidityEl = document.getElementById('humidity');
const windEl = document.getElementById('wind');
const weatherIcon = document.getElementById('weatherIcon');
const toggleUnitBtn = document.getElementById('toggleUnit');

const forecastEl = document.getElementById('forecast');
const errorMsg = document.getElementById('errorMsg');

let isCelsius = true;
let currentTempC = 0;

// Load recent cities from localStorage
let recentCitiesArr = JSON.parse(localStorage.getItem('recentCities')) || [];
updateRecentCitiesDropdown();

// Event Listeners
searchBtn.addEventListener('click', () => {
  const city = cityInput.value.trim();
  if (city) fetchWeatherByCity(city);
  else showError("Please enter a city name.");
});

locationBtn.addEventListener("click", () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(position => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      getCityFromCoords(lat, lon);     
      getWeatherByCoords(lat, lon);   
    });
  } else {
    alert("Geolocation is not supported by this browser.");
  }
});

const recentCitiesDropdown = document.getElementById("recentCities");

recentCitiesDropdown.addEventListener("change", function () {
  const selectedCity = this.value;

  if (selectedCity) {
    cityInput.value = selectedCity;
    fetchWeatherByCity(selectedCity);
  }
});




function getCityFromCoords(lat, lon) {
  const url = `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=e979b1af09b39d52bff8cbdc7d505393`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      if (data.length > 0) {
        const city = data[0].name;
        cityInput.value = city;   
      }
    })
    .catch(err => console.error("Location city error:", err));
}

recentCities.addEventListener('change', () => {
  const city = recentCities.value;
  if (city) fetchWeatherByCity(city);
});

toggleUnitBtn.addEventListener('click', () => {
  if (isCelsius) {
    tempEl.textContent = `Temperature: ${(currentTempC * 9/5 + 32).toFixed(1)}°F`;
    isCelsius = false;
  } else {
    tempEl.textContent = `Temperature: ${currentTempC.toFixed(1)}°C`;
    isCelsius = true;
  }
});

// Fetch weather by city
async function fetchWeatherByCity(city) {
  try {
    clearError();
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`);
    if (!res.ok) throw new Error("City not found.");
    const data = await res.json();
    displayCurrentWeather(data);
    saveRecentCity(city);
    fetchForecast(city);
  } catch(err) {
    showError(err.message);
  }
}

function addCityToDropdown(city) {
  const option = document.createElement("option");
  option.value = city;
  option.textContent = city;
  recentCitiesDropdown.appendChild(option);
}

// Fetch weather by coordinates
async function fetchWeatherByCoords(lat, lon) {
  try {
    clearError();
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`);
    if (!res.ok) throw new Error("Weather data not found.");
    const data = await res.json();
    displayCurrentWeather(data);
    saveRecentCity(data.name);
    fetchForecast(data.name);
  } catch(err) {
    showError(err.message);
  }
}

// Display current weather
function displayCurrentWeather(data) {
  currentWeather.classList.remove('hidden');
  currentCity.textContent = `${data.name}, ${data.sys.country}`;
  currentTempC = data.main.temp;
  tempEl.textContent = `Temperature: ${currentTempC.toFixed(1)}°C`;
  descriptionEl.textContent = `Description: ${data.weather[0].description}`;
  humidityEl.textContent = `Humidity: ${data.main.humidity}%`;
  windEl.textContent = `Wind: ${data.wind.speed} m/s`;
  weatherIcon.src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;

  // Extreme temperature alert
  if (currentTempC > 40) {
    showError("⚠️ Extreme temperature! Stay hydrated.");
  }

}

// Display 5-day forecast
async function fetchForecast(city) {
  try {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}`);
    if (!res.ok) throw new Error("Forecast data not found.");
    const data = await res.json();

    // Display 5-day forecast at 12:00 each day
    const forecastList = data.list.filter(f => f.dt_txt.includes("12:00:00"));
    forecastEl.innerHTML = '';
    forecastList.forEach(f => {
      const card = document.createElement('div');
      card.className = "glass-card p-4 rounded shadow text-center";
      card.innerHTML = `
        <h3 class="font-bold">${new Date(f.dt_txt).toLocaleDateString()}</h3>
        <img src="https://openweathermap.org/img/wn/${f.weather[0].icon}@2x.png" alt="icon" class="mx-auto">
        <p>Temp: ${f.main.temp.toFixed(1)}°C</p>
        <p>Humidity: ${f.main.humidity}%</p>
        <p>Wind: ${f.wind.speed} m/s</p>
      `;
      forecastEl.appendChild(card);
    });
    forecastEl.classList.remove('hidden');
  } catch(err) {
    showError(err.message);
  }
}

// Save recent city
function saveRecentCity(city) {
  if (!recentCitiesArr.includes(city)) {
    recentCitiesArr.unshift(city);
    if (recentCitiesArr.length > 5) recentCitiesArr.pop(); // Keep max 5
    localStorage.setItem('recentCities', JSON.stringify(recentCitiesArr));
    updateRecentCitiesDropdown();
  }
}

// Update recent cities dropdown
function updateRecentCitiesDropdown() {
  // Always keep default placeholder option
  recentCities.innerHTML = `<option value="" selected disabled>Recently Searched Cities</option>`;

  recentCitiesArr.forEach(city => {
    const option = document.createElement("option");
    option.value = city;
    option.textContent = city;
    recentCities.appendChild(option);
  });
}


// Show error
function showError(msg) {
  errorMsg.textContent = msg;
}

// Clear error
function clearError() {
  errorMsg.textContent = '';
}

// Dynamic background based on weather condition
function getBackgroundForWeather(condition) {
  switch(condition.toLowerCase()) {
    case 'clear': return 'url(https://images.unsplash.com/photo-1501973801540-537f08ccae7d?auto=format&fit=crop&w=1950&q=80) no-repeat center/cover';
    case 'clouds': return 'url(https://images.unsplash.com/photo-1501630834273-4b5604d2ee31?auto=format&fit=crop&w=1950&q=80) no-repeat center/cover';
    case 'rain': return 'url(https://images.unsplash.com/photo-1501973801540-537f08ccae7d?auto=format&fit=crop&w=1950&q=80) no-repeat center/cover';
    case 'snow': return 'url(https://images.unsplash.com/photo-1604152135912-04a5a8abf0b3?auto=format&fit=crop&w=1950&q=80) no-repeat center/cover';
    default: return 'none';
  }
}

function updateDateTime() {
  const now = new Date();

  const date = now.toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const time = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  document.getElementById("dateTime").innerHTML = `${date} | ${time}`;
}

updateDateTime();

setInterval(updateDateTime, 1000);

