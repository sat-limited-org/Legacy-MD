const { loadCommands } = require('./utils/commandLoader');
const commands = loadCommands();
const config = require('./config');

// Roasts for unknown command
const ROASTS = [
    'bruh', 'lol', 'wtf', 'that aint a command', 
    'skill issue', 'are you okay', 'try again noob'
];

module.exports = async (sock, msg) => {
    const messages = msg.messages || [msg];
    const message = messages[0];
    if (!message ||!message.message) return;

    const from = message.key.remoteJid;
    const sender = message.key.participant || message.key.remoteJid;
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
    const prefix = config.prefix;

    if (!text.startsWith(prefix)) return;

    const args = text.slice(prefix.length).trim().split(/ +/);
    const cmdName = args.shift().toLowerCase();

    let command = commands.get(cmdName) || commands.find(cmd => cmd.aliases && cmd.aliases.includes(cmdName));

    // ========== UNKNOWN COMMAND HANDLER BUILT-IN ==========
    if (!command) {
        const randomRoast = ROASTS[Math.floor(Math.random() * ROASTS.length)];

        // Suggest similar command
        const allCmds = Array.from(commands.keys());
        const similar = allCmds.find(c => c.startsWith(cmdName.slice(0,2)));
        const suggestion = similar? `\n💡 Did you mean: ${prefix}${similar}?` : '';

        const unknownText = `❌ *Unknown Command:* ${prefix}${cmdName}${suggestion}\n\n📋 Type ${prefix}menu to see all commands\n${randomRoast} 😂`;

        return await sock.sendMessage(from, { 
            text: unknownText,
            mentions: [sender]
        }, { quoted: message });
    }

    const extra = {
        from,
        sender,
        commandName: cmdName,
        sock,
        reply: (txt) => sock.sendMessage(from, { text: txt, mentions: [sender] }, { quoted: message })
    };

    try {
        await command.execute(sock, message, args, extra);
    } catch (error) {
        console.log(error);
        await sock.sendMessage(from, { text: `❌ Error: ${error.message}` }, { quoted: message });
    }
};