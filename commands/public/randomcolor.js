import { SlashCommandBuilder } from 'discord.js';

export default {
    data: new SlashCommandBuilder()
        .setName('randomcolor')
        .setDescription('Generate a random color and display it'),
    
    async execute(interaction) {
        // Generate random RGB values
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);

        // Convert RGB to hexadecimal
        const hexColor = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;

        // Create an embed with the color information
        const colorEmbed = {
            color: parseInt(hexColor.slice(1), 16),
            title: 'Random Color Generated',
            fields: [
                {
                    name: 'RGB',
                    value: `R: ${r}\nG: ${g}\nB: ${b}`,
                    inline: true
                },
                {
                    name: 'Hex',
                    value: hexColor.toUpperCase(),
                    inline: true
                }
            ],
            image: {
                url: `https://dummyimage.com/200x200/${hexColor.slice(1)}/${hexColor.slice(1)}`
            },
            footer: {
                text: 'Generated at ' + new Date().toLocaleString()
            }
        };

        await interaction.reply({ embeds: [colorEmbed] });
    },
};
