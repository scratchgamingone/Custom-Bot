
# Discord Community Bot

Welcome to the Discord Community Bot! This is a versatile Discord bot built with Node.js and discord.js, designed to enhance community engagement with a variety of fun and utility commands.

## ✨ Features

-   **Fun Commands**: Get random jokes, animal pictures, and more.
-   **Utility Commands**: Look up definitions, weather forecasts, and Fortnite items.
-   **Slash Commands**: Modern and easy-to-use interface within Discord.
-   **Modular Command Handler**: Easily add new commands by dropping files into the respective category folders.
-   **Role-Based Access**: Commands are structured into `public`, `booster`, `admin`, and `owner` categories (though only public and booster are currently implemented).

---

## 🚀 Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) v18.0.0 or higher
-   A Discord Bot Token
-   API keys for external services (Weather, eBay, etc.)

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/Discord-Bot-main.git
    cd Discord-Bot-main
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure environment variables:**
    Create a file named `.env` in the root of the project and add the following variables.

    ```env
    # Discord Bot Token
    DISCORD_TOKEN=your_discord_bot_token_here

    # Bot and Server Configuration
    PREFIX=!
    CLIENT_ID=your_bot_client_id_here
    GUILD_ID=your_discord_server_id_here
    COMMAND_CHANNEL_ID=your_channel_id_for_commands
    OWNER_ID=your_discord_user_id

    # Role IDs (optional)
    BYPASS_ROLE_IDS=role_id_1,role_id_2
    BOOSTER_ROLE_ID=your_server_booster_role_id
    ADMIN_ROLE_ID=your_admin_role_id

    # API Keys
    WEATHER_API_KEY=your_openweathermap_api_key
    EBAY_APP_ID=your_ebay_app_id
    ```

4.  **Run the bot:**
    -   For development (with automatic restarts):
        ```bash
        npm run dev
        ```
    -   For production:
        ```bash
        npm start
        ```

---

## 🤖 Available Commands

Here is a list of the currently available slash commands.

### Public Commands (`/`)

-   `/fun joke`: Get a random joke.
-   `/fun cat`: Get a random cat picture and fact.
-   `/fun dog`: Get a random dog picture.
-   `/fortniteitem`: Get a random Fortnite cosmetic item.
-   `/randomword [count]`: Get one or more random words.
-   `/urban <term>`: Look up a term on Urban Dictionary.
-   `/weather current [zipcode]`: Get the current weather for a US zip code.
-   `/weather forecast [zipcode]`: Get a 5-day weather forecast for a US zip code.



## 🤝 Contributing

Contributions are welcome! If you have ideas for new commands or improvements, feel free to open an issue or submit a pull request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)

https://discord.gg/KPkJckBQTW - Join my server :)
