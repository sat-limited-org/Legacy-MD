const { loadCommands } = require('./utils/commandLoader');
const commands = loadCommands();
const config = require('./config');

module.exports = async (sock, msg) => {
    const { messages } = msg;
    const message = messages[0];
    if (!message || !message.message) return;

    const from = message.key.remoteJid;
    const sender = message.key.participant || message.key.remoteJid;
    const text = message.message?.conversation || message.message?.extendedTextMessage?.text || '';
    const prefix = config.prefix;

    if (!text.startsWith(prefix)) return;

    const args = text.slice(prefix.length).trim().split(/ +/);
    const cmdName = args.shift().toLowerCase();

    let command = commands.get(cmdName) || commands.find(cmd => cmd.aliases && cmd.aliases.includes(cmdName));

    // ========== FALLBACK TO UNKNOWN ==========
    if (!command) {
        command = commands.get('unknown'); // loads from commands/unknown/unknown.js
    }

    // Pass extra data
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