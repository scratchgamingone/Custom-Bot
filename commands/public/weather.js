
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import fetch from 'node-fetch';

const WEATHER_API_KEY = process.env.WEATHER_API_KEY;

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
            return { zip: data.zip, location: `${data.city}, ${data.region}`, countryCode: data.countryCode };
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
                        .setMaxLength(5))),

    async execute(interaction) {
        if (!WEATHER_API_KEY) {
            return interaction.reply({ content: 'The weather API key is not configured. Please contact the bot owner.', ephemeral: true });
        }

        await interaction.deferReply();

        const subcommand = interaction.options.getSubcommand();
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
    const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${locationQuery}&appid=${WEATHER_API_KEY}&units=imperial`);
    const data = await response.json();

    if (data.cod !== 200) {
        return interaction.editReply(`Could not find weather for zip code ${zipCode}.`);
    }

    const embed = new EmbedBuilder()
        .setColor('#3498DB')
        .setTitle(`Current Weather in ${data.name}${randomLocationInfo}`)
        .setDescription(`**${data.weather[0].main}**: ${data.weather[0].description}`)
        .addFields(
            { name: 'Temperature', value: `${data.main.temp}°F`, inline: true },
            { name: 'Feels Like', value: `${data.main.feels_like}°F`, inline: true },
            { name: 'Humidity', value: `${data.main.humidity}%`, inline: true },
            { name: 'Wind Speed', value: `${data.wind.speed} mph`, inline: true }
        )
        .setTimestamp()
        .setFooter({ text: `Weather data for ${zipCode}, US` });

    await interaction.editReply({ embeds: [embed] });
}

async function handleForecast(interaction, locationQuery, randomLocationInfo, zipCode) {
    const response = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${locationQuery}&appid=${WEATHER_API_KEY}&units=imperial`);
    const data = await response.json();

    if (data.cod !== "200") {
        return interaction.editReply(`Could not find a forecast for zip code ${zipCode}.`);
    }

    const embed = new EmbedBuilder()
        .setColor('#2ECC71')
        .setTitle(`5-Day Weather Forecast for ${data.city.name}${randomLocationInfo}`)
        .setDescription(`Forecast for the next 5 days, showing conditions at midday.`);

    const dailyForecasts = {};
    data.list.forEach(item => {
        const date = new Date(item.dt_txt).toLocaleDateString();
        if (!dailyForecasts[date] && item.dt_txt.includes("12:00:00")) {
            dailyForecasts[date] = item;
        }
    });

    Object.values(dailyForecasts).slice(0, 5).forEach(forecast => {
        embed.addFields({
            name: new Date(forecast.dt * 1000).toLocaleDateString('en-US', { weekday: 'long' }),
            value: `**${forecast.weather[0].main}**\nTemp: ${forecast.main.temp}°F\nWind: ${forecast.wind.speed} mph`,
            inline: true
        });
    });

    embed.setTimestamp().setFooter({ text: `Weather data for ${zipCode}, US` });
    await interaction.editReply({ embeds: [embed] });
}
