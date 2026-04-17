const apiKey = "e77dff61819df4aa9636f0e2423dd5fb";
const fallbackCity = "Delhi";

function getWeather(lat, lon) {
    let url = "";
    if (lat !== null && lon !== null) {
        url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    } else {
        url = `https://api.openweathermap.org/data/2.5/weather?q=${fallbackCity}&appid=${apiKey}&units=metric`;
    }

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error("Invalid response or network error");
            }
            return response.json();
        })
        .then(data => {
            console.log("Weather API response:", data);
            document.getElementById("weather").innerHTML = `
<h2>${data.name}</h2>
<p>Temperature: ${data.main.temp} °C</p>
<p>Weather: ${data.weather[0].description}</p>
<p>Humidity: ${data.main.humidity}%</p>
<p>Wind Speed: ${data.wind.speed} m/s</p>
`;
        })
        .catch(error => {
            console.error("Weather error:", error);
            document.getElementById("weather").innerHTML = "Unable to fetch weather data";
        });
}

if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
        position => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            getWeather(lat, lon);
        },
        error => {
            console.error("Geolocation error:", error);
            getWeather(null, null); // Use fallback city
        }
    );
} else {
    getWeather(null, null); // Use fallback city
}