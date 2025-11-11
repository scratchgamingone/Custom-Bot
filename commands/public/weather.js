
import fetch from 'node-fetch';
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import dotenv from 'dotenv';
dotenv.config();

const WEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

// Helper function to get weather icon
const getWeatherIcon = (iconCode) => `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

// Helper function to convert Celsius to Fahrenheit
const celsiusToFahrenheit = (celsius) => (celsius * 9/5) + 32;

// Helper function to get a random valid US zip code
async function getRandomZipCode() {
    let attempts = 0;
    while (attempts < 10) {
        // Generate a random 5-digit zip code
        const randomZip = Math.floor(Math.random() * (99999 - 10000 + 1) + 10000).toString();
        try {
            const response = await fetch(`https://api.zippopotam.us/us/${randomZip}`);
            if (response.ok) {
                const data = await response.json();
                // Use the first place's name for more accurate weather query
                const placeName = data.places[0]['place name'];
                const stateAbbr = data.places[0]['state abbreviation'];
                return { zip: randomZip, location: `${placeName}, ${stateAbbr}` };
            }
        } catch (error) {
            // Ignore fetch errors and try again
        }
        attempts++;
    }
    return null; // Return null if we can't find a valid zip code
}

// New helper function to get location from IP
async function getLocationFromIP() {
    try {
        // We use a service that returns the caller's IP info.
        // In this case, it will be the bot server's IP.
        // For a more user-centric approach, a web-based OAuth flow would be needed,
        // which is beyond the scope of a simple bot command.
        // This will effectively show the weather for the bot's server location.
        const response = await fetch('http://ip-api.com/json/');
        if (!response.ok) return null;
        const data = await response.json();
        if (data.status === 'success' && data.zip) {
            return { zip: data.zip, location: `${data.city}, ${data.region}` };
        }
        return null;
    } catch (error) {
        console.error('Error fetching location from IP:', error);
        return null;
    }
}

