
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

// Fetches location info (city, state) for a given ZIP code
async function getZipLocationInfo(zipcode) {
    const response = await fetch(`https://api.zippopotam.us/us/${zipcode}`);
    if (!response.ok) {
        return null; // Invalid or not found
    }
    const data = await response.json();
    return {
        city: data.places[0]['place name'],
        state: data.places[0]['state abbreviation']
    };
}

// Function to get a random valid US ZIP code and its location info
async function getRandomLocation() {
    const maxAttempts = 10; // Prevent an infinite loop
    for (let i = 0; i < maxAttempts; i++) {
        const randomZip = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
        const locationInfo = await getZipLocationInfo(randomZip);
        
        if (locationInfo) {
            return { zipcode: randomZip, ...locationInfo };
        }
    }
    throw new Error(`Failed to find a valid random ZIP code after ${maxAttempts} attempts.`);
}

export default {
    data: new SlashCommandBuilder()
        .setName('weather')
        .setDescription('Get the current weather for a specified US ZIP code.')
        .addStringOption(option =>
            option.setName('zipcode')
                .setDescription('The 5-digit US ZIP code (optional, random if not provided).')
                .setRequired(false)),

    async execute(interaction) {
        if (!OPENWEATHER_API_KEY) {
            console.error('OpenWeatherMap API key is missing.');
            return interaction.reply({ content: 'The weather command is not configured correctly. An API key is missing.', ephemeral: true });
        }

        await interaction.deferReply();

        let zipcode = interaction.options.getString('zipcode');
        let locationInfo;
        const zipCodePattern = /^\d{5}$/;
        let isRandom = false;

        try {
            if (zipcode && zipCodePattern.test(zipcode)) {
                locationInfo = await getZipLocationInfo(zipcode);
                if (!locationInfo) {
                    return interaction.editReply(`The provided ZIP code "${zipcode}" is not a valid US ZIP code. Please try again.`);
                }
                locationInfo.zipcode = zipcode;
            } else {
                locationInfo = await getRandomLocation();
                isRandom = true;
            }
        } catch (error) {
            console.error('Error getting location info:', error);
            return interaction.editReply('Could not fetch location data at the moment. Please try again later.');
        }

        const url = `https://api.openweathermap.org/data/2.5/weather?zip=${locationInfo.zipcode},us&appid=${OPENWEATHER_API_KEY}&units=metric`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.cod !== 200) {
                return interaction.editReply(`Could not find weather data for ZIP code "${locationInfo.zipcode}". Please check the code and try again.`);
            }

            // Function to convert UTC timestamp and timezone offset to local time string
            const toLocalTime = (timestamp, timezoneOffset) => {
                const date = new Date((timestamp + timezoneOffset) * 1000);
                return date.toLocaleTimeString('en-US', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', hour12: true });
            };

            const description = isRandom 
                ? `Showing weather for a random location.`
                : `Current conditions for ZIP code: ${locationInfo.zipcode}`;

            const weatherEmbed = new EmbedBuilder()
                .setColor('#3498DB')
                .setTitle(`Weather in ${locationInfo.city}, ${locationInfo.state}`)
                .setDescription(description)
                .setThumbnail(`https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`)
                .addFields(
                    { name: 'Condition', value: data.weather[0].description, inline: true },
                    { name: 'Temperature', value: `${data.main.temp}°C`, inline: true },
                    { name: 'Feels Like', value: `${data.main.feels_like}°C`, inline: true },
                    { name: 'Humidity', value: `${data.main.humidity}%`, inline: true },
                    { name: 'Wind Speed', value: `${data.wind.speed} m/s`, inline: true },
                    { name: 'Pressure', value: `${data.main.pressure} hPa`, inline: true },
                    { name: 'Visibility', value: `${(data.visibility / 1000).toFixed(1)} km`, inline: true },
                    { name: 'Sunrise', value: toLocalTime(data.sys.sunrise, data.timezone), inline: true },
                    { name: 'Sunset', value: toLocalTime(data.sys.sunset, data.timezone), inline: true }
                )
                .setTimestamp()
                .setFooter({ text: 'Powered by OpenWeatherMap' });

            await interaction.editReply({ embeds: [weatherEmbed] });

        } catch (error) {
            console.error('Error in weather command:', error);
            await interaction.editReply('An error occurred while fetching weather information. Please try again later.');
        }
    }
};
