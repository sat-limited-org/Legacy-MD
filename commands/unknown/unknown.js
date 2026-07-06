const config = require('../../config');
const { loadCommands } = require('../../utils/commandLoader');

module.exports = {
    name: 'unknown',
    category: 'unknown',
    description: 'Handles unknown commands',

    async execute(sock, msg, args, extra) {
        const { from, sender, commandName } = extra;
        
        const roasts = [
            'bruh', 'lol', 'wtf', 'that aint a command', 
            'skill issue', 'are you dumb', 'try again noob'
        ];
        const randomRoast = roasts[Math.floor(Math.random() * roasts.length)];

        const commands = loadCommands();

        // Suggest similar command
        const allCmds = Array.from(commands.keys());
        const similar = allCmds.find(c => c.startsWith(commandName.slice(0,2)));
        const suggestion = similar? `\n💡 Did you mean: ${config.prefix}${similar}?` : '';

        const text = `❌ *Unknown Command:* ${config.prefix}${commandName}${suggestion}\n\n📋 Type ${config.prefix}menu to see all commands\n${randomRoast} 😂`;

        await sock.sendMessage(from, { 
            text,
            mentions: [sender]
        }, { quoted: msg });
    }
};