export default {
    data: new SlashCommandBuilder()
        .setName('weather')
        .setDescription('Get weather information for a US location by zip code.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('current')
                .setDescription('Get the current weather.')
                .addStringOption(option =>
                    option.setName('zipcode')
                        .setDescription('The 5-digit US zip code (optional, random if not provided).')
                        .setRequired(false)
                        .setMinLength(5)
                        .setMaxLength(5)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('forecast')
                .setDescription('Get the 5-day weather forecast.')
                .addStringOption(option =>
                    option.setName('zipcode')
                        .setDescription('The 5-digit US zip code (optional, random if not provided).')
                        .setRequired(false)
                        .setMinLength(5)
                        .setMaxLength(5)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('local')
                .setDescription('Get the current weather for your estimated location (ephemeral).')),

    async execute(interaction) {
        if (!WEATHER_API_KEY) {
            return interaction.reply({ content: 'The weather API key is not configured. Please contact the bot owner.', ephemeral: true });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'local') {
            await interaction.deferReply({ ephemeral: true });
            const locationData = await getLocationFromIP();
            if (!locationData) {
                return interaction.editReply('Could not determine your location automatically. Please try using a zip code.');
            }
            const locationQuery = `${locationData.zip},us`;
            await handleCurrentWeather(interaction, locationQuery, ` for your estimated location: ${locationData.location}`, locationData.zip);
            return;
        }

        await interaction.deferReply();

        let zipCode = interaction.options.getString('zipcode');
        let locationQuery;
        let randomLocationInfo = '';

        try {
            if (!zipCode) {
                const randomZipData = await getRandomZipCode();
                if (!randomZipData) {
                    return interaction.editReply('Could not fetch a random location. Please try again.');
                }
                zipCode = randomZipData.zip;
                randomLocationInfo = ` for a random location: ${randomZipData.location}`;
            } else if (!/^\d{5}$/.test(zipCode)) {
                return interaction.editReply('Please provide a valid 5-digit US zip code.');
            }

            locationQuery = `${zipCode},us`;

            if (subcommand === 'current') {
                await handleCurrentWeather(interaction, locationQuery, randomLocationInfo, zipCode);
            } else if (subcommand === 'forecast') {
                await handleForecast(interaction, locationQuery, randomLocationInfo, zipCode);
            }
        } catch (error) {
            console.error('Error in weather command:', error);
            await interaction.editReply('An error occurred while fetching weather data. Please ensure the zip code is correct.');
        }
    },
};

async function handleCurrentWeather(interaction, locationQuery, randomLocationInfo, zipCode) {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?zip=${encodeURIComponent(locationQuery)}&appid=${WEATHER_API_KEY}&units=metric`);
    const data = await response.json();

    if (data.cod !== 200) {
        return interaction.editReply(`Could not find weather data for the provided zip code. Please check the number.`);
    }

    const tempC = data.main.temp;
    const feelsLikeC = data.main.feels_like;
    const tempF = celsiusToFahrenheit(tempC);
    const feelsLikeF = celsiusToFahrenheit(feelsLikeC);

    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`Current Weather in ${data.name} (${zipCode})${randomLocationInfo}`)
        .setDescription(data.weather[0].description.charAt(0).toUpperCase() + data.weather[0].description.slice(1))
        .setThumbnail(getWeatherIcon(data.weather[0].icon))
        .addFields(
            { name: 'Temperature', value: `${tempC.toFixed(1)}°C / ${tempF.toFixed(1)}°F`, inline: true },
            { name: 'Feels Like', value: `${feelsLikeC.toFixed(1)}°C / ${feelsLikeF.toFixed(1)}°F`, inline: true },
            { name: 'Humidity', value: `${data.main.humidity}%`, inline: true },
            { name: 'Wind Speed', value: `${data.wind.speed} m/s`, inline: true },
            { name: 'Pressure', value: `${data.main.pressure} hPa`, inline: true },
            { name: 'Visibility', value: `${data.visibility / 1000} km`, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: 'Powered by OpenWeatherMap' });

    await interaction.editReply({ embeds: [embed] });
}

async function handleForecast(interaction, locationQuery, randomLocationInfo, zipCode) {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?zip=${encodeURIComponent(locationQuery)}&appid=${WEATHER_API_KEY}&units=metric`);
    const data = await response.json();

    if (data.cod !== "200") {
        return interaction.editReply(`Could not find forecast data for the provided zip code. Please check the number.`);
    }

    // Group forecasts by day
    const dailyForecasts = {};
    data.list.forEach(forecast => {
        const date = new Date(forecast.dt * 1000).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
        if (!dailyForecasts[date]) {
            dailyForecasts[date] = [];
        }
        dailyForecasts[date].push(forecast);
    });

    const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`5-Day Weather Forecast for ${data.city.name} (${zipCode})${randomLocationInfo}`)
        .setTimestamp()
        .setFooter({ text: 'Powered by OpenWeatherMap' });

    // Create a field for each day's forecast summary
    Object.keys(dailyForecasts).slice(0, 5).forEach(date => {
        const dayForecasts = dailyForecasts[date];
        // Find min/max temps for the day
        const minTempC = Math.min(...dayForecasts.map(f => f.main.temp_min));
        const maxTempC = Math.max(...dayForecasts.map(f => f.main.temp_max));
        const minTempF = celsiusToFahrenheit(minTempC);
        const maxTempF = celsiusToFahrenheit(maxTempC);
        // Use the weather from around midday for the icon/description
        const middayForecast = dayForecasts.find(f => new Date(f.dt * 1000).getHours() >= 12) || dayForecasts[0];
        
        embed.addFields({
            name: date,
            value: `**${Math.round(maxTempC)}°C / ${Math.round(maxTempF)}°F** / ${Math.round(minTempC)}°C / ${Math.round(minTempF)}°F - ${middayForecast.weather[0].description}`
        });
    });

    await interaction.editReply({ embeds: [embed] });
}
