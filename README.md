
# Discord Community Bot

A versatile Discord bot built with Node.js and discord.js, designed to enhance community engagement with a variety of fun and utility commands. It includes special perks for server boosters and a modular command structure.

## Features

- **Fun Commands**: Get random jokes, animal pictures, Urban Dictionary definitions, and more.
- **Utility Commands**: Check the weather or get stats for Fortnite players.
- **Booster Perks**: Special commands exclusive to server boosters, like temporarily enabling image permissions in a channel.
- **Slash Commands**: Modern and easy-to-use slash command integration.
- **Modular & Extendable**: Organized command structure makes it easy to add new commands.

## Prerequisites

- [Node.js](https://nodejs.org/) (v18.0.0 or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- A Discord Bot Token and other API keys.

## Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/scratchgamingone/Custom-Bot.git
    ```
    ```bash
    cd Custom-Bot
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
    PRICE_CHECKER_CATEGORY_ID=your_price_tracker_category_id

    # Role IDs (optional)
    BYPASS_ROLE_IDS=role_id_1,role_id_2
    BOOSTER_ROLE_ID=your_server_booster_role_id
    ADMIN_ROLE_ID=your_admin_role_id

    # API Keys
    WEATHER_API_KEY=your_openweathermap_api_key
    EBAY_APP_ID=your_ebay_app_id
    ```

4.  **Run the bot:**
    - For development (with automatic restarts):
      ```bash
      npm run dev
      ```
    - For production:
      ```bash
      npm start
      ```

## Available Commands

Here are some of the commands available in the bot:

### Public Commands
- `/cat`: Get a random picture of a cat.
- `/dog`: Get a random picture of a dog.
- `/fortnite <username>`: Get Fortnite stats for a player.
- `/joke`: Get a random joke.
- `/randomword`: Get a random word.
- `/urban [term]`: Get the definition of a word from Urban Dictionary. If no term is provided, a random word is used.
- `/weather <city>`: Get the current weather for a specified city.
- `/swcard`: Fetches a random Star Wars card from the Fandom wiki.
- `/amazonprice <url>`: Creates a dedicated channel to track the price of an Amazon product and sends alerts when the price changes.
- `/help`: Displays a list of available commands.

### Booster Commands
These commands can only be used by users with the "Server Booster" role.

- `/booster perks`: Displays a special thank you message for boosters.
- `/booster imageperm [duration]`: Temporarily grants you permission to upload images in the current channel. The default duration is 5 minutes.

## Contributing

Contributions are welcome! If you have ideas for new features or improvements, feel free to fork the repository and submit a pull request.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## License

This project is open source and available under the MIT License.